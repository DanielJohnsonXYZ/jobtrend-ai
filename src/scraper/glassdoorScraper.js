const BaseScraper = require('./baseScraper');

class GlassdoorScraper extends BaseScraper {
  constructor(config) {
    super(config);
    this.baseUrl = 'https://www.glassdoor.com/Job/jobs.htm';
  }

  buildSearchUrl(query, location, page = 1) {
    const params = new URLSearchParams({
      sc: '0kf="' + query + '"',
      locT: 'C',
      locId: '1',
      locKeyword: location,
      jobType: 'all',
      fromAge: 1, // Last 1 day
      minSalary: 0,
      includeNoSalaryJobs: 'true',
      radius: 25,
      cityId: '-1',
      minRating: '0.0',
      p: page
    });
    return `${this.baseUrl}?${params.toString()}`;
  }

  async scrapePage(query, location, pageNum) {
    const page = await this.createPage();
    const jobs = [];

    try {
      const pageNumber = pageNum + 1;
      const url = this.buildSearchUrl(query, location, pageNumber);
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: this.config.timeout });
      
      // Wait for job listings to load
      try {
        await page.waitForSelector('[data-test="job-link"]', { timeout: 10000 });
      } catch {
        console.log('No job listings found on this page');
        return jobs;
      }

      const jobElements = await page.$$('[data-test="job-link"]');
      
      for (const element of jobElements) {
        try {
          const job = await this.extractJobData(element, page);
          if (job && job.title && job.company) {
            jobs.push({
              ...job,
              source: 'Glassdoor',
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
      console.error(`Glassdoor scraping error: ${error.message}`);
    } finally {
      await page.close();
    }

    return jobs;
  }

  async extractJobData(element, page) {
    return await page.evaluate((el) => {
      const titleEl = el.querySelector('[data-test="job-title"]');
      const companyEl = el.querySelector('[data-test="employer-name"]');
      const locationEl = el.querySelector('[data-test="job-location"]');
      const salaryEl = el.querySelector('[data-test="detailSalary"]');
      
      return {
        title: titleEl ? titleEl.textContent.trim() : '',
        company: companyEl ? companyEl.textContent.trim() : '',
        location: locationEl ? locationEl.textContent.trim() : '',
        url: el.href || '',
        salary: salaryEl ? salaryEl.textContent.trim() : '',
        skills: [] // Would need to visit individual job pages for detailed skills
      };
    }, element);
  }
}

module.exports = GlassdoorScraper;