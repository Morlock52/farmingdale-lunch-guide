/**
 * Unit tests for Storage module
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

// Create context with required globals
const context = vm.createContext({
    console,
    setTimeout,
    clearTimeout,
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
    localStorage: localStorageMock
});

// Load Utils first (dependency)
const utilsCode = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');
const Utils = vm.runInContext(utilsCode + '\nUtils;', context);
context.Utils = Utils;

// Load Storage module
const storageCode = fs.readFileSync(path.join(__dirname, '../js/storage.js'), 'utf8');
const Storage = vm.runInContext(storageCode + '\nStorage;', context);

describe('Storage', () => {
    beforeEach(() => {
        localStorageMock.store = {};
    });

    describe('isAvailable', () => {
        test('should return true when localStorage is available', () => {
            expect(Storage.isAvailable()).toBe(true);
        });
    });

    describe('get and set', () => {
        test('should store and retrieve data', () => {
            Storage.set('testKey', { value: 'test' });
            const result = Storage.get('testKey');
            expect(result).toEqual({ value: 'test' });
        });

        test('should return default value for non-existent key', () => {
            const result = Storage.get('nonExistent', 'default');
            expect(result).toBe('default');
        });

        test('should return null default for non-existent key', () => {
            const result = Storage.get('nonExistent');
            expect(result).toBeNull();
        });

        test('should handle invalid key', () => {
            const result = Storage.get('', 'default');
            expect(result).toBe('default');
        });

        test('should return false for invalid key in set', () => {
            const result = Storage.set('', 'value');
            expect(result).toBe(false);
        });
    });

    describe('remove', () => {
        test('should remove stored data', () => {
            Storage.set('testKey', 'value');
            Storage.remove('testKey');
            const result = Storage.get('testKey', 'default');
            expect(result).toBe('default');
        });

        test('should handle invalid key', () => {
            const result = Storage.remove('');
            expect(result).toBe(false);
        });
    });

    describe('getFavorites and setFavorites', () => {
        test('should return empty array when no favorites', () => {
            const favorites = Storage.getFavorites();
            expect(favorites).toEqual([]);
        });

        test('should add favorite', () => {
            Storage.addFavorite(1);
            const favorites = Storage.getFavorites();
            expect(favorites).toContain(1);
        });

        test('should not duplicate favorites', () => {
            Storage.addFavorite(1);
            Storage.addFavorite(1);
            const favorites = Storage.getFavorites();
            expect(favorites).toHaveLength(1);
        });

        test('should remove favorite', () => {
            Storage.addFavorite(1);
            Storage.addFavorite(2);
            Storage.removeFavorite(1);
            const favorites = Storage.getFavorites();
            expect(favorites).not.toContain(1);
            expect(favorites).toContain(2);
        });

        test('should handle invalid restaurant ID in addFavorite', () => {
            const result = Storage.addFavorite('invalid');
            expect(result).toBe(false);
        });

        test('should handle invalid restaurant ID in removeFavorite', () => {
            const result = Storage.removeFavorite('invalid');
            expect(result).toBe(false);
        });
    });

    describe('isFavorite', () => {
        test('should return true for favorite restaurant', () => {
            Storage.addFavorite(1);
            expect(Storage.isFavorite(1)).toBe(true);
        });

        test('should return false for non-favorite restaurant', () => {
            expect(Storage.isFavorite(999)).toBe(false);
        });

        test('should return false for invalid ID', () => {
            expect(Storage.isFavorite('invalid')).toBe(false);
        });
    });

    describe('getPreferences and setPreferences', () => {
        test('should return default preferences', () => {
            const prefs = Storage.getPreferences();
            expect(prefs).toHaveProperty('categoryFilter', 'all');
            expect(prefs).toHaveProperty('priceFilter', 'all');
            expect(prefs).toHaveProperty('sortBy', 'rating');
        });

        test('should save and retrieve preferences', () => {
            Storage.setPreferences({ priceFilter: '$$', sortBy: 'distance' });
            const prefs = Storage.getPreferences();
            expect(prefs.priceFilter).toBe('$$');
            expect(prefs.sortBy).toBe('distance');
        });

        test('should merge with existing preferences', () => {
            Storage.setPreferences({ priceFilter: '$$' });
            Storage.setPreferences({ sortBy: 'name' });
            const prefs = Storage.getPreferences();
            expect(prefs.priceFilter).toBe('$$');
            expect(prefs.sortBy).toBe('name');
        });

        test('should return false for invalid preferences', () => {
            const result = Storage.setPreferences(null);
            expect(result).toBe(false);
        });
    });
});
