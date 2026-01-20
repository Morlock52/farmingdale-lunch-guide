/**
 * Unit tests for Utils module
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Read the utils.js file
const utilsCode = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');

// Create a sandbox with the necessary globals
const sandbox = {
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
    parseInt
};

// Create context and run the code, returning Utils object
vm.createContext(sandbox);
const Utils = vm.runInContext(utilsCode + '\nUtils;', sandbox);

describe('Utils', () => {
    describe('safeJsonParse', () => {
        test('should parse valid JSON string', () => {
            const result = Utils.safeJsonParse('{"name": "test"}', {});
            expect(result).toEqual({ name: 'test' });
        });

        test('should return default value for invalid JSON', () => {
            const result = Utils.safeJsonParse('invalid json', { default: true });
            expect(result).toEqual({ default: true });
        });

        test('should return default value for non-string input', () => {
            const result = Utils.safeJsonParse(123, 'default');
            expect(result).toBe('default');
        });

        test('should return default value for empty string', () => {
            const result = Utils.safeJsonParse('', 'default');
            expect(result).toBe('default');
        });

        test('should handle null default value', () => {
            const result = Utils.safeJsonParse('invalid');
            expect(result).toBeNull();
        });
    });

    describe('safeJsonStringify', () => {
        test('should stringify object', () => {
            const result = Utils.safeJsonStringify({ name: 'test' });
            expect(result).toBe('{"name":"test"}');
        });

        test('should stringify array', () => {
            const result = Utils.safeJsonStringify([1, 2, 3]);
            expect(result).toBe('[1,2,3]');
        });

        test('should return default for undefined', () => {
            const result = Utils.safeJsonStringify(undefined, 'default');
            expect(result).toBe('default');
        });

        test('should handle null value', () => {
            const result = Utils.safeJsonStringify(null);
            expect(result).toBe('null');
        });
    });

    describe('escapeHtml', () => {
        test('should escape HTML characters', () => {
            const result = Utils.escapeHtml('<script>alert("xss")</script>');
            expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        });

        test('should escape ampersand', () => {
            const result = Utils.escapeHtml('Tom & Jerry');
            expect(result).toBe('Tom &amp; Jerry');
        });

        test('should escape quotes', () => {
            const result = Utils.escapeHtml("It's a \"test\"");
            expect(result).toBe('It&#39;s a &quot;test&quot;');
        });

        test('should return empty string for null', () => {
            const result = Utils.escapeHtml(null);
            expect(result).toBe('');
        });

        test('should return empty string for undefined', () => {
            const result = Utils.escapeHtml(undefined);
            expect(result).toBe('');
        });

        test('should convert numbers to string', () => {
            const result = Utils.escapeHtml(123);
            expect(result).toBe('123');
        });
    });

    describe('validateRestaurant', () => {
        const validRestaurant = {
            id: 1,
            name: 'Test Restaurant',
            category: 'pizza',
            price: '$$',
            rating: 4.5
        };

        test('should validate correct restaurant data', () => {
            const result = Utils.validateRestaurant(validRestaurant);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should fail for null input', () => {
            const result = Utils.validateRestaurant(null);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Restaurant data must be an object');
        });

        test('should fail for missing required fields', () => {
            const result = Utils.validateRestaurant({ id: 1 });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Missing required field: name');
            expect(result.errors).toContain('Missing required field: category');
            expect(result.errors).toContain('Missing required field: price');
        });

        test('should fail for invalid id type', () => {
            const result = Utils.validateRestaurant({ ...validRestaurant, id: 'abc' });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Field "id" must be a number');
        });

        test('should fail for invalid rating range', () => {
            const result = Utils.validateRestaurant({ ...validRestaurant, rating: 10 });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Field "rating" must be a number between 0 and 5');
        });

        test('should accept rating of 0', () => {
            const result = Utils.validateRestaurant({ ...validRestaurant, rating: 0 });
            expect(result.valid).toBe(true);
        });

        test('should accept rating of 5', () => {
            const result = Utils.validateRestaurant({ ...validRestaurant, rating: 5 });
            expect(result.valid).toBe(true);
        });
    });

    describe('formatRating', () => {
        test('should format rating with stars', () => {
            const result = Utils.formatRating(4.5);
            expect(result).toContain('4.5');
            expect(result).toContain('\u2605');
        });

        test('should return N/A for invalid rating', () => {
            const result = Utils.formatRating('invalid');
            expect(result).toBe('N/A');
        });

        test('should return N/A for NaN', () => {
            const result = Utils.formatRating(NaN);
            expect(result).toBe('N/A');
        });

        test('should clamp rating below 0', () => {
            const result = Utils.formatRating(-1);
            expect(result).toContain('0.0');
        });

        test('should clamp rating above 5', () => {
            const result = Utils.formatRating(6);
            expect(result).toContain('5.0');
        });

        test('should format whole number rating', () => {
            const result = Utils.formatRating(4);
            expect(result).toContain('4.0');
        });
    });

    describe('debounce', () => {
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        test('should delay function execution', async () => {
            const mockFn = jest.fn();
            const debouncedFn = Utils.debounce(mockFn, 50);

            debouncedFn();
            expect(mockFn).not.toHaveBeenCalled();

            await delay(100);
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        test('should only call once for multiple rapid calls', async () => {
            const mockFn = jest.fn();
            const debouncedFn = Utils.debounce(mockFn, 50);

            debouncedFn();
            debouncedFn();
            debouncedFn();

            await delay(100);
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        test('should return empty function for non-function input', () => {
            const result = Utils.debounce('not a function', 50);
            expect(typeof result).toBe('function');
            result();
        });

        test('should use default wait time for invalid wait', async () => {
            const mockFn = jest.fn();
            const debouncedFn = Utils.debounce(mockFn, -100);

            debouncedFn();
            await delay(350); // Default is 300ms
            expect(mockFn).toHaveBeenCalledTimes(1);
        });
    });
});
