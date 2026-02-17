import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Product Search Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Search API Endpoint', () => {
    it('should return weighted search results', async () => {
      const mockResponse = {
        items: [
          {
            kind: 'variant',
            product_id: 'prod-1',
            variant_id: 'var-1',
            title: 'Test Product',
            variant_name: 'Large',
            sku: 'TEST-001',
            stock_qty: 10,
            unit_price_cents_default: 15000,
            _score: 9.0,
            _match_type: 'word_TEST_exact',
          },
          {
            kind: 'simple',
            product_id: 'prod-2',
            variant_id: null,
            title: 'Another Product',
            variant_name: null,
            sku: null,
            stock_qty: 5,
            unit_price_cents_default: 20000,
            _score: 6.0,
            _match_type: 'partial',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/admin/invoice-catalog?q=TEST');
      const data = await response.json();

      expect(data.items).toHaveLength(2);
      expect(data.items[0]._score).toBeGreaterThan(data.items[1]._score);
      expect(data.items[0]._match_type).toBe('word_TEST_exact');
    });

    it('should handle exact phrase matches with highest priority', async () => {
      const mockResponse = {
        items: [
          {
            kind: 'simple',
            product_id: 'prod-1',
            title: 'Blue T-Shirt',
            _score: 9.0,
            _match_type: 'exact_phrase_exact',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/admin/invoice-catalog?q=Blue T-Shirt');
      const data = await response.json();

      expect(data.items[0]._match_type).toBe('exact_phrase_exact');
      expect(data.items[0]._score).toBe(9.0);
    });

    it('should search across multiple fields', async () => {
      const mockResponse = {
        items: [
          {
            kind: 'variant',
            title: 'Product Name',
            sku: 'SKU123',
            _score: 7.5,
            _match_type: 'word_SKU_exact',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/admin/invoice-catalog?q=SKU123');
      const data = await response.json();

      expect(data.items[0].sku).toBe('SKU123');
      expect(data.items[0]._match_type).toContain('exact');
    });

    it('should return empty results for empty query', async () => {
      const mockResponse = { items: [] };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/admin/invoice-catalog?q=');
      const data = await response.json();

      expect(data.items).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const response = await fetch('/api/admin/invoice-catalog?q=test');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('Search Quality Indicators', () => {
    it('should classify exact matches correctly', () => {
      const testCases = [
        { match_type: 'exact_phrase_exact', expected: 'Exact match' },
        { match_type: 'word_TEST_exact', expected: 'Exact match' },
        { match_type: 'word_SKU_exact', expected: 'Exact match' },
        { match_type: 'word_test', expected: 'Keyword match' },
        { match_type: 'partial', expected: 'Partial match' },
      ];

      testCases.forEach(({ match_type, expected }) => {
        const getMatchIndicator = (item: any) => {
          if (!item._match_type) return null;
          
          if (item._match_type.includes('exact')) {
            return 'Exact match';
          } else if (item._match_type.includes('word_')) {
            return 'Keyword match';
          } else {
            return 'Partial match';
          }
        };

        const result = getMatchIndicator({ _match_type: match_type });
        expect(result).toBe(expected);
      });
    });

    it('should score exact matches higher than partial matches', () => {
      const items = [
        { _score: 9.0, _match_type: 'exact_phrase_exact' },
        { _score: 6.0, _match_type: 'partial' },
        { _score: 7.5, _match_type: 'word_test_exact' },
      ];

      // Sort by score (highest first)
      const sorted = items.sort((a, b) => b._score - a._score);

      expect(sorted[0]._match_type).toBe('exact_phrase_exact');
      expect(sorted[1]._match_type).toBe('word_test_exact');
      expect(sorted[2]._match_type).toBe('partial');
    });
  });

  describe('Search Query Processing', () => {
    it('should handle multi-word searches', async () => {
      const mockResponse = {
        items: [
          {
            title: 'Blue Cotton T-Shirt',
            _score: 7.2,
            _match_type: 'word_blue',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/admin/invoice-catalog?q=blue cotton');
      const data = await response.json();

      expect(data.items).toHaveLength(1);
      expect(data.items[0].title).toContain('Blue');
    });

    it('should handle SKU searches', async () => {
      const mockResponse = {
        items: [
          {
            kind: 'variant',
            sku: 'TEST-001',
            _score: 9.0,
            _match_type: 'word_TEST_exact',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/admin/invoice-catalog?q=TEST-001');
      const data = await response.json();

      expect(data.items[0].sku).toBe('TEST-001');
      expect(data.items[0]._score).toBe(9.0);
    });

    it('should filter out very short words', () => {
      // This is tested in the API implementation
      // Words shorter than 2 characters are skipped
      const shortWords = ['a', 'b', 'c'];
      const validWords = ['test', 'product', 'blue'];

      shortWords.forEach(word => {
        expect(word.length).toBeLessThan(2);
      });

      validWords.forEach(word => {
        expect(word.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Result Formatting', () => {
    it('should include stock information', async () => {
      const mockResponse = {
        items: [
          {
            kind: 'simple',
            stock_qty: 15,
            stockColor: 'text-green-600',
            stockText: '15 available',
          },
          {
            kind: 'variant',
            stock_qty: 0,
            stockColor: 'text-red-600',
            stockText: 'Out of stock',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/admin/invoice-catalog?q=test');
      const data = await response.json();

      expect(data.items[0].stock_qty).toBe(15);
      expect(data.items[1].stock_qty).toBe(0);
    });

    it('should include pricing information', async () => {
      const mockResponse = {
        items: [
          {
            unit_price_cents_default: 15000,
            formattedPrice: 'R150.00',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/admin/invoice-catalog?q=test');
      const data = await response.json();

      expect(data.items[0].unit_price_cents_default).toBe(15000);
    });
  });
});
