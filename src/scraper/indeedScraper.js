const StealthScraper = require('./stealthScraper');

class IndeedScraper extends StealthScraper {
  constructor(config) {
    super(config);
    this.baseUrl = 'https://www.indeed.com/jobs';
    this.name = 'Indeed';
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
    const page = await this.createStealthPage();
    const jobs = [];

    try {
      const start = pageNum * 10;
      const url = this.buildSearchUrl(query, location, start);
      
      console.log(`🔍 Scraping: ${query} in ${location} (page ${pageNum + 1})`);
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: this.config.timeout });
      
      // Random delay to appear more human
      await this.randomDelay();
      
      // Check for CAPTCHA
      const hasCaptcha = await this.handleCaptcha(page);
      if (hasCaptcha) {
        await page.close();
        return [];
      }

      // Wait for job results with multiple selectors
      try {
        await page.waitForSelector('[data-jk], .jobsearch-SerpJobCard, .job_seen_beacon', { timeout: 15000 });
      } catch (error) {
        console.log(`⚠️  No jobs found for: ${query} in ${location}`);
        await page.close();
        return [];
      }

      // Get job elements with multiple selectors for compatibility
      const jobElements = await page.$$('[data-jk], .jobsearch-SerpJobCard, .job_seen_beacon');
      console.log(`📋 Found ${jobElements.length} job listings`);
      
      for (let i = 0; i < Math.min(jobElements.length, 10); i++) {
        try {
          const job = await this.extractJobData(jobElements[i], page);
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
          console.error(`❌ Error extracting job ${i + 1}:`, error.message);
        }
      }
    } catch (error) {
      console.error(`❌ Indeed scraping error: ${error.message}`);
    } finally {
      await page.close();
    }

    console.log(`✅ Successfully scraped ${jobs.length} jobs from Indeed`);
    return jobs;
  }

  async extractJobData(element, page) {
    return await page.evaluate((el) => {
      // Multiple selectors for robustness
      const titleSelectors = [
        '[data-testid="job-title"] a span',
        '[data-testid="job-title"] span',
        '.jobTitle a span',
        'h2 a span',
        '.jobTitle span'
      ];
      
      const companySelectors = [
        '[data-testid="company-name"]',
        '.companyName',
        '[data-testid="company-name"] a',
        '.companyName a'
      ];
      
      const locationSelectors = [
        '[data-testid="job-location"]',
        '.companyLocation',
        '[data-testid="job-location"] div'
      ];
      
      const salarySelectors = [
        '.metadata.salary-snippet-container',
        '.salary-snippet-container',
        '.estimated-salary',
        '.salaryText'
      ];
      
      const linkSelectors = [
        '[data-testid="job-title"] a',
        '.jobTitle a',
        'h2 a'
      ];

      function findElement(selectors) {
        for (const selector of selectors) {
          const elem = el.querySelector(selector);
          if (elem) return elem;
        }
        return null;
      }

      const titleEl = findElement(titleSelectors);
      const companyEl = findElement(companySelectors);
      const locationEl = findElement(locationSelectors);
      const salaryEl = findElement(salarySelectors);
      const linkEl = findElement(linkSelectors);
      
      return {
        title: titleEl ? titleEl.textContent.trim() : '',
        company: companyEl ? companyEl.textContent.trim() : '',
        location: locationEl ? locationEl.textContent.trim() : '',
        url: linkEl ? 'https://www.indeed.com' + linkEl.getAttribute('href') : '',
        salary: salaryEl ? salaryEl.textContent.trim() : '',
        skills: [] // Could extract from job description if needed
      };
    }, element);
  }
}

module.exports = IndeedScraper;