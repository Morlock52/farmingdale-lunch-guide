/**
 * Storage module for localStorage operations with comprehensive error handling
 */
const Storage = {
    KEYS: {
        FAVORITES: 'farmingdale_lunch_favorites',
        PREFERENCES: 'farmingdale_lunch_preferences',
        CACHE_TIMESTAMP: 'farmingdale_lunch_cache_time'
    },

    /**
     * Checks if localStorage is available
     * @returns {boolean} True if localStorage is available
     */
    isAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.warn('Storage.isAvailable: localStorage is not available:', error.message);
            return false;
        }
    },

    /**
     * Safely retrieves data from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist or on error
     * @returns {*} Retrieved data or default value
     */
    get(key, defaultValue = null) {
        if (typeof key !== 'string' || key.trim() === '') {
            console.error('Storage.get: Invalid key provided');
            return defaultValue;
        }

        if (!this.isAvailable()) {
            console.warn('Storage.get: localStorage not available, returning default value');
            return defaultValue;
        }

        try {
            const item = localStorage.getItem(key);

            if (item === null) {
                return defaultValue;
            }

            return Utils.safeJsonParse(item, defaultValue);
        } catch (error) {
            console.error(`Storage.get: Failed to retrieve "${key}":`, error.message);
            return defaultValue;
        }
    },

    /**
     * Safely stores data in localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} True if successful, false otherwise
     */
    set(key, value) {
        if (typeof key !== 'string' || key.trim() === '') {
            console.error('Storage.set: Invalid key provided');
            return false;
        }

        if (!this.isAvailable()) {
            console.warn('Storage.set: localStorage not available');
            return false;
        }

        try {
            const serialized = Utils.safeJsonStringify(value);

            if (serialized === '{}' && value !== null && typeof value === 'object' && Object.keys(value).length > 0) {
                console.error('Storage.set: Failed to serialize value');
                return false;
            }

            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                console.error('Storage.set: localStorage quota exceeded. Consider clearing old data.');
                this.handleQuotaExceeded();
            } else {
                console.error(`Storage.set: Failed to store "${key}":`, error.message);
            }
            return false;
        }
    },

    /**
     * Safely removes data from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} True if successful, false otherwise
     */
    remove(key) {
        if (typeof key !== 'string' || key.trim() === '') {
            console.error('Storage.remove: Invalid key provided');
            return false;
        }

        if (!this.isAvailable()) {
            console.warn('Storage.remove: localStorage not available');
            return false;
        }

        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Storage.remove: Failed to remove "${key}":`, error.message);
            return false;
        }
    },

    /**
     * Handles quota exceeded error by clearing old cache data
     */
    handleQuotaExceeded() {
        console.warn('Storage.handleQuotaExceeded: Attempting to free up space...');

        try {
            // Remove cache timestamp first (least important)
            localStorage.removeItem(this.KEYS.CACHE_TIMESTAMP);
            console.info('Storage.handleQuotaExceeded: Cleared cache timestamp');
        } catch (error) {
            console.error('Storage.handleQuotaExceeded: Failed to clear cache:', error.message);
        }
    },

    /**
     * Gets user's favorite restaurant IDs
     * @returns {number[]} Array of favorite restaurant IDs
     */
    getFavorites() {
        try {
            const favorites = this.get(this.KEYS.FAVORITES, []);

            if (!Array.isArray(favorites)) {
                console.warn('Storage.getFavorites: Invalid favorites data, resetting to empty array');
                this.set(this.KEYS.FAVORITES, []);
                return [];
            }

            // Validate that all items are numbers
            const validFavorites = favorites.filter(id => {
                if (typeof id !== 'number') {
                    console.warn('Storage.getFavorites: Invalid favorite ID removed:', id);
                    return false;
                }
                return true;
            });

            // Update storage if we filtered out invalid items
            if (validFavorites.length !== favorites.length) {
                this.set(this.KEYS.FAVORITES, validFavorites);
            }

            return validFavorites;
        } catch (error) {
            console.error('Storage.getFavorites: Failed to get favorites:', error.message);
            return [];
        }
    },

    /**
     * Adds a restaurant to favorites
     * @param {number} restaurantId - Restaurant ID to add
     * @returns {boolean} True if successful
     */
    addFavorite(restaurantId) {
        if (typeof restaurantId !== 'number' || isNaN(restaurantId)) {
            console.error('Storage.addFavorite: Invalid restaurant ID:', restaurantId);
            return false;
        }

        try {
            const favorites = this.getFavorites();

            if (favorites.includes(restaurantId)) {
                console.info('Storage.addFavorite: Restaurant already in favorites:', restaurantId);
                return true;
            }

            favorites.push(restaurantId);
            return this.set(this.KEYS.FAVORITES, favorites);
        } catch (error) {
            console.error('Storage.addFavorite: Failed to add favorite:', error.message);
            return false;
        }
    },

    /**
     * Removes a restaurant from favorites
     * @param {number} restaurantId - Restaurant ID to remove
     * @returns {boolean} True if successful
     */
    removeFavorite(restaurantId) {
        if (typeof restaurantId !== 'number' || isNaN(restaurantId)) {
            console.error('Storage.removeFavorite: Invalid restaurant ID:', restaurantId);
            return false;
        }

        try {
            const favorites = this.getFavorites();
            const index = favorites.indexOf(restaurantId);

            if (index === -1) {
                console.info('Storage.removeFavorite: Restaurant not in favorites:', restaurantId);
                return true;
            }

            favorites.splice(index, 1);
            return this.set(this.KEYS.FAVORITES, favorites);
        } catch (error) {
            console.error('Storage.removeFavorite: Failed to remove favorite:', error.message);
            return false;
        }
    },

    /**
     * Checks if a restaurant is in favorites
     * @param {number} restaurantId - Restaurant ID to check
     * @returns {boolean} True if restaurant is in favorites
     */
    isFavorite(restaurantId) {
        if (typeof restaurantId !== 'number' || isNaN(restaurantId)) {
            console.warn('Storage.isFavorite: Invalid restaurant ID:', restaurantId);
            return false;
        }

        try {
            const favorites = this.getFavorites();
            return favorites.includes(restaurantId);
        } catch (error) {
            console.error('Storage.isFavorite: Failed to check favorite:', error.message);
            return false;
        }
    },

    /**
     * Gets user preferences
     * @returns {Object} User preferences object
     */
    getPreferences() {
        const defaultPreferences = {
            categoryFilter: 'all',
            priceFilter: 'all',
            sortBy: 'rating'
        };

        try {
            const preferences = this.get(this.KEYS.PREFERENCES, defaultPreferences);

            if (!preferences || typeof preferences !== 'object') {
                return defaultPreferences;
            }

            // Merge with defaults to ensure all fields exist
            return { ...defaultPreferences, ...preferences };
        } catch (error) {
            console.error('Storage.getPreferences: Failed to get preferences:', error.message);
            return defaultPreferences;
        }
    },

    /**
     * Saves user preferences
     * @param {Object} preferences - Preferences object
     * @returns {boolean} True if successful
     */
    setPreferences(preferences) {
        if (!preferences || typeof preferences !== 'object') {
            console.error('Storage.setPreferences: Invalid preferences object');
            return false;
        }

        try {
            const currentPreferences = this.getPreferences();
            const mergedPreferences = { ...currentPreferences, ...preferences };
            return this.set(this.KEYS.PREFERENCES, mergedPreferences);
        } catch (error) {
            console.error('Storage.setPreferences: Failed to save preferences:', error.message);
            return false;
        }
    }
};

// Freeze Storage to prevent modifications
Object.freeze(Storage);
Object.freeze(Storage.KEYS);
