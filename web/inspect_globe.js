const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8080');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Take a full page screenshot
  await page.screenshot({ path: 'screenshot_full.png', fullPage: true });
  console.log('Full page screenshot saved to screenshot_full.png');

  // Get computed styles for #globe element
  const globeStyles = await page.evaluate(() => {
    const globe = document.getElementById('globe');
    if (!globe) return { error: '#globe element not found' };

    const computed = window.getComputedStyle(globe);
    return {
      position: computed.position,
      left: computed.left,
      right: computed.right,
      top: computed.top,
      bottom: computed.bottom,
      transform: computed.transform,
      display: computed.display,
      width: computed.width,
      height: computed.height,
      marginLeft: computed.marginLeft,
      marginRight: computed.marginRight,
      marginTop: computed.marginTop,
      marginBottom: computed.marginBottom,
      float: computed.float,
      flexDirection: computed.flexDirection,
      justifyContent: computed.justifyContent,
      alignItems: computed.alignItems,
    };
  });

  // Get computed styles for .hero-visual element
  const heroVisualStyles = await page.evaluate(() => {
    const heroVisual = document.querySelector('.hero-visual');
    if (!heroVisual) return { error: '.hero-visual element not found' };

    const computed = window.getComputedStyle(heroVisual);
    return {
      position: computed.position,
      left: computed.left,
      right: computed.right,
      top: computed.top,
      bottom: computed.bottom,
      transform: computed.transform,
      display: computed.display,
      width: computed.width,
      height: computed.height,
      marginLeft: computed.marginLeft,
      marginRight: computed.marginRight,
      marginTop: computed.marginTop,
      marginBottom: computed.marginBottom,
      float: computed.float,
      flexDirection: computed.flexDirection,
      justifyContent: computed.justifyContent,
      alignItems: computed.alignItems,
    };
  });

  // Get bounding client rects for actual position info
  const boundingRects = await page.evaluate(() => {
    const globe = document.getElementById('globe');
    const heroVisual = document.querySelector('.hero-visual');
    const heroSection = document.querySelector('.hero');

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      globe: globe ? {
        x: globe.getBoundingClientRect().x,
        y: globe.getBoundingClientRect().y,
        width: globe.getBoundingClientRect().width,
        height: globe.getBoundingClientRect().height,
        left: globe.getBoundingClientRect().left,
        right: globe.getBoundingClientRect().right,
      } : null,
      heroVisual: heroVisual ? {
        x: heroVisual.getBoundingClientRect().x,
        y: heroVisual.getBoundingClientRect().y,
        width: heroVisual.getBoundingClientRect().width,
        height: heroVisual.getBoundingClientRect().height,
        left: heroVisual.getBoundingClientRect().left,
        right: heroVisual.getBoundingClientRect().right,
      } : null,
      heroSection: heroSection ? {
        width: heroSection.getBoundingClientRect().width,
        display: window.getComputedStyle(heroSection).display,
        flexDirection: window.getComputedStyle(heroSection).flexDirection,
        justifyContent: window.getComputedStyle(heroSection).justifyContent,
        alignItems: window.getComputedStyle(heroSection).alignItems,
      } : null,
    };
  });

  console.log('\n========== #globe Computed Styles ==========');
  console.log(JSON.stringify(globeStyles, null, 2));

  console.log('\n========== .hero-visual Computed Styles ==========');
  console.log(JSON.stringify(heroVisualStyles, null, 2));

  console.log('\n========== Bounding Rects & Position Info ==========');
  console.log(JSON.stringify(boundingRects, null, 2));

  // Check if globe is visually on left or right side of viewport
  if (boundingRects.globe && boundingRects.viewport) {
    const globeCenterX = boundingRects.globe.x + boundingRects.globe.width / 2;
    const viewportCenterX = boundingRects.viewport.width / 2;
    const position = globeCenterX < viewportCenterX ? 'LEFT' : 'RIGHT';
    console.log(`\n========== ANALYSIS ==========`);
    console.log(`Viewport width: ${boundingRects.viewport.width}px`);
    console.log(`Viewport center: ${viewportCenterX}px`);
    console.log(`Globe center X: ${globeCenterX}px`);
    console.log(`Globe position relative to viewport center: ${position}`);
  }

  await browser.close();
})();
