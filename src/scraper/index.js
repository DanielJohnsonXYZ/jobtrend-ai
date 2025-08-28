require('dotenv').config();
const LinkedInScraper = require('./linkedinScraper');
const IndeedScraper = require('./indeedScraper');
const GlassdoorScraper = require('./glassdoorScraper');
const CSVManager = require('../data/csvManager');

class JobScraper {
  constructor() {
    this.csvManager = new CSVManager();
    this.scrapers = [
      new LinkedInScraper({ maxPages: parseInt(process.env.MAX_PAGES_PER_SITE) || 3 }),
      new IndeedScraper({ maxPages: parseInt(process.env.MAX_PAGES_PER_SITE) || 3 }),
      new GlassdoorScraper({ maxPages: parseInt(process.env.MAX_PAGES_PER_SITE) || 3 })
    ];
    
    this.targetRoles = process.env.TARGET_ROLES 
      ? process.env.TARGET_ROLES.split(',').map(role => role.trim())
      : ['marketing', 'startup', 'growth', 'product management', 'business development'];
    
    this.locations = ['Remote', 'United States', 'United Kingdom', 'Canada', 'Global'];
  }

  async scrapeAllSites() {
    console.log('Starting job scraping for target roles:', this.targetRoles);
    const allJobs = [];

    for (const scraper of this.scrapers) {
      try {
        console.log(`\nInitializing ${scraper.constructor.name}...`);
        await scraper.init();
        
        const jobs = await scraper.scrapeJobs(this.targetRoles, this.locations);
        allJobs.push(...jobs);
        console.log(`${scraper.constructor.name} found ${jobs.length} jobs`);
        
        await scraper.close();
      } catch (error) {
        console.error(`Error with ${scraper.constructor.name}:`, error.message);
        try {
          await scraper.close();
        } catch {}
      }
    }

    console.log(`\nTotal jobs scraped: ${allJobs.length}`);
    
    if (allJobs.length > 0) {
      await this.csvManager.appendJobs(allJobs);
      console.log('Jobs saved to CSV');
    }

    return allJobs;
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