require('dotenv').config();
const cron = require('node-cron');
const JobScraper = require('./scraper/index');

class JobTrendAI {
  constructor() {
    this.scraper = new JobScraper();
    this.scheduleInterval = process.env.SCRAPE_INTERVAL_HOURS || 24;
  }

  async runScraping() {
    console.log('🤖 JobTrend AI - Starting scraping cycle...');
    console.log('⏰ Time:', new Date().toLocaleString());
    
    try {
      const jobs = await this.scraper.scrapeAllSites();
      const stats = await this.scraper.getStats();
      
      console.log('\n📊 Scraping Summary:');
      console.log(`✅ Total jobs in database: ${stats.total_jobs}`);
      console.log(`🆕 New jobs today: ${stats.recent_jobs}`);
      console.log(`🏢 Top sources: ${Object.entries(stats.sources).map(([k,v]) => `${k}(${v})`).join(', ')}`);
      
      return { success: true, jobs: jobs.length, total: stats.total_jobs };
    } catch (error) {
      console.error('❌ Scraping failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  startScheduler() {
    console.log(`🕐 Starting JobTrend AI scheduler (every ${this.scheduleInterval} hours)`);
    
    // Run immediately on start
    this.runScraping();
    
    // Schedule regular runs
    const cronPattern = `0 */${this.scheduleInterval} * * *`; // Every N hours
    
    cron.schedule(cronPattern, () => {
      this.runScraping();
    });

    console.log('📅 Scheduler started successfully');
    console.log('🌐 Dashboard available at: http://localhost:3000');
    console.log('⚡ Run "npm run dashboard" to start the web interface');
  }

  async generateReport() {
    console.log('📋 Generating job market report...');
    
    const stats = await this.scraper.getStats();
    const TrendAnalyzer = require('./ai/trendAnalyzer');
    const analyzer = new TrendAnalyzer();
    
    const CSVManager = require('./data/csvManager');
    const csvManager = new CSVManager();
    const jobs = await csvManager.readJobs();
    
    const trends = analyzer.analyzeJobTrends(jobs);
    const skills = analyzer.extractTopSkills(jobs);
    const insights = await analyzer.generateInsights(jobs);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 JOBTREND AI MARKET REPORT');
    console.log('='.repeat(60));
    console.log(`📅 Generated: ${new Date().toLocaleString()}`);
    console.log(`📈 Total Jobs Tracked: ${stats.total_jobs}`);
    console.log(`🆕 New Jobs (24h): ${stats.recent_jobs}`);
    console.log(`📊 Growth Prediction: ${trends.prediction.toFixed(1)}%`);
    
    console.log('\n🏢 TOP JOB SOURCES:');
    Object.entries(stats.sources)
      .sort((a,b) => b[1] - a[1])
      .forEach(([source, count]) => {
        console.log(`   ${source}: ${count} jobs`);
      });
    
    console.log('\n🎯 TOP SKILLS IN DEMAND:');
    skills.top_skills.slice(0, 10).forEach((skill, i) => {
      console.log(`   ${i+1}. ${skill.name}: ${skill.count} mentions`);
    });
    
    console.log('\n🏢 TOP HIRING COMPANIES:');
    Object.entries(stats.companies)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([company, count], i) => {
        console.log(`   ${i+1}. ${company}: ${count} jobs`);
      });
    
    if (insights.summary) {
      console.log('\n🤖 AI MARKET INSIGHTS:');
      console.log(insights.summary.replace(/\n/g, '\n   '));
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// CLI Commands
const command = process.argv[2];
const jobTrendAI = new JobTrendAI();

switch(command) {
  case 'scrape':
    jobTrendAI.runScraping().then(result => {
      console.log('\n✅ Scraping completed');
      process.exit(result.success ? 0 : 1);
    });
    break;
    
  case 'start':
    jobTrendAI.startScheduler();
    break;
    
  case 'report':
    jobTrendAI.generateReport().then(() => {
      process.exit(0);
    });
    break;
    
  default:
    console.log(`
🤖 JobTrend AI - Job Market Analysis Tool

USAGE:
  npm start              - Start the scheduler (runs every ${jobTrendAI.scheduleInterval}h)
  npm run scrape         - Run one-time scraping
  npm run dashboard      - Start web dashboard
  node src/index.js report  - Generate market report

SETUP:
  1. Copy .env.example to .env
  2. Add your ANTHROPIC_API_KEY for AI insights
  3. Run: npm install
  4. Run: npm start

The tool will scrape jobs from LinkedIn, Indeed, and Glassdoor,
focusing on marketing, startup, and growth roles globally.
Data is stored in data/jobs.csv for tracking and analysis.
    `);
}

module.exports = JobTrendAI;