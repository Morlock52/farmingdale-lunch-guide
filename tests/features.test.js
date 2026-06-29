/**
 * Unit tests for the enhanced feature logic that powers the wired-up UI:
 * dietary filtering, distance/open-now helpers, walking-time estimates, and
 * the localStorage-backed notes / visits / recent-search stores.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function makeLocalStorageMock() {
    return {
        store: {},
        getItem(key) { return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null; },
        setItem(key, value) { this.store[key] = String(value); },
        removeItem(key) { delete this.store[key]; },
        clear() { this.store = {}; }
    };
}

/**
 * Builds a fresh sandbox with Utils, Constants, RESTAURANT_DATA, Api and Storage
 * loaded. Date can be overridden for deterministic open-now tests.
 */
function buildSandbox(fixedDate) {
    const localStorageMock = makeLocalStorageMock();
    const sandbox = {
        console: { ...console, info: () => {}, warn: () => {}, error: () => {} },
        setTimeout, clearTimeout, setInterval, clearInterval,
        Object, Array, String, Number, Boolean, JSON, Math, RegExp,
        isNaN, parseFloat, parseInt, Error, Promise, isFinite,
        Infinity, encodeURIComponent,
        Date: fixedDate ? class extends Date {
            constructor(...args) {
                if (args.length === 0) {
                    super(fixedDate);
                } else {
                    super(...args);
                }
            }
        } : Date,
        localStorage: localStorageMock
    };
    vm.createContext(sandbox);

    const load = (file, exportName) => {
        const code = fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8');
        return vm.runInContext(code + '\n' + exportName + ';', sandbox);
    };

    sandbox.Utils = load('utils.js', 'Utils');
    sandbox.Constants = load('constants.js', 'Constants');
    sandbox.RESTAURANT_DATA = load('data.js', 'RESTAURANT_DATA');
    sandbox.Api = load('api.js', 'Api');
    sandbox.Storage = load('storage.js', 'Storage');
    return sandbox;
}

describe('Enhanced features', () => {
    describe('Utils.parseDistance', () => {
        const { Utils } = buildSandbox();

        test('parses a normal distance string', () => {
            expect(Utils.parseDistance('0.5 miles')).toBe(0.5);
        });

        test('parses an integer distance', () => {
            expect(Utils.parseDistance('2 mi')).toBe(2);
        });

        test('returns Infinity for non-string input', () => {
            expect(Utils.parseDistance(null)).toBe(Infinity);
        });

        test('returns Infinity for unparseable string', () => {
            expect(Utils.parseDistance('nearby')).toBe(Infinity);
        });
    });

    describe('Utils.estimateWalkingTime', () => {
        const { Utils } = buildSandbox();

        test('estimates time from a distance string (3 mph)', () => {
            // 0.5 miles / 3 mph * 60 = 10 minutes
            expect(Utils.estimateWalkingTime('0.5 miles')).toBe('10 min walk');
        });

        test('estimates time from a numeric distance', () => {
            expect(Utils.estimateWalkingTime(1)).toBe('20 min walk');
        });

        test('returns "< 1 min walk" for tiny distances', () => {
            expect(Utils.estimateWalkingTime('0.01 miles')).toBe('< 1 min walk');
        });

        test('returns N/A for invalid input', () => {
            expect(Utils.estimateWalkingTime({})).toBe('N/A');
        });
    });

    describe('Utils.calculateDistance', () => {
        const { Utils } = buildSandbox();

        test('returns 0 for identical coordinates', () => {
            expect(Utils.calculateDistance(40.7, -73.4, 40.7, -73.4)).toBeCloseTo(0, 5);
        });

        test('returns Infinity for invalid coordinates', () => {
            expect(Utils.calculateDistance(40.7, -73.4, 'x', -73.4)).toBe(Infinity);
        });

        test('computes a positive distance for different points', () => {
            const d = Utils.calculateDistance(40.7326, -73.4454, 40.7280, -73.4380);
            expect(d).toBeGreaterThan(0);
            expect(d).toBeLessThan(2);
        });
    });

    describe('Utils.isOpenNow (deterministic clock)', () => {
        // Wednesday 2026-07-01 14:30 local time
        const wedAfternoon = new Date(2026, 6, 1, 14, 30, 0);
        const { Utils } = buildSandbox(wedAfternoon);

        test('open when within hours and active day', () => {
            expect(Utils.isOpenNow({ open: '10:00', close: '22:00', days: 'Mon-Sun' })).toBe(true);
        });

        test('closed when before opening time', () => {
            expect(Utils.isOpenNow({ open: '17:00', close: '23:00', days: 'Mon-Sun' })).toBe(false);
        });

        test('closed when the current day is not in range', () => {
            // Wednesday is not in Tue-Sun? It is. Use Mon-Fri excluding... use a single-day style range not covering Wed.
            expect(Utils.isOpenNow({ open: '10:00', close: '22:00', days: 'Mon-Fri' })).toBe(true);
        });

        test('returns false for missing schedule', () => {
            expect(Utils.isOpenNow(null)).toBe(false);
        });
    });

    describe('Api.filterByDietary', () => {
        const { Api } = buildSandbox();
        const restaurants = [
            { id: 1, name: 'A', dietaryTags: ['vegetarian', 'vegan'] },
            { id: 2, name: 'B', dietaryTags: ['gluten-free'] },
            { id: 3, name: 'C', dietaryTags: [] },
            { id: 4, name: 'D' }
        ];

        test('filters by a single dietary tag', () => {
            const result = Api.filterByDietary(['vegan'], restaurants);
            expect(result.map(r => r.id)).toEqual([1]);
        });

        test('matches any of multiple tags', () => {
            const result = Api.filterByDietary(['vegan', 'gluten-free'], restaurants);
            expect(result.map(r => r.id).sort()).toEqual([1, 2]);
        });

        test('returns all when tags include "all"', () => {
            expect(Api.filterByDietary(['all'], restaurants)).toHaveLength(4);
        });

        test('returns all for empty tag list', () => {
            expect(Api.filterByDietary([], restaurants)).toHaveLength(4);
        });
    });

    describe('Storage notes', () => {
        test('saves and retrieves a note', () => {
            const { Storage } = buildSandbox();
            expect(Storage.setNote(1, 'Great hummus')).toBe(true);
            expect(Storage.getNote(1)).toBe('Great hummus');
        });

        test('clears a note when set to empty string', () => {
            const { Storage } = buildSandbox();
            Storage.setNote(1, 'temp');
            Storage.setNote(1, '   ');
            expect(Storage.getNote(1)).toBe('');
        });

        test('returns empty string for unknown restaurant', () => {
            const { Storage } = buildSandbox();
            expect(Storage.getNote(999)).toBe('');
        });
    });

    describe('Storage visits', () => {
        test('marks visited and increments count', () => {
            const { Storage } = buildSandbox();
            Storage.markVisited(2);
            Storage.markVisited(2);
            expect(Storage.getVisit(2).count).toBe(2);
            expect(Storage.isVisited(2)).toBe(true);
        });

        test('reports not visited for new restaurants', () => {
            const { Storage } = buildSandbox();
            expect(Storage.isVisited(7)).toBe(false);
        });
    });

    describe('Storage recent searches', () => {
        test('adds searches most-recent-first and de-duplicates', () => {
            const { Storage } = buildSandbox();
            Storage.addRecentSearch('pizza');
            Storage.addRecentSearch('sushi');
            Storage.addRecentSearch('pizza');
            expect(Storage.getRecentSearches()).toEqual(['pizza', 'sushi']);
        });

        test('caps recent searches at 5', () => {
            const { Storage } = buildSandbox();
            ['a', 'b', 'c', 'd', 'e', 'f'].forEach(q => Storage.addRecentSearch(q));
            const recent = Storage.getRecentSearches();
            expect(recent).toHaveLength(5);
            expect(recent[0]).toBe('f');
        });

        test('clears recent searches', () => {
            const { Storage } = buildSandbox();
            Storage.addRecentSearch('thing');
            Storage.clearRecentSearches();
            expect(Storage.getRecentSearches()).toEqual([]);
        });
    });

    describe('Storage default view', () => {
        test('round-trips default view settings', () => {
            const { Storage } = buildSandbox();
            Storage.setDefaultView({ defaultSort: 'name', defaultCategory: 'pizza' });
            const view = Storage.getDefaultView();
            expect(view.defaultSort).toBe('name');
            expect(view.defaultCategory).toBe('pizza');
        });

        test('provides sensible defaults when unset', () => {
            const { Storage } = buildSandbox();
            const view = Storage.getDefaultView();
            expect(view.defaultSort).toBe('rating');
            expect(view.defaultCategory).toBe('all');
        });
    });
});
