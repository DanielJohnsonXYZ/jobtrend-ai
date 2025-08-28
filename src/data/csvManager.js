const fs = require('fs').promises;
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');

class CSVManager {
  constructor(filePath = 'data/jobs.csv') {
    this.filePath = filePath;
    this.headers = [
      { id: 'id', title: 'ID' },
      { id: 'title', title: 'Title' },
      { id: 'company', title: 'Company' },
      { id: 'location', title: 'Location' },
      { id: 'salary', title: 'Salary' },
      { id: 'skills', title: 'Skills' },
      { id: 'url', title: 'URL' },
      { id: 'source', title: 'Source' },
      { id: 'scraped_date', title: 'Scraped Date' },
      { id: 'search_query', title: 'Search Query' },
      { id: 'search_location', title: 'Search Location' }
    ];
  }

  async ensureFileExists() {
    try {
      await fs.access(this.filePath);
    } catch {
      // File doesn't exist, create it with headers
      await this.writeJobs([]);
    }
  }

  async writeJobs(jobs) {
    // Ensure directory exists
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });

    const csvWriter = createCsvWriter({
      path: this.filePath,
      header: this.headers
    });

    // Add unique IDs and clean data
    const jobsWithIds = jobs.map((job, index) => ({
      id: this.generateId(),
      title: this.cleanText(job.title),
      company: this.cleanText(job.company),
      location: this.cleanText(job.location),
      salary: this.cleanText(job.salary),
      skills: Array.isArray(job.skills) ? job.skills.join(';') : this.cleanText(job.skills),
      url: job.url || '',
      source: job.source || '',
      scraped_date: job.scraped_date || new Date().toISOString(),
      search_query: job.search_query || '',
      search_location: job.search_location || ''
    }));

    await csvWriter.writeRecords(jobsWithIds);
    console.log(`Wrote ${jobsWithIds.length} jobs to ${this.filePath}`);
  }

  async appendJobs(newJobs) {
    await this.ensureFileExists();
    
    // Read existing jobs to avoid duplicates
    const existingJobs = await this.readJobs();
    const existingUrls = new Set(existingJobs.map(job => job.url).filter(url => url));
    
    // Filter out duplicates based on URL and title+company combination
    const uniqueJobs = newJobs.filter(job => {
      if (job.url && existingUrls.has(job.url)) return false;
      
      const titleCompanyKey = `${job.title}-${job.company}`.toLowerCase();
      const exists = existingJobs.some(existing => 
        `${existing.title}-${existing.company}`.toLowerCase() === titleCompanyKey
      );
      
      return !exists;
    });

    if (uniqueJobs.length === 0) {
      console.log('No new unique jobs to add');
      return;
    }

    // Append mode
    const csvWriter = createCsvWriter({
      path: this.filePath,
      header: this.headers,
      append: true
    });

    const jobsWithIds = uniqueJobs.map(job => ({
      id: this.generateId(),
      title: this.cleanText(job.title),
      company: this.cleanText(job.company),
      location: this.cleanText(job.location),
      salary: this.cleanText(job.salary),
      skills: Array.isArray(job.skills) ? job.skills.join(';') : this.cleanText(job.skills),
      url: job.url || '',
      source: job.source || '',
      scraped_date: job.scraped_date || new Date().toISOString(),
      search_query: job.search_query || '',
      search_location: job.search_location || ''
    }));

    await csvWriter.writeRecords(jobsWithIds);
    console.log(`Appended ${jobsWithIds.length} new jobs to ${this.filePath}`);
  }

  async readJobs() {
    try {
      await this.ensureFileExists();
      
      return new Promise((resolve, reject) => {
        const jobs = [];
        const fs = require('fs');
        
        fs.createReadStream(this.filePath)
          .pipe(csv())
          .on('data', (data) => {
            // Convert skills back to array
            if (data.skills) {
              data.skills = data.skills.split(';').filter(skill => skill.trim());
            }
            jobs.push(data);
          })
          .on('end', () => resolve(jobs))
          .on('error', reject);
      });
    } catch (error) {
      // If CSV doesn't exist or can't be read, return sample data
      const { sampleJobs } = require('./sampleData');
      return sampleJobs;
    }
  }

  async getJobStats() {
    const jobs = await this.readJobs();
    
    const stats = {
      total_jobs: jobs.length,
      sources: {},
      companies: {},
      locations: {},
      recent_jobs: jobs.filter(job => {
        const jobDate = new Date(job.scraped_date);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return jobDate > dayAgo;
      }).length
    };

    // Count by source
    jobs.forEach(job => {
      stats.sources[job.source] = (stats.sources[job.source] || 0) + 1;
      stats.companies[job.company] = (stats.companies[job.company] || 0) + 1;
      stats.locations[job.location] = (stats.locations[job.location] || 0) + 1;
    });

    return stats;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  cleanText(text) {
    return text ? text.trim().replace(/\s+/g, ' ').replace(/[^\w\s-.,]/gi, '') : '';
  }
}

module.exports = CSVManager;