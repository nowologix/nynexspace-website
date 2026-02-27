// ============================================
// NYNEX SPACE - Strategic Intelligence from Orbit
// ============================================

console.log('NYNEX SPACE - Script loaded');

// ============================================
// CLEANUP MANAGEMENT
// ============================================
const scriptCleanup = {
    scrollHandler: null,
    anchorHandlers: [],
    observer: null,

    cleanup() {
        // Remove scroll handler
        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
            this.scrollHandler = null;
        }

        // Remove anchor handlers
        this.anchorHandlers.forEach(({ element, handler }) => {
            element.removeEventListener('click', handler);
        });
        this.anchorHandlers = [];

        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        console.log('Script cleanup completed');
    }
};

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => scriptCleanup.cleanup());

// ============================================
// EASED PROGRAMMATIC SCROLLING
// ============================================

/**
 * Smooth scroll to a target position with easing
 * @param {number} targetY - Target scroll position
 * @param {number} duration - Animation duration in ms
 * @param {string} easing - Easing function: 'easeInOutQuad', 'easeOutCubic', 'easeInOutCubic'
 */
function smoothScrollTo(targetY, duration = 1000, easing = 'easeInOutQuad') {
    const startY = window.scrollY;
    const distance = targetY - startY;
    const startTime = performance.now();

    // Easing functions
    const easings = {
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
        easeOutCubic: t => 1 - Math.pow(1 - t, 3),
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
        easeOutQuad: t => 1 - (1 - t) * (1 - t),
        linear: t => t
    };

    const easingFn = easings[easing] || easings.easeInOutQuad;

    function animateScroll(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFn(progress);

        window.scrollTo(0, startY + (distance * easedProgress));

        if (progress < 1) {
            requestAnimationFrame(animateScroll);
        }
    }

    requestAnimationFrame(animateScroll);
}

/**
 * Smooth scroll to an element
 * @param {HTMLElement|string} target - Element or selector
 * @param {number} offset - Optional offset in pixels
 * @param {number} duration - Animation duration in ms
 */
function smoothScrollToElement(target, offset = 0, duration = 1000) {
    let element;

    if (typeof target === 'string') {
        element = document.querySelector(target);
    } else if (target instanceof HTMLElement) {
        element = target;
    }

    if (!element) {
        console.warn('Element not found for smooth scroll:', target);
        return;
    }

    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    const targetY = elementPosition - offset;

    smoothScrollTo(targetY, duration);
}

/**
 * Smooth scroll by a relative amount
 * @param {number} delta - Pixels to scroll (positive = down, negative = up)
 * @param {number} duration - Animation duration in ms
 */
function smoothScrollBy(delta, duration = 1000) {
    const targetY = window.scrollY + delta;
    smoothScrollTo(targetY, duration);
}

// Make functions available globally
window.smoothScrollTo = smoothScrollTo;
window.smoothScrollToElement = smoothScrollToElement;
window.smoothScrollBy = smoothScrollBy;

console.log('Eased scrolling functions loaded. Use: smoothScrollTo(), smoothScrollToElement(), smoothScrollBy()');

// ============================================
// LENIS SMOOTH SCROLLING (Touch-like feel)
// ============================================

// Global Lenis instance for access by other scripts
window.lenis = null;

(() => {
    // Initialize Lenis for smooth scrolling
    window.lenis = new Lenis({
        duration: 1.2,                    // Duration of smooth scroll
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),  // Easing function
        direction: 'vertical',             // Scroll direction
        gestureDirection: 'vertical',      // Gesture direction
        smooth: true,                      // Enable smooth scrolling
        mouseMultiplier: 1,                // Mouse wheel sensitivity
        smoothTouch: true,                 // Enable smooth scrolling on touch devices
        touchMultiplier: 2,                // Touch sensitivity
        infinite: false,                   // Disable infinite scrolling
    });

    // RequestAnimationFrame loop for Lenis
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Override smoothScrollTo to use Lenis
    window.smoothScrollTo = (targetY) => {
        lenis.scrollTo(targetY);
    };

    // Override smoothScrollToElement to use Lenis
    window.smoothScrollToElement = (target, offset = 0) => {
        let element;
        if (typeof target === 'string') {
            element = document.querySelector(target);
        } else if (target instanceof HTMLElement) {
            element = target;
        }

        if (!element) {
            console.warn('Element not found for smooth scroll:', target);
            return;
        }

        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        const targetY = elementPosition - offset;
        lenis.scrollTo(targetY);
    };

    // Override smoothScrollBy to use Lenis
    window.smoothScrollBy = (delta) => {
        const targetY = window.scrollY + delta;
        lenis.scrollTo(targetY);
    };

    console.log('Lenis smooth scrolling enabled - smoother, touch-like feel');
})();

// ============================================
// NAVIGATION SCROLL EFFECT
// ============================================
const nav = document.querySelector('.nav');
const navLogo = document.querySelector('.nav-logo img');
const heroSection = document.querySelector('.hero');
const governmentSection = document.querySelector('#government');

if (nav && heroSection) {
    const heroHeight = heroSection.offsetHeight;
    const governmentSectionTop = governmentSection ? governmentSection.offsetTop : Infinity;

    // Function to update nav state based on scroll position
    const updateNavState = () => {
        const scrollY = window.lenis ? window.lenis.scroll : window.scrollY;

        // Box-Style sobald man scrollt (auch 1px)
        if (scrollY > 0) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        // Light mode when reaching government/white section
        if (scrollY > governmentSectionTop - 100) {
            nav.classList.add('light-mode');
            // Logo wechseln zu dark
            if (navLogo) {
                navLogo.src = '/logo/nynesspacelogo_dark.png';
            }
        } else {
            nav.classList.remove('light-mode');
            // Logo wechseln zu light
            if (navLogo) {
                navLogo.src = '/logo/nynesspacelogo_light.png';
            }
        }
    };

    // Set up scroll handler
    // Use Lenis scroll event if available, otherwise fall back to window scroll
    const setupScrollHandler = () => {
        if (window.lenis) {
            window.lenis.on('scroll', updateNavState);
        } else {
            window.addEventListener('scroll', updateNavState, { passive: true });
            // Store for cleanup
            scriptCleanup.scrollHandler = updateNavState;
        }
    };

    // Set up immediately or wait for Lenis to be ready
    if (window.lenis) {
        setupScrollHandler();
    } else {
        // Try again after a short delay
        setTimeout(setupScrollHandler, 100);
    }
}

// ============================================
// SMOOTH SCROLLING (Anchor Links)
// ============================================
const anchorHandler = function (e) {
    const href = this.getAttribute('href');
    if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const navHeight = 64;
            const currentScroll = window.lenis ? window.lenis.scroll : window.pageYOffset;
            const targetPosition = target.getBoundingClientRect().top + currentScroll - navHeight;
            // Use Lenis smooth scrolling
            window.smoothScrollTo(targetPosition);
        }
    }
};

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', anchorHandler);
    scriptCleanup.anchorHandlers.push({ element: anchor, handler: anchorHandler });
});

// ============================================
// FADE IN ON SCROLL
// ============================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

scriptCleanup.observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            scriptCleanup.observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe sections for fade-in effect
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.vertical-section, .tech-card, .trust-card, .compliance-badge, .contact-box');
    sections.forEach(section => {
        section.classList.add('fade-in-section');
        scriptCleanup.observer.observe(section);
    });
});

// ============================================
// HAMBURGER MENU (Mobile)
// ============================================
const hamburger = document.getElementById('hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('mobile-open');
        document.body.style.overflow = navMenu.classList.contains('mobile-open') ? 'hidden' : '';
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('mobile-open');
            document.body.style.overflow = '';
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('mobile-open') &&
            !navMenu.contains(e.target) &&
            !hamburger.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('mobile-open');
            document.body.style.overflow = '';
        }
    });
}

// ============================================
// CONSOLE BRANDING
// ============================================
console.log('%c NYNEX SPACE - Strategic Intelligence from Orbit', 'font-size: 16px; color: #667eea; font-weight: bold; font-family: monospace;');
