/**
 * Unit tests for Api module
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Create mock localStorage
const localStorageMock = {
    store: {},
    getItem: function(key) { return this.store[key] || null; },
    setItem: function(key, value) { this.store[key] = value; },
    removeItem: function(key) { delete this.store[key]; },
    clear: function() { this.store = {}; }
};

// Create sandbox with required globals
const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Object,
    Array,
    String,
    Number,
    Boolean,
    JSON,
    Math,
    isNaN,
    parseFloat,
    parseInt,
    Error,
    Promise,
    localStorage: localStorageMock
};

vm.createContext(sandbox);

// Load Utils first (dependency)
const utilsCode = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');
sandbox.Utils = vm.runInContext(utilsCode + '\nUtils;', sandbox);

// Load data
const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
sandbox.RESTAURANT_DATA = vm.runInContext(dataCode + '\nRESTAURANT_DATA;', sandbox);

// Load Api module
const apiCode = fs.readFileSync(path.join(__dirname, '../js/api.js'), 'utf8');
const Api = vm.runInContext(apiCode + '\nApi;', sandbox);

describe('Api', () => {
    describe('searchRestaurants', () => {
        const restaurants = [
            { id: 1, name: 'Pizza Place', category: 'pizza', description: 'Great pizza', address: '123 Main St' },
            { id: 2, name: 'Sushi Bar', category: 'asian', description: 'Fresh sushi', address: '456 Oak Ave' },
            { id: 3, name: 'Burger Joint', category: 'fast-food', description: 'Juicy burgers', address: '789 Elm St' }
        ];

        test('should find restaurants by name', () => {
            const result = Api.searchRestaurants('pizza', restaurants);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Pizza Place');
        });

        test('should find restaurants by category', () => {
            const result = Api.searchRestaurants('asian', restaurants);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Sushi Bar');
        });

        test('should find restaurants by description', () => {
            const result = Api.searchRestaurants('fresh', restaurants);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Sushi Bar');
        });

        test('should be case insensitive', () => {
            const result = Api.searchRestaurants('PIZZA', restaurants);
            expect(result).toHaveLength(1);
        });

        test('should return all restaurants for empty query', () => {
            const result = Api.searchRestaurants('', restaurants);
            expect(result).toHaveLength(3);
        });

        test('should return empty array for no matches', () => {
            const result = Api.searchRestaurants('mexican', restaurants);
            expect(result).toHaveLength(0);
        });

        test('should handle invalid query type', () => {
            const result = Api.searchRestaurants(123, restaurants);
            expect(result).toEqual(restaurants);
        });

        test('should handle invalid restaurants array', () => {
            const result = Api.searchRestaurants('pizza', null);
            expect(result).toEqual([]);
        });
    });

    describe('filterByCategory', () => {
        const restaurants = [
            { id: 1, name: 'Pizza 1', category: 'pizza' },
            { id: 2, name: 'Pizza 2', category: 'pizza' },
            { id: 3, name: 'Sushi', category: 'asian' }
        ];

        test('should filter by category', () => {
            const result = Api.filterByCategory('pizza', restaurants);
            expect(result).toHaveLength(2);
            result.forEach(r => expect(r.category).toBe('pizza'));
        });

        test('should be case insensitive', () => {
            const result = Api.filterByCategory('PIZZA', restaurants);
            expect(result).toHaveLength(2);
        });

        test('should return all for "all" category', () => {
            const result = Api.filterByCategory('all', restaurants);
            expect(result).toHaveLength(3);
        });

        test('should return all for empty category', () => {
            const result = Api.filterByCategory('', restaurants);
            expect(result).toHaveLength(3);
        });

        test('should handle invalid restaurants array', () => {
            const result = Api.filterByCategory('pizza', null);
            expect(result).toEqual([]);
        });
    });

    describe('filterByPrice', () => {
        const restaurants = [
            { id: 1, name: 'Cheap', price: '$' },
            { id: 2, name: 'Medium', price: '$$' },
            { id: 3, name: 'Expensive', price: '$$$' }
        ];

        test('should filter by price', () => {
            const result = Api.filterByPrice('$$', restaurants);
            expect(result).toHaveLength(1);
            expect(result[0].price).toBe('$$');
        });

        test('should return all for "all" price', () => {
            const result = Api.filterByPrice('all', restaurants);
            expect(result).toHaveLength(3);
        });

        test('should return all for invalid price', () => {
            const result = Api.filterByPrice('$$$$', restaurants);
            expect(result).toHaveLength(3);
        });

        test('should handle invalid restaurants array', () => {
            const result = Api.filterByPrice('$', null);
            expect(result).toEqual([]);
        });
    });

    describe('getErrorMessage', () => {
        test('should return user-friendly message for known error codes', () => {
            const error = new Api.ApiError('Test', 'NOT_FOUND');
            const message = Api.getErrorMessage(error);
            expect(message).toBe('Restaurant not found.');
        });

        test('should return generic message for unknown error', () => {
            const error = new Error('Unknown error');
            const message = Api.getErrorMessage(error);
            expect(message).toBe('An unexpected error occurred. Please try again.');
        });

        test('should handle NETWORK_ERROR', () => {
            const error = new Api.ApiError('Test', 'NETWORK_ERROR');
            const message = Api.getErrorMessage(error);
            expect(message).toBe('Network error. Please check your connection.');
        });
    });

    describe('isRetryableError', () => {
        test('should return true for NETWORK_ERROR', () => {
            expect(Api.isRetryableError('NETWORK_ERROR')).toBe(true);
        });

        test('should return true for TIMEOUT', () => {
            expect(Api.isRetryableError('TIMEOUT')).toBe(true);
        });

        test('should return false for NOT_FOUND', () => {
            expect(Api.isRetryableError('NOT_FOUND')).toBe(false);
        });
    });

    describe('fetchRestaurants', () => {
        test('should return validated restaurant data', async () => {
            const restaurants = await Api.fetchRestaurants();
            expect(Array.isArray(restaurants)).toBe(true);
            expect(restaurants.length).toBeGreaterThan(0);

            restaurants.forEach(restaurant => {
                expect(restaurant).toHaveProperty('id');
                expect(restaurant).toHaveProperty('name');
                expect(restaurant).toHaveProperty('category');
                expect(restaurant).toHaveProperty('price');
            });
        });
    });

    describe('fetchRestaurantById', () => {
        test('should return restaurant for valid ID', async () => {
            const restaurant = await Api.fetchRestaurantById(1);
            expect(restaurant).toHaveProperty('id', 1);
            expect(restaurant).toHaveProperty('name');
        });

        test('should throw for invalid ID type', async () => {
            await expect(Api.fetchRestaurantById('invalid')).rejects.toThrow();
        });

        test('should throw for negative ID', async () => {
            await expect(Api.fetchRestaurantById(-1)).rejects.toThrow();
        });

        test('should throw for non-existent ID', async () => {
            await expect(Api.fetchRestaurantById(9999)).rejects.toThrow();
        });
    });
});
