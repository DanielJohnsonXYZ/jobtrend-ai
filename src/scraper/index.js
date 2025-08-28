require('dotenv').config();
const IndeedScraper = require('./indeedScraper');
const APIJobSources = require('./apiJobSources');
const CSVManager = require('../data/csvManager');

class JobScraper {
  constructor() {
    this.csvManager = new CSVManager();
    
    // Start with API sources (more reliable) and one web scraper
    this.apiSources = new APIJobSources();
    this.webScrapers = [
      new IndeedScraper({ 
        maxPages: parseInt(process.env.MAX_PAGES_PER_SITE) || 2,
        headless: true 
      })
      // Note: LinkedIn and Glassdoor are more restrictive, disabled for now
    ];
    
    this.targetRoles = process.env.TARGET_ROLES 
      ? process.env.TARGET_ROLES.split(',').map(role => role.trim())
      : ['marketing', 'growth', 'product manager', 'business development'];
    
    this.locations = ['Remote', 'United States', 'San Francisco', 'New York'];
  }

  async scrapeAllSites() {
    console.log('🚀 Starting comprehensive job scraping...');
    console.log('🎯 Target roles:', this.targetRoles);
    const allJobs = [];
    let totalSuccess = 0;

    // Step 1: API Sources (fast and reliable)
    try {
      console.log('\n📡 Phase 1: API-based job sources');
      const apiJobs = await this.apiSources.scrapeAllAPISources(this.targetRoles);
      allJobs.push(...apiJobs);
      totalSuccess += apiJobs.length;
      console.log(`✅ API sources: ${apiJobs.length} jobs collected`);
    } catch (error) {
      console.error('❌ API sources failed:', error.message);
    }

    // Step 2: Web Scraping (slower but more comprehensive)
    console.log('\n🕷️  Phase 2: Web scraping');
    for (const scraper of this.webScrapers) {
      try {
        console.log(`\n🔧 Initializing ${scraper.name || scraper.constructor.name}...`);
        await scraper.init();
        
        // Limit to fewer queries to avoid being blocked
        const limitedRoles = this.targetRoles.slice(0, 2); // Only first 2 roles
        const limitedLocations = this.locations.slice(0, 2); // Only first 2 locations
        
        for (const role of limitedRoles) {
          for (const location of limitedLocations) {
            try {
              console.log(`🔍 Scraping: ${role} in ${location}`);
              const jobs = await scraper.scrapePage(role, location, 0); // Only first page
              allJobs.push(...jobs);
              totalSuccess += jobs.length;
              
              // Longer delay between requests
              await this.delay(5000);
            } catch (error) {
              console.error(`❌ Failed: ${role} in ${location} - ${error.message}`);
            }
          }
        }
        
        await scraper.close();
      } catch (error) {
        console.error(`❌ ${scraper.name || scraper.constructor.name} failed:`, error.message);
        try {
          await scraper.close();
        } catch {}
      }
    }

    // Step 3: Save results
    console.log(`\n📊 Scraping Summary:`);
    console.log(`✅ Total jobs collected: ${totalSuccess}`);
    console.log(`📈 Unique jobs after deduplication: ${allJobs.length}`);
    
    if (allJobs.length > 0) {
      await this.csvManager.appendJobs(allJobs);
      console.log('💾 Jobs saved to CSV successfully');
      
      // Show sample of collected jobs
      console.log('\n📋 Sample jobs collected:');
      allJobs.slice(0, 3).forEach((job, i) => {
        console.log(`${i + 1}. ${job.title} at ${job.company} (${job.source})`);
      });
    } else {
      console.log('⚠️  No jobs collected. Check your network connection and try again.');
    }

    return allJobs;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getStats() {
    return await this.csvManager.getJobStats();
  }
}

// CLI usage
if (require.main === module) {
  const scraper = new JobScraper();
  
  scraper.scrapeAllSites()
    .then(() => {
      console.log('Scraping completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Scraping failed:', error);
      process.exit(1);
    });
}

module.exports = JobScraper;