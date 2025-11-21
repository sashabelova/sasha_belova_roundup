import { describe, it, expect } from 'vitest';
import { calculateRoundUpMinorUnits } from './roundup';
import type { FeedItem } from '../api/starling';

describe('roundup utilities', () => {
  describe('calculateRoundUpMinorUnits', () => {
    it('should calculate round-up for outgoing transactions', () => {
      const feedItems: FeedItem[] = [
        {
          feedItemUid: '1',
          direction: 'OUT',
          amount: { minorUnits: 435, currency: 'GBP' }, //expected round up 65p
          timestamp: '2024-01-01T10:00:00Z',
          status: 'SETTLED',
        },
        {
          feedItemUid: '2',
          direction: 'OUT',
          amount: { minorUnits: 520, currency: 'GBP' }, // expected round up 80p
          timestamp: '2024-01-01T11:00:00Z',
          status: 'SETTLED',
        },
        {
          feedItemUid: '3',
          direction: 'OUT',
          amount: { minorUnits: 87, currency: 'GBP' }, //expected round up 13p
          timestamp: '2024-01-01T12:00:00Z',
          status: 'SETTLED',
        },
      ];

      const result = calculateRoundUpMinorUnits(feedItems);
      expect(result).toBe(158); // 65 + 80 + 13 = 158 p = £1.58
    });

    it('should ignore incoming transactions', () => {
      const feedItems: FeedItem[] = [
        {
          feedItemUid: '1',
          direction: 'IN',
          amount: { minorUnits: 435, currency: 'GBP' },
          timestamp: '2024-01-01T10:00:00Z',
          status: 'SETTLED',
        },
        {
          feedItemUid: '2',
          direction: 'OUT',
          amount: { minorUnits: 250, currency: 'GBP' },
          timestamp: '2024-01-01T11:00:00Z',
          status: 'SETTLED',
        },
      ];

      const result = calculateRoundUpMinorUnits(feedItems);
      expect(result).toBe(50); 
    });

    it('should return 0 for transactions already rounded to pounds', () => {
      const feedItems: FeedItem[] = [
        {
          feedItemUid: '1',
          direction: 'OUT',
          amount: { minorUnits: 500, currency: 'GBP' },
          timestamp: '2024-01-01T10:00:00Z',
          status: 'SETTLED',
        },
      ];

      const result = calculateRoundUpMinorUnits(feedItems);
      expect(result).toBe(0);
    });
  });
});

