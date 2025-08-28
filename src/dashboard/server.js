require('dotenv').config();
const express = require('express');
const path = require('path');
const CSVManager = require('../data/csvManager');
const TrendAnalyzer = require('../ai/trendAnalyzer');

const app = express();
const port = process.env.DASHBOARD_PORT || 3000;
const csvManager = new CSVManager();
const trendAnalyzer = new TrendAnalyzer();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API Routes
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await csvManager.getJobStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await csvManager.readJobs();
    const limit = parseInt(req.query.limit) || 100;
    res.json(jobs.slice(-limit).reverse()); // Most recent first
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/trends', async (req, res) => {
  try {
    const jobs = await csvManager.readJobs();
    const trends = await trendAnalyzer.analyzeJobTrends(jobs);
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/skills', async (req, res) => {
  try {
    const jobs = await csvManager.readJobs();
    const skillsData = trendAnalyzer.extractTopSkills(jobs);
    res.json(skillsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/insights', async (req, res) => {
  try {
    const jobs = await csvManager.readJobs();
    const insights = await trendAnalyzer.generateInsights(jobs);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
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