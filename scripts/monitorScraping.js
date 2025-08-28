#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const CSVManager = require('../src/data/csvManager');

async function monitorScraping() {
  console.log('📊 JobTrend AI - Scraping Status Report');
  console.log('=' .repeat(50));
  
  try {
    const csvManager = new CSVManager();
    const stats = await csvManager.getJobStats();
    
    // Check last update time
    const csvPath = path.join(__dirname, '../data/jobs.csv');
    try {
      const fileStat = await fs.stat(csvPath);
      const lastUpdate = new Date(fileStat.mtime);
      const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
      
      console.log(`📅 Last Update: ${lastUpdate.toLocaleString()}`);
      console.log(`⏱️  Hours Since Update: ${hoursSinceUpdate.toFixed(1)}`);
      
      if (hoursSinceUpdate > 25) {
        console.log('⚠️  WARNING: Data is more than 25 hours old!');
        console.log('   Check if automated scraping is running properly.');
      }
    } catch (error) {
      console.log('❌ No data file found - scraping may have never run');
    }
    
    console.log(`\n📈 Current Stats:`);
    console.log(`   Total Jobs: ${stats.total_jobs}`);
    console.log(`   Recent Jobs (24h): ${stats.recent_jobs}`);
    
    if (Object.keys(stats.sources).length > 0) {
      console.log('\n📍 Sources:');
      Object.entries(stats.sources)
        .sort((a, b) => b[1] - a[1])
        .forEach(([source, count]) => {
          console.log(`   ${source}: ${count} jobs`);
        });
    }
    
    // Health check
    console.log('\n🏥 Health Check:');
    console.log(`   ✅ Data file exists: ${stats.total_jobs > 0}`);
    console.log(`   ✅ Recent activity: ${stats.recent_jobs > 0}`);
    console.log(`   ✅ Multiple sources: ${Object.keys(stats.sources).length > 1}`);
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (stats.recent_jobs === 0) {
      console.log('   • Run manual scraping: npm run scrape');
      console.log('   • Check if sites are blocking requests');
      console.log('   • Consider using VPN or different IP');
    }
    
    if (stats.total_jobs < 50) {
      console.log('   • Increase scraping frequency');
      console.log('   • Add more job sources or search terms');
    }
    
  } catch (error) {
    console.error('❌ Error generating report:', error.message);
  }
  
  console.log('\n🌐 Dashboard: http://localhost:3000');
  console.log('📖 Documentation: SCRAPING_GUIDE.md');
}

if (require.main === module) {
  monitorScraping();
}

module.exports = monitorScraping;