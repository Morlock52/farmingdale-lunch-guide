/**
 * Utility functions with comprehensive error handling
 */
const Utils = {
    /**
     * Safely parses JSON string with error handling
     * @param {string} jsonString - The JSON string to parse
     * @param {*} defaultValue - Default value to return on parse failure
     * @returns {*} Parsed object or default value
     */
    safeJsonParse(jsonString, defaultValue = null) {
        if (typeof jsonString !== 'string') {
            console.warn('safeJsonParse: Expected string input, received:', typeof jsonString);
            return defaultValue;
        }

        if (jsonString.trim() === '') {
            return defaultValue;
        }

        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('safeJsonParse: Failed to parse JSON string:', error.message);
            return defaultValue;
        }
    },

    /**
     * Safely converts object to JSON string with error handling
     * @param {*} data - The data to stringify
     * @param {string} defaultValue - Default value to return on stringify failure
     * @returns {string} JSON string or default value
     */
    safeJsonStringify(data, defaultValue = '{}') {
        if (data === undefined) {
            console.warn('safeJsonStringify: Cannot stringify undefined value');
            return defaultValue;
        }

        try {
            return JSON.stringify(data);
        } catch (error) {
            console.error('safeJsonStringify: Failed to stringify data:', error.message);
            // Handle circular references or other JSON.stringify errors
            if (error.message.includes('circular')) {
                console.error('safeJsonStringify: Circular reference detected in data');
            }
            return defaultValue;
        }
    },

    /**
     * Safely gets a DOM element with error handling
     * @param {string} selector - CSS selector
     * @returns {Element|null} The DOM element or null
     */
    getElement(selector) {
        if (typeof selector !== 'string' || selector.trim() === '') {
            console.error('getElement: Invalid selector provided:', selector);
            return null;
        }

        try {
            const element = document.querySelector(selector);
            if (!element) {
                console.warn(`getElement: No element found for selector "${selector}"`);
            }
            return element;
        } catch (error) {
            console.error(`getElement: Invalid CSS selector "${selector}":`, error.message);
            return null;
        }
    },

    /**
     * Safely gets multiple DOM elements with error handling
     * @param {string} selector - CSS selector
     * @returns {Element[]} Array of DOM elements (empty array on error)
     */
    getElements(selector) {
        if (typeof selector !== 'string' || selector.trim() === '') {
            console.error('getElements: Invalid selector provided:', selector);
            return [];
        }

        try {
            return Array.from(document.querySelectorAll(selector));
        } catch (error) {
            console.error(`getElements: Invalid CSS selector "${selector}":`, error.message);
            return [];
        }
    },

    /**
     * Debounces a function with error handling
     * @param {Function} func - Function to debounce
     * @param {number} wait - Debounce delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 300) {
        if (typeof func !== 'function') {
            console.error('debounce: First argument must be a function');
            return () => {};
        }

        if (typeof wait !== 'number' || wait < 0) {
            console.warn('debounce: Invalid wait time, using default 300ms');
            wait = 300;
        }

        let timeoutId = null;

        return function debounced(...args) {
            try {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    try {
                        func.apply(this, args);
                    } catch (error) {
                        console.error('debounce: Error executing debounced function:', error.message);
                    }
                }, wait);
            } catch (error) {
                console.error('debounce: Error setting up debounce:', error.message);
            }
        };
    },

    /**
     * Safely escapes HTML to prevent XSS attacks
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (text === null || text === undefined) {
            return '';
        }

        if (typeof text !== 'string') {
            try {
                text = String(text);
            } catch (error) {
                console.error('escapeHtml: Failed to convert input to string:', error.message);
                return '';
            }
        }

        const htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };

        return text.replace(/[&<>"']/g, char => htmlEscapes[char]);
    },

    /**
     * Validates restaurant data structure
     * @param {Object} restaurant - Restaurant object to validate
     * @returns {{valid: boolean, errors: string[]}} Validation result
     */
    validateRestaurant(restaurant) {
        const errors = [];
        const requiredFields = ['id', 'name', 'category', 'price'];

        if (!restaurant || typeof restaurant !== 'object') {
            return { valid: false, errors: ['Restaurant data must be an object'] };
        }

        requiredFields.forEach(field => {
            if (!(field in restaurant)) {
                errors.push(`Missing required field: ${field}`);
            }
        });

        if (restaurant.id !== undefined && typeof restaurant.id !== 'number') {
            errors.push('Field "id" must be a number');
        }

        if (restaurant.name !== undefined && typeof restaurant.name !== 'string') {
            errors.push('Field "name" must be a string');
        }

        if (restaurant.rating !== undefined) {
            if (typeof restaurant.rating !== 'number' || restaurant.rating < 0 || restaurant.rating > 5) {
                errors.push('Field "rating" must be a number between 0 and 5');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * Formats a rating number for display with error handling
     * @param {number} rating - Rating value
     * @returns {string} Formatted rating string
     */
    formatRating(rating) {
        if (typeof rating !== 'number' || isNaN(rating)) {
            console.warn('formatRating: Invalid rating value:', rating);
            return 'N/A';
        }

        if (rating < 0 || rating > 5) {
            console.warn('formatRating: Rating out of range (0-5):', rating);
            rating = Math.max(0, Math.min(5, rating));
        }

        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '\u2605'; // Full star
        }
        if (hasHalfStar && fullStars < 5) {
            stars += '\u00BD'; // Half
        }

        return `${stars} ${rating.toFixed(1)}`;
    },

    /**
     * Creates an element safely with error handling
     * @param {string} tag - HTML tag name
     * @param {Object} attributes - Element attributes
     * @param {string} innerHTML - Inner HTML content (will be escaped)
     * @returns {HTMLElement|null} Created element or null on error
     */
    createElement(tag, attributes = {}, textContent = '') {
        if (typeof tag !== 'string' || tag.trim() === '') {
            console.error('createElement: Invalid tag name provided');
            return null;
        }

        try {
            const element = document.createElement(tag);

            if (attributes && typeof attributes === 'object') {
                Object.entries(attributes).forEach(([key, value]) => {
                    try {
                        if (key === 'className') {
                            element.className = value;
                        } else if (key === 'dataset' && typeof value === 'object') {
                            Object.entries(value).forEach(([dataKey, dataValue]) => {
                                element.dataset[dataKey] = dataValue;
                            });
                        } else if (key.startsWith('on') && typeof value === 'function') {
                            element.addEventListener(key.slice(2).toLowerCase(), value);
                        } else {
                            element.setAttribute(key, value);
                        }
                    } catch (attrError) {
                        console.warn(`createElement: Failed to set attribute "${key}":`, attrError.message);
                    }
                });
            }

            if (textContent) {
                element.textContent = textContent;
            }

            return element;
        } catch (error) {
            console.error('createElement: Failed to create element:', error.message);
            return null;
        }
    }
};

// Freeze Utils to prevent modifications
Object.freeze(Utils);
