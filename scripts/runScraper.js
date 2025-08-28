#!/usr/bin/env node
require('dotenv').config();
const JobScraper = require('../src/scraper/index');

async function runProductionScraper() {
  const scraper = new JobScraper();
  
  console.log('🤖 JobTrend AI - Production Scraping');
  console.log('⏰ Started:', new Date().toLocaleString());
  console.log('🎯 Mode: API + Stealth Web Scraping');
  console.log('=' .repeat(50));

  try {
    const jobs = await scraper.scrapeAllSites();
    const stats = await scraper.getStats();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 SCRAPING RESULTS');
    console.log('='.repeat(50));
    console.log(`✅ Jobs collected this run: ${jobs.length}`);
    console.log(`📈 Total jobs in database: ${stats.total_jobs}`);
    console.log(`🆕 Recent jobs (24h): ${stats.recent_jobs}`);
    
    if (Object.keys(stats.sources).length > 0) {
      console.log('\n📍 Sources:');
      Object.entries(stats.sources)
        .sort((a, b) => b[1] - a[1])
        .forEach(([source, count]) => {
          console.log(`   ${source}: ${count} jobs`);
        });
    }
    
    if (jobs.length > 0) {
      console.log('\n🏢 New Companies Added:');
      const newCompanies = [...new Set(jobs.map(j => j.company))];
      newCompanies.slice(0, 5).forEach(company => {
        console.log(`   • ${company}`);
      });
      if (newCompanies.length > 5) {
        console.log(`   ... and ${newCompanies.length - 5} more`);
      }
    }
    
    console.log('\n✅ Scraping completed successfully');
    console.log(`💾 Data saved to: data/jobs.csv`);
    console.log(`🌐 View dashboard: http://localhost:3000`);
    
    return { success: true, jobsCollected: jobs.length, totalJobs: stats.total_jobs };
    
  } catch (error) {
    console.error('\n❌ SCRAPING FAILED');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your internet connection');
    console.error('2. Try running again (sites may be temporarily blocking)');
    console.error('3. Consider using VPN or proxy');
    console.error('4. Check if target sites have changed their structure');
    
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  runProductionScraper()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = runProductionScraper;