// Sample data for demo purposes when CSV doesn't exist
const sampleJobs = [
  {
    id: '1',
    title: 'Growth Marketing Manager',
    company: 'TechStart Inc',
    location: 'San Francisco, CA',
    salary: '$80,000 - $120,000',
    skills: ['digital marketing', 'analytics', 'growth hacking'],
    url: 'https://example.com/job1',
    source: 'LinkedIn',
    scraped_date: new Date(Date.now() - 86400000).toISOString(),
    search_query: 'growth marketing',
    search_location: 'San Francisco'
  },
  {
    id: '2',
    title: 'Startup Product Manager',
    company: 'InnovateCorp',
    location: 'New York, NY',
    salary: '$90,000 - $140,000',
    skills: ['product management', 'agile', 'strategy'],
    url: 'https://example.com/job2',
    source: 'Indeed',
    scraped_date: new Date(Date.now() - 43200000).toISOString(),
    search_query: 'product manager',
    search_location: 'New York'
  },
  {
    id: '3',
    title: 'Digital Marketing Specialist',
    company: 'GrowthCo',
    location: 'Remote',
    salary: '$60,000 - $90,000',
    skills: ['seo', 'social media', 'content marketing'],
    url: 'https://example.com/job3',
    source: 'Glassdoor',
    scraped_date: new Date().toISOString(),
    search_query: 'digital marketing',
    search_location: 'Remote'
  },
  {
    id: '4',
    title: 'Business Development Manager',
    company: 'ScaleUp Ltd',
    location: 'Austin, TX',
    salary: '$70,000 - $110,000',
    skills: ['business development', 'sales', 'partnerships'],
    url: 'https://example.com/job4',
    source: 'LinkedIn',
    scraped_date: new Date(Date.now() - 21600000).toISOString(),
    search_query: 'business development',
    search_location: 'Austin'
  },
  {
    id: '5',
    title: 'Growth Hacker',
    company: 'StartupXYZ',
    location: 'Los Angeles, CA',
    salary: '$75,000 - $115,000',
    skills: ['growth hacking', 'analytics', 'experimentation'],
    url: 'https://example.com/job5',
    source: 'Indeed',
    scraped_date: new Date(Date.now() - 7200000).toISOString(),
    search_query: 'growth hacker',
    search_location: 'Los Angeles'
  }
];

const sampleStats = {
  total_jobs: 5,
  recent_jobs: 3,
  sources: {
    'LinkedIn': 2,
    'Indeed': 2,
    'Glassdoor': 1
  },
  companies: {
    'TechStart Inc': 1,
    'InnovateCorp': 1,
    'GrowthCo': 1,
    'ScaleUp Ltd': 1,
    'StartupXYZ': 1
  },
  locations: {
    'San Francisco, CA': 1,
    'New York, NY': 1,
    'Remote': 1,
    'Austin, TX': 1,
    'Los Angeles, CA': 1
  }
};

module.exports = {
  sampleJobs,
  sampleStats
};