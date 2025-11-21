import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AccountHolderHeader from './AccountHolderHeader';
import * as starlingApi from '../api/starling';

vi.mock('../api/starling', () => ({
  getAccountHolderName: vi.fn(),
}));

describe('AccountHolderHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', () => {
    vi.mocked(starlingApi.getAccountHolderName).mockImplementation(
      () => new Promise(() => {})
    );

    render(<AccountHolderHeader />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display account holder name when loaded successfully', async () => {
    vi.mocked(starlingApi.getAccountHolderName).mockResolvedValue({
      accountHolderName: 'John Smith',
    });

    render(<AccountHolderHeader />);

    await waitFor(() => {
      expect(screen.getByText(/Hi, John Smith! 👋/)).toBeInTheDocument();
    });
  });

  it('should display error message when API call fails', async () => {
    vi.mocked(starlingApi.getAccountHolderName).mockRejectedValue(
      new Error('Network error')
    );

    render(<AccountHolderHeader />);

    await waitFor(() => {
      expect(screen.getByText(/Hi, there! 👋/)).toBeInTheDocument();
    });

    expect(
      screen.getByText("We couldn't fetch your name from Starling right now.")
    ).toBeInTheDocument();
  });
});

