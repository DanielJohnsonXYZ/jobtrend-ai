const puppeteer = require('puppeteer');

class BaseScraper {
  constructor(config = {}) {
    this.config = {
      headless: true,
      timeout: 30000,
      maxPages: 5,
      ...config
    };
    this.browser = null;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async createPage() {
    const page = await this.browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    return page;
  }

  extractJobData(element) {
    throw new Error('extractJobData must be implemented by subclass');
  }

  buildSearchUrl(query, location, page) {
    throw new Error('buildSearchUrl must be implemented by subclass');
  }

  async scrapeJobs(queries, locations = ['Global', 'Remote']) {
    const jobs = [];
    
    for (const query of queries) {
      for (const location of locations) {
        console.log(`Scraping ${this.constructor.name}: ${query} in ${location}`);
        
        for (let page = 0; page < this.config.maxPages; page++) {
          try {
            const pageJobs = await this.scrapePage(query, location, page);
            jobs.push(...pageJobs);
            
            if (pageJobs.length === 0) break;
            await this.delay(2000);
          } catch (error) {
            console.error(`Error scraping page ${page}:`, error.message);
            break;
          }
        }
      }
    }
    
    return jobs;
  }

  async scrapePage(query, location, page) {
    throw new Error('scrapePage must be implemented by subclass');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  cleanText(text) {
    return text ? text.trim().replace(/\s+/g, ' ') : '';
  }
}

module.exports = BaseScraper;