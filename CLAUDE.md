# CLAUDE.md - NYNEX SPACE Website

## Project Overview

NYNEX SPACE is a **static marketing/landing page website** for a sovereign satellite AI intelligence company. The site is a single-page application built with vanilla HTML, CSS, and JavaScript (no framework, no build step). It features a dark-themed hero section with an interactive 3D globe, scroll-driven animations, and bilingual (EN/DE) support.

The project previously had a real estate SaaS component (ImmoStack/ImmoQuantis) which has been fully pivoted to a space/defense intelligence brand. Some legacy references (e.g., `immostack_api_url` in `config.js`, the README) remain from that era.

## Repository Structure

```
nynexspace-website/
├── CLAUDE.md              # This file
├── .gitignore             # Standard Node.js gitignore
├── *.svg, *.png, *.jpeg   # Root-level brand assets (legacy copies)
│
└── web/                   # Main website (all served files)
    ├── index.html          # Single-page landing page
    ├── impressum.html      # Legal: Imprint (German law requirement)
    ├── datenschutz.html    # Legal: Privacy policy (GDPR)
    ├── styles.css          # All styles (~2050 lines, single file)
    ├── package.json        # Only dependency: Playwright (for testing)
    │
    ├── script.js           # Core: nav, smooth scroll (Lenis), hamburger menu, fade-in observers
    ├── translations.js     # i18n: EN/DE translation strings + language switcher
    ├── starfield.js        # Canvas: animated parallax starfield background
    ├── globe.js            # Three.js: interactive 3D Earth globe (ES module)
    ├── scroll-animation.js # Scroll-driven animation engine (6 phases, globe movement, effects)
    ├── config.js           # API config (legacy, references ImmoStack backend)
    ├── lenis.min.js        # Vendored: Lenis smooth scrolling library
    │
    ├── inspect_globe.js    # Debug: Playwright script for globe positioning
    ├── debug_screenshot.js # Debug: Playwright script for layout debugging
    ├── test-hero-sizes.js  # Debug: in-browser hero size measurement
    │
    ├── logo/               # Brand logos (light/dark variants)
    ├── images/             # Section imagery (satellite, weather, agriculture, scanner/)
    ├── logos/               # Third-party logos (legacy real estate portals)
    ├── *.svg, *.png        # Flags, blurs, and other assets
    └── README.md           # Deployment guide (partially outdated, references ImmoStack)
```

## Tech Stack

- **HTML/CSS/JS** - No framework, no bundler, no build step
- **Three.js** (v0.134.0 via CDN/Skypack) - 3D globe with custom GLSL shaders
- **Lenis** (vendored) - Smooth scrolling library
- **Playwright** (dev dependency) - Used for visual debugging/testing scripts
- **Fonts** - Inter (body) + Orbitron (headings), loaded from Google Fonts

## Development

### Local Server

The site is static HTML. Serve the `web/` directory with any HTTP server:

```bash
cd web
# Option 1: live-server (recommended for development)
npx live-server --port=8080

# Option 2: Python
python -m http.server 8080
```

Then open `http://localhost:8080`.

### No Build Step

There is no build process. Edit files directly and refresh the browser. The globe module uses native ES module imports via CDN.

### Playwright Debug Scripts

Three Playwright-based debug scripts exist in `web/` for visual testing:
- `inspect_globe.js` - Captures globe positioning/computed styles
- `debug_screenshot.js` - Full-page screenshot with element analysis
- `test-hero-sizes.js` - In-browser hero layout measurement (paste in console)

Run Playwright scripts: `cd web && npx playwright test <script>` (requires `npm install` first).

## Architecture & Key Patterns

### Script Loading Order (index.html)

Scripts are loaded in this specific order at the end of `<body>`:
1. `lenis.min.js` - Smooth scrolling (must be first)
2. `translations.js` - i18n strings + language init
3. `script.js` - Navigation, Lenis init, scroll handlers, hamburger menu
4. `starfield.js` - Canvas starfield (IIFE, self-contained)
5. `globe.js` - Three.js globe (`type="module"`, ES imports)
6. `scroll-animation.js` - Phase-based scroll animations (depends on globe.js globals)

**Loading dependency**: `scroll-animation.js` waits for `window.load` + 500ms timeout to ensure `globe.js` has initialized its global objects (`window.globeAtmosphere`, `window.globeStormEffects`, `window.globeOrbitalTubes`).

### Scroll Animation Phases

The page is divided into 7 scroll-driven phases controlled by `scroll-animation.js`:

| Phase | Section | Globe Behavior | Effects |
|-------|---------|---------------|---------|
| 1 | Hero | Right side → center, scale 1.0→0.8 | Starfield parallax |
| 2 | Sovereign Mission | Centered, scale 0.8 | Text fade-in |
| 3 | Infrastructure | Center → right side, scale 0.8→0.45 | Satellite image scales |
| 4 | Space Weather | Right → left side, scale 0.45 | Solar storm halos + particles |
| 5 | Food Security | Left → right side, scale 0.45 | Orbital tubes grow, storm fades |
| 6 | Architecture+ | Right side, scale 0.45 | Globe fades out over 1200px |
| 7 | Institutional | No globe visible | Light-mode nav transition |

### Globe System (globe.js)

The 3D globe uses Three.js with custom GLSL shaders and exposes three global control interfaces:

- `window.globeAtmosphere` - Controls halo glow color (normal blue ↔ solar storm orange)
- `window.globeStormEffects` - Controls additional storm halos + solar wind particle system
- `window.globeOrbitalTubes` - Controls 8 orbital path tubes with progressive draw animation

The globe renders world dots from a GitHub-hosted map texture using instanced meshes.

### Internationalization (translations.js)

- Two languages: English (`en`) and German (`de`)
- Default language: German (`de`), stored in `localStorage`
- Translation keys use dot notation: `'hero.title'`, `'nav.capabilities'`
- HTML elements use `data-i18n` attributes for automatic translation
- Some translations contain raw HTML (e.g., `<span class="gradient-text">`)

### Navigation Behavior

- Fixed nav bar with transparent → frosted glass → boxed transitions on scroll
- **Dark mode** (default): dark background, light text, light logo
- **Light mode**: triggers at government section, swaps to light background, dark text, dark logo
- Hamburger menu on mobile with slide-in overlay
- Phase dot navigation on the left side (desktop only, snaps to sections)

### CSS Architecture (styles.css)

- Single CSS file, ~2050 lines
- CSS custom properties (variables) for colors, spacing, and border radius
- Mobile-first responsive design with breakpoints at `768px` and `1024px`
- Sections: Reset → Navigation → Hero → Positioning → Capabilities → Technology → Government → Capital → Trust → Contact → Footer → Animations → Phase Navigation → Responsive

### Color Scheme

The site uses a dual-theme approach:
- **Dark sections** (Hero through Technology): `#000000` background, white/blue text, gradient orbs
- **Light sections** (Government onward): `#ffffff` background, dark text
- **Brand colors**: Sky blue (`#0ea5e9`), accent blue (`#7dd3fc`), green for food security (`#10b981`), orange for solar storm (`#FF6B00`)

## Conventions

### Git Commit Messages

- Imperative mood, present tense: "Add", "Fix", "Update", "Revert"
- Short (under 72 chars), descriptive of the change
- Examples from history:
  - `Fix responsive globe positioning with dynamic centering and side offsets`
  - `Add scroll snapping, phase navigation, and visual improvements`
  - `Revert Fresnel reflection - too subtle for the computational cost`

### Code Style

- Vanilla JavaScript, no TypeScript
- `const`/`let` (no `var`)
- IIFEs for self-contained modules (starfield.js)
- ES modules only for globe.js (Three.js imports)
- Console logging for initialization confirmation (`console.log('Module initialized')`)
- Cleanup patterns: each script tracks its own resources and cleans up on `beforeunload`

### File Organization

- All website files live in `web/`
- Assets are referenced with absolute paths from the web root (e.g., `/logo/nynesspacelogo_light.png`, `/images/sattelite.png`)
- Legal pages (impressum, datenschutz) share the same `styles.css` and navigation structure

## Important Notes

- **No test suite**: There are no automated tests. The Playwright scripts are debug utilities, not tests.
- **No CI/CD**: No pipeline configuration exists.
- **CDN dependencies**: Three.js and OrbitControls are loaded from `cdn.skypack.dev` at runtime. If Skypack goes down, the globe breaks.
- **Legacy artifacts**: `web/config.js`, `web/README.md`, and `web/logos/` directory contain references to the old ImmoStack/ImmoQuantis real estate product. These are not actively used by the current site but remain in the repo.
- **Asset paths**: Images use absolute paths (`/images/...`), which means the site must be served from the root of a domain or virtual host. Subdirectory deployment requires path adjustments.
- **Performance**: The globe + starfield + scroll animations are GPU-intensive. Mobile devices get a simplified experience (globe is dimmed, centered, no movement).
- **Bilingual content**: Both `impressum.html` and `datenschutz.html` are written in German (legal requirement for German companies) but include English translations inline.
