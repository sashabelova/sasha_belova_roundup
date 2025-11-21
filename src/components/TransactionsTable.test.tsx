import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionsTable from './TransactionsTable';
import type { FeedItem } from '../api/starling';

describe('TransactionsTable', () => {
  const mockFeedItems: FeedItem[] = [
    {
      feedItemUid: '1',
      direction: 'OUT',
      amount: { minorUnits: 435, currency: 'GBP' },
      timestamp: '2024-01-01T10:30:00Z',
      transactionTime: '2024-01-01T10:30:00Z',
      status: 'SETTLED',
      spendingCategory: 'PAYMENTS',
    },
    {
      feedItemUid: '2',
      direction: 'IN',
      amount: { minorUnits: 5000, currency: 'GBP' },
      timestamp: '2024-01-02T14:00:00Z',
      transactionTime: '2024-01-02T14:00:00Z',
      status: 'SETTLED',
      spendingCategory: 'INCOME',
    },
    {
      feedItemUid: '3',
      direction: 'OUT',
      amount: { minorUnits: 1250, currency: 'GBP' },
      timestamp: '2024-01-03T09:15:00Z',
      transactionTime: '2024-01-03T09:15:00Z',
      status: 'SETTLED',
      spendingCategory: 'SAVING',
    },
  ];

  it('should render all transactions by default', () => {
    render(<TransactionsTable feedItems={mockFeedItems} />);

    expect(screen.getByText(/Transactions \(3 of 3\)/)).toBeInTheDocument();
    expect(screen.getByText('GBP 4.35')).toBeInTheDocument();
    expect(screen.getByText('GBP 50.00')).toBeInTheDocument();
    expect(screen.getByText('GBP 12.50')).toBeInTheDocument();
  });

  it('should filter to show only outgoing transactions', async () => {
    const user = userEvent.setup();
    render(<TransactionsTable feedItems={mockFeedItems} />);

    const outButton = screen.getByRole('button', {
      name: /Show 2 outgoing transactions/,
    });
    await user.click(outButton);

    expect(screen.getByText(/Transactions \(2 of 3\)/)).toBeInTheDocument();
    expect(screen.getByText('GBP 4.35')).toBeInTheDocument();
    expect(screen.getByText('GBP 12.50')).toBeInTheDocument();
    expect(screen.queryByText('GBP 50.00')).not.toBeInTheDocument();
  });

  it('should filter to show only incoming transactions', async () => {
    const user = userEvent.setup();
    render(<TransactionsTable feedItems={mockFeedItems} />);

    const inButton = screen.getByRole('button', {
      name: /Show 1 incoming transactions/,
    });
    await user.click(inButton);

    expect(screen.getByText(/Transactions \(1 of 3\)/)).toBeInTheDocument();
    expect(screen.getByText('GBP 50.00')).toBeInTheDocument();
    expect(screen.queryByText('GBP 4.35')).not.toBeInTheDocument();
  });

  it('should display "No transactions" message when feedItems is empty', () => {
    render(<TransactionsTable feedItems={[]} />);

    expect(
      screen.getByText('No transactions found for this week'),
    ).toBeInTheDocument();
  });

  it('should display round-up amounts for outgoing transactions', () => {
    render(<TransactionsTable feedItems={mockFeedItems} />);

    // £4.35 -> round up 65p
    expect(screen.getByText('+GBP 0.65')).toBeInTheDocument();
    // £12.50 -> round up 50p
    expect(screen.getByText('+GBP 0.50')).toBeInTheDocument();
  });
});
