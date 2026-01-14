/**
 * Main Application module with comprehensive error handling
 * Coordinates all components of the Farmingdale Lunch Guide
 */
const App = {
    // Application state
    state: {
        restaurants: [],
        filteredRestaurants: [],
        isInitialized: false,
        isLoading: false,
        lastError: null
    },

    /**
     * Initializes the application
     * @returns {Promise<boolean>} True if initialization successful
     */
    async init() {
        console.info('App.init: Starting application initialization...');

        try {
            // Prevent double initialization
            if (this.state.isInitialized) {
                console.warn('App.init: Application already initialized');
                return true;
            }

            // Check if DOM is ready
            if (document.readyState === 'loading') {
                console.info('App.init: Waiting for DOM to be ready...');
                await this.waitForDOMReady();
            }

            // Initialize UI
            console.info('App.init: Initializing UI...');
            const uiInitialized = UI.init();
            if (!uiInitialized) {
                throw new Error('Failed to initialize UI components');
            }

            // Bind event handlers
            this.bindEventHandlers();

            // Load saved preferences
            this.loadPreferences();

            // Load restaurant data
            await this.loadRestaurants();

            // Mark as initialized
            this.state.isInitialized = true;
            console.info('App.init: Application initialized successfully');

            return true;

        } catch (error) {
            console.error('App.init: Initialization failed:', error);
            this.state.lastError = error;
            UI.showError('Failed to initialize the application. Please refresh the page.');
            return false;
        }
    },

    /**
     * Waits for DOM to be ready
     * @returns {Promise<void>}
     */
    waitForDOMReady() {
        return new Promise((resolve) => {
            if (document.readyState !== 'loading') {
                resolve();
            } else {
                document.addEventListener('DOMContentLoaded', resolve, { once: true });
            }
        });
    },

    /**
     * Binds all event handlers with error handling
     */
    bindEventHandlers() {
        try {
            // Bind filter change events
            UI.bindFilterEvents(() => this.applyFilters());

            // Bind retry button
            UI.bindRetryEvent(() => this.retryLoad());

            // Bind global error handler
            window.addEventListener('error', (event) => {
                console.error('App: Global error caught:', event.error);
                // Don't show error UI for minor errors
            });

            // Bind unhandled promise rejection handler
            window.addEventListener('unhandledrejection', (event) => {
                console.error('App: Unhandled promise rejection:', event.reason);
                // Prevent default browser handling
                event.preventDefault();
            });

            console.info('App.bindEventHandlers: Event handlers bound successfully');

        } catch (error) {
            console.error('App.bindEventHandlers: Failed to bind event handlers:', error);
        }
    },

    /**
     * Loads saved user preferences
     */
    loadPreferences() {
        try {
            const preferences = Storage.getPreferences();

            if (preferences.categoryFilter) {
                UI.setFilterValue('categoryFilter', preferences.categoryFilter);
            }

            if (preferences.priceFilter) {
                UI.setFilterValue('priceFilter', preferences.priceFilter);
            }

            console.info('App.loadPreferences: Preferences loaded');

        } catch (error) {
            console.warn('App.loadPreferences: Failed to load preferences:', error);
            // Non-critical error, continue without preferences
        }
    },

    /**
     * Saves current filter preferences
     */
    savePreferences() {
        try {
            const filters = UI.getFilterValues();
            Storage.setPreferences({
                categoryFilter: filters.category,
                priceFilter: filters.price
            });
        } catch (error) {
            console.warn('App.savePreferences: Failed to save preferences:', error);
            // Non-critical error, continue without saving
        }
    },

    /**
     * Loads restaurant data from the API
     * @returns {Promise<void>}
     */
    async loadRestaurants() {
        if (this.state.isLoading) {
            console.warn('App.loadRestaurants: Already loading, skipping duplicate request');
            return;
        }

        this.state.isLoading = true;
        UI.showLoading();

        try {
            console.info('App.loadRestaurants: Fetching restaurant data...');
            const restaurants = await Api.fetchRestaurants();

            if (!Array.isArray(restaurants) || restaurants.length === 0) {
                throw new Api.ApiError('No restaurant data available', 'NO_DATA');
            }

            this.state.restaurants = restaurants;
            this.state.filteredRestaurants = [...restaurants];
            this.state.lastError = null;

            console.info(`App.loadRestaurants: Loaded ${restaurants.length} restaurants`);

            // Apply any existing filters
            this.applyFilters();

            // Render favorites
            UI.renderFavorites();

            UI.hideLoading();
            UI.hideError();

        } catch (error) {
            console.error('App.loadRestaurants: Failed to load restaurants:', error);
            this.state.lastError = error;

            const errorMessage = Api.getErrorMessage(error);
            UI.showError(errorMessage);

        } finally {
            this.state.isLoading = false;
        }
    },

    /**
     * Retries loading restaurant data
     */
    async retryLoad() {
        console.info('App.retryLoad: Retrying data load...');

        try {
            UI.hideError();
            await this.loadRestaurants();
        } catch (error) {
            console.error('App.retryLoad: Retry failed:', error);
        }
    },

    /**
     * Applies all filters to the restaurant data
     */
    applyFilters() {
        try {
            if (!Array.isArray(this.state.restaurants) || this.state.restaurants.length === 0) {
                console.warn('App.applyFilters: No restaurant data to filter');
                UI.renderRestaurants([]);
                return;
            }

            const filters = UI.getFilterValues();
            console.info('App.applyFilters: Applying filters:', filters);

            let filtered = [...this.state.restaurants];

            // Apply category filter
            if (filters.category && filters.category !== 'all') {
                filtered = Api.filterByCategory(filters.category, filtered);
            }

            // Apply price filter
            if (filters.price && filters.price !== 'all') {
                filtered = Api.filterByPrice(filters.price, filtered);
            }

            // Apply search filter
            if (filters.search && filters.search.trim() !== '') {
                filtered = Api.searchRestaurants(filters.search, filtered);
            }

            this.state.filteredRestaurants = filtered;

            // Save preferences
            this.savePreferences();

            // Render filtered results
            UI.renderRestaurants(filtered);

            console.info(`App.applyFilters: Showing ${filtered.length} of ${this.state.restaurants.length} restaurants`);

        } catch (error) {
            console.error('App.applyFilters: Filter application failed:', error);
            // Show all restaurants as fallback
            UI.renderRestaurants(this.state.restaurants);
        }
    },

    /**
     * Gets a restaurant by ID with error handling
     * @param {number} id - Restaurant ID
     * @returns {Object|null} Restaurant object or null
     */
    getRestaurantById(id) {
        try {
            if (typeof id !== 'number' || isNaN(id)) {
                console.error('App.getRestaurantById: Invalid ID:', id);
                return null;
            }

            const restaurant = this.state.restaurants.find(r => r.id === id);

            if (!restaurant) {
                console.warn('App.getRestaurantById: Restaurant not found:', id);
                return null;
            }

            return { ...restaurant }; // Return copy

        } catch (error) {
            console.error('App.getRestaurantById: Error finding restaurant:', error);
            return null;
        }
    },

    /**
     * Gets the current application state (for debugging)
     * @returns {Object} Current state
     */
    getState() {
        try {
            return {
                ...this.state,
                restaurants: [...this.state.restaurants],
                filteredRestaurants: [...this.state.filteredRestaurants]
            };
        } catch (error) {
            console.error('App.getState: Error getting state:', error);
            return {};
        }
    },

    /**
     * Resets the application state
     */
    reset() {
        try {
            console.info('App.reset: Resetting application state...');

            this.state = {
                restaurants: [],
                filteredRestaurants: [],
                isInitialized: false,
                isLoading: false,
                lastError: null
            };

            // Clear storage
            Storage.remove(Storage.KEYS.FAVORITES);
            Storage.remove(Storage.KEYS.PREFERENCES);

            // Reinitialize
            this.init();

        } catch (error) {
            console.error('App.reset: Reset failed:', error);
        }
    }
};

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init().catch(error => {
        console.error('Failed to initialize application:', error);
    });
});

// Also handle case where script loads after DOMContentLoaded
if (document.readyState !== 'loading') {
    // Small delay to ensure all scripts are loaded
    setTimeout(() => {
        if (!App.state.isInitialized) {
            App.init().catch(error => {
                console.error('Failed to initialize application:', error);
            });
        }
    }, 0);
}
