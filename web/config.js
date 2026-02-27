// ============================================
// IMMOQUANTIS - API CONFIGURATION
// ============================================

// API Configuration - automatically detects environment
const API_CONFIG = {
    // In production, if served from the same domain, use relative paths
    // In development, point to the Next.js backend
    getApiUrl: function() {
        // Check if we're in development mode (localhost or file://)
        const isDevelopment = window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1' ||
                             window.location.protocol === 'file:';

        // Check if there's an explicit override in localStorage
        const override = localStorage.getItem('immostack_api_url');
        if (override) {
            return override;
        }

        // Development: Point to Next.js backend on port 3004
        if (isDevelopment) {
            return 'http://localhost:3004';
        }

        // Production: Use relative path (same domain)
        return '';
    },

    // Get the full URL for an API endpoint
    getEndpointUrl: function(endpoint) {
        const baseUrl = this.getApiUrl();
        return baseUrl + endpoint;
    },

    // Dashboard URL configuration
    getDashboardUrl: function(path = '') {
        const isDevelopment = window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1' ||
                             window.location.protocol === 'file:';

        // Development: Point to Next.js backend
        if (isDevelopment) {
            return 'http://localhost:3004' + path;
        }

        // Production: Use relative path
        return path;
    }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.IMMO_CONFIG = API_CONFIG;
}
