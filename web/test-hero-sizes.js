// Test script to measure hero element sizes
const heroGrid = document.querySelector('.hero-grid');
const heroContent = document.querySelector('.hero-content');
const heroVisual = document.querySelector('.hero-visual');

if (heroGrid && heroContent && heroVisual) {
    const gridWidth = heroGrid.offsetWidth;
    const contentWidth = heroContent.offsetWidth;
    const visualWidth = heroVisual.offsetWidth;

    console.log('Hero Grid Width:', gridWidth);
    console.log('Hero Content Width:', contentWidth, `(${Math.round(contentWidth/gridWidth*100)}%)`);
    console.log('Hero Visual Width:', visualWidth, `(${Math.round(visualWidth/gridWidth*100)}%)`);

    // Show on page
    const debugDiv = document.createElement('div');
    debugDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; background: red; color: white; padding: 10px; z-index: 99999; font-size: 12px;';
    debugDiv.innerHTML = `
        Grid: ${gridWidth}px<br>
        Content: ${contentWidth}px (${Math.round(contentWidth/gridWidth*100)}%)<br>
        Visual: ${visualWidth}px (${Math.round(visualWidth/gridWidth*100)}%)
    `;
    document.body.appendChild(debugDiv);

    setTimeout(() => debugDiv.remove(), 10000);
} else {
    console.error('Hero elements not found!');
}
