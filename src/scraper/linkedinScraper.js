const BaseScraper = require('./baseScraper');

class LinkedInScraper extends BaseScraper {
  constructor(config) {
    super(config);
    this.baseUrl = 'https://www.linkedin.com/jobs/search';
  }

  buildSearchUrl(query, location, start = 0) {
    const params = new URLSearchParams({
      keywords: query,
      location: location,
      start: start,
      f_TPR: 'r86400', // Last 24 hours
      f_JT: 'F,P', // Full-time and Part-time
    });
    return `${this.baseUrl}?${params.toString()}`;
  }

  async scrapePage(query, location, pageNum) {
    const page = await this.createPage();
    const jobs = [];

    try {
      const start = pageNum * 25;
      const url = this.buildSearchUrl(query, location, start);
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: this.config.timeout });
      await page.waitForSelector('.jobs-search__results-list', { timeout: 10000 });

      const jobElements = await page.$$('.base-card');
      
      for (const element of jobElements) {
        try {
          const job = await this.extractJobData(element, page);
          if (job && job.title && job.company) {
            jobs.push({
              ...job,
              source: 'LinkedIn',
              scraped_date: new Date().toISOString(),
              search_query: query,
              search_location: location
            });
          }
        } catch (error) {
          console.error('Error extracting job data:', error.message);
        }
      }
    } catch (error) {
      console.error(`LinkedIn scraping error: ${error.message}`);
    } finally {
      await page.close();
    }

    return jobs;
  }

  async extractJobData(element, page) {
    return await page.evaluate((el) => {
      const titleEl = el.querySelector('.base-search-card__title');
      const companyEl = el.querySelector('.base-search-card__subtitle');
      const locationEl = el.querySelector('.job-search-card__location');
      const linkEl = el.querySelector('.base-card__full-link');
      
      return {
        title: titleEl ? titleEl.textContent.trim() : '',
        company: companyEl ? companyEl.textContent.trim() : '',
        location: locationEl ? locationEl.textContent.trim() : '',
        url: linkEl ? linkEl.href : '',
        salary: '', // LinkedIn doesn't always show salary in search results
        skills: [] // Would need to visit individual job pages for detailed skills
      };
    }, element);
  }
}

module.exports = LinkedInScraper;