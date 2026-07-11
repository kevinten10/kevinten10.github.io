const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const FRAMES_DIR = path.join(__dirname, 'frames');
const STORYBOARD_URL = process.env.STORYBOARD_URL || 'http://localhost:8766/video/storyboard.html';
const TOTAL = 8;

const chromiumCandidates = [
  process.env.CHROMIUM_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const chromiumPath = chromiumCandidates.find(candidate => fs.existsSync(candidate));

if (!chromiumPath) {
  throw new Error('Chromium not found. Set CHROMIUM_PATH to a Chrome or Chromium executable.');
}

fs.mkdirSync(FRAMES_DIR, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromiumPath,
    headless: true,
    args: ['--no-sandbox', '--hide-scrollbars'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  for (let i = 1; i <= TOTAL; i++) {
    const url = new URL(STORYBOARD_URL);
    url.searchParams.set('frame', String(i));
    console.log(`Frame ${i}: navigating...`);
    await page.goto(url.toString(), { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));
    const file = path.join(FRAMES_DIR, `frame${i}.png`);
    await page.screenshot({ path: file, type: 'png' });
    console.log(`  Saved: ${file}`);
  }

  await browser.close();
  console.log('All frames captured!');
})();
