require('dotenv').config();
const express = require('express');
const path = require('path');

// Gracefully handle missing modules in serverless environment
let CSVManager, TrendAnalyzer;
try {
  CSVManager = require('../data/csvManager');
  TrendAnalyzer = require('../ai/trendAnalyzer');
} catch (error) {
  console.log('Some modules not available in serverless environment:', error.message);
}

const app = express();
const port = process.env.DASHBOARD_PORT || 3000;

// Initialize managers with error handling
let csvManager, trendAnalyzer;
try {
  csvManager = CSVManager ? new CSVManager() : null;
  trendAnalyzer = TrendAnalyzer ? new TrendAnalyzer() : null;
} catch (error) {
  console.log('Error initializing managers:', error.message);
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Helper function to calculate stats from job data
function calculateStats(jobs) {
  const stats = {
    total_jobs: jobs.length,
    sources: {},
    companies: {},
    locations: {},
    recent_jobs: jobs.filter(job => {
      const jobDate = new Date(job.scraped_date);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return jobDate > dayAgo;
    }).length
  };

  jobs.forEach(job => {
    stats.sources[job.source] = (stats.sources[job.source] || 0) + 1;
    stats.companies[job.company] = (stats.companies[job.company] || 0) + 1;
    stats.locations[job.location] = (stats.locations[job.location] || 0) + 1;
  });

  return stats;
}

// API Routes
app.get('/api/stats', async (req, res) => {
  try {
    if (csvManager) {
      const stats = await csvManager.getJobStats();
      res.json(stats);
    } else {
      // Use real job data from JSON file
      try {
        const realJobsData = require('../../public/jobs-data.json');
        const stats = calculateStats(realJobsData);
        res.json(stats);
      } catch {
        const { sampleStats } = require('../data/sampleData');
        res.json(sampleStats);
      }
    }
  } catch (error) {
    // Fallback to sample data
    try {
      const { sampleStats } = require('../data/sampleData');
      res.json(sampleStats);
    } catch {
      res.status(500).json({ error: 'Unable to load data' });
    }
  }
});

app.get('/api/jobs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    if (csvManager) {
      const jobs = await csvManager.readJobs();
      res.json(jobs.slice(-limit).reverse()); // Most recent first
    } else {
      try {
        const realJobsData = require('../../public/jobs-data.json');
        res.json(realJobsData.slice(-limit).reverse());
      } catch {
        const { sampleJobs } = require('../data/sampleData');
        res.json(sampleJobs.slice(-limit).reverse());
      }
    }
  } catch (error) {
    try {
      const { sampleJobs } = require('../data/sampleData');
      res.json(sampleJobs.slice(-100).reverse());
    } catch {
      res.status(500).json({ error: 'Unable to load jobs data' });
    }
  }
});

app.get('/api/trends', async (req, res) => {
  try {
    const { sampleJobs } = require('../data/sampleData');
    const jobs = csvManager ? await csvManager.readJobs() : sampleJobs;
    
    if (trendAnalyzer) {
      const trends = await trendAnalyzer.analyzeJobTrends(jobs);
      res.json(trends);
    } else {
      // Mock trend data
      res.json({
        daily_counts: [
          { date: '2024-08-26', count: 2 },
          { date: '2024-08-27', count: 3 },
          { date: '2024-08-28', count: 5 }
        ],
        growth_rate: 0.5,
        prediction: 15.2
      });
    }
  } catch (error) {
    res.json({
      daily_counts: [{ date: new Date().toISOString().split('T')[0], count: 5 }],
      growth_rate: 0.3,
      prediction: 12.5
    });
  }
});

app.get('/api/skills', async (req, res) => {
  try {
    const { sampleJobs } = require('../data/sampleData');
    const jobs = csvManager ? await csvManager.readJobs() : sampleJobs;
    
    if (trendAnalyzer) {
      const skillsData = trendAnalyzer.extractTopSkills(jobs);
      res.json(skillsData);
    } else {
      // Mock skills data
      res.json({
        top_skills: [
          { name: 'digital marketing', count: 8 },
          { name: 'analytics', count: 6 },
          { name: 'growth hacking', count: 5 },
          { name: 'product management', count: 4 },
          { name: 'seo', count: 3 }
        ]
      });
    }
  } catch (error) {
    res.json({ top_skills: [] });
  }
});

app.get('/api/insights', async (req, res) => {
  try {
    const { sampleJobs } = require('../data/sampleData');
    const jobs = csvManager ? await csvManager.readJobs() : sampleJobs;
    
    if (trendAnalyzer) {
      const insights = await trendAnalyzer.generateInsights(jobs);
      res.json(insights);
    } else {
      // Mock insights
      res.json({
        summary: 'The job market for marketing and growth roles is showing strong momentum with a 15% increase in postings over the last week. Digital marketing skills, particularly analytics and growth hacking, are in highest demand. Companies are actively seeking versatile professionals who can drive both customer acquisition and retention strategies.'
      });
    }
  } catch (error) {
    res.json({ summary: 'JobTrend AI is analyzing the current job market trends. The dashboard shows sample data demonstrating real-time job tracking capabilities.' });
  }
});

// Serve main dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// For Vercel serverless deployment
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`JobTrend AI Dashboard running at http://localhost:${port}`);
  });
}

module.exports = app;