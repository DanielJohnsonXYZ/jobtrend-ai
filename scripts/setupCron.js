#!/usr/bin/env node
const cron = require('node-cron');
const runProductionScraper = require('./runScraper');
const path = require('path');

class AutomatedScraper {
  constructor() {
    this.schedule = process.env.SCRAPE_SCHEDULE || '0 9 * * *'; // Default: 9 AM daily
    this.isRunning = false;
    this.lastRun = null;
    this.stats = {
      runsCompleted: 0,
      totalJobsCollected: 0,
      lastError: null
    };
  }

  start() {
    console.log('🔄 JobTrend AI - Automated Scraper Starting');
    console.log(`📅 Schedule: ${this.schedule} (${this.getScheduleDescription()})`);
    console.log(`📁 Working Directory: ${process.cwd()}`);
    console.log('🎯 Monitoring job market for marketing, growth, and startup roles');
    console.log('=' .repeat(60));

    // Schedule the job
    cron.schedule(this.schedule, async () => {
      await this.runScheduledScraping();
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    // Also run immediately on startup (optional)
    if (process.argv.includes('--run-now')) {
      console.log('🚀 Running immediately as requested...');
      setTimeout(() => this.runScheduledScraping(), 5000);
    }

    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down automated scraper...');
      this.printFinalStats();
      process.exit(0);
    });

    console.log('✅ Automated scraper is now running');
    console.log('   Press Ctrl+C to stop');
    console.log('   Use --run-now flag to run immediately on startup');
  }

  async runScheduledScraping() {
    if (this.isRunning) {
      console.log('⚠️  Scraping already in progress, skipping this run');
      return;
    }

    this.isRunning = true;
    this.lastRun = new Date();
    
    try {
      console.log(`\n🚀 Starting scheduled scraping run #${this.stats.runsCompleted + 1}`);
      console.log(`⏰ Time: ${this.lastRun.toLocaleString()}`);
      
      const result = await runProductionScraper();
      
      if (result.success) {
        this.stats.runsCompleted++;
        this.stats.totalJobsCollected += result.jobsCollected;
        this.stats.lastError = null;
        
        console.log(`✅ Scheduled run completed successfully`);
        console.log(`📊 This run: ${result.jobsCollected} jobs | Total database: ${result.totalJobs} jobs`);
      } else {
        this.stats.lastError = result.error;
        console.log(`❌ Scheduled run failed: ${result.error}`);
      }
      
    } catch (error) {
      this.stats.lastError = error.message;
      console.error(`❌ Scheduled run crashed: ${error.message}`);
    } finally {
      this.isRunning = false;
      console.log(`⏭️  Next run scheduled for: ${this.getNextRunTime()}`);
    }
  }

  getScheduleDescription() {
    const schedules = {
      '0 9 * * *': 'Daily at 9:00 AM',
      '0 */12 * * *': 'Every 12 hours',
      '0 */6 * * *': 'Every 6 hours',
      '0 */4 * * *': 'Every 4 hours',
      '0 * * * *': 'Every hour'
    };
    
    return schedules[this.schedule] || 'Custom schedule';
  }

  getNextRunTime() {
    // This is a simplified version - for production use a proper cron parser
    if (this.schedule === '0 9 * * *') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow.toLocaleString();
    }
    return 'Next scheduled time';
  }

  printFinalStats() {
    console.log('\n📊 Final Statistics:');
    console.log(`   Completed runs: ${this.stats.runsCompleted}`);
    console.log(`   Total jobs collected: ${this.stats.totalJobsCollected}`);
    console.log(`   Last run: ${this.lastRun ? this.lastRun.toLocaleString() : 'Never'}`);
    console.log(`   Last error: ${this.stats.lastError || 'None'}`);
  }
}

// CLI usage
if (require.main === module) {
  const automatedScraper = new AutomatedScraper();
  automatedScraper.start();
}

module.exports = AutomatedScraper;