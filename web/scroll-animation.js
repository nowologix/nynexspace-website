// ============================================
// ORBITAL DAY CYCLE - Manual Scroll Animation
// ============================================

// Cleanup tracker
let scrollAnimationCleanup = null;

// Wait for page load - AFTER globe.js has fully initialized
window.addEventListener('load', () => {
    setTimeout(initOrbitalAnimation, 500);
});

function initOrbitalAnimation() {
    const globe = document.querySelector('#globe');
    const heroVisual = document.querySelector('.hero-visual');
    const heroSection = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    const positioningContent = document.querySelector('.positioning-content');

    if (!globe || !heroSection || !heroVisual) {
        console.log('Orbital animation: Required elements not found');
        return;
    }

    // Set initial inline background for animation (transparent to show body vignette)
    heroSection.style.background = 'transparent';

    // IMPORTANT: Start with text HIDDEN, fade in during scroll
    positioningContent.style.setProperty('opacity', '0', 'important');
    positioningContent.style.visibility = 'visible';

    // Set text colors inline
    const heading = positioningContent.querySelector('h2');
    const paragraph = positioningContent.querySelector('p');
    if (heading) heading.style.color = '#ffffff';
    if (paragraph) paragraph.style.color = 'rgba(255, 255, 255, 0.8)';

    // Get gradient orbs for parallax (all 6 orbs) - now in global-orbs container
    const orb1 = document.querySelector('.orb-1');
    const orb2 = document.querySelector('.orb-2');
    const orb3 = document.querySelector('.orb-3');
    const orb4 = document.querySelector('.orb-4');
    const orb5 = document.querySelector('.orb-5');
    const orb6 = document.querySelector('.orb-6');

    console.log('Orbs found:', {
        orb1: !!orb1,
        orb2: !!orb2,
        orb3: !!orb3,
        orb4: !!orb4,
        orb5: !!orb5,
        orb6: !!orb6
    });

    const allOrbs = [orb1, orb2, orb3, orb4, orb5, orb6];

    // CRITICAL: Read the ACTUAL current position AFTER everything is loaded
    const startRight = parseInt(window.getComputedStyle(heroVisual).right);
    console.log('Starting position:', startRight);

    // Get ACTUAL globe dimensions for precise centering
    const globeRect = globe.getBoundingClientRect();
    const globeWidth = globeRect.width;
    const globeHeight = globeRect.height;
    console.log('Globe dimensions:', globeWidth, 'x', globeHeight);

    // Animation configuration
    const startRightValue = startRight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate TRUE center position for globe
    // Globe is positioned with right: 0 inside hero-visual
    // To center globe on screen: heroVisual.right = (viewportWidth - globeWidth) / 2
    // Derivation: globe center = viewportWidth - heroVisual.right - (globeWidth / 2)
    //            For centering: viewportWidth - heroVisual.right - (globeWidth / 2) = viewportWidth / 2
    //            Therefore: heroVisual.right = (viewportWidth - globeWidth) / 2
    const centerRightValue = (viewportWidth - globeWidth) / 2;

    console.log('Calculated centerRightValue:', centerRightValue, '(viewportWidth:', viewportWidth, ', globeWidth:', globeWidth, ')');

    // Calculate section positions (CACHE THESE to avoid getBoundingClientRect on every scroll!)
    const positioningSection = document.querySelector('.section-positioning');
    const sectionTop = positioningSection ? positioningSection.offsetTop : viewportHeight;

    // Infrastructure section
    const infrastructureSection = document.querySelector('#vertical-infrastructure');
    const infrastructureImage = infrastructureSection ? infrastructureSection.querySelector('.visual-infrastructure') : null;

    // Space Weather section (Phase 4)
    const spaceWeatherSection = document.querySelector('#vertical-spaceweather');
    const spaceWeatherImage = spaceWeatherSection ? spaceWeatherSection.querySelector('.visual-weather') : null;

    // Food Security section (Phase 5)
    const foodSecuritySection = document.querySelector('#vertical-foodsecurity');
    const foodSecurityImage = foodSecuritySection ? foodSecuritySection.querySelector('.visual-agriculture') : null;

    // Cache section positions (expensive getBoundingClientRect calls moved here!)
    const getSectionPosition = (section) => {
        if (!section) return null;
        const rect = section.getBoundingClientRect();
        return rect.top + window.scrollY;
    };

    const infraSectionTop = getSectionPosition(infrastructureSection);
    const spaceWeatherSectionTop = getSectionPosition(spaceWeatherSection);
    const foodSecuritySectionTop = getSectionPosition(foodSecuritySection);

    const infraCenterScroll = infraSectionTop ? infraSectionTop - (viewportHeight / 2) : null;
    const spaceWeatherCenterScroll = spaceWeatherSectionTop ? spaceWeatherSectionTop - (viewportHeight / 2) : null;
    const foodSecurityCenterScroll = foodSecuritySectionTop ? foodSecuritySectionTop - (viewportHeight / 2) : null;

    // Set satellite image to initially VISIBLE (only hide in Phase 4)
    if (infrastructureImage) {
        infrastructureImage.style.opacity = '1';
    }

    // Also set space weather image visible by default
    if (spaceWeatherImage) {
        spaceWeatherImage.style.opacity = '1';
    }

    console.log('Animation config - startRight:', startRightValue, 'centerRight:', centerRightValue, 'sectionTop:', sectionTop);
    console.log('globeRightOffset (for Phase 3):', (centerRightValue - 200).toFixed(0), 'px');

    // Manual scroll handler with state tracking
    let ticking = false;
    let lastScrollY = 0;
    let accumulatedSlowMo = 0;
    let globeX = 0;  // Globe X offset from center
    let globeY = 0;  // Globe Y offset from center

    // Cache text elements
    const textElements = positioningContent.querySelectorAll('h2, p');

    // Initialize phase tracking
    window._lastPhase = '0';

    // Track previous values to detect jumps
    let prevGlobeX = 0;
    let prevGlobeScale = 1;

    // Orb color interpolation state
    let currentOrbColors = {
        orb1: { r: 102, g: 126, b: 234 },   // var(--color-primary) #667eea
        orb2: { r: 118, g: 75, b: 162 },    // var(--color-secondary) #764ba2
        orb3: { r: 59, g: 130, b: 246 }     // var(--color-accent) #3b82f6
    };
    let targetOrbColors = {
        orb1: { r: 102, g: 126, b: 234 },
        orb2: { r: 118, g: 75, b: 162 },
        orb3: { r: 59, g: 130, b: 246 }
    };
    const colorTransitionSpeed = 0.02; // Interpolation speed

    // Color palettes for phases
    const phaseColors = {
        default: {
            orb1: { r: 102, g: 126, b: 234 },   // #667eea
            orb2: { r: 118, g: 75, b: 162 },    // #764ba2
            orb3: { r: 59, g: 130, b: 246 }     // #3b82f6
        },
        solar: {
            orb1: { r: 255, g: 107, b: 0 },     // #FF6B00
            orb2: { r: 255, g: 68, b: 0 },      // #FF4400
            orb3: { r: 255, g: 170, b: 0 }      // #FFAA00
        },
        food: {
            orb1: { r: 16, g: 185, b: 129 },    // #10b981
            orb2: { r: 5, g: 150, b: 105 },     // #059669
            orb3: { r: 52, g: 211, b: 153 }     // #34d399
        }
    };

    // Helper: Interpolate between colors
    function lerpColor(current, target, t) {
        return {
            r: current.r + (target.r - current.r) * t,
            g: current.g + (target.g - current.g) * t,
            b: current.b + (target.b - current.b) * t
        };
    }

    // Helper: RGB to CSS string
    function rgbToString(c) {
        return `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;
    }

    // Scroll handler
    const scrollHandler = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateAnimation();
                ticking = false;
            });
            ticking = true;
        }
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });

    function updateAnimation() {
        // Use Lenis scroll position if available, otherwise fall back to window.scrollY
        const scrollY = window.lenis ? window.lenis.scroll : window.scrollY;
        const deltaScroll = scrollY - lastScrollY;
        lastScrollY = scrollY;

        // Mobile mode: disable globe movement, keep centered background only
        const isMobile = window.innerWidth < 768;

        // Track which phase we're in
        let currentPhase = '0';

        // ============================================================
        // SECTION POSITIONS
        // ============================================================

        const sectionPaddingTop = 200;
        const textStartInDocument = sectionTop + sectionPaddingTop;
        const contentHeight = positioningContent.offsetHeight || 300;
        const textCenterInDocument = textStartInDocument + (contentHeight / 2);
        const textCenteredScroll = textCenterInDocument - (viewportHeight / 2);

        // Sovereign Mission slow-mo zone
        const zoneStart = textCenteredScroll - (viewportHeight * 0.4);
        const zoneEnd = textCenteredScroll + (viewportHeight * 0.25);

        // Slow-mo disabled - accumulatedSlowMo = 0
        accumulatedSlowMo = 0;

        // Globe timing (use cached positions!)
        const globeCenterEnd = textCenteredScroll * 0.4;  // End of Phase 1 (globe to center)
        const fadeInEnd = zoneStart + (viewportHeight * 0.15);  // Text fade-in within Phase 2
        const phase2End = zoneEnd;  // End of Phase 2 (Sovereign Mission)

        // Phase 3: Globe moves to right side and gets smaller (Infrastructure section)
        const phase3End = infraCenterScroll || (textCenteredScroll + viewportHeight + 500);

        // Phase 4: Globe moves to left side (Space Weather section)
        const phase4End = spaceWeatherCenterScroll || (phase3End + viewportHeight + 500);

        // Phase 5: Globe moves back to right side (Food Security section)
        const phase5End = foodSecurityCenterScroll || (phase4End + viewportHeight + 500);

        // Calculate translateX offset to move globe from center to right side
        // When centered: globe center = viewport center
        // When on right side: we want globe ~200px from viewport right edge
        // Current: globe right edge = viewportWidth - centerRightValue
        // Target: globe right edge = 200px from viewport right
        // So globe needs to move RIGHT by: (viewportWidth - centerRightValue) - 200 - (globeWidth / 2)
        // Wait, let me recalculate more carefully:
        // Globe at center: its right edge is at viewportWidth - centerRightValue - (globeWidth/2) from left... no that's wrong
        // Actually, when globe is centered: centerRightValue puts hero-visual's right edge such that globe is centered
        // Globe's right edge from viewport left = viewportWidth - centerRightValue
        // Globe's right edge from viewport right = centerRightValue
        // But globe's width is 1080px, so globe center is at: viewportWidth - centerRightValue - 540 = 960px (centered) ✓

        // Calculate translateX offset to move globe from center to right side
        // Increase by 20% for better positioning under the satellite
        const baseOffset = centerRightValue - 200;
        const globeRightOffset = baseOffset * 1.20;  // 20% more movement to the right

        let currentRight, currentScale, currentBg, globeOpacity;
        let textOpacity = 0;

        // ============================================================
        // PHASE 1: Globe to center (Hero → Sovereign Mission)
        // ============================================================
        if (scrollY < globeCenterEnd) {
            currentPhase = '1';
            const p = scrollY / globeCenterEnd;
            const eased = easeInOutQuad(Math.max(0, Math.min(p, 1)));
            currentRight = startRightValue + (centerRightValue - startRightValue) * eased;
            currentScale = 1 - (0.2 * eased);
            currentBg = 'transparent';
            globeOpacity = 1;
            textOpacity = 0;
            globeX = 0;
            globeY = 0;
        }
        // ============================================================
        // PHASE 2: Sovereign Mission with slow-mo
        // ============================================================
        else if (scrollY < zoneEnd) {
            currentPhase = '2';
            const subPhase = scrollY < fadeInEnd ? 'fade-in' : 'slow-mo';
            currentRight = centerRightValue;
            currentScale = 0.8;
            currentBg = 'transparent';
            globeOpacity = 1;
            globeX = 0;
            globeY = 0;
            textOpacity = subPhase === 'fade-in'
                ? Math.max(0, Math.min(1, (scrollY - globeCenterEnd) / (fadeInEnd - globeCenterEnd)))
                : 1;
        }
        // ============================================================
        // PHASE 3: Globe moves to right side and gets smaller (Infrastructure)
        // ============================================================
        else if (scrollY < phase3End) {
            currentPhase = '3';
            const p = (scrollY - phase2End) / (phase3End - phase2End);
            const eased = easeInOutQuad(Math.max(0, Math.min(p, 1)));

            // Keep heroVisual.right constant, use translateX to move globe
            currentRight = centerRightValue;

            // Move globe to right using translateX
            globeX = globeRightOffset * eased;  // 0 → 220px (moves right)

            // Scale down from 80% to 45%
            currentScale = 0.8 - (0.35 * eased);

            // Background stays black
            currentBg = 'transparent';

            globeOpacity = 1;
            globeY = viewportHeight * 0.02 * eased;  // Slight downward movement
            textOpacity = 1 - eased;  // Fade out Sovereign text

            // Don't reset atmosphere in Phase 3 - keep previous state
            // This prevents the snap when entering Phase 4

            // Reset storm effects (halos + particles) in Phase 3
            if (window.globeStormEffects) {
                window.globeStormEffects.setIntensity(0);
            }

            // Satellite image: scale based on position (peak earlier in scroll)
            // 20% at start → 100% at 30% → then shrinks back
            if (infrastructureImage) {
                // Shifted parabola: peaks at p=0.3 instead of p=0.5
                const shiftedP = (p - 0.3) / 0.7;  // Normalize so peak is at 0.3
                const parabola = Math.max(0, 1 - Math.pow(shiftedP, 2));
                const imageScale = 0.2 + (0.8 * parabola);
                infrastructureImage.style.transform = `scale(${imageScale})`;
                infrastructureImage.style.opacity = '1';
            }
        }
        // ============================================================
        // PHASE 4: Globe moves to LEFT side (Space Weather section)
        // Same distance from center as Phase 3, but mirrored to left
        // ============================================================
        else if (scrollY < phase4End) {
            currentPhase = '4';
            const p = (scrollY - phase3End) / (phase4End - phase3End);
            const eased = easeInOutQuad(Math.max(0, Math.min(p, 1)));

            // Keep heroVisual.right constant, use translateX to move globe
            currentRight = centerRightValue;

            // Move globe from RIGHT side to LEFT side
            // Start: globeRightOffset (right side) → End: -globeRightOffset (left side)
            globeX = globeRightOffset * (1 - eased * 2);  // Right offset → 0 → -Right offset (left)

            // Keep scale at 45%
            currentScale = 0.45;

            // Background stays black
            currentBg = 'transparent';

            globeOpacity = 1;
            globeY = viewportHeight * 0.02;
            textOpacity = 0;

            // Solar storm atmosphere effect - intensify through Phase 4
            if (window.globeAtmosphere) {
                window.globeAtmosphere.setSolarStormMode(true, eased);
            }

            // Storm effects (halos + particles) - intensify through Phase 4
            if (window.globeStormEffects) {
                window.globeStormEffects.setIntensity(eased);
            }

            // Hide the space weather image (but keep the satellite visible)
            if (spaceWeatherImage) {
                spaceWeatherImage.style.opacity = '0';
            }

            // Reset orbital tubes in Phase 4
            if (window.globeOrbitalTubes) {
                window.globeOrbitalTubes.reset();
            }
        }
        // ============================================================
        // PHASE 5: Globe moves from LEFT to RIGHT side (Food Security)
        // ORBITAL TUBES ANIMATE HERE
        // ============================================================
        else if (scrollY < phase5End) {
            currentPhase = '5';
            const p = (scrollY - phase4End) / (phase5End - phase4End);
            const eased = easeInOutQuad(Math.max(0, Math.min(p, 1)));

            // Keep heroVisual.right constant, use translateX to move globe
            currentRight = centerRightValue;

            // Move globe from LEFT side to RIGHT side (like Phase 3 position)
            // Start: -globeRightOffset (left side) → End: +globeRightOffset (right side)
            globeX = -globeRightOffset + (globeRightOffset * 2 * eased);  // Left → Right

            // Keep scale at 45%
            currentScale = 0.45;

            // Background stays black
            currentBg = 'transparent';

            globeOpacity = 1;
            globeY = viewportHeight * 0.02;
            textOpacity = 0;

            // Smoothly fade out solar storm at the start of Phase 5
            if (window.globeAtmosphere) {
                const stormFadeOut = Math.max(0, 1 - (p * 3));  // Fade out over first 33% of Phase 5
                window.globeAtmosphere.setSolarStormMode(true, stormFadeOut);
            }

            // Fade out storm effects (halos + particles)
            if (window.globeStormEffects) {
                const stormFadeOut = Math.max(0, 1 - (p * 3));
                window.globeStormEffects.setIntensity(stormFadeOut);
            }

            // Hide satellite image in Phase 5 to showcase globe with orbital tubes
            if (infrastructureImage) {
                infrastructureImage.style.opacity = '0';
            }

            // Hide food security agriculture image in Phase 5
            if (foodSecurityImage) {
                foodSecurityImage.style.opacity = '0';
            }

            // Animate orbital tubes - they grow progressively during Phase 5
            if (window.globeOrbitalTubes) {
                window.globeOrbitalTubes.setProgress(eased);
            }
        }
        // ============================================================
        // PHASE 6: Past Food Security section
        // ============================================================
        else {
            currentPhase = '6';
            currentRight = centerRightValue;
            currentScale = 0.45;
            currentBg = 'transparent';
            globeOpacity = 1;
            globeX = globeRightOffset;  // Keep globe on RIGHT side
            globeY = viewportHeight * 0.02;
            textOpacity = 0;

            // Reset atmosphere to normal
            if (window.globeAtmosphere) {
                window.globeAtmosphere.setSolarStormMode(false, 0);
            }

            // Reset storm effects to off
            if (window.globeStormEffects) {
                window.globeStormEffects.setIntensity(0);
            }

            // Hide satellite image to keep showcasing orbital tubes
            if (infrastructureImage) {
                infrastructureImage.style.opacity = '0';
            }

            // Hide food security agriculture image to keep showcasing orbital tubes
            if (foodSecurityImage) {
                foodSecurityImage.style.opacity = '0';
            }

            // Keep orbital tubes fully visible after Phase 5
            if (window.globeOrbitalTubes) {
                window.globeOrbitalTubes.setProgress(1);
            }

            // Fade out globe as we scroll past Phase 5
            // Over 1200px of scroll past phase5End
            const fadeOutStart = phase5End;
            const fadeOutEnd = phase5End + 1200;
            const fadeProgress = Math.min(1, Math.max(0, (scrollY - fadeOutStart) / (fadeOutEnd - fadeOutStart)));
            globeOpacity = 1 - fadeProgress;

            // Also fade out the hero-visual background (stays transparent for vignette)
            currentBg = 'transparent';
        }

        // Apply values
        // Mobile: keep globe centered, no movement
        if (isMobile) {
            heroVisual.style.right = '';
            heroVisual.style.transform = '';
            globe.style.transform = 'translate(-50%, -50%)'; // Full size on mobile
            globe.style.opacity = 0.3; // Dimmer on mobile
        } else {
            heroVisual.style.right = currentRight + 'px';
            // Combine vertical centering, offsets, and scale in a single transform
            globe.style.transform = `translateY(calc(-50% + ${globeY}px)) translateX(${globeX}px) scale(${currentScale})`;
        }

        globe.style.opacity = isMobile ? 0.3 : globeOpacity;
        heroSection.style.background = currentBg;

        // Parallax gradient orbs based on phase and scroll - stronger effect
        const parallaxY = scrollY * 0.5;
        const parallaxX = scrollY * 0.2;

        // Check if phase changed for color transitions
        const phaseChanged = window._lastPhase !== currentPhase;
        if (phaseChanged) {
            window._lastPhase = currentPhase;
        }

        // Set target colors based on phase
        if (currentPhase === '4') {
            targetOrbColors = phaseColors.solar;
        } else if (currentPhase === '5') {
            targetOrbColors = phaseColors.food;
        } else {
            targetOrbColors = phaseColors.default;
        }

        // Smoothly interpolate current colors toward target colors (every frame)
        currentOrbColors.orb1 = lerpColor(currentOrbColors.orb1, targetOrbColors.orb1, colorTransitionSpeed);
        currentOrbColors.orb2 = lerpColor(currentOrbColors.orb2, targetOrbColors.orb2, colorTransitionSpeed);
        currentOrbColors.orb3 = lerpColor(currentOrbColors.orb3, targetOrbColors.orb3, colorTransitionSpeed);

        const orbOpacity = 0.4;

        // Apply parallax and interpolated colors to all orbs (every frame)
        // Using translate3d for GPU acceleration
        // Adding slow upward drift for better parallax effect
        const driftY = -scrollY * 0.2; // Negative = upward when scrolling down
        // orb3 needs centering offset since it's positioned at top: 50%, left: 50%
        if (orb1) {
            orb1.style.transform = `translate3d(${parallaxX * 0.6}px, ${driftY + parallaxY * 0.2}px, 0)`;
            orb1.style.background = `radial-gradient(circle, ${rgbToString(currentOrbColors.orb1)} 0%, transparent 70%)`;
            orb1.style.opacity = orbOpacity;
        }
        if (orb2) {
            orb2.style.transform = `translate3d(${-parallaxX * 0.4}px, ${driftY - parallaxY * 0.3}px, 0)`;
            orb2.style.background = `radial-gradient(circle, ${rgbToString(currentOrbColors.orb2)} 0%, transparent 70%)`;
            orb2.style.opacity = orbOpacity;
        }
        if (orb3) {
            orb3.style.transform = `translate3d(calc(-50% + ${parallaxX * 0.3}px), calc(-50% + ${driftY + parallaxY * 0.25}px), 0)`;
            orb3.style.background = `radial-gradient(circle, ${rgbToString(currentOrbColors.orb3)} 0%, transparent 70%)`;
            orb3.style.opacity = orbOpacity;
        }
        if (orb4) {
            orb4.style.transform = `translate3d(${-parallaxX * 0.5}px, ${driftY + parallaxY * 0.15}px, 0)`;
            orb4.style.background = `radial-gradient(circle, ${rgbToString(currentOrbColors.orb1)} 0%, transparent 70%)`;
            orb4.style.opacity = orbOpacity;
        }
        if (orb5) {
            orb5.style.transform = `translate3d(${parallaxX * 0.35}px, ${driftY - parallaxY * 0.2}px, 0)`;
            orb5.style.background = `radial-gradient(circle, ${rgbToString(currentOrbColors.orb2)} 0%, transparent 70%)`;
            orb5.style.opacity = orbOpacity;
        }
        if (orb6) {
            orb6.style.transform = `translate3d(${-parallaxX * 0.25}px, ${driftY + parallaxY * 0.3}px, 0)`;
            orb6.style.background = `radial-gradient(circle, ${rgbToString(currentOrbColors.orb3)} 0%, transparent 70%)`;
            orb6.style.opacity = orbOpacity;
        }

        // Fade out orbs in Phase 6
        if (currentPhase === '6' && typeof fadeProgress !== 'undefined') {
            const orbFadeOpacity = orbOpacity * (1 - fadeProgress);
            allOrbs.forEach(orb => {
                if (orb) orb.style.opacity = orbFadeOpacity;
            });
        }

        // Apply text with slow-mo
        positioningContent.style.position = '';
        positioningContent.style.top = '';
        positioningContent.style.left = '';
        positioningContent.style.transform = `translateY(${accumulatedSlowMo}px)`;
        positioningContent.style.opacity = Math.max(0, Math.min(1, textOpacity)).toFixed(3);

        // Text color transition (after Sovereign Mission zone)
        if (scrollY > zoneEnd) {
            const p = Math.min(1, (scrollY - zoneEnd) / (viewportHeight * 3));
            const textColor = interpolateColor('#ffffff', '#1e293b', p);
            textElements.forEach(el => {
                el.style.color = textColor;
            });
        }

        // Hero fade
        heroContent.style.opacity = scrollY < viewportHeight * 0.15
            ? 1 - (scrollY / (viewportHeight * 0.15))
            : 0;

        // Track previous values (no debug logging to avoid performance hit)
        prevGlobeX = globeX;
        prevGlobeScale = currentScale;
    }

    // Initial call
    updateAnimation();

    console.log('Orbital animation initialized (manual scroll handler)');

    // Define cleanup function
    scrollAnimationCleanup = () => {
        window.removeEventListener('scroll', scrollHandler);
        console.log('Scroll animation event listener removed');
    };
}

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (scrollAnimationCleanup) {
        scrollAnimationCleanup();
    }
});

// Easing function
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Color interpolation
function lerpColor(color1, color2, factor) {
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);
    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);
    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));
    return `rgb(${r}, ${g}, ${b})`;
}

// Legacy function name for compatibility
function interpolateColor(color1, color2, factor) {
    return lerpColor(color1, color2, factor);
}

console.log('Orbital Day Cycle - Animation loaded');
