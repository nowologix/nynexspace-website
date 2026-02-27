// ============================================
// STARFIELD - Parallax Stars with Sparkle
// ============================================

(function() {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let stars = [];
    let scrollY = 0;
    let targetScrollY = 0;

    // Star configuration
    const STAR_COUNT = 200;
    const PARALLAX_STRENGTH = 0.15;

    // Resize handler
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    // Star class
    class Star {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.z = Math.random() * 3 + 0.5;  // Depth for parallax (0.5 to 3.5)
            this.size = Math.random() * 1.5 + 0.5;
            this.baseOpacity = Math.random() * 0.5 + 0.3;
            this.opacity = this.baseOpacity;
            this.twinkleSpeed = Math.random() * 0.02 + 0.005;
            this.twinklePhase = Math.random() * Math.PI * 2;
            this.color = this.getRandomColor();
        }

        getRandomColor() {
            const colors = [
                { r: 255, g: 255, b: 255 },  // White
                { r: 200, g: 220, b: 255 },  // Light blue
                { r: 255, g: 240, b: 200 },  // Warm white
                { r: 180, g: 200, b: 255 },  // Cool blue
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        update(time) {
            // Twinkle effect
            this.twinklePhase += this.twinkleSpeed;
            const twinkle = Math.sin(this.twinklePhase) * 0.3 + 0.7;
            this.opacity = this.baseOpacity * twinkle;
        }

        draw(parallaxY) {
            // Apply parallax based on depth (z)
            const parallaxOffset = parallaxY * this.z * PARALLAX_STRENGTH;
            const y = (this.y - parallaxOffset) % height;

            // Handle wrapping
            let drawY = y;
            if (drawY < 0) drawY += height;
            if (drawY > height) drawY -= height;

            ctx.beginPath();
            ctx.arc(this.x, drawY, this.size * this.z * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity})`;
            ctx.fill();

            // Add glow for larger stars
            if (this.z > 2 && this.opacity > 0.5) {
                ctx.beginPath();
                ctx.arc(this.x, drawY, this.size * this.z * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity * 0.2})`;
                ctx.fill();
            }
        }
    }

    // Initialize stars
    function initStars() {
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push(new Star());
        }
    }

    // Animation loop
    let animationId;
    function animate(time) {
        // Smooth scroll interpolation
        targetScrollY = window.lenis ? window.lenis.scroll : window.scrollY;
        scrollY += (targetScrollY - scrollY) * 0.1;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Update and draw stars
        stars.forEach(star => {
            star.update(time);
            star.draw(scrollY);
        });

        animationId = requestAnimationFrame(animate);
    }

    // Initialize
    resize();
    initStars();
    animate(0);

    // Handle resize
    window.addEventListener('resize', () => {
        resize();
        initStars();
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    });

    console.log('Starfield initialized');
})();
