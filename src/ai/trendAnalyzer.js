const regression = require('simple-statistics');
const Anthropic = require('@anthropic-ai/sdk');

class TrendAnalyzer {
  constructor() {
    this.anthropic = process.env.ANTHROPIC_API_KEY ? 
      new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
  }

  analyzeJobTrends(jobs) {
    if (!jobs || jobs.length === 0) {
      return {
        daily_counts: [],
        growth_rate: 0,
        prediction: 0
      };
    }

    // Group jobs by date
    const dailyCounts = this.groupJobsByDate(jobs);
    
    // Calculate linear regression for trend prediction
    const trendData = dailyCounts.map((item, index) => [index, item.count]);
    
    let growthRate = 0;
    let prediction = 0;
    
    if (trendData.length >= 2) {
      try {
        const linearRegression = regression.linearRegression(trendData);
        const rSquared = regression.rSquared(trendData, linearRegression);
        
        growthRate = linearRegression.m; // Slope represents daily growth
        
        // Predict next 7 days
        const nextWeekIndex = trendData.length + 7;
        prediction = linearRegression.m * nextWeekIndex + linearRegression.b;
        
        // Convert to percentage growth
        const currentAvg = dailyCounts.slice(-7).reduce((sum, d) => sum + d.count, 0) / 7;
        prediction = currentAvg > 0 ? ((prediction - currentAvg) / currentAvg) * 100 : 0;
        
      } catch (error) {
        console.error('Error calculating trends:', error);
      }
    }

    return {
      daily_counts: dailyCounts,
      growth_rate: growthRate,
      prediction: Math.max(prediction, -100), // Cap at -100%
      r_squared: trendData.length >= 2 ? regression.rSquared(trendData, regression.linearRegression(trendData)) : 0
    };
  }

  groupJobsByDate(jobs) {
    const dateGroups = {};
    
    jobs.forEach(job => {
      const date = new Date(job.scraped_date).toISOString().split('T')[0];
      dateGroups[date] = (dateGroups[date] || 0) + 1;
    });

    // Convert to array and sort by date
    return Object.entries(dateGroups)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  extractTopSkills(jobs, limit = 20) {
    if (!jobs || jobs.length === 0) {
      return { top_skills: [], skill_trends: {} };
    }

    const skillCounts = {};
    const commonSkills = [
      'javascript', 'python', 'react', 'node.js', 'sql', 'marketing', 'analytics',
      'growth hacking', 'seo', 'social media', 'content marketing', 'digital marketing',
      'product management', 'agile', 'scrum', 'leadership', 'strategy', 'communication',
      'project management', 'data analysis', 'excel', 'powerpoint', 'salesforce',
      'hubspot', 'google analytics', 'facebook ads', 'google ads', 'email marketing'
    ];

    jobs.forEach(job => {
      const jobText = `${job.title} ${job.company}`.toLowerCase();
      
      // Extract skills from job title and description
      commonSkills.forEach(skill => {
        if (jobText.includes(skill.toLowerCase())) {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        }
      });

      // Also check explicit skills array if available
      if (Array.isArray(job.skills)) {
        job.skills.forEach(skill => {
          const cleanSkill = skill.toLowerCase().trim();
          if (cleanSkill.length > 2) {
            skillCounts[cleanSkill] = (skillCounts[cleanSkill] || 0) + 1;
          }
        });
      }
    });

    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));

    return {
      top_skills: topSkills,
      total_unique_skills: Object.keys(skillCounts).length,
      skill_trends: this.calculateSkillTrends(jobs, topSkills.slice(0, 10))
    };
  }

  calculateSkillTrends(jobs, topSkills) {
    const skillTrends = {};
    const recentJobs = jobs.filter(job => {
      const jobDate = new Date(job.scraped_date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return jobDate > weekAgo;
    });

    const olderJobs = jobs.filter(job => {
      const jobDate = new Date(job.scraped_date);
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return jobDate > twoWeeksAgo && jobDate <= weekAgo;
    });

    topSkills.forEach(skill => {
      const recentCount = this.countSkillInJobs(recentJobs, skill.name);
      const olderCount = this.countSkillInJobs(olderJobs, skill.name);
      
      const trend = olderCount > 0 ? ((recentCount - olderCount) / olderCount * 100) : 0;
      skillTrends[skill.name] = {
        recent_count: recentCount,
        older_count: olderCount,
        trend_percentage: Math.round(trend)
      };
    });

    return skillTrends;
  }

  countSkillInJobs(jobs, skill) {
    return jobs.reduce((count, job) => {
      const jobText = `${job.title} ${job.company}`.toLowerCase();
      return jobText.includes(skill.toLowerCase()) ? count + 1 : count;
    }, 0);
  }

  async generateInsights(jobs) {
    if (!this.anthropic || !jobs || jobs.length === 0) {
      return {
        summary: 'AI insights are not available. Please configure your ANTHROPIC_API_KEY.',
        trends: [],
        recommendations: []
      };
    }

    try {
      const trends = this.analyzeJobTrends(jobs);
      const skills = this.extractTopSkills(jobs, 10);
      
      // Prepare data summary for Claude
      const recentJobs = jobs.filter(job => {
        const jobDate = new Date(job.scraped_date);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return jobDate > weekAgo;
      });

      const companyCounts = {};
      const locationCounts = {};
      
      recentJobs.forEach(job => {
        companyCounts[job.company] = (companyCounts[job.company] || 0) + 1;
        locationCounts[job.location] = (locationCounts[job.location] || 0) + 1;
      });

      const topCompanies = Object.entries(companyCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
      const topLocations = Object.entries(locationCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);

      const prompt = `Analyze this job market data and provide insights:

RECENT ACTIVITY (Last 7 days):
- Total jobs: ${recentJobs.length}
- Growth trend: ${trends.growth_rate > 0 ? 'Increasing' : 'Decreasing'} (${trends.prediction.toFixed(1)}% predicted change)

TOP SKILLS IN DEMAND:
${skills.top_skills.slice(0, 5).map(s => `- ${s.name}: ${s.count} mentions`).join('\n')}

TOP HIRING COMPANIES:
${topCompanies.map(([name, count]) => `- ${name}: ${count} jobs`).join('\n')}

TOP LOCATIONS:
${topLocations.map(([name, count]) => `- ${name}: ${count} jobs`).join('\n')}

Please provide a concise market analysis (2-3 paragraphs) covering:
1. Current market trends and what they indicate
2. Key skills that are most valuable right now
3. Actionable recommendations for job seekers in marketing/growth roles

Keep the response professional and data-driven.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return {
        summary: response.content[0].text,
        data_points: {
          total_recent_jobs: recentJobs.length,
          growth_prediction: trends.prediction,
          top_skills: skills.top_skills.slice(0, 5),
          top_companies: topCompanies,
          confidence_score: trends.r_squared
        },
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating AI insights:', error);
      return {
        summary: 'Unable to generate AI insights at this time. Please check your API configuration.',
        error: error.message
      };
    }
  }
}

module.exports = TrendAnalyzer;