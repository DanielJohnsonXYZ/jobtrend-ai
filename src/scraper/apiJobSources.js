const axios = require('axios');

class APIJobSources {
  constructor() {
    this.sources = {
      // Free job APIs
      usajobs: 'https://data.usajobs.gov/api/search',
      remoteok: 'https://remoteok.io/api',
      
      // Note: These require API keys (add to .env if you get them)
      // adzuna: process.env.ADZUNA_API_KEY,
      // reed: process.env.REED_API_KEY,
      // jooble: process.env.JOOBLE_API_KEY
    };
  }

  async scrapeRemoteOK(query, limit = 20) {
    console.log('🌐 Fetching jobs from RemoteOK API...');
    const jobs = [];
    
    try {
      const response = await axios.get(this.sources.remoteok, {
        headers: {
          'User-Agent': 'JobTrend AI (contact@example.com)'
        },
        timeout: 30000
      });

      const apiJobs = response.data.slice(1, limit + 1); // Skip first element (metadata)
      
      apiJobs.forEach(job => {
        const skills = [];
        
        // Extract skills from tags
        if (job.tags) {
          job.tags.forEach(tag => {
            if (tag && typeof tag === 'string') {
              skills.push(tag.toLowerCase());
            }
          });
        }

        // Filter for relevant roles
        const isRelevant = this.isRelevantRole(job.position, query);
        
        if (isRelevant) {
          jobs.push({
            title: job.position || 'Unknown Position',
            company: job.company || 'Unknown Company',
            location: job.location || 'Remote',
            salary: job.salary_min && job.salary_max ? 
              `$${job.salary_min} - $${job.salary_max}` : '',
            skills: skills,
            url: job.url || `https://remoteok.io/remote-jobs/${job.slug}`,
            source: 'RemoteOK',
            scraped_date: new Date().toISOString(),
            search_query: query,
            search_location: 'Remote'
          });
        }
      });

    } catch (error) {
      console.error('❌ RemoteOK API error:', error.message);
    }

    console.log(`✅ RemoteOK: Found ${jobs.length} relevant jobs`);
    return jobs;
  }

  async scrapeUSAJobs(query, limit = 10) {
    console.log('🇺🇸 Fetching jobs from USAJobs API...');
    const jobs = [];
    
    try {
      const params = {
        Keyword: query,
        ResultsPerPage: limit,
        SortField: 'OpenDate',
        SortDirection: 'Desc'
      };

      const response = await axios.get(this.sources.usajobs, {
        params,
        headers: {
          'User-Agent': 'JobTrend AI (contact@example.com)',
          'Authorization-Key': 'YOUR_USAJOBS_API_KEY' // Optional: get free key from USAJobs
        },
        timeout: 30000
      });

      const apiJobs = response.data.SearchResult?.SearchResultItems || [];
      
      apiJobs.forEach(item => {
        const job = item.MatchedObjectDescriptor;
        
        if (job && this.isRelevantRole(job.PositionTitle, query)) {
          jobs.push({
            title: job.PositionTitle || 'Unknown Position',
            company: job.OrganizationName || 'US Government',
            location: this.formatLocation(job.PositionLocationDisplay),
            salary: this.formatSalary(job.PositionRemuneration),
            skills: this.extractSkills(job.QualificationSummary || ''),
            url: job.PositionURI || 'https://usajobs.gov',
            source: 'USAJobs',
            scraped_date: new Date().toISOString(),
            search_query: query,
            search_location: 'United States'
          });
        }
      });

    } catch (error) {
      console.error('❌ USAJobs API error:', error.message);
    }

    console.log(`✅ USAJobs: Found ${jobs.length} relevant jobs`);
    return jobs;
  }

  async scrapeAllAPISources(queries) {
    const allJobs = [];
    
    for (const query of queries) {
      console.log(`\n🔍 Searching APIs for: "${query}"`);
      
      try {
        // RemoteOK (usually works well)
        const remoteJobs = await this.scrapeRemoteOK(query, 15);
        allJobs.push(...remoteJobs);
        
        // Small delay between API calls
        await this.delay(2000);
        
        // USAJobs (government positions)
        const usaJobs = await this.scrapeUSAJobs(query, 5);
        allJobs.push(...usaJobs);
        
        // Delay between different search terms
        await this.delay(3000);
        
      } catch (error) {
        console.error(`❌ Error searching for "${query}":`, error.message);
      }
    }

    return allJobs;
  }

  isRelevantRole(title, query) {
    if (!title) return false;
    
    const titleLower = title.toLowerCase();
    const queryLower = query.toLowerCase();
    
    const relevantTerms = [
      'marketing', 'growth', 'product', 'manager', 'startup', 'business development',
      'sales', 'operations', 'strategy', 'digital', 'content', 'social', 'community'
    ];
    
    // Check if title contains query or relevant terms
    return titleLower.includes(queryLower) || 
           relevantTerms.some(term => titleLower.includes(term));
  }

  formatLocation(locationArray) {
    if (Array.isArray(locationArray) && locationArray.length > 0) {
      return locationArray[0].LocationName || 'Unknown Location';
    }
    return 'Unknown Location';
  }

  formatSalary(remunerationArray) {
    if (Array.isArray(remunerationArray) && remunerationArray.length > 0) {
      const salary = remunerationArray[0];
      if (salary.MinimumRange && salary.MaximumRange) {
        return `$${salary.MinimumRange} - $${salary.MaximumRange}`;
      }
    }
    return '';
  }

  extractSkills(text) {
    if (!text) return [];
    
    const commonSkills = [
      'javascript', 'python', 'react', 'node.js', 'sql', 'marketing', 'analytics',
      'project management', 'agile', 'scrum', 'leadership', 'communication',
      'excel', 'powerpoint', 'salesforce', 'hubspot', 'google analytics'
    ];
    
    const textLower = text.toLowerCase();
    return commonSkills.filter(skill => textLower.includes(skill));
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = APIJobSources;