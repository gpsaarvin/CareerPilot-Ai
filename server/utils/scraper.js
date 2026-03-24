// ============================================================
// Puppeteer Scraper Utility
// Scrapes internship listings from Internshala
// Run: npm run scrape (or node utils/scraper.js)
//
// NOTE: Web scraping may violate TOS of some sites.
// This is for educational purposes — use responsibly.
// ============================================================
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('./db');
const Internship = require('../models/Internship');

async function scrapeInternshala() {
  // Dynamically import puppeteer (may not be installed in all environments)
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (e) {
    console.log('⚠️  Puppeteer not installed. Run: npm install puppeteer');
    console.log('   Using seed data instead. Run: npm run seed');
    process.exit(0);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    await connectDB();

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log('🔍 Navigating to Internshala...');
    await page.goto('https://internshala.com/internships/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for internship cards to load
    await page.waitForSelector('.internship_meta', { timeout: 10000 }).catch(() => {
      console.log('⚠️  Could not find internship cards — page layout may have changed');
    });

    // Extract internship data
    const internships = await page.evaluate(() => {
      const cards = document.querySelectorAll('.individual_internship');
      const results = [];

      cards.forEach((card, index) => {
        if (index >= 20) return; // Limit to 20

        const titleEl = card.querySelector('.profile a');
        const companyEl = card.querySelector('.company_name a');
        const locationEl = card.querySelector('.location_link a');
        const stipendEl = card.querySelector('.stipend');
        const linkEl = card.querySelector('.profile a');

        if (titleEl && companyEl) {
          results.push({
            title: titleEl.textContent.trim(),
            company: companyEl.textContent.trim(),
            location: locationEl ? locationEl.textContent.trim() : 'India',
            stipend: stipendEl ? stipendEl.textContent.trim() : 'Unpaid',
            link: linkEl ? 'https://internshala.com' + linkEl.getAttribute('href') : 'https://internshala.com',
            source: 'Internshala',
            type: 'onsite',
            skills_required: [],
          });
        }
      });

      return results;
    });

    console.log(`📋 Found ${internships.length} internships`);

    if (internships.length > 0) {
      // Save to MongoDB
      let savedCount = 0;
      for (const intern of internships) {
        try {
          await Internship.findOneAndUpdate(
            { title: intern.title, company: intern.company },
            intern,
            { upsert: true, new: true }
          );
          savedCount++;
        } catch (err) {
          console.log(`  ⚠️ Skipped: ${intern.title} — ${err.message}`);
        }
      }
      console.log(`✅ Saved ${savedCount} internships to MongoDB`);
    } else {
      console.log('ℹ️  No internships scraped. The page structure may have changed.');
      console.log('   Use seed data instead: npm run seed');
    }
  } catch (error) {
    console.error('❌ Scraping error:', error.message);
  } finally {
    await browser.close();
    process.exit(0);
  }
}

scrapeInternshala();
