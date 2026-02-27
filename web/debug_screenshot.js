const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function debugScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    console.log('Navigating to http://localhost:8080...');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });

    // Wait a bit for any animations
    await page.waitForTimeout(2000);

    // Take full page screenshot
    console.log('Taking full page screenshot...');
    await page.screenshot({
      path: 'C:\\Users\\schwa\\source\\repos\\nynexspace\\web\\debug_screenshot.png',
      fullPage: true
    });

    // Find and analyze .section-label element
    console.log('\n=== ANALYZING .section-label ELEMENT ===');
    const sectionLabel = await page.locator('.section-label').first();
    const sectionLabelExists = await sectionLabel.count();

    if (sectionLabelExists > 0) {
      const sectionLabelText = await sectionLabel.textContent();
      console.log(`Text content: "${sectionLabelText}"`);

      const sectionLabelStyles = await sectionLabel.evaluate(el => {
        const computed = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          opacity: computed.opacity,
          visibility: computed.visibility,
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          zIndex: computed.zIndex,
          position: computed.position,
          display: computed.display,
          fontSize: computed.fontSize,
          fontFamily: computed.fontFamily,
          top: computed.top,
          left: computed.left,
          width: computed.width,
          height: computed.height,
          // Bounding rect info
          boundingRect: {
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right,
            width: rect.width,
            height: rect.height
          },
          // Check if in viewport
          isInViewport: (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
          ),
          // Check if element is visible on screen (at least partially)
          isPartiallyInViewport: (
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < window.innerHeight &&
            rect.left < window.innerWidth
          )
        };
      });
      console.log('Computed styles:', JSON.stringify(sectionLabelStyles, null, 2));
    } else {
      console.log('.section-label element NOT FOUND');
    }

    // Find and analyze .positioning-content element
    console.log('\n=== ANALYZING .positioning-content ELEMENT ===');
    const positioningContent = await page.locator('.positioning-content').first();
    const positioningContentExists = await positioningContent.count();

    if (positioningContentExists > 0) {
      const positioningContentText = await positioningContent.textContent();
      console.log(`Text content: "${positioningContentText?.trim()}"`);

      const positioningContentStyles = await positioningContent.evaluate(el => {
        const computed = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          opacity: computed.opacity,
          visibility: computed.visibility,
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          zIndex: computed.zIndex,
          position: computed.position,
          display: computed.display,
          fontSize: computed.fontSize,
          fontFamily: computed.fontFamily,
          top: computed.top,
          left: computed.left,
          width: computed.width,
          height: computed.height,
          overflow: computed.overflow,
          // Bounding rect info
          boundingRect: {
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right,
            width: rect.width,
            height: rect.height
          },
          // Check if in viewport
          isInViewport: (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
          ),
          // Check if element is visible on screen (at least partially)
          isPartiallyInViewport: (
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < window.innerHeight &&
            rect.left < window.innerWidth
          ),
          // Get parent chain
          parentOverflow: (() => {
            let current = el.parentElement;
            const parents = [];
            while (current) {
              const styles = window.getComputedStyle(current);
              if (styles.overflow !== 'visible') {
                parents.push({
                  tagName: current.tagName,
                  className: current.className,
                  overflow: styles.overflow,
                  overflowX: styles.overflowX,
                  overflowY: styles.overflowY,
                  position: styles.position
                });
              }
              current = el.parentElement;
              if (parents.length > 10) break;
              el = el.parentElement;
            }
            return parents;
          })()
        };
      });
      console.log('Computed styles:', JSON.stringify(positioningContentStyles, null, 2));
    } else {
      console.log('.positioning-content element NOT FOUND');
    }

    // Look specifically for "Sovereign Mission" text anywhere in the DOM
    console.log('\n=== SEARCHING FOR "Sovereign Mission" TEXT ===');
    const sovereignMissionElements = await page.evaluate(() => {
      const results = [];
      // Find all elements containing "Sovereign Mission"
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        if (el.textContent && el.textContent.includes('Sovereign Mission') && el.children.length === 0) {
          const computed = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          results.push({
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            textContent: el.textContent,
            styles: {
              opacity: computed.opacity,
              visibility: computed.visibility,
              display: computed.display,
              color: computed.color,
              zIndex: computed.zIndex,
              position: computed.position
            },
            boundingRect: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            },
            isInViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth
          });
        }
      });
      return results;
    });

    console.log(`Found ${sovereignMissionElements.length} elements with "Sovereign Mission" text:`);
    console.log(JSON.stringify(sovereignMissionElements, null, 2));

    // Get viewport dimensions
    const viewportInfo = await page.evaluate(() => {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollY: window.scrollY,
        scrollX: window.scrollX,
        documentHeight: document.documentElement.scrollHeight,
        documentWidth: document.documentElement.scrollWidth
      };
    });
    console.log('\n=== VIEWPORT INFO ===');
    console.log(JSON.stringify(viewportInfo, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugScreenshot();
