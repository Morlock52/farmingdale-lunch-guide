/**
 * Application constants and configuration
 * Centralizes magic numbers and strings for maintainability
 */
const Constants = {
    // API Configuration
    API: {
        MIN_DELAY: 200,
        MAX_DELAY: 800,
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000,
        RETRYABLE_ERRORS: ['NETWORK_ERROR', 'TIMEOUT', 'SERVICE_UNAVAILABLE']
    },

    // Storage Keys
    STORAGE_KEYS: {
        FAVORITES: 'farmingdale_lunch_favorites',
        PREFERENCES: 'farmingdale_lunch_preferences',
        CACHE_TIMESTAMP: 'farmingdale_lunch_cache_time',
        THEME: 'farmingdale_lunch_theme',
        RECENT_SEARCHES: 'farmingdale_lunch_recent_searches',
        NOTES: 'farmingdale_lunch_notes',
        VISITS: 'farmingdale_lunch_visits',
        FAVORITES_ORDER: 'farmingdale_lunch_favorites_order',
        DEFAULT_VIEW: 'farmingdale_lunch_default_view'
    },

    // UI Configuration
    UI: {
        DEBOUNCE_DELAY: 300,
        TOAST_DURATION: 3000,
        ANIMATION_DURATION: 300,
        LAZY_LOAD_THRESHOLD: '100px',
        MAX_RECENT_SEARCHES: 5,
        PAGE_SIZE: 6,
        BACK_TO_TOP_THRESHOLD: 300,
        MAX_COMPARE: 3,
        WALKING_SPEED_MPH: 3
    },

    // Filter Options
    FILTERS: {
        CATEGORIES: [
            { value: 'all', label: 'All Categories' },
            { value: 'pizza', label: 'Pizza' },
            { value: 'deli', label: 'Deli' },
            { value: 'asian', label: 'Asian' },
            { value: 'fast-food', label: 'Fast Food' },
            { value: 'cafe', label: 'Cafe' }
        ],
        PRICE_RANGES: [
            { value: 'all', label: 'All Prices' },
            { value: '$', label: '$ (Under $10)' },
            { value: '$$', label: '$$ ($10-$20)' },
            { value: '$$$', label: '$$$ (Over $20)' }
        ],
        SORT_OPTIONS: [
            { value: 'rating', label: 'Highest Rated' },
            { value: 'distance', label: 'Nearest' },
            { value: 'price-low', label: 'Price: Low to High' },
            { value: 'price-high', label: 'Price: High to Low' },
            { value: 'name', label: 'Name (A-Z)' }
        ],
        DIETARY_OPTIONS: [
            { value: 'all', label: 'All Dietary' },
            { value: 'vegetarian', label: 'Vegetarian' },
            { value: 'vegan', label: 'Vegan' },
            { value: 'halal', label: 'Halal' },
            { value: 'gluten-free', label: 'Gluten-Free' }
        ]
    },

    // Validation
    VALIDATION: {
        MIN_RATING: 0,
        MAX_RATING: 5,
        REQUIRED_RESTAURANT_FIELDS: ['id', 'name', 'category', 'price']
    },

    // Theme
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark'
    },

    // CSS Classes
    CSS_CLASSES: {
        HIDDEN: 'hidden',
        ACTIVE: 'active',
        LOADING: 'loading',
        ERROR: 'error',
        DARK_MODE: 'dark-mode'
    },

    // Error Messages
    ERROR_MESSAGES: {
        DATA_SOURCE_UNAVAILABLE: 'Unable to load restaurant data. Please refresh the page.',
        INVALID_DATA_FORMAT: 'Restaurant data is corrupted. Please contact support.',
        NO_VALID_DATA: 'No restaurants available at this time.',
        NOT_FOUND: 'Restaurant not found.',
        INVALID_ID: 'Invalid restaurant selection.',
        CORRUPTED_DATA: 'Restaurant information is incomplete.',
        NETWORK_ERROR: 'Network error. Please check your connection.',
        TIMEOUT: 'Request timed out. Please try again.',
        UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.'
    },

    // Toast Types
    TOAST_TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    }
};

// Freeze all nested objects
Object.keys(Constants).forEach(key => {
    if (typeof Constants[key] === 'object' && Constants[key] !== null) {
        Object.freeze(Constants[key]);
    }
});

Object.freeze(Constants);
