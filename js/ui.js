/**
 * UI module for rendering and DOM manipulation with comprehensive error handling
 */
const UI = {
    // Cache for DOM element references
    elements: {},

    // Lazy loading observer
    imageObserver: null,

    // Current modal restaurant
    currentModalRestaurant: null,

    // Bound modal keydown handler (stable reference for add/removeEventListener)
    _boundHandleModalKeydown: null,

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
                priceFilter: '#price-filter',
                sortSelect: '#sort-select',
                searchInput: '#search-input',
                themeToggle: '#theme-toggle',
                categoryTrigger: '#category-trigger',
                categoryDropdown: '#category-dropdown',
                modal: '#restaurant-modal',
                modalOverlay: '#restaurant-modal .modal-overlay',
                modalClose: '#restaurant-modal .modal-close',
                modalImage: '#restaurant-modal .modal-image',
                modalName: '#restaurant-modal .modal-name',
                modalCategory: '#restaurant-modal .modal-category',
                modalPrice: '#restaurant-modal .modal-price',
                modalRating: '#restaurant-modal .modal-rating',
                modalDescription: '#restaurant-modal .modal-description',
                modalAddress: '#restaurant-modal .modal-address span',
                modalDistance: '#restaurant-modal .modal-distance span',
                modalPhone: '#restaurant-modal .modal-phone span',
                modalHours: '#restaurant-modal .modal-hours span',
                modalFavoriteBtn: '#restaurant-modal .modal-favorite-btn'
            };

            const missingElements = [];

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

            // Initialize lazy loading
            this.initLazyLoading();

            // Initialize Toast
            Toast.init();

            return true;

        } catch (error) {
            console.error('UI.init: Initialization failed:', error.message);
            return false;
        }
    },

    /**
     * Initializes IntersectionObserver for lazy loading images
     */
    initLazyLoading() {
        try {
            if ('IntersectionObserver' in window) {
                this.imageObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            if (img.dataset.src) {
                                img.src = img.dataset.src;
                                img.classList.add('loaded');
                                this.imageObserver.unobserve(img);
                            }
                        }
                    });
                }, {
                    rootMargin: '100px',
                    threshold: 0.1
                });
                console.info('UI.initLazyLoading: IntersectionObserver initialized');
            } else {
                console.warn('UI.initLazyLoading: IntersectionObserver not supported');
            }
        } catch (error) {
            console.error('UI.initLazyLoading: Failed to initialize:', error.message);
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
                Toast.error(message || 'An error occurred');
                return;
            }

            const safeMessage = Utils.escapeHtml(message || 'An unexpected error occurred');

            this.elements.errorMessage.textContent = safeMessage;
            this.elements.errorDisplay.classList.remove('hidden');
            this.hideLoading();

            if (this.elements.restaurantsContainer) {
                this.elements.restaurantsContainer.classList.add('hidden');
            }

        } catch (error) {
            console.error('UI.showError: Failed to show error:', error.message);
            Toast.error(message || 'An error occurred');
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

            if (!Array.isArray(restaurants)) {
                console.error('UI.renderRestaurants: Invalid restaurants data');
                this.elements.restaurantsContainer.innerHTML = '<p class="error">Unable to display restaurants</p>';
                return;
            }

            this.elements.restaurantsContainer.innerHTML = '';

            if (restaurants.length === 0) {
                this.elements.restaurantsContainer.innerHTML = '<p class="no-results">No restaurants found matching your criteria</p>';
                return;
            }

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
     * Creates a restaurant card element with lazy loading
     * @param {Object} restaurant - Restaurant data object
     * @returns {HTMLElement|null} Restaurant card element
     */
    createRestaurantCard(restaurant) {
        try {
            const validation = Utils.validateRestaurant(restaurant);
            if (!validation.valid) {
                console.warn('UI.createRestaurantCard: Invalid restaurant data:', validation.errors);
                return null;
            }

            const card = document.createElement('article');
            card.className = 'restaurant-card';
            card.dataset.id = restaurant.id;
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'listitem');
            card.setAttribute('aria-label', `${restaurant.name}, ${restaurant.category}, ${restaurant.price}`);

            const isFavorite = Storage.isFavorite(restaurant.id);
            const placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 180%22%3E%3Crect fill=%22%23ddd%22 width=%22400%22 height=%22180%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2220%22%3ELoading...%3C/text%3E%3C/svg%3E';

            card.innerHTML = `
                <img class="restaurant-image lazy"
                     src="${placeholderSvg}"
                     data-src="${Utils.escapeHtml(restaurant.image || '')}"
                     alt="${Utils.escapeHtml(restaurant.name)}"
                     loading="lazy"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 180%22%3E%3Crect fill=%22%23ddd%22 width=%22400%22 height=%22180%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2220%22%3EImage not available%3C/text%3E%3C/svg%3E'">
                <div class="restaurant-info">
                    <div class="restaurant-header">
                        <h3 class="restaurant-name">${Utils.escapeHtml(restaurant.name)}</h3>
                        <button class="favorite-btn ${isFavorite ? 'active' : ''}"
                                data-id="${restaurant.id}"
                                aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
                                aria-pressed="${isFavorite}">
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

            // Set up lazy loading for image
            const img = card.querySelector('.restaurant-image');
            if (img && this.imageObserver) {
                this.imageObserver.observe(img);
            } else if (img) {
                img.src = img.dataset.src;
                img.classList.add('loaded');
            }

            // Favorite button click
            const favoriteBtn = card.querySelector('.favorite-btn');
            if (favoriteBtn) {
                favoriteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleFavoriteClick(restaurant.id, favoriteBtn);
                });
            }

            // Card click opens modal
            card.addEventListener('click', () => {
                this.openModal(restaurant);
            });

            // Keyboard navigation
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openModal(restaurant);
                }
            });

            return card;

        } catch (error) {
            console.error('UI.createRestaurantCard: Failed to create card:', error.message);
            return null;
        }
    },

    /**
     * Opens the restaurant detail modal
     * @param {Object} restaurant - Restaurant data
     */
    openModal(restaurant) {
        try {
            if (!this.elements.modal) {
                console.error('UI.openModal: Modal element not found');
                return;
            }

            this.currentModalRestaurant = restaurant;

            if (this.elements.modalImage) {
                this.elements.modalImage.src = restaurant.image || '';
                this.elements.modalImage.alt = restaurant.name;
            }
            if (this.elements.modalName) {
                this.elements.modalName.textContent = restaurant.name;
            }
            if (this.elements.modalCategory) {
                this.elements.modalCategory.textContent = restaurant.category;
            }
            if (this.elements.modalPrice) {
                this.elements.modalPrice.textContent = restaurant.price;
            }
            if (this.elements.modalRating) {
                this.elements.modalRating.textContent = Utils.formatRating(restaurant.rating);
            }
            if (this.elements.modalDescription) {
                this.elements.modalDescription.textContent = restaurant.description;
            }
            if (this.elements.modalAddress) {
                this.elements.modalAddress.textContent = restaurant.address || 'N/A';
            }
            if (this.elements.modalDistance) {
                this.elements.modalDistance.textContent = restaurant.distance || 'N/A';
            }
            if (this.elements.modalPhone) {
                this.elements.modalPhone.textContent = restaurant.phone || 'N/A';
            }
            if (this.elements.modalHours) {
                this.elements.modalHours.textContent = restaurant.hours || 'N/A';
            }

            const isFavorite = Storage.isFavorite(restaurant.id);
            if (this.elements.modalFavoriteBtn) {
                this.elements.modalFavoriteBtn.classList.toggle('active', isFavorite);
                this.elements.modalFavoriteBtn.innerHTML = isFavorite
                    ? '<span class="heart-icon">\u2665</span> Remove from Favorites'
                    : '<span class="heart-icon">\u2661</span> Add to Favorites';
            }

            this.elements.modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';

            if (this.elements.modalClose) {
                this.elements.modalClose.focus();
            }

            if (!this._boundHandleModalKeydown) {
                this._boundHandleModalKeydown = this.handleModalKeydown.bind(this);
            }
            this.elements.modal.addEventListener('keydown', this._boundHandleModalKeydown);

        } catch (error) {
            console.error('UI.openModal: Failed to open modal:', error.message);
        }
    },

    /**
     * Closes the restaurant detail modal
     */
    closeModal() {
        try {
            if (!this.elements.modal) {
                return;
            }

            this.elements.modal.classList.add('hidden');
            document.body.style.overflow = '';
            this.currentModalRestaurant = null;

            if (this._boundHandleModalKeydown) {
                this.elements.modal.removeEventListener('keydown', this._boundHandleModalKeydown);
            }

        } catch (error) {
            console.error('UI.closeModal: Failed to close modal:', error.message);
        }
    },

    /**
     * Handles keyboard events in modal
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleModalKeydown(e) {
        if (e.key === 'Escape') {
            this.closeModal();
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
                if (success) {
                    Toast.info('Removed from favorites');
                }
            } else {
                success = Storage.addFavorite(restaurantId);
                if (success) {
                    Toast.success('Added to favorites');
                }
            }

            if (success && button) {
                const nowFavorite = !isFavorite;
                button.classList.toggle('active', nowFavorite);
                button.innerHTML = nowFavorite ? '\u2665' : '\u2661';
                button.setAttribute('aria-label', nowFavorite ? 'Remove from favorites' : 'Add to favorites');
                button.setAttribute('aria-pressed', nowFavorite);

                this.renderFavorites();
            } else if (!success) {
                Toast.error('Failed to update favorites');
            }

        } catch (error) {
            console.error('UI.handleFavoriteClick: Error handling favorite click:', error.message);
            Toast.error('Failed to update favorites');
        }
    },

    /**
     * Handles modal favorite button click
     */
    handleModalFavoriteClick() {
        try {
            if (!this.currentModalRestaurant) {
                return;
            }

            const restaurantId = this.currentModalRestaurant.id;
            const isFavorite = Storage.isFavorite(restaurantId);
            let success;

            if (isFavorite) {
                success = Storage.removeFavorite(restaurantId);
                if (success) {
                    Toast.info('Removed from favorites');
                }
            } else {
                success = Storage.addFavorite(restaurantId);
                if (success) {
                    Toast.success('Added to favorites');
                }
            }

            if (success) {
                const nowFavorite = !isFavorite;

                if (this.elements.modalFavoriteBtn) {
                    this.elements.modalFavoriteBtn.classList.toggle('active', nowFavorite);
                    this.elements.modalFavoriteBtn.innerHTML = nowFavorite
                        ? '<span class="heart-icon">\u2665</span> Remove from Favorites'
                        : '<span class="heart-icon">\u2661</span> Add to Favorites';
                }

                const card = Utils.getElement(`.restaurant-card[data-id="${restaurantId}"]`);
                if (card) {
                    const cardBtn = card.querySelector('.favorite-btn');
                    if (cardBtn) {
                        cardBtn.classList.toggle('active', nowFavorite);
                        cardBtn.innerHTML = nowFavorite ? '\u2665' : '\u2661';
                        cardBtn.setAttribute('aria-label', nowFavorite ? 'Remove from favorites' : 'Add to favorites');
                        cardBtn.setAttribute('aria-pressed', nowFavorite);
                    }
                }

                this.renderFavorites();
            }

        } catch (error) {
            console.error('UI.handleModalFavoriteClick: Error:', error.message);
            Toast.error('Failed to update favorites');
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
                        <button class="remove-favorite" data-id="${restaurant.id}" aria-label="Remove ${Utils.escapeHtml(restaurant.name)} from favorites">
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
                Toast.info('Removed from favorites');

                const card = Utils.getElement(`.restaurant-card[data-id="${restaurantId}"]`);
                if (card) {
                    const favoriteBtn = card.querySelector('.favorite-btn');
                    if (favoriteBtn) {
                        favoriteBtn.classList.remove('active');
                        favoriteBtn.innerHTML = '\u2661';
                        favoriteBtn.setAttribute('aria-label', 'Add to favorites');
                        favoriteBtn.setAttribute('aria-pressed', 'false');
                    }
                }

                this.renderFavorites();
            } else {
                Toast.error('Failed to remove from favorites');
            }

        } catch (error) {
            console.error('UI.handleRemoveFavorite: Error removing favorite:', error.message);
            Toast.error('Failed to remove from favorites');
        }
    },

    /**
     * Updates filter dropdown value
     * @param {string} elementKey - Key of the element
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
     * Gets the selected categories from multi-select
     * @returns {string[]} Array of selected category values
     */
    getSelectedCategories() {
        try {
            const checkboxes = Utils.getElements('#category-dropdown input[type="checkbox"]:checked');
            const values = checkboxes.map(cb => cb.value);

            if (values.includes('all')) {
                return ['all'];
            }

            return values.length > 0 ? values : ['all'];
        } catch (error) {
            console.error('UI.getSelectedCategories: Error:', error.message);
            return ['all'];
        }
    },

    /**
     * Updates category trigger text
     */
    updateCategoryTriggerText() {
        try {
            if (!this.elements.categoryTrigger) {
                return;
            }

            const selected = this.getSelectedCategories();

            if (selected.includes('all') || selected.length === 0) {
                this.elements.categoryTrigger.textContent = 'All Categories';
            } else if (selected.length === 1) {
                const labels = {
                    'pizza': 'Pizza',
                    'deli': 'Deli',
                    'asian': 'Asian',
                    'fast-food': 'Fast Food',
                    'cafe': 'Cafe'
                };
                this.elements.categoryTrigger.textContent = labels[selected[0]] || selected[0];
            } else {
                this.elements.categoryTrigger.textContent = `${selected.length} categories`;
            }
        } catch (error) {
            console.error('UI.updateCategoryTriggerText: Error:', error.message);
        }
    },

    /**
     * Gets filter values from UI
     * @returns {Object} Object containing filter values
     */
    getFilterValues() {
        try {
            return {
                categories: this.getSelectedCategories(),
                price: this.elements.priceFilter?.value || 'all',
                sort: this.elements.sortSelect?.value || 'rating',
                search: this.elements.searchInput?.value || ''
            };
        } catch (error) {
            console.error('UI.getFilterValues: Failed to get filter values:', error.message);
            return { categories: ['all'], price: 'all', sort: 'rating', search: '' };
        }
    },

    /**
     * Toggles dark mode
     */
    toggleTheme() {
        try {
            const isDark = document.body.classList.toggle('dark-mode');
            Storage.set(Constants.STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
            Toast.info(isDark ? 'Dark mode enabled' : 'Light mode enabled');
        } catch (error) {
            console.error('UI.toggleTheme: Error:', error.message);
        }
    },

    /**
     * Loads saved theme preference
     */
    loadTheme() {
        try {
            const savedTheme = Storage.get(Constants.STORAGE_KEYS.THEME, 'light');
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-mode');
            }
        } catch (error) {
            console.error('UI.loadTheme: Error:', error.message);
        }
    },

    /**
     * Binds all event listeners
     * @param {Function} filterCallback - Callback for filter changes
     */
    bindFilterEvents(filterCallback) {
        try {
            if (typeof filterCallback !== 'function') {
                console.error('UI.bindFilterEvents: Callback must be a function');
                return;
            }

            // Price filter
            if (this.elements.priceFilter) {
                this.elements.priceFilter.addEventListener('change', filterCallback);
            }

            // Sort select
            if (this.elements.sortSelect) {
                this.elements.sortSelect.addEventListener('change', filterCallback);
            }

            // Search input with debounce
            if (this.elements.searchInput) {
                const debouncedCallback = Utils.debounce(filterCallback, 300);
                this.elements.searchInput.addEventListener('input', debouncedCallback);
            }

            // Multi-select category dropdown
            this.setupCategoryDropdown(filterCallback);

            // Theme toggle
            if (this.elements.themeToggle) {
                this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
            }

            // Modal events
            this.setupModalEvents();

        } catch (error) {
            console.error('UI.bindFilterEvents: Failed to bind events:', error.message);
        }
    },

    /**
     * Sets up category dropdown behavior
     * @param {Function} filterCallback - Filter callback
     */
    setupCategoryDropdown(filterCallback) {
        try {
            const trigger = this.elements.categoryTrigger;
            const dropdown = this.elements.categoryDropdown;

            if (!trigger || !dropdown) {
                return;
            }

            trigger.addEventListener('click', () => {
                const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
                trigger.setAttribute('aria-expanded', !isExpanded);
                dropdown.classList.toggle('hidden');
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('#category-container')) {
                    trigger.setAttribute('aria-expanded', 'false');
                    dropdown.classList.add('hidden');
                }
            });

            const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const value = e.target.value;

                    if (value === 'all' && e.target.checked) {
                        checkboxes.forEach(cb => {
                            if (cb.value !== 'all') {
                                cb.checked = false;
                            }
                        });
                    } else if (value !== 'all' && e.target.checked) {
                        const allCheckbox = dropdown.querySelector('input[value="all"]');
                        if (allCheckbox) {
                            allCheckbox.checked = false;
                        }
                    }

                    const anyChecked = Array.from(checkboxes).some(cb => cb.checked && cb.value !== 'all');
                    if (!anyChecked) {
                        const allCheckbox = dropdown.querySelector('input[value="all"]');
                        if (allCheckbox) {
                            allCheckbox.checked = true;
                        }
                    }

                    this.updateCategoryTriggerText();
                    filterCallback();
                });
            });

            dropdown.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    trigger.setAttribute('aria-expanded', 'false');
                    dropdown.classList.add('hidden');
                    trigger.focus();
                }
            });

        } catch (error) {
            console.error('UI.setupCategoryDropdown: Error:', error.message);
        }
    },

    /**
     * Sets up modal event listeners
     */
    setupModalEvents() {
        try {
            if (this.elements.modalClose) {
                this.elements.modalClose.addEventListener('click', () => this.closeModal());
            }

            if (this.elements.modalOverlay) {
                this.elements.modalOverlay.addEventListener('click', () => this.closeModal());
            }

            if (this.elements.modalFavoriteBtn) {
                this.elements.modalFavoriteBtn.addEventListener('click', () => this.handleModalFavoriteClick());
            }

        } catch (error) {
            console.error('UI.setupModalEvents: Error:', error.message);
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
