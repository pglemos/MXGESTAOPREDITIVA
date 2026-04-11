const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Listen to console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    
    console.log('Navigating to http://127.0.0.1:3000');
    await page.goto('http://127.0.0.1:3000');
    
    // Wait for the app to load
    await page.waitForTimeout(5000);
    
    await browser.close();
})();
