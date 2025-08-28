# JobTrend AI - Job Market Analysis Tool

JobTrend AI is an automated job market analysis tool that crawls LinkedIn, Indeed, and Glassdoor for marketing, startup, and growth roles globally. It extracts job postings, analyzes trends, and provides AI-powered insights using Claude API.

🚀 **Live Demo**: [View Dashboard](https://jobtrend-ai-git-main-daniel-wescalestarts-projects.vercel.app)

## Features

🔍 **Automated Job Scraping**
- LinkedIn, Indeed, and Glassdoor integration
- Focuses on marketing, startup, and growth roles
- Daily automated crawling with configurable intervals
- Global job market coverage

📊 **Data Analysis & Storage**
- Extracts titles, companies, locations, salaries, and skills
- Stores data in CSV format for easy tracking
- Deduplicates job postings automatically
- Historical data tracking

📈 **Trend Analysis**
- Linear regression for job volume predictions
- 7-day growth forecasting
- Top skills and companies analysis
- Interactive dashboard with real-time charts

🤖 **AI-Powered Insights**
- Claude API integration for market analysis
- Automated insights generation
- Trend interpretation and recommendations
- Professional market reports

## Quick Start

### 1. Installation

```bash
git clone <repository-url>
cd jobtrend-ai
npm install
```

### 2. Configuration

Copy the environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` and add your Claude API key:

```env
ANTHROPIC_API_KEY=your_claude_api_key_here
SCRAPE_INTERVAL_HOURS=24
MAX_PAGES_PER_SITE=10
TARGET_ROLES=marketing,startup,growth,product management,business development
DASHBOARD_PORT=3000
```

### 3. Usage

**Start the automated scheduler:**
```bash
npm start
```

**Run one-time scraping:**
```bash
npm run scrape
```

**Start the web dashboard:**
```bash
npm run dashboard
```

**Generate a market report:**
```bash
node src/index.js report
```

## Dashboard

Access the web dashboard at `http://localhost:3000` to view:

- Real-time job market statistics
- Interactive charts and trends
- Top skills and companies analysis
- AI-generated market insights
- Growth predictions

## Data Structure

Jobs are stored in `data/jobs.csv` with the following fields:

- **ID**: Unique identifier
- **Title**: Job title
- **Company**: Company name
- **Location**: Job location
- **Salary**: Salary information (if available)
- **Skills**: Extracted skills (semicolon-separated)
- **URL**: Job posting URL
- **Source**: Platform (LinkedIn/Indeed/Glassdoor)
- **Scraped Date**: When the job was collected
- **Search Query**: Query used to find the job
- **Search Location**: Location used in search

## Architecture

```
src/
├── index.js           # Main application entry point
├── scraper/           # Web scraping modules
│   ├── baseScraper.js      # Base scraper class
│   ├── linkedinScraper.js  # LinkedIn implementation
│   ├── indeedScraper.js    # Indeed implementation
│   ├── glassdoorScraper.js # Glassdoor implementation
│   └── index.js            # Scraper orchestrator
├── data/              # Data management
│   └── csvManager.js       # CSV operations
├── ai/                # AI analysis
│   └── trendAnalyzer.js    # Trend analysis & Claude integration
└── dashboard/         # Web interface
    ├── server.js           # Express server
    └── public/
        └── index.html      # Dashboard frontend
```

## Troubleshooting

### Common Issues

**1. Scraping fails with timeout errors**
- Job sites may have anti-bot measures
- Try reducing `MAX_PAGES_PER_SITE`
- Increase delays between requests

**2. No AI insights generated**
- Check your `ANTHROPIC_API_KEY` is valid
- Ensure you have sufficient API credits
- Verify internet connection

**3. Dashboard shows no data**
- Run scraping first: `npm run scrape`
- Check if `data/jobs.csv` exists and has content
- Verify CSV format is correct

### Rate Limiting

To avoid being blocked:
- Keep `MAX_PAGES_PER_SITE` reasonable (3-10)
- Don't run scraping too frequently (<4 times/day)
- Monitor for CAPTCHA or blocking responses

## Customization

### Adding New Job Sites

1. Create a new scraper class extending `BaseScraper`
2. Implement `buildSearchUrl()` and `extractJobData()` methods
3. Add to the scrapers array in `src/scraper/index.js`

### Modifying Target Roles

Edit `TARGET_ROLES` in `.env` or update the array in `src/scraper/index.js`:

```javascript
this.targetRoles = ['marketing', 'growth', 'product', 'sales'];
```

### Custom Skills Detection

Modify the `commonSkills` array in `src/ai/trendAnalyzer.js`:

```javascript
const commonSkills = [
  'your-custom-skill', 'another-skill', ...
];
```

## API Endpoints

The dashboard server exposes REST APIs:

- `GET /api/stats` - Basic job statistics
- `GET /api/jobs?limit=100` - Recent job listings
- `GET /api/trends` - Trend analysis data
- `GET /api/skills` - Top skills analysis
- `GET /api/insights` - AI-generated insights

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Submit a pull request

## Legal Compliance

This tool is for educational and research purposes. When scraping job sites:
- Respect robots.txt files
- Follow each site's terms of service
- Don't overload servers with requests
- Use scraped data responsibly

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section above
- Review logs for error details
- Ensure dependencies are up to date
- Verify environment configuration