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
    /**
     * Checks if a restaurant is currently open based on its schedule
     * @param {Object} schedule - Schedule object with open, close, days
     * @returns {boolean} True if open now
     */
    isOpenNow(schedule) {
        if (!schedule || typeof schedule !== 'object') {
            return false;
        }

        try {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTime = currentHour * 60 + currentMinute;

            const [openHour, openMinute] = (schedule.open || '00:00').split(':').map(Number);
            const [closeHour, closeMinute] = (schedule.close || '00:00').split(':').map(Number);
            const openTime = openHour * 60 + openMinute;
            const closeTime = closeHour * 60 + closeMinute;

            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const currentDay = dayNames[now.getDay()];

            if (schedule.days) {
                const days = schedule.days;
                if (days === 'Mon-Sun' || days === 'Mon-Sat' || days === 'Tue-Sun') {
                    const dayRangeMap = {
                        'Mon-Sun': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        'Mon-Sat': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                        'Mon-Fri': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                        'Tue-Sun': ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                    };
                    const activeDays = dayRangeMap[days] || dayNames;
                    if (!activeDays.includes(currentDay)) {
                        return false;
                    }
                }
            }

            return currentTime >= openTime && currentTime < closeTime;
        } catch (error) {
            console.error('isOpenNow: Error checking schedule:', error.message);
            return false;
        }
    },

    /**
     * Parses a distance string like "0.5 miles" to a number
     * @param {string} distanceStr - Distance string
     * @returns {number} Distance as a number, or Infinity on error
     */
    parseDistance(distanceStr) {
        if (typeof distanceStr !== 'string') {
            return Infinity;
        }
        const match = distanceStr.match(/([\d.]+)/);
        if (match) {
            const val = parseFloat(match[1]);
            return isNaN(val) ? Infinity : val;
        }
        return Infinity;
    },

    /**
     * Highlights matching text by wrapping it in <mark> tags
     * @param {string} text - Original text
     * @param {string} query - Search query to highlight
     * @returns {string} Text with highlighted matches (HTML)
     */
    highlightText(text, query) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        if (!query || typeof query !== 'string' || query.trim() === '') {
            return this.escapeHtml(text);
        }

        try {
            const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escaped})`, 'gi');
            const parts = text.split(regex);

            return parts.map(part => {
                if (part.toLowerCase() === query.toLowerCase()) {
                    return `<mark>${this.escapeHtml(part)}</mark>`;
                }
                return this.escapeHtml(part);
            }).join('');
        } catch (error) {
            console.error('highlightText: Error highlighting text:', error.message);
            return this.escapeHtml(text);
        }
    },

    /**
     * Formats rating as SVG stars
     * @param {number} rating - Rating value (0-5)
     * @returns {string} HTML string with SVG stars
     */
    formatRatingSvg(rating) {
        if (typeof rating !== 'number' || isNaN(rating)) {
            return '<span class="rating-na">N/A</span>';
        }

        rating = Math.max(0, Math.min(5, rating));
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

        const fullSvg = '<svg class="star star-full" viewBox="0 0 24 24" width="16" height="16"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/></svg>';
        const halfSvg = '<svg class="star star-half" viewBox="0 0 24 24" width="16" height="16"><defs><linearGradient id="half"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#half)" stroke="currentColor" stroke-width="1"/></svg>';
        const emptySvg = '<svg class="star star-empty" viewBox="0 0 24 24" width="16" height="16"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="none" stroke="currentColor" stroke-width="1"/></svg>';

        let html = '<span class="star-rating" title="' + rating.toFixed(1) + ' out of 5">';
        for (let i = 0; i < fullStars; i++) {
            html += fullSvg;
        }
        if (hasHalf) {
            html += halfSvg;
        }
        for (let i = 0; i < emptyStars; i++) {
            html += emptySvg;
        }
        html += ' <span class="rating-number">' + rating.toFixed(1) + '</span></span>';
        return html;
    },

    /**
     * Calculates distance between two coordinates using Haversine formula
     * @param {number} lat1 - Latitude of point 1
     * @param {number} lng1 - Longitude of point 1
     * @param {number} lat2 - Latitude of point 2
     * @param {number} lng2 - Longitude of point 2
     * @returns {number} Distance in miles
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        if ([lat1, lng1, lat2, lng2].some(v => typeof v !== 'number' || isNaN(v))) {
            return Infinity;
        }

        const R = 3959; // Earth radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    /**
     * Estimates walking time from distance in miles
     * @param {number|string} distance - Distance in miles or distance string
     * @returns {string} Estimated walking time string
     */
    estimateWalkingTime(distance) {
        let miles;
        if (typeof distance === 'string') {
            miles = this.parseDistance(distance);
        } else if (typeof distance === 'number') {
            miles = distance;
        } else {
            return 'N/A';
        }

        if (!isFinite(miles) || miles < 0) {
            return 'N/A';
        }

        const minutes = Math.round((miles / 3) * 60);
        if (minutes < 1) {
            return '< 1 min walk';
        }
        return `${minutes} min walk`;
    },

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
