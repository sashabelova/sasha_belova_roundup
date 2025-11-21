import { useEffect, useState } from 'react';
import { getAccountHolderName, type AccountHolderName } from '../api/starling';

export default function AccountHolderHeader() {
  const [accountHolder, setAccountHolder] = useState<AccountHolderName | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccountHolderData = async () => {
      setLoading(true);
      setError(null);
      try {
        const holderName = await getAccountHolderName();
        setAccountHolder(holderName);
      } catch (err) {
        console.error('Failed to fetch account holder name:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load account holder name',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAccountHolderData();
  }, []);

  if (loading) {
    return (
      <header
        style={{ padding: '16px 0' }}
        role="banner"
        aria-label="Account holder information"
      >
        <div
          style={{ fontSize: 18, color: '#999' }}
          aria-live="polite"
          aria-busy="true"
        >
          Loading...
        </div>
      </header>
    );
  }

  const displayName =
    accountHolder?.accountHolderName || (error ? 'there' : 'Account Holder');

  return (
    <header
      style={{
        padding: '16px 0',
        borderBottom: '1px solid #e5e5e5',
        marginBottom: 16,
      }}
      role="banner"
      aria-label="Account holder information"
    >
      <h1
        style={{ fontSize: 20, fontWeight: 600, margin: 0 }}
        aria-label={`Welcome message for ${displayName}`}
      >
        Hi, {displayName}! 👋
      </h1>
      {error && (
        <div
          style={{ fontSize: 12, color: '#c00', marginTop: 4 }}
          role="alert"
          aria-live="assertive"
        >
          We couldn't fetch your name from Starling right now.
        </div>
      )}
    </header>
  );
}
