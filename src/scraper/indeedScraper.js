const BaseScraper = require('./baseScraper');

class IndeedScraper extends BaseScraper {
  constructor(config) {
    super(config);
    this.baseUrl = 'https://www.indeed.com/jobs';
  }

  buildSearchUrl(query, location, start = 0) {
    const params = new URLSearchParams({
      q: query,
      l: location,
      start: start,
      fromage: '1', // Last 1 day
    });
    return `${this.baseUrl}?${params.toString()}`;
  }

  async scrapePage(query, location, pageNum) {
    const page = await this.createPage();
    const jobs = [];

    try {
      const start = pageNum * 10;
      const url = this.buildSearchUrl(query, location, start);
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: this.config.timeout });
      await page.waitForSelector('[data-testid="job-title"]', { timeout: 10000 });

      const jobElements = await page.$$('[data-jk]');
      
      for (const element of jobElements) {
        try {
          const job = await this.extractJobData(element, page);
          if (job && job.title && job.company) {
            jobs.push({
              ...job,
              source: 'Indeed',
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
      console.error(`Indeed scraping error: ${error.message}`);
    } finally {
      await page.close();
    }

    return jobs;
  }

  async extractJobData(element, page) {
    return await page.evaluate((el) => {
      const titleEl = el.querySelector('[data-testid="job-title"] a span');
      const companyEl = el.querySelector('[data-testid="company-name"]');
      const locationEl = el.querySelector('[data-testid="job-location"]');
      const salaryEl = el.querySelector('.metadata.salary-snippet-container');
      const linkEl = el.querySelector('[data-testid="job-title"] a');
      
      return {
        title: titleEl ? titleEl.textContent.trim() : '',
        company: companyEl ? companyEl.textContent.trim() : '',
        location: locationEl ? locationEl.textContent.trim() : '',
        url: linkEl ? 'https://www.indeed.com' + linkEl.getAttribute('href') : '',
        salary: salaryEl ? salaryEl.textContent.trim() : '',
        skills: [] // Would need to visit individual job pages for detailed skills
      };
    }, element);
  }
}

module.exports = IndeedScraper;