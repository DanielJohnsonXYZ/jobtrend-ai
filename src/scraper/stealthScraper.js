const puppeteer = require('puppeteer');

class StealthScraper {
  constructor(config = {}) {
    this.config = {
      headless: true,
      timeout: 60000,
      maxPages: 3,
      delayMin: 3000,
      delayMax: 8000,
      userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
      ],
      ...config
    };
    this.browser = null;
  }

  async init() {
    console.log('🚀 Initializing stealth browser...');
    
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--window-size=1920,1080'
      ]
    });
  }

  async createStealthPage() {
    const page = await this.browser.newPage();
    
    // Random user agent
    const userAgent = this.config.userAgents[Math.floor(Math.random() * this.config.userAgents.length)];
    await page.setUserAgent(userAgent);
    
    // Set viewport to common resolution
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Block images and stylesheets to speed up loading
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.resourceType() === 'stylesheet' || req.resourceType() === 'image') {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Add stealth techniques
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Mock permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });

    return page;
  }

  async randomDelay() {
    const delay = Math.floor(Math.random() * (this.config.delayMax - this.config.delayMin + 1)) + this.config.delayMin;
    console.log(`⏱️  Waiting ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async handleCaptcha(page) {
    // Check for common CAPTCHA elements
    const captchaSelectors = [
      '[data-testid="captcha"]',
      '.captcha',
      '#captcha',
      '[src*="captcha"]',
      'iframe[src*="recaptcha"]'
    ];

    for (const selector of captchaSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log('🛑 CAPTCHA detected! Waiting before retry...');
          await this.randomDelay();
          return true;
        }
      } catch (error) {
        // Continue checking other selectors
      }
    }
    return false;
  }
}

module.exports = StealthScraper;