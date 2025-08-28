# Real Data Collection Guide

This guide explains how to collect real job market data using JobTrend AI's improved scraping system.

## 🚀 Quick Start - Get Real Data Now

### Option 1: One-Time Scraping
```bash
npm run scrape
```
This runs a comprehensive scraping session using both API sources and stealth web scraping.

### Option 2: Automated Daily Collection
```bash
npm run scrape-auto
```
Starts an automated scraper that runs daily at 9 AM.

### Option 3: Run Immediately + Auto Schedule
```bash
npm run scrape-now
```
Runs scraping immediately, then sets up daily automation.

## 🛠️ What's Been Improved

### ✅ Anti-Bot Protection
- **Stealth Browser**: Randomized user agents, disabled webdriver detection
- **Human-like Behavior**: Random delays (3-8 seconds), realistic viewport sizes
- **Request Optimization**: Blocks images/CSS for faster, less detectable scraping
- **CAPTCHA Detection**: Automatically detects and handles CAPTCHA challenges

### ✅ Multiple Data Sources
1. **API Sources** (Most Reliable):
   - RemoteOK API (remote tech jobs)
   - USAJobs API (government positions)
   - Future: Adzuna, Reed, JSearch APIs

2. **Web Scraping** (More Comprehensive):
   - Indeed (primary focus - more lenient)
   - LinkedIn (advanced protection - limited)
   - Glassdoor (strict - use carefully)

### ✅ Smart Rate Limiting
- 3-8 second random delays between requests
- 5 second delays between different search terms
- Limited to 2 pages per site to avoid detection
- Focused on high-value search terms

## 📊 Expected Results

**API Sources (RemoteOK)**:
- 10-20 jobs per run
- High quality remote positions
- Tech companies and startups
- Real-time data

**Web Scraping (Indeed)**:
- 5-15 jobs per run (depends on detection)
- Mix of remote and on-site positions
- Broader company range
- Fresh job postings

**Total**: 15-35 new jobs per scraping session

## 🔧 Configuration

### Environment Variables (.env)
```env
# Scraping Configuration
MAX_PAGES_PER_SITE=2                    # Keep low to avoid blocks
TARGET_ROLES=marketing,growth,product   # Customize target roles
SCRAPE_SCHEDULE=0 9 * * *              # Daily at 9 AM (cron format)

# Optional API Keys
USAJOBS_API_KEY=your_key_here          # For USAJobs API
ADZUNA_API_KEY=your_key_here           # For Adzuna API (future)
```

### Customizing Target Roles
Edit the roles in your `.env` file:
```env
TARGET_ROLES=marketing,growth,product manager,business development,sales,startup
```

## 🚨 Troubleshooting

### "No jobs found" or "Scraping failed"
1. **Check your internet connection**
2. **Try again later** - Sites may temporarily block
3. **Use a VPN** - Change your IP address
4. **Reduce frequency** - Don't scrape too often

### CAPTCHA or blocking detected
1. **Wait longer** - Try again in a few hours
2. **Use different network** - Mobile hotspot or VPN
3. **Focus on API sources** - More reliable than web scraping

### Low success rate
1. **API sources work better** - They provide consistent data
2. **Indeed is most reliable** for web scraping
3. **LinkedIn/Glassdoor are strict** - Use sparingly

## 📈 Production Deployment Options

### Option 1: VPS/Cloud Server (Recommended)
- **DigitalOcean Droplet**: $5/month
- **AWS EC2 t2.micro**: Free tier eligible
- **Google Cloud Compute**: $5/month
- Run `npm run scrape-auto` for 24/7 operation

### Option 2: GitHub Actions (Free)
```yaml
# .github/workflows/scrape.yml
name: Daily Job Scraping
on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run scrape
```

### Option 3: Heroku Scheduler (Limited)
- Add Heroku Scheduler addon
- Schedule: `npm run scrape`
- Frequency: Daily

## 🔒 Legal & Ethical Guidelines

### ✅ Best Practices
- **Respect robots.txt** - Check site policies
- **Reasonable delays** - Don't overload servers
- **Personal use only** - Don't redistribute scraped data
- **Follow ToS** - Respect each site's terms of service

### ⚠️ Rate Limiting
- **Max 1-2 runs per day** per site
- **Use API sources when available** - They're designed for this
- **Monitor for blocks** - Stop if consistently failing

### 📊 Data Usage
- **Analytics only** - For personal job market research
- **Don't republish** - Respect original content ownership
- **Attribution** - Credit data sources when possible

## 🎯 Advanced Configuration

### Custom Scraping Targets
```javascript
// In src/scraper/index.js
this.targetRoles = [
  'marketing manager',
  'growth hacker', 
  'product manager',
  'business development',
  'sales manager'
];

this.locations = [
  'Remote',
  'San Francisco', 
  'New York',
  'Austin'
];
```

### Adding New Job APIs
```javascript
// Example: Adding a new API source
const newAPI = {
  url: 'https://api.jobsite.com/search',
  headers: { 'Authorization': 'Bearer YOUR_KEY' },
  params: { q: query, location: location }
};
```

## 📞 Support

If you encounter issues:
1. Check the [troubleshooting section](#-troubleshooting) above
2. Review your `.env` configuration
3. Test with `npm run scrape` first before automation
4. Consider starting with API-only sources for reliability

Remember: **API sources are more reliable than web scraping** for consistent data collection!