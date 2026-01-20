/**
 * API module for data fetching with comprehensive error handling
 * Simulates API calls using local data with realistic error handling patterns
 */
const Api = {
    // Simulated network delay range (ms)
    MIN_DELAY: 200,
    MAX_DELAY: 800,

    // Retry configuration
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,

    /**
     * Custom error class for API errors
     */
    ApiError: class ApiError extends Error {
        constructor(message, code, originalError = null) {
            super(message);
            this.name = 'ApiError';
            this.code = code;
            this.originalError = originalError;
            this.timestamp = new Date().toISOString();
        }
    },

    /**
     * Simulates network delay for realistic API behavior
     * @returns {Promise<void>}
     */
    async simulateNetworkDelay() {
        const delay = Math.random() * (this.MAX_DELAY - this.MIN_DELAY) + this.MIN_DELAY;
        return new Promise(resolve => setTimeout(resolve, delay));
    },

    /**
     * Fetches all restaurants with error handling and retry logic
     * @param {Object} options - Fetch options
     * @param {number} options.retryCount - Current retry attempt
     * @returns {Promise<Object[]>} Array of restaurant objects
     * @throws {ApiError} If fetch fails after all retries
     */
    async fetchRestaurants(options = {}) {
        const { retryCount = 0 } = options;

        try {
            // Simulate network delay
            await this.simulateNetworkDelay();

            // Validate data source exists
            if (typeof RESTAURANT_DATA === 'undefined') {
                throw new this.ApiError(
                    'Restaurant data source is not available',
                    'DATA_SOURCE_UNAVAILABLE'
                );
            }

            if (!Array.isArray(RESTAURANT_DATA)) {
                throw new this.ApiError(
                    'Restaurant data is not in expected format',
                    'INVALID_DATA_FORMAT'
                );
            }

            // Validate each restaurant
            const validatedData = [];
            const invalidItems = [];

            RESTAURANT_DATA.forEach((restaurant, index) => {
                const validation = Utils.validateRestaurant(restaurant);
                if (validation.valid) {
                    validatedData.push({ ...restaurant }); // Return copy to prevent mutations
                } else {
                    invalidItems.push({ index, errors: validation.errors });
                }
            });

            if (invalidItems.length > 0) {
                console.warn('Api.fetchRestaurants: Some items failed validation:', invalidItems);
            }

            if (validatedData.length === 0) {
                throw new this.ApiError(
                    'No valid restaurant data available',
                    'NO_VALID_DATA'
                );
            }

            return validatedData;

        } catch (error) {
            // Handle specific error types
            if (error instanceof this.ApiError) {
                console.error(`Api.fetchRestaurants: ${error.code} - ${error.message}`);

                // Retry logic for recoverable errors
                if (retryCount < this.MAX_RETRIES && this.isRetryableError(error.code)) {
                    console.info(`Api.fetchRestaurants: Retrying (${retryCount + 1}/${this.MAX_RETRIES})...`);
                    await this.delay(this.RETRY_DELAY * (retryCount + 1));
                    return this.fetchRestaurants({ retryCount: retryCount + 1 });
                }

                throw error;
            }

            // Wrap unexpected errors
            console.error('Api.fetchRestaurants: Unexpected error:', error);
            throw new this.ApiError(
                'An unexpected error occurred while fetching restaurants',
                'UNEXPECTED_ERROR',
                error
            );
        }
    },

    /**
     * Fetches a single restaurant by ID with error handling
     * @param {number} id - Restaurant ID
     * @returns {Promise<Object>} Restaurant object
     * @throws {ApiError} If restaurant not found or fetch fails
     */
    async fetchRestaurantById(id) {
        try {
            // Validate input
            if (typeof id !== 'number' || isNaN(id)) {
                throw new this.ApiError(
                    `Invalid restaurant ID: ${id}. Expected a number.`,
                    'INVALID_ID'
                );
            }

            if (id < 0) {
                throw new this.ApiError(
                    `Invalid restaurant ID: ${id}. ID must be non-negative.`,
                    'INVALID_ID'
                );
            }

            // Simulate network delay
            await this.simulateNetworkDelay();

            // Validate data source
            if (typeof RESTAURANT_DATA === 'undefined' || !Array.isArray(RESTAURANT_DATA)) {
                throw new this.ApiError(
                    'Restaurant data source is not available',
                    'DATA_SOURCE_UNAVAILABLE'
                );
            }

            // Find restaurant
            const restaurant = RESTAURANT_DATA.find(r => r.id === id);

            if (!restaurant) {
                throw new this.ApiError(
                    `Restaurant with ID ${id} not found`,
                    'NOT_FOUND'
                );
            }

            // Validate found restaurant
            const validation = Utils.validateRestaurant(restaurant);
            if (!validation.valid) {
                throw new this.ApiError(
                    `Restaurant data is corrupted: ${validation.errors.join(', ')}`,
                    'CORRUPTED_DATA'
                );
            }

            return { ...restaurant }; // Return copy

        } catch (error) {
            if (error instanceof this.ApiError) {
                console.error(`Api.fetchRestaurantById: ${error.code} - ${error.message}`);
                throw error;
            }

            console.error('Api.fetchRestaurantById: Unexpected error:', error);
            throw new this.ApiError(
                'An unexpected error occurred while fetching restaurant',
                'UNEXPECTED_ERROR',
                error
            );
        }
    },

    /**
     * Searches restaurants by query with error handling
     * @param {string} query - Search query
     * @param {Object[]} restaurants - Array of restaurants to search
     * @returns {Object[]} Filtered array of restaurants
     */
    searchRestaurants(query, restaurants) {
        try {
            // Validate inputs
            if (typeof query !== 'string') {
                console.warn('Api.searchRestaurants: Invalid query type, returning all restaurants');
                return restaurants || [];
            }

            if (!Array.isArray(restaurants)) {
                console.error('Api.searchRestaurants: Invalid restaurants array');
                return [];
            }

            const normalizedQuery = query.toLowerCase().trim();

            if (normalizedQuery === '') {
                return restaurants;
            }

            return restaurants.filter(restaurant => {
                try {
                    const searchableFields = [
                        restaurant.name,
                        restaurant.category,
                        restaurant.description,
                        restaurant.address
                    ];

                    return searchableFields.some(field => {
                        if (typeof field !== 'string') {
                            return false;
                        }
                        return field.toLowerCase().includes(normalizedQuery);
                    });
                } catch (filterError) {
                    console.warn('Api.searchRestaurants: Error filtering restaurant:', filterError);
                    return false;
                }
            });

        } catch (error) {
            console.error('Api.searchRestaurants: Search failed:', error);
            return [];
        }
    },

    /**
     * Filters restaurants by category with error handling
     * @param {string} category - Category to filter by
     * @param {Object[]} restaurants - Array of restaurants to filter
     * @returns {Object[]} Filtered array of restaurants
     */
    filterByCategory(category, restaurants) {
        try {
            if (!Array.isArray(restaurants)) {
                console.error('Api.filterByCategory: Invalid restaurants array');
                return [];
            }

            if (typeof category !== 'string' || category === 'all' || category.trim() === '') {
                return restaurants;
            }

            const normalizedCategory = category.toLowerCase().trim();

            return restaurants.filter(restaurant => {
                try {
                    return restaurant.category &&
                           restaurant.category.toLowerCase() === normalizedCategory;
                } catch (error) {
                    console.warn('Api.filterByCategory: Error filtering restaurant:', error);
                    return false;
                }
            });

        } catch (error) {
            console.error('Api.filterByCategory: Filter failed:', error);
            return [];
        }
    },

    /**
     * Filters restaurants by price range with error handling
     * @param {string} priceRange - Price range to filter by ($, $$, $$$)
     * @param {Object[]} restaurants - Array of restaurants to filter
     * @returns {Object[]} Filtered array of restaurants
     */
    filterByPrice(priceRange, restaurants) {
        try {
            if (!Array.isArray(restaurants)) {
                console.error('Api.filterByPrice: Invalid restaurants array');
                return [];
            }

            if (typeof priceRange !== 'string' || priceRange === 'all' || priceRange.trim() === '') {
                return restaurants;
            }

            const validPriceRanges = ['$', '$$', '$$$'];
            if (!validPriceRanges.includes(priceRange)) {
                console.warn('Api.filterByPrice: Invalid price range:', priceRange);
                return restaurants;
            }

            return restaurants.filter(restaurant => {
                try {
                    return restaurant.price === priceRange;
                } catch (error) {
                    console.warn('Api.filterByPrice: Error filtering restaurant:', error);
                    return false;
                }
            });

        } catch (error) {
            console.error('Api.filterByPrice: Filter failed:', error);
            return [];
        }
    },

    /**
     * Checks if an error code is retryable
     * @param {string} errorCode - Error code
     * @returns {boolean} True if error is retryable
     */
    isRetryableError(errorCode) {
        const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'SERVICE_UNAVAILABLE'];
        return retryableCodes.includes(errorCode);
    },

    /**
     * Promise-based delay utility
     * @param {number} ms - Delay in milliseconds
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Gets a user-friendly error message for an API error
     * @param {Error} error - Error object
     * @returns {string} User-friendly error message
     */
    getErrorMessage(error) {
        if (error instanceof this.ApiError) {
            const messages = {
                'DATA_SOURCE_UNAVAILABLE': 'Unable to load restaurant data. Please refresh the page.',
                'INVALID_DATA_FORMAT': 'Restaurant data is corrupted. Please contact support.',
                'NO_VALID_DATA': 'No restaurants available at this time.',
                'NOT_FOUND': 'Restaurant not found.',
                'INVALID_ID': 'Invalid restaurant selection.',
                'CORRUPTED_DATA': 'Restaurant information is incomplete.',
                'NETWORK_ERROR': 'Network error. Please check your connection.',
                'TIMEOUT': 'Request timed out. Please try again.',
                'UNEXPECTED_ERROR': 'An unexpected error occurred. Please try again.'
            };

            return messages[error.code] || error.message;
        }

        return 'An unexpected error occurred. Please try again.';
    }
};

// Freeze Api to prevent modifications
Object.freeze(Api);
