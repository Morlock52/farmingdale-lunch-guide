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

    // Pagination state
    _allFiltered: [],
    _visibleCount: 0,

    // Restaurants currently being compared (array of ids, max Constants.UI.MAX_COMPARE)
    compareIds: [],

    // Callback invoked when a filter is changed programmatically (set in bindFilterEvents)
    _filterCallback: null,

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
                dietaryTrigger: '#dietary-trigger',
                dietaryDropdown: '#dietary-dropdown',
                openNowToggle: '#open-now-toggle',
                distanceSlider: '#distance-slider',
                distanceValue: '#distance-value',
                recentSearchesDropdown: '#recent-searches-dropdown',
                resultsCount: '#results-count',
                activeFilters: '#active-filters',
                loadMoreSentinel: '#load-more-sentinel',
                loadMoreBtn: '#load-more-btn',
                comparisonPanel: '#comparison-panel',
                comparisonContent: '#comparison-content',
                compareCount: '#compare-count',
                clearCompareBtn: '#clear-compare',
                exportFavoritesBtn: '#export-favorites-btn',
                backToTop: '#back-to-top',
                settingsToggle: '#settings-toggle',
                settingsPanel: '#settings-panel',
                settingsClose: '#settings-close',
                settingsOverlay: '#settings-panel .settings-overlay',
                defaultSort: '#default-sort',
                defaultCategory: '#default-category',
                saveSettingsBtn: '#save-settings-btn',
                shortcutsModal: '#shortcuts-modal',
                shortcutsClose: '#shortcuts-modal .shortcuts-close-btn',
                modal: '#restaurant-modal',
                modalOverlay: '#restaurant-modal .modal-overlay',
                modalClose: '#restaurant-modal .modal-close',
                modalImage: '#restaurant-modal .modal-image',
                modalGallery: '#restaurant-modal .modal-photo-gallery',
                modalName: '#restaurant-modal .modal-name',
                modalCategory: '#restaurant-modal .modal-category',
                modalPrice: '#restaurant-modal .modal-price',
                modalRating: '#restaurant-modal .modal-rating',
                modalStatus: '#restaurant-modal .modal-status',
                modalDietaryTags: '#restaurant-modal .modal-dietary-tags',
                modalDescription: '#restaurant-modal .modal-description',
                modalMenuList: '#restaurant-modal .menu-list',
                modalAddress: '#restaurant-modal .modal-address span',
                modalDistance: '#restaurant-modal .modal-distance span',
                modalWalkTime: '#restaurant-modal .modal-walk-time span',
                modalPhone: '#restaurant-modal .modal-phone span',
                modalHours: '#restaurant-modal .modal-hours span',
                modalNoteInput: '#restaurant-modal .modal-note-input',
                modalSaveNoteBtn: '#restaurant-modal .modal-save-note-btn',
                modalFavoriteBtn: '#restaurant-modal .modal-favorite-btn',
                modalVisitedBtn: '#restaurant-modal .modal-visited-btn',
                modalShareBtn: '#restaurant-modal .modal-share-btn',
                modalDirectionsBtn: '#restaurant-modal .modal-directions-btn'
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
     * Renders a list of restaurant cards (with pagination)
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

            this._allFiltered = restaurants;
            const pageSize = Constants.UI.PAGE_SIZE || 6;
            this._visibleCount = Math.min(pageSize, restaurants.length);

            this.elements.restaurantsContainer.innerHTML = '';

            if (restaurants.length === 0) {
                this.elements.restaurantsContainer.innerHTML = '<p class="no-results">No restaurants found matching your criteria</p>';
                this.updateLoadMore();
                return;
            }

            const fragment = document.createDocumentFragment();
            restaurants.slice(0, this._visibleCount).forEach(restaurant => {
                const card = this.createRestaurantCard(restaurant);
                if (card) {
                    fragment.appendChild(card);
                }
            });
            this.elements.restaurantsContainer.appendChild(fragment);

            this.updateLoadMore();

        } catch (error) {
            console.error('UI.renderRestaurants: Render failed:', error.message);
            this.showError('Failed to display restaurants. Please refresh the page.');
        }
    },

    /**
     * Appends the next page of restaurants
     */
    showMore() {
        try {
            const pageSize = Constants.UI.PAGE_SIZE || 6;
            const start = this._visibleCount;
            const end = Math.min(start + pageSize, this._allFiltered.length);

            const fragment = document.createDocumentFragment();
            this._allFiltered.slice(start, end).forEach(restaurant => {
                const card = this.createRestaurantCard(restaurant);
                if (card) {
                    fragment.appendChild(card);
                }
            });
            this.elements.restaurantsContainer.appendChild(fragment);

            this._visibleCount = end;
            this.updateLoadMore();
        } catch (error) {
            console.error('UI.showMore: Failed to load more:', error.message);
        }
    },

    /**
     * Toggles the Load More button visibility based on remaining items
     */
    updateLoadMore() {
        try {
            if (!this.elements.loadMoreSentinel) {
                return;
            }
            const hasMore = this._visibleCount < this._allFiltered.length;
            this.elements.loadMoreSentinel.classList.toggle('hidden', !hasMore);
            if (hasMore && this.elements.loadMoreBtn) {
                const remaining = this._allFiltered.length - this._visibleCount;
                this.elements.loadMoreBtn.textContent = `Load More (${remaining} more)`;
            }
        } catch (error) {
            console.error('UI.updateLoadMore: Error:', error.message);
        }
    },

    /**
     * Updates the results count and active filter chips
     * @param {number} shownTotal - Total number of restaurants matching filters
     * @param {number} grandTotal - Total number of restaurants available
     * @param {Object} filters - Current filter values
     */
    updateResultsInfo(shownTotal, grandTotal, filters) {
        try {
            if (this.elements.resultsCount) {
                if (shownTotal === grandTotal) {
                    this.elements.resultsCount.textContent = `${grandTotal} restaurants`;
                } else {
                    this.elements.resultsCount.textContent = `${shownTotal} of ${grandTotal} restaurants`;
                }
            }

            if (!this.elements.activeFilters) {
                return;
            }

            const chips = [];
            const categoryLabels = {
                'pizza': 'Pizza', 'deli': 'Deli', 'asian': 'Asian',
                'fast-food': 'Fast Food', 'cafe': 'Cafe'
            };
            const dietaryLabels = {
                'vegetarian': 'Vegetarian', 'vegan': 'Vegan',
                'halal': 'Halal', 'gluten-free': 'Gluten-Free'
            };

            if (filters.categories && !filters.categories.includes('all')) {
                filters.categories.forEach(c => {
                    chips.push({ type: 'category', value: c, label: categoryLabels[c] || c });
                });
            }
            if (filters.dietary && !filters.dietary.includes('all')) {
                filters.dietary.forEach(d => {
                    chips.push({ type: 'dietary', value: d, label: dietaryLabels[d] || d });
                });
            }
            if (filters.price && filters.price !== 'all') {
                chips.push({ type: 'price', value: filters.price, label: `Price: ${filters.price}` });
            }
            if (filters.openNow) {
                chips.push({ type: 'openNow', value: 'true', label: 'Open Now' });
            }
            const maxDist = parseFloat(filters.maxDistance);
            if (!isNaN(maxDist) && maxDist < 2.0) {
                chips.push({ type: 'distance', value: String(maxDist), label: `Within ${maxDist.toFixed(1)} mi` });
            }
            if (filters.search && filters.search.trim() !== '') {
                chips.push({ type: 'search', value: filters.search, label: `"${filters.search.trim()}"` });
            }

            this.elements.activeFilters.innerHTML = '';
            chips.forEach(chip => {
                const el = document.createElement('button');
                el.className = 'filter-chip';
                el.type = 'button';
                el.dataset.type = chip.type;
                el.dataset.value = chip.value;
                el.setAttribute('aria-label', `Remove filter ${chip.label}`);
                el.innerHTML = `${Utils.escapeHtml(chip.label)} <span class="chip-x">✕</span>`;
                el.addEventListener('click', () => this.removeFilter(chip.type, chip.value));
                this.elements.activeFilters.appendChild(el);
            });

            if (chips.length > 1) {
                const clearAll = document.createElement('button');
                clearAll.className = 'filter-chip clear-all-chip';
                clearAll.type = 'button';
                clearAll.textContent = 'Clear all';
                clearAll.addEventListener('click', () => this.clearAllFilters());
                this.elements.activeFilters.appendChild(clearAll);
            }
        } catch (error) {
            console.error('UI.updateResultsInfo: Error:', error.message);
        }
    },

    /**
     * Removes a single active filter and re-applies
     * @param {string} type - Filter type
     * @param {string} value - Filter value
     */
    removeFilter(type, value) {
        try {
            switch (type) {
            case 'category':
                this.uncheckOption(this.elements.categoryDropdown, value);
                this.updateCategoryTriggerText();
                break;
            case 'dietary':
                this.uncheckOption(this.elements.dietaryDropdown, value);
                this.updateDietaryTriggerText();
                break;
            case 'price':
                if (this.elements.priceFilter) {
                    this.elements.priceFilter.value = 'all';
                }
                break;
            case 'openNow':
                if (this.elements.openNowToggle) {
                    this.elements.openNowToggle.checked = false;
                }
                break;
            case 'distance':
                if (this.elements.distanceSlider) {
                    this.elements.distanceSlider.value = this.elements.distanceSlider.max;
                    if (this.elements.distanceValue) {
                        this.elements.distanceValue.textContent = parseFloat(this.elements.distanceSlider.max).toFixed(1);
                    }
                }
                break;
            case 'search':
                if (this.elements.searchInput) {
                    this.elements.searchInput.value = '';
                }
                break;
            default:
                break;
            }
            if (typeof this._filterCallback === 'function') {
                this._filterCallback();
            }
        } catch (error) {
            console.error('UI.removeFilter: Error:', error.message);
        }
    },

    /**
     * Resets all filters to defaults
     */
    clearAllFilters() {
        try {
            this.checkOnlyAll(this.elements.categoryDropdown);
            this.updateCategoryTriggerText();
            this.checkOnlyAll(this.elements.dietaryDropdown);
            this.updateDietaryTriggerText();
            if (this.elements.priceFilter) {
                this.elements.priceFilter.value = 'all';
            }
            if (this.elements.openNowToggle) {
                this.elements.openNowToggle.checked = false;
            }
            if (this.elements.distanceSlider) {
                this.elements.distanceSlider.value = this.elements.distanceSlider.max;
                if (this.elements.distanceValue) {
                    this.elements.distanceValue.textContent = parseFloat(this.elements.distanceSlider.max).toFixed(1);
                }
            }
            if (this.elements.searchInput) {
                this.elements.searchInput.value = '';
            }
            if (typeof this._filterCallback === 'function') {
                this._filterCallback();
            }
        } catch (error) {
            console.error('UI.clearAllFilters: Error:', error.message);
        }
    },

    /**
     * Unchecks a specific option in a multi-select dropdown; falls back to "all" if none left
     * @param {HTMLElement} dropdown - Dropdown element
     * @param {string} value - Option value to uncheck
     */
    uncheckOption(dropdown, value) {
        if (!dropdown) {
            return;
        }
        const cb = dropdown.querySelector(`input[value="${value}"]`);
        if (cb) {
            cb.checked = false;
        }
        const anyChecked = Array.from(dropdown.querySelectorAll('input[type="checkbox"]'))
            .some(c => c.checked && c.value !== 'all');
        if (!anyChecked) {
            const allCb = dropdown.querySelector('input[value="all"]');
            if (allCb) {
                allCb.checked = true;
            }
        }
    },

    /**
     * Checks only the "all" option in a dropdown
     * @param {HTMLElement} dropdown - Dropdown element
     */
    checkOnlyAll(dropdown) {
        if (!dropdown) {
            return;
        }
        dropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = cb.value === 'all';
        });
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
            const isOpen = Utils.isOpenNow(restaurant.schedule);
            const inCompare = this.compareIds.includes(restaurant.id);
            const placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 180%22%3E%3Crect fill=%22%23ddd%22 width=%22400%22 height=%22180%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2220%22%3ELoading...%3C/text%3E%3C/svg%3E';

            const dietaryTagsHtml = Array.isArray(restaurant.dietaryTags) && restaurant.dietaryTags.length
                ? `<div class="card-dietary-tags">${restaurant.dietaryTags.map(t => `<span class="dietary-tag">${Utils.escapeHtml(this.dietaryLabel(t))}</span>`).join('')}</div>`
                : '';

            card.innerHTML = `
                <div class="card-image-wrap">
                    <img class="restaurant-image lazy"
                         src="${placeholderSvg}"
                         data-src="${Utils.escapeHtml(restaurant.image || '')}"
                         alt="${Utils.escapeHtml(restaurant.name)}"
                         loading="lazy"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 180%22%3E%3Crect fill=%22%23ddd%22 width=%22400%22 height=%22180%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2220%22%3EImage not available%3C/text%3E%3C/svg%3E'">
                    <span class="status-badge ${isOpen ? 'open' : 'closed'}">${isOpen ? 'Open' : 'Closed'}</span>
                </div>
                <div class="restaurant-info">
                    <div class="restaurant-header">
                        <h3 class="restaurant-name">${Utils.escapeHtml(restaurant.name)}</h3>
                        <button class="favorite-btn ${isFavorite ? 'active' : ''}"
                                data-id="${restaurant.id}"
                                aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
                                aria-pressed="${isFavorite}">
                            ${isFavorite ? '♥' : '♡'}
                        </button>
                    </div>
                    <span class="restaurant-category">${Utils.escapeHtml(restaurant.category)}</span>
                    <div class="restaurant-details">
                        <span class="restaurant-price">${Utils.escapeHtml(restaurant.price || 'N/A')}</span>
                        <span class="restaurant-distance">${Utils.escapeHtml(restaurant.distance || 'N/A')}</span>
                        <span class="restaurant-rating">${Utils.formatRating(restaurant.rating)}</span>
                    </div>
                    ${dietaryTagsHtml}
                    <p class="restaurant-description">${Utils.escapeHtml(restaurant.description || '')}</p>
                    <label class="compare-toggle">
                        <input type="checkbox" class="compare-checkbox" data-id="${restaurant.id}" ${inCompare ? 'checked' : ''}>
                        Compare
                    </label>
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

            // Compare checkbox
            const compareCheckbox = card.querySelector('.compare-checkbox');
            if (compareCheckbox) {
                compareCheckbox.addEventListener('click', (e) => e.stopPropagation());
                compareCheckbox.addEventListener('change', (e) => {
                    this.handleCompareToggle(restaurant.id, e.target);
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
     * Returns a human-readable label for a dietary tag value
     * @param {string} value - Dietary tag value
     * @returns {string} Label
     */
    dietaryLabel(value) {
        const labels = {
            'vegetarian': 'Vegetarian', 'vegan': 'Vegan',
            'halal': 'Halal', 'gluten-free': 'Gluten-Free'
        };
        return labels[value] || value;
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
            this.renderModalGallery(restaurant);

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
            if (this.elements.modalStatus) {
                const isOpen = Utils.isOpenNow(restaurant.schedule);
                this.elements.modalStatus.textContent = isOpen ? 'Open now' : 'Closed';
                this.elements.modalStatus.className = `modal-status ${isOpen ? 'open' : 'closed'}`;
            }
            this.renderModalDietaryTags(restaurant);
            if (this.elements.modalDescription) {
                this.elements.modalDescription.textContent = restaurant.description;
            }
            this.renderModalMenu(restaurant);
            if (this.elements.modalAddress) {
                this.elements.modalAddress.textContent = restaurant.address || 'N/A';
            }
            if (this.elements.modalDistance) {
                this.elements.modalDistance.textContent = restaurant.distance || 'N/A';
            }
            if (this.elements.modalWalkTime) {
                this.elements.modalWalkTime.textContent = Utils.estimateWalkingTime(restaurant.distance);
            }
            if (this.elements.modalPhone) {
                this.elements.modalPhone.textContent = restaurant.phone || 'N/A';
            }
            if (this.elements.modalHours) {
                this.elements.modalHours.textContent = restaurant.hours || 'N/A';
            }

            // Note
            if (this.elements.modalNoteInput) {
                this.elements.modalNoteInput.value = Storage.getNote(restaurant.id);
            }

            // Visited button
            this.updateVisitedButton(restaurant.id);

            // Directions link
            if (this.elements.modalDirectionsBtn) {
                this.elements.modalDirectionsBtn.href = this.buildDirectionsUrl(restaurant);
            }

            const isFavorite = Storage.isFavorite(restaurant.id);
            if (this.elements.modalFavoriteBtn) {
                this.elements.modalFavoriteBtn.classList.toggle('active', isFavorite);
                this.elements.modalFavoriteBtn.innerHTML = isFavorite
                    ? '<span class="heart-icon">♥</span> Remove from Favorites'
                    : '<span class="heart-icon">♡</span> Add to Favorites';
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
     * Renders the modal photo gallery thumbnails
     * @param {Object} restaurant - Restaurant data
     */
    renderModalGallery(restaurant) {
        try {
            const gallery = this.elements.modalGallery;
            if (!gallery) {
                return;
            }
            gallery.innerHTML = '';
            const photos = Array.isArray(restaurant.photos) && restaurant.photos.length
                ? restaurant.photos
                : (restaurant.image ? [restaurant.image] : []);

            if (photos.length <= 1) {
                gallery.classList.add('hidden');
                return;
            }
            gallery.classList.remove('hidden');

            photos.forEach((photo, index) => {
                const thumb = document.createElement('button');
                thumb.type = 'button';
                thumb.className = 'gallery-thumb' + (index === 0 ? ' active' : '');
                thumb.setAttribute('aria-label', `View photo ${index + 1}`);
                thumb.innerHTML = `<img src="${Utils.escapeHtml(photo)}" alt="${Utils.escapeHtml(restaurant.name)} photo ${index + 1}" loading="lazy">`;
                thumb.addEventListener('click', () => {
                    if (this.elements.modalImage) {
                        this.elements.modalImage.src = photo;
                    }
                    gallery.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                });
                gallery.appendChild(thumb);
            });
        } catch (error) {
            console.error('UI.renderModalGallery: Error:', error.message);
        }
    },

    /**
     * Renders dietary tags in the modal
     * @param {Object} restaurant - Restaurant data
     */
    renderModalDietaryTags(restaurant) {
        try {
            const container = this.elements.modalDietaryTags;
            if (!container) {
                return;
            }
            container.innerHTML = '';
            const tags = Array.isArray(restaurant.dietaryTags) ? restaurant.dietaryTags : [];
            if (tags.length === 0) {
                container.classList.add('hidden');
                return;
            }
            container.classList.remove('hidden');
            tags.forEach(tag => {
                const span = document.createElement('span');
                span.className = 'dietary-tag';
                span.textContent = this.dietaryLabel(tag);
                container.appendChild(span);
            });
        } catch (error) {
            console.error('UI.renderModalDietaryTags: Error:', error.message);
        }
    },

    /**
     * Renders menu highlights in the modal
     * @param {Object} restaurant - Restaurant data
     */
    renderModalMenu(restaurant) {
        try {
            const list = this.elements.modalMenuList;
            if (!list) {
                return;
            }
            list.innerHTML = '';
            const items = Array.isArray(restaurant.menuHighlights) ? restaurant.menuHighlights : [];
            const section = list.closest('.modal-menu-highlights');
            if (items.length === 0) {
                if (section) {
                    section.classList.add('hidden');
                }
                return;
            }
            if (section) {
                section.classList.remove('hidden');
            }
            items.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="menu-item-name">${Utils.escapeHtml(item.name || '')}</span>
                                <span class="menu-item-price">${Utils.escapeHtml(item.price || '')}</span>`;
                list.appendChild(li);
            });
        } catch (error) {
            console.error('UI.renderModalMenu: Error:', error.message);
        }
    },

    /**
     * Builds a Google Maps directions URL for a restaurant
     * @param {Object} restaurant - Restaurant data
     * @returns {string} Directions URL
     */
    buildDirectionsUrl(restaurant) {
        try {
            let destination;
            if (typeof restaurant.lat === 'number' && typeof restaurant.lng === 'number') {
                destination = `${restaurant.lat},${restaurant.lng}`;
            } else {
                destination = restaurant.address || restaurant.name || '';
            }
            return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
        } catch (error) {
            console.error('UI.buildDirectionsUrl: Error:', error.message);
            return '#';
        }
    },

    /**
     * Updates the visited button label/state for a restaurant
     * @param {number} restaurantId - Restaurant ID
     */
    updateVisitedButton(restaurantId) {
        try {
            const btn = this.elements.modalVisitedBtn;
            if (!btn) {
                return;
            }
            const visit = Storage.getVisit(restaurantId);
            if (visit.count > 0) {
                btn.classList.add('visited');
                btn.innerHTML = `✓ Visited${visit.count > 1 ? ` (${visit.count})` : ''}`;
            } else {
                btn.classList.remove('visited');
                btn.innerHTML = '✓ Mark Visited';
            }
        } catch (error) {
            console.error('UI.updateVisitedButton: Error:', error.message);
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
                button.innerHTML = nowFavorite ? '♥' : '♡';
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
                        ? '<span class="heart-icon">♥</span> Remove from Favorites'
                        : '<span class="heart-icon">♡</span> Add to Favorites';
                }

                this.syncCardFavorite(restaurantId, nowFavorite);
                this.renderFavorites();
            }

        } catch (error) {
            console.error('UI.handleModalFavoriteClick: Error:', error.message);
            Toast.error('Failed to update favorites');
        }
    },

    /**
     * Syncs a card's favorite button state with storage
     * @param {number} restaurantId - Restaurant ID
     * @param {boolean} nowFavorite - New favorite state
     */
    syncCardFavorite(restaurantId, nowFavorite) {
        const card = Utils.getElement(`.restaurant-card[data-id="${restaurantId}"]`);
        if (card) {
            const cardBtn = card.querySelector('.favorite-btn');
            if (cardBtn) {
                cardBtn.classList.toggle('active', nowFavorite);
                cardBtn.innerHTML = nowFavorite ? '♥' : '♡';
                cardBtn.setAttribute('aria-label', nowFavorite ? 'Remove from favorites' : 'Add to favorites');
                cardBtn.setAttribute('aria-pressed', nowFavorite);
            }
        }
    },

    /**
     * Handles saving a note from the modal
     */
    handleSaveNote() {
        try {
            if (!this.currentModalRestaurant || !this.elements.modalNoteInput) {
                return;
            }
            const note = this.elements.modalNoteInput.value;
            const success = Storage.setNote(this.currentModalRestaurant.id, note);
            if (success) {
                Toast.success(note.trim() === '' ? 'Note cleared' : 'Note saved');
            } else {
                Toast.error('Failed to save note');
            }
        } catch (error) {
            console.error('UI.handleSaveNote: Error:', error.message);
            Toast.error('Failed to save note');
        }
    },

    /**
     * Handles marking the current modal restaurant as visited
     */
    handleMarkVisited() {
        try {
            if (!this.currentModalRestaurant) {
                return;
            }
            const success = Storage.markVisited(this.currentModalRestaurant.id);
            if (success) {
                Toast.success('Marked as visited');
                this.updateVisitedButton(this.currentModalRestaurant.id);
            } else {
                Toast.error('Failed to mark as visited');
            }
        } catch (error) {
            console.error('UI.handleMarkVisited: Error:', error.message);
        }
    },

    /**
     * Handles sharing the current modal restaurant
     */
    async handleShare() {
        try {
            if (!this.currentModalRestaurant) {
                return;
            }
            const r = this.currentModalRestaurant;
            const shareData = {
                title: r.name,
                text: `Check out ${r.name} near Farmingdale State College!`,
                url: window.location.href
            };

            if (navigator.share) {
                await navigator.share(shareData);
                return;
            }

            const text = `${shareData.text} ${shareData.url}`;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                Toast.success('Link copied to clipboard');
            } else {
                Toast.info(text);
            }
        } catch (error) {
            if (error && error.name === 'AbortError') {
                return; // user cancelled share dialog
            }
            console.error('UI.handleShare: Error:', error.message);
            Toast.error('Unable to share');
        }
    },

    /**
     * Toggles a restaurant in the comparison list
     * @param {number} restaurantId - Restaurant ID
     * @param {HTMLElement} checkbox - Compare checkbox
     */
    handleCompareToggle(restaurantId, checkbox) {
        try {
            const max = Constants.UI.MAX_COMPARE || 3;
            const index = this.compareIds.indexOf(restaurantId);

            if (checkbox.checked) {
                if (index === -1) {
                    if (this.compareIds.length >= max) {
                        checkbox.checked = false;
                        Toast.warning(`You can compare up to ${max} restaurants`);
                        return;
                    }
                    this.compareIds.push(restaurantId);
                }
            } else if (index !== -1) {
                this.compareIds.splice(index, 1);
            }

            this.renderComparison();
        } catch (error) {
            console.error('UI.handleCompareToggle: Error:', error.message);
        }
    },

    /**
     * Renders the comparison panel
     */
    renderComparison() {
        try {
            const panel = this.elements.comparisonPanel;
            const content = this.elements.comparisonContent;
            if (!panel || !content) {
                return;
            }

            const max = Constants.UI.MAX_COMPARE || 3;
            if (this.elements.compareCount) {
                this.elements.compareCount.textContent = `(${this.compareIds.length}/${max})`;
            }

            if (this.compareIds.length === 0) {
                panel.classList.add('hidden');
                content.innerHTML = '';
                return;
            }

            panel.classList.remove('hidden');

            const restaurants = this.compareIds
                .map(id => RESTAURANT_DATA.find(r => r.id === id))
                .filter(Boolean);

            const rows = [
                { label: 'Category', get: r => Utils.escapeHtml(r.category || 'N/A') },
                { label: 'Price', get: r => Utils.escapeHtml(r.price || 'N/A') },
                { label: 'Rating', get: r => Utils.formatRating(r.rating) },
                { label: 'Distance', get: r => Utils.escapeHtml(r.distance || 'N/A') },
                { label: 'Walk', get: r => Utils.escapeHtml(Utils.estimateWalkingTime(r.distance)) },
                { label: 'Open now', get: r => Utils.isOpenNow(r.schedule) ? 'Yes' : 'No' }
            ];

            let html = '<table class="comparison-table"><thead><tr><th></th>';
            restaurants.forEach(r => {
                html += `<th>${Utils.escapeHtml(r.name)}</th>`;
            });
            html += '</tr></thead><tbody>';
            rows.forEach(row => {
                html += `<tr><th scope="row">${row.label}</th>`;
                restaurants.forEach(r => {
                    html += `<td>${row.get(r)}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table>';
            content.innerHTML = html;
        } catch (error) {
            console.error('UI.renderComparison: Error:', error.message);
        }
    },

    /**
     * Clears the comparison list
     */
    clearComparison() {
        try {
            this.compareIds = [];
            Utils.getElements('.compare-checkbox').forEach(cb => {
                cb.checked = false;
            });
            this.renderComparison();
        } catch (error) {
            console.error('UI.clearComparison: Error:', error.message);
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
                            ✕
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
                this.syncCardFavorite(restaurantId, false);
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
     * Exports (prints) the user's favorite restaurants
     */
    exportFavorites() {
        try {
            const favoriteIds = Storage.getFavorites();
            if (!favoriteIds.length) {
                Toast.info('No favorites to export');
                return;
            }

            const favorites = favoriteIds
                .map(id => RESTAURANT_DATA.find(r => r.id === id))
                .filter(Boolean);

            const rows = favorites.map(r => `
                <tr>
                    <td>${Utils.escapeHtml(r.name)}</td>
                    <td>${Utils.escapeHtml(r.category)}</td>
                    <td>${Utils.escapeHtml(r.price || '')}</td>
                    <td>${Utils.escapeHtml(r.address || '')}</td>
                    <td>${Utils.escapeHtml(r.phone || '')}</td>
                </tr>`).join('');

            const win = window.open('', '_blank');
            if (!win) {
                Toast.error('Unable to open print window');
                return;
            }
            win.document.write(`
                <html>
                <head>
                    <title>My Farmingdale Lunch Favorites</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
                        h1 { color: #2c5530; }
                        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                        th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
                        th { background: #2c5530; color: #fff; }
                    </style>
                </head>
                <body>
                    <h1>My Lunch Favorites</h1>
                    <table>
                        <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Address</th><th>Phone</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </body>
                </html>
            `);
            win.document.close();
            win.focus();
            win.print();
        } catch (error) {
            console.error('UI.exportFavorites: Error:', error.message);
            Toast.error('Failed to export favorites');
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
     * Gets selected values from a multi-select dropdown
     * @param {string} dropdownSelector - CSS selector for the dropdown
     * @returns {string[]} Array of selected values
     */
    getSelectedFromDropdown(dropdownSelector) {
        try {
            const checkboxes = Utils.getElements(`${dropdownSelector} input[type="checkbox"]:checked`);
            const values = checkboxes.map(cb => cb.value);

            if (values.includes('all')) {
                return ['all'];
            }
            return values.length > 0 ? values : ['all'];
        } catch (error) {
            console.error('UI.getSelectedFromDropdown: Error:', error.message);
            return ['all'];
        }
    },

    /**
     * Gets the selected categories from multi-select
     * @returns {string[]} Array of selected category values
     */
    getSelectedCategories() {
        return this.getSelectedFromDropdown('#category-dropdown');
    },

    /**
     * Gets the selected dietary tags from multi-select
     * @returns {string[]} Array of selected dietary values
     */
    getSelectedDietary() {
        return this.getSelectedFromDropdown('#dietary-dropdown');
    },

    /**
     * Updates category trigger text
     */
    updateCategoryTriggerText() {
        this.updateTriggerText(this.elements.categoryTrigger, this.getSelectedCategories(), {
            'pizza': 'Pizza', 'deli': 'Deli', 'asian': 'Asian',
            'fast-food': 'Fast Food', 'cafe': 'Cafe'
        }, 'All Categories', 'categories');
    },

    /**
     * Updates dietary trigger text
     */
    updateDietaryTriggerText() {
        this.updateTriggerText(this.elements.dietaryTrigger, this.getSelectedDietary(), {
            'vegetarian': 'Vegetarian', 'vegan': 'Vegan',
            'halal': 'Halal', 'gluten-free': 'Gluten-Free'
        }, 'All Dietary', 'options');
    },

    /**
     * Generic helper to update a multi-select trigger label
     * @param {HTMLElement} trigger - Trigger button
     * @param {string[]} selected - Selected values
     * @param {Object} labels - Value->label map
     * @param {string} allLabel - Label when "all" is selected
     * @param {string} pluralNoun - Noun for count display
     */
    updateTriggerText(trigger, selected, labels, allLabel, pluralNoun) {
        try {
            if (!trigger) {
                return;
            }
            if (selected.includes('all') || selected.length === 0) {
                trigger.textContent = allLabel;
            } else if (selected.length === 1) {
                trigger.textContent = labels[selected[0]] || selected[0];
            } else {
                trigger.textContent = `${selected.length} ${pluralNoun}`;
            }
        } catch (error) {
            console.error('UI.updateTriggerText: Error:', error.message);
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
                dietary: this.getSelectedDietary(),
                price: this.elements.priceFilter?.value || 'all',
                sort: this.elements.sortSelect?.value || 'rating',
                search: this.elements.searchInput?.value || '',
                openNow: this.elements.openNowToggle?.checked || false,
                maxDistance: this.elements.distanceSlider
                    ? parseFloat(this.elements.distanceSlider.value)
                    : Infinity
            };
        } catch (error) {
            console.error('UI.getFilterValues: Failed to get filter values:', error.message);
            return { categories: ['all'], dietary: ['all'], price: 'all', sort: 'rating', search: '', openNow: false, maxDistance: Infinity };
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

            this._filterCallback = filterCallback;

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
                const debouncedCallback = Utils.debounce(() => {
                    const value = this.elements.searchInput.value;
                    if (value && value.trim() !== '') {
                        Storage.addRecentSearch(value);
                    }
                    filterCallback();
                }, Constants.UI.DEBOUNCE_DELAY || 300);
                this.elements.searchInput.addEventListener('input', debouncedCallback);
                this.setupRecentSearches(filterCallback);
            }

            // Open now toggle
            if (this.elements.openNowToggle) {
                this.elements.openNowToggle.addEventListener('change', filterCallback);
            }

            // Distance slider
            if (this.elements.distanceSlider) {
                const debouncedFilter = Utils.debounce(filterCallback, 150);
                this.elements.distanceSlider.addEventListener('input', () => {
                    if (this.elements.distanceValue) {
                        this.elements.distanceValue.textContent = parseFloat(this.elements.distanceSlider.value).toFixed(1);
                    }
                    debouncedFilter();
                });
            }

            // Multi-select dropdowns
            this.setupMultiSelect(this.elements.categoryTrigger, this.elements.categoryDropdown, '#category-container',
                () => this.updateCategoryTriggerText(), filterCallback);
            this.setupMultiSelect(this.elements.dietaryTrigger, this.elements.dietaryDropdown, '#dietary-container',
                () => this.updateDietaryTriggerText(), filterCallback);

            // Theme toggle
            if (this.elements.themeToggle) {
                this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
            }

            // Load more
            if (this.elements.loadMoreBtn) {
                this.elements.loadMoreBtn.addEventListener('click', () => this.showMore());
            }

            // Comparison clear
            if (this.elements.clearCompareBtn) {
                this.elements.clearCompareBtn.addEventListener('click', () => this.clearComparison());
            }

            // Export favorites
            if (this.elements.exportFavoritesBtn) {
                this.elements.exportFavoritesBtn.addEventListener('click', () => this.exportFavorites());
            }

            // Back to top
            this.setupBackToTop();

            // Settings panel
            this.setupSettings(filterCallback);

            // Shortcuts modal + global keyboard shortcuts
            this.setupKeyboardShortcuts();

            // Modal events
            this.setupModalEvents();

        } catch (error) {
            console.error('UI.bindFilterEvents: Failed to bind events:', error.message);
        }
    },

    /**
     * Sets up a multi-select dropdown's open/close and change behavior
     * @param {HTMLElement} trigger - Trigger button
     * @param {HTMLElement} dropdown - Dropdown element
     * @param {string} containerSelector - Selector for the wrapping container
     * @param {Function} updateText - Function to update the trigger label
     * @param {Function} filterCallback - Filter callback
     */
    setupMultiSelect(trigger, dropdown, containerSelector, updateText, filterCallback) {
        try {
            if (!trigger || !dropdown) {
                return;
            }

            trigger.addEventListener('click', () => {
                const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
                trigger.setAttribute('aria-expanded', !isExpanded);
                dropdown.classList.toggle('hidden');
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest(containerSelector)) {
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

                    updateText();
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
            console.error('UI.setupMultiSelect: Error:', error.message);
        }
    },

    /**
     * Sets up the recent searches dropdown
     * @param {Function} filterCallback - Filter callback
     */
    setupRecentSearches(filterCallback) {
        try {
            const input = this.elements.searchInput;
            const dropdown = this.elements.recentSearchesDropdown;
            if (!input || !dropdown) {
                return;
            }

            const render = () => {
                const searches = Storage.getRecentSearches();
                if (!searches.length) {
                    dropdown.classList.add('hidden');
                    dropdown.innerHTML = '';
                    return;
                }
                dropdown.innerHTML = '';
                searches.forEach(query => {
                    const option = document.createElement('button');
                    option.type = 'button';
                    option.className = 'recent-search-item';
                    option.setAttribute('role', 'option');
                    option.innerHTML = `<span class="recent-icon">↺</span> ${Utils.escapeHtml(query)}`;
                    option.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        input.value = query;
                        Storage.addRecentSearch(query);
                        dropdown.classList.add('hidden');
                        filterCallback();
                    });
                    dropdown.appendChild(option);
                });

                const clear = document.createElement('button');
                clear.type = 'button';
                clear.className = 'recent-search-clear';
                clear.textContent = 'Clear recent searches';
                clear.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    Storage.clearRecentSearches();
                    dropdown.classList.add('hidden');
                });
                dropdown.appendChild(clear);

                dropdown.classList.remove('hidden');
            };

            input.addEventListener('focus', () => {
                if (input.value.trim() === '') {
                    render();
                }
            });

            input.addEventListener('blur', () => {
                setTimeout(() => dropdown.classList.add('hidden'), 150);
            });
        } catch (error) {
            console.error('UI.setupRecentSearches: Error:', error.message);
        }
    },

    /**
     * Sets up the back-to-top button
     */
    setupBackToTop() {
        try {
            const btn = this.elements.backToTop;
            if (!btn) {
                return;
            }
            const threshold = Constants.UI.BACK_TO_TOP_THRESHOLD || 300;
            window.addEventListener('scroll', () => {
                btn.classList.toggle('hidden', window.scrollY < threshold);
            }, { passive: true });
            btn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        } catch (error) {
            console.error('UI.setupBackToTop: Error:', error.message);
        }
    },

    /**
     * Sets up the settings panel
     * @param {Function} filterCallback - Filter callback
     */
    setupSettings(filterCallback) {
        try {
            const open = () => {
                const view = Storage.getDefaultView();
                if (this.elements.defaultSort) {
                    this.elements.defaultSort.value = view.defaultSort;
                }
                if (this.elements.defaultCategory) {
                    this.elements.defaultCategory.value = view.defaultCategory;
                }
                if (this.elements.settingsPanel) {
                    this.elements.settingsPanel.classList.remove('hidden');
                }
            };
            const close = () => {
                if (this.elements.settingsPanel) {
                    this.elements.settingsPanel.classList.add('hidden');
                }
            };

            if (this.elements.settingsToggle) {
                this.elements.settingsToggle.addEventListener('click', open);
            }
            if (this.elements.settingsClose) {
                this.elements.settingsClose.addEventListener('click', close);
            }
            if (this.elements.settingsOverlay) {
                this.elements.settingsOverlay.addEventListener('click', close);
            }
            if (this.elements.saveSettingsBtn) {
                this.elements.saveSettingsBtn.addEventListener('click', () => {
                    const settings = {
                        defaultSort: this.elements.defaultSort?.value || 'rating',
                        defaultCategory: this.elements.defaultCategory?.value || 'all'
                    };
                    Storage.setDefaultView(settings);

                    // Apply immediately
                    if (this.elements.sortSelect) {
                        this.elements.sortSelect.value = settings.defaultSort;
                    }
                    this.applyDefaultCategory(settings.defaultCategory);
                    close();
                    Toast.success('Settings saved');
                    filterCallback();
                });
            }
        } catch (error) {
            console.error('UI.setupSettings: Error:', error.message);
        }
    },

    /**
     * Applies a default category selection to the category dropdown
     * @param {string} category - Category value (or "all")
     */
    applyDefaultCategory(category) {
        try {
            const dropdown = this.elements.categoryDropdown;
            if (!dropdown) {
                return;
            }
            if (!category || category === 'all') {
                this.checkOnlyAll(dropdown);
            } else {
                dropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    cb.checked = cb.value === category;
                });
            }
            this.updateCategoryTriggerText();
        } catch (error) {
            console.error('UI.applyDefaultCategory: Error:', error.message);
        }
    },

    /**
     * Sets up keyboard shortcuts and the shortcuts modal
     */
    setupKeyboardShortcuts() {
        try {
            const openShortcuts = () => {
                if (this.elements.shortcutsModal) {
                    this.elements.shortcutsModal.classList.remove('hidden');
                }
            };
            const closeShortcuts = () => {
                if (this.elements.shortcutsModal) {
                    this.elements.shortcutsModal.classList.add('hidden');
                }
            };

            if (this.elements.shortcutsClose) {
                this.elements.shortcutsClose.addEventListener('click', closeShortcuts);
            }
            const shortcutsOverlay = this.elements.shortcutsModal?.querySelector('.modal-overlay');
            if (shortcutsOverlay) {
                shortcutsOverlay.addEventListener('click', closeShortcuts);
            }

            document.addEventListener('keydown', (e) => {
                const tag = (e.target.tagName || '').toLowerCase();
                const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select';

                if (e.key === 'Escape') {
                    closeShortcuts();
                    if (this.elements.searchInput && document.activeElement === this.elements.searchInput) {
                        this.elements.searchInput.value = '';
                        if (typeof this._filterCallback === 'function') {
                            this._filterCallback();
                        }
                    }
                    return;
                }

                if (isTyping) {
                    return;
                }

                switch (e.key) {
                case '/':
                    e.preventDefault();
                    if (this.elements.searchInput) {
                        this.elements.searchInput.focus();
                    }
                    break;
                case 'd':
                    this.toggleTheme();
                    break;
                case 'f': {
                    const fav = Utils.getElement('#favorites-section');
                    if (fav) {
                        fav.scrollIntoView({ behavior: 'smooth' });
                    }
                    break;
                }
                case '?':
                    openShortcuts();
                    break;
                default:
                    break;
                }
            });
        } catch (error) {
            console.error('UI.setupKeyboardShortcuts: Error:', error.message);
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

            // Close when clicking the backdrop padding around the content card.
            if (this.elements.modal) {
                this.elements.modal.addEventListener('click', (e) => {
                    if (e.target === this.elements.modal || e.target === this.elements.modalOverlay) {
                        this.closeModal();
                    }
                });
            }

            if (this.elements.modalFavoriteBtn) {
                this.elements.modalFavoriteBtn.addEventListener('click', () => this.handleModalFavoriteClick());
            }

            if (this.elements.modalSaveNoteBtn) {
                this.elements.modalSaveNoteBtn.addEventListener('click', () => this.handleSaveNote());
            }

            if (this.elements.modalVisitedBtn) {
                this.elements.modalVisitedBtn.addEventListener('click', () => this.handleMarkVisited());
            }

            if (this.elements.modalShareBtn) {
                this.elements.modalShareBtn.addEventListener('click', () => this.handleShare());
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
