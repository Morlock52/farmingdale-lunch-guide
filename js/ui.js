/**
 * UI module for rendering and DOM manipulation with comprehensive error handling
 */
const UI = {
    // Cache for DOM element references
    elements: {},

    /**
     * Initializes UI by caching DOM element references
     * @returns {boolean} True if initialization successful
     */
    init() {
        try {
            const selectors = {
                restaurantsContainer: '#restaurants-container',
                favoritesContainer: '#favorites-container',
                errorDisplay: '#error-display',
                errorMessage: '#error-display .error-message',
                retryBtn: '#retry-btn',
                loading: '#loading',
                categoryFilter: '#category-filter',
                priceFilter: '#price-filter',
                searchInput: '#search-input'
            };

            let missingElements = [];

            Object.entries(selectors).forEach(([key, selector]) => {
                const element = Utils.getElement(selector);
                if (element) {
                    this.elements[key] = element;
                } else {
                    missingElements.push(key);
                }
            });

            if (missingElements.length > 0) {
                console.warn('UI.init: Some elements not found:', missingElements);
            }

            // Check critical elements
            const criticalElements = ['restaurantsContainer', 'errorDisplay', 'loading'];
            const missingCritical = criticalElements.filter(el => !this.elements[el]);

            if (missingCritical.length > 0) {
                console.error('UI.init: Critical elements missing:', missingCritical);
                return false;
            }

            return true;

        } catch (error) {
            console.error('UI.init: Initialization failed:', error.message);
            return false;
        }
    },

    /**
     * Shows the loading spinner
     */
    showLoading() {
        try {
            if (this.elements.loading) {
                this.elements.loading.classList.remove('hidden');
            }
            if (this.elements.restaurantsContainer) {
                this.elements.restaurantsContainer.classList.add('hidden');
            }
            this.hideError();
        } catch (error) {
            console.error('UI.showLoading: Failed to show loading state:', error.message);
        }
    },

    /**
     * Hides the loading spinner
     */
    hideLoading() {
        try {
            if (this.elements.loading) {
                this.elements.loading.classList.add('hidden');
            }
            if (this.elements.restaurantsContainer) {
                this.elements.restaurantsContainer.classList.remove('hidden');
            }
        } catch (error) {
            console.error('UI.hideLoading: Failed to hide loading state:', error.message);
        }
    },

    /**
     * Shows an error message to the user
     * @param {string} message - Error message to display
     */
    showError(message) {
        try {
            if (!this.elements.errorDisplay || !this.elements.errorMessage) {
                console.error('UI.showError: Error display elements not available');
                // Fallback: alert the user
                alert(message || 'An error occurred');
                return;
            }

            // Sanitize message before displaying
            const safeMessage = Utils.escapeHtml(message || 'An unexpected error occurred');

            this.elements.errorMessage.textContent = safeMessage;
            this.elements.errorDisplay.classList.remove('hidden');
            this.hideLoading();

            // Hide restaurants container when showing error
            if (this.elements.restaurantsContainer) {
                this.elements.restaurantsContainer.classList.add('hidden');
            }

        } catch (error) {
            console.error('UI.showError: Failed to show error:', error.message);
            alert(message || 'An error occurred');
        }
    },

    /**
     * Hides the error display
     */
    hideError() {
        try {
            if (this.elements.errorDisplay) {
                this.elements.errorDisplay.classList.add('hidden');
            }
        } catch (error) {
            console.error('UI.hideError: Failed to hide error:', error.message);
        }
    },

    /**
     * Renders a list of restaurant cards
     * @param {Object[]} restaurants - Array of restaurant objects
     */
    renderRestaurants(restaurants) {
        try {
            if (!this.elements.restaurantsContainer) {
                throw new Error('Restaurants container not found');
            }

            // Validate input
            if (!Array.isArray(restaurants)) {
                console.error('UI.renderRestaurants: Invalid restaurants data');
                this.elements.restaurantsContainer.innerHTML = '<p class="error">Unable to display restaurants</p>';
                return;
            }

            // Clear container
            this.elements.restaurantsContainer.innerHTML = '';

            if (restaurants.length === 0) {
                this.elements.restaurantsContainer.innerHTML = '<p class="no-results">No restaurants found matching your criteria</p>';
                return;
            }

            // Render each restaurant
            restaurants.forEach(restaurant => {
                try {
                    const card = this.createRestaurantCard(restaurant);
                    if (card) {
                        this.elements.restaurantsContainer.appendChild(card);
                    }
                } catch (cardError) {
                    console.error('UI.renderRestaurants: Failed to render card for restaurant:', restaurant.id, cardError);
                }
            });

        } catch (error) {
            console.error('UI.renderRestaurants: Render failed:', error.message);
            this.showError('Failed to display restaurants. Please refresh the page.');
        }
    },

    /**
     * Creates a restaurant card element
     * @param {Object} restaurant - Restaurant data object
     * @returns {HTMLElement|null} Restaurant card element
     */
    createRestaurantCard(restaurant) {
        try {
            // Validate restaurant data
            const validation = Utils.validateRestaurant(restaurant);
            if (!validation.valid) {
                console.warn('UI.createRestaurantCard: Invalid restaurant data:', validation.errors);
                return null;
            }

            const card = document.createElement('article');
            card.className = 'restaurant-card';
            card.dataset.id = restaurant.id;

            const isFavorite = Storage.isFavorite(restaurant.id);

            // Use template with escaped values
            card.innerHTML = `
                <img class="restaurant-image"
                     src="${Utils.escapeHtml(restaurant.image || '')}"
                     alt="${Utils.escapeHtml(restaurant.name)}"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 180%22><rect fill=%22%23ddd%22 width=%22400%22 height=%22180%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2220%22>Image not available</text></svg>'">
                <div class="restaurant-info">
                    <div class="restaurant-header">
                        <h3 class="restaurant-name">${Utils.escapeHtml(restaurant.name)}</h3>
                        <button class="favorite-btn ${isFavorite ? 'active' : ''}"
                                data-id="${restaurant.id}"
                                aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                            ${isFavorite ? '\u2665' : '\u2661'}
                        </button>
                    </div>
                    <span class="restaurant-category">${Utils.escapeHtml(restaurant.category)}</span>
                    <div class="restaurant-details">
                        <span class="restaurant-price">${Utils.escapeHtml(restaurant.price || 'N/A')}</span>
                        <span class="restaurant-distance">${Utils.escapeHtml(restaurant.distance || 'N/A')}</span>
                        <span class="restaurant-rating">${Utils.formatRating(restaurant.rating)}</span>
                    </div>
                    <p class="restaurant-description">${Utils.escapeHtml(restaurant.description || '')}</p>
                </div>
            `;

            // Add event listener for favorite button
            const favoriteBtn = card.querySelector('.favorite-btn');
            if (favoriteBtn) {
                favoriteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleFavoriteClick(restaurant.id, favoriteBtn);
                });
            }

            return card;

        } catch (error) {
            console.error('UI.createRestaurantCard: Failed to create card:', error.message);
            return null;
        }
    },

    /**
     * Handles favorite button click
     * @param {number} restaurantId - Restaurant ID
     * @param {HTMLElement} button - Favorite button element
     */
    handleFavoriteClick(restaurantId, button) {
        try {
            if (typeof restaurantId !== 'number') {
                console.error('UI.handleFavoriteClick: Invalid restaurant ID');
                return;
            }

            const isFavorite = Storage.isFavorite(restaurantId);

            let success;
            if (isFavorite) {
                success = Storage.removeFavorite(restaurantId);
            } else {
                success = Storage.addFavorite(restaurantId);
            }

            if (success && button) {
                const nowFavorite = !isFavorite;
                button.classList.toggle('active', nowFavorite);
                button.innerHTML = nowFavorite ? '\u2665' : '\u2661';
                button.setAttribute('aria-label', nowFavorite ? 'Remove from favorites' : 'Add to favorites');

                // Trigger favorites update
                this.renderFavorites();
            } else {
                console.error('UI.handleFavoriteClick: Failed to update favorite status');
            }

        } catch (error) {
            console.error('UI.handleFavoriteClick: Error handling favorite click:', error.message);
        }
    },

    /**
     * Renders the favorites section
     */
    renderFavorites() {
        try {
            if (!this.elements.favoritesContainer) {
                console.warn('UI.renderFavorites: Favorites container not found');
                return;
            }

            const favoriteIds = Storage.getFavorites();

            if (!Array.isArray(favoriteIds) || favoriteIds.length === 0) {
                this.elements.favoritesContainer.innerHTML = '<p class="empty-favorites">No favorites yet. Click the heart icon to add!</p>';
                return;
            }

            // Get restaurant data for favorites
            const favoriteRestaurants = [];
            favoriteIds.forEach(id => {
                try {
                    const restaurant = RESTAURANT_DATA.find(r => r.id === id);
                    if (restaurant) {
                        favoriteRestaurants.push(restaurant);
                    }
                } catch (error) {
                    console.warn('UI.renderFavorites: Error finding restaurant:', id);
                }
            });

            if (favoriteRestaurants.length === 0) {
                this.elements.favoritesContainer.innerHTML = '<p class="empty-favorites">No favorites yet. Click the heart icon to add!</p>';
                return;
            }

            this.elements.favoritesContainer.innerHTML = '';

            favoriteRestaurants.forEach(restaurant => {
                try {
                    const item = document.createElement('div');
                    item.className = 'favorite-item';
                    item.innerHTML = `
                        <span>${Utils.escapeHtml(restaurant.name)} - ${Utils.escapeHtml(restaurant.category)}</span>
                        <button class="remove-favorite" data-id="${restaurant.id}" aria-label="Remove from favorites">
                            \u2715
                        </button>
                    `;

                    const removeBtn = item.querySelector('.remove-favorite');
                    if (removeBtn) {
                        removeBtn.addEventListener('click', () => {
                            this.handleRemoveFavorite(restaurant.id);
                        });
                    }

                    this.elements.favoritesContainer.appendChild(item);
                } catch (error) {
                    console.warn('UI.renderFavorites: Error rendering favorite item:', error);
                }
            });

        } catch (error) {
            console.error('UI.renderFavorites: Failed to render favorites:', error.message);
        }
    },

    /**
     * Handles removing a favorite from the favorites section
     * @param {number} restaurantId - Restaurant ID to remove
     */
    handleRemoveFavorite(restaurantId) {
        try {
            const success = Storage.removeFavorite(restaurantId);

            if (success) {
                // Update the main restaurant card if visible
                const card = Utils.getElement(`.restaurant-card[data-id="${restaurantId}"]`);
                if (card) {
                    const favoriteBtn = card.querySelector('.favorite-btn');
                    if (favoriteBtn) {
                        favoriteBtn.classList.remove('active');
                        favoriteBtn.innerHTML = '\u2661';
                        favoriteBtn.setAttribute('aria-label', 'Add to favorites');
                    }
                }

                // Re-render favorites
                this.renderFavorites();
            } else {
                console.error('UI.handleRemoveFavorite: Failed to remove favorite');
            }

        } catch (error) {
            console.error('UI.handleRemoveFavorite: Error removing favorite:', error.message);
        }
    },

    /**
     * Updates filter dropdown value with error handling
     * @param {string} elementKey - Key of the element in cached elements
     * @param {string} value - Value to set
     */
    setFilterValue(elementKey, value) {
        try {
            const element = this.elements[elementKey];

            if (!element) {
                console.warn('UI.setFilterValue: Element not found:', elementKey);
                return;
            }

            if (element.tagName !== 'SELECT' && element.tagName !== 'INPUT') {
                console.warn('UI.setFilterValue: Element is not a form control:', elementKey);
                return;
            }

            element.value = value;

        } catch (error) {
            console.error('UI.setFilterValue: Failed to set filter value:', error.message);
        }
    },

    /**
     * Gets filter values from UI with error handling
     * @returns {Object} Object containing filter values
     */
    getFilterValues() {
        try {
            return {
                category: this.elements.categoryFilter?.value || 'all',
                price: this.elements.priceFilter?.value || 'all',
                search: this.elements.searchInput?.value || ''
            };
        } catch (error) {
            console.error('UI.getFilterValues: Failed to get filter values:', error.message);
            return { category: 'all', price: 'all', search: '' };
        }
    },

    /**
     * Binds event listeners to filter elements
     * @param {Function} callback - Callback function to invoke on filter change
     */
    bindFilterEvents(callback) {
        try {
            if (typeof callback !== 'function') {
                console.error('UI.bindFilterEvents: Callback must be a function');
                return;
            }

            // Bind category filter
            if (this.elements.categoryFilter) {
                this.elements.categoryFilter.addEventListener('change', () => {
                    try {
                        callback();
                    } catch (error) {
                        console.error('UI.bindFilterEvents: Category filter callback error:', error);
                    }
                });
            }

            // Bind price filter
            if (this.elements.priceFilter) {
                this.elements.priceFilter.addEventListener('change', () => {
                    try {
                        callback();
                    } catch (error) {
                        console.error('UI.bindFilterEvents: Price filter callback error:', error);
                    }
                });
            }

            // Bind search input with debounce
            if (this.elements.searchInput) {
                const debouncedCallback = Utils.debounce(() => {
                    try {
                        callback();
                    } catch (error) {
                        console.error('UI.bindFilterEvents: Search callback error:', error);
                    }
                }, 300);

                this.elements.searchInput.addEventListener('input', debouncedCallback);
            }

        } catch (error) {
            console.error('UI.bindFilterEvents: Failed to bind filter events:', error.message);
        }
    },

    /**
     * Binds retry button event
     * @param {Function} callback - Callback function for retry
     */
    bindRetryEvent(callback) {
        try {
            if (typeof callback !== 'function') {
                console.error('UI.bindRetryEvent: Callback must be a function');
                return;
            }

            if (this.elements.retryBtn) {
                this.elements.retryBtn.addEventListener('click', () => {
                    try {
                        callback();
                    } catch (error) {
                        console.error('UI.bindRetryEvent: Retry callback error:', error);
                    }
                });
            }

        } catch (error) {
            console.error('UI.bindRetryEvent: Failed to bind retry event:', error.message);
        }
    }
};

// Don't freeze UI as it maintains mutable state (elements cache)
