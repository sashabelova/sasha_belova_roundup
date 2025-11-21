import { useEffect, useState } from 'react';
import {
  type Account,
  type FeedItem,
  type SavingsGoal,
  getAccounts,
  getFeedBetween,
  listSavingsGoals,
  createSavingsGoal,
  addMoneyToSavingsGoal,
} from '../api/starling';
import { calculateRoundUpMinorUnits, formatMinorUnits } from '../utils/roundup';
import { startOfWeek, endOfWeek, addDays } from 'date-fns';
import TransactionsTable from './TransactionsTable';
import AccountHolderHeader from './AccountHolderHeader';

export default function BaseComponent() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountUid, setSelectedAccountUid] = useState<string>('');
  const [selectedCategoryUid, setSelectedCategoryUid] = useState<string>('');
  const [weekStartIso, setWeekStartIso] = useState<string>(
    startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
  );
  const [weekEndIso, setWeekEndIso] = useState<string>(
    endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
  );
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [rawRoundupMinorUnits, setRawRoundupMinorUnits] = useState<number>(0);
  const [processedRoundups, setProcessedRoundups] = useState<
    Map<string, number>
  >(new Map());
  const [savingsGoal, setSavingsGoal] = useState<SavingsGoal | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();
  const [lastTransferMinorUnits, setLastTransferMinorUnits] =
    useState<number>(0);
  const [transferError, setTransferError] = useState<string | undefined>();

  // Helper to get storage key for account + week
  const getStorageKey = (accountUid: string, weekStartIso: string): string => {
    const weekDate = new Date(weekStartIso).toISOString().slice(0, 10);
    return `${accountUid}:${weekDate}`;
  };

  // Get processed roundup amount for current account + week
  const getProcessedRoundupMinorUnits = (
    accountUid: string,
    weekStartIso: string,
  ): number => {
    const key = getStorageKey(accountUid, weekStartIso);
    return processedRoundups.get(key) || 0;
  };

  // Set processed roundup amount for current account + week
  const setProcessedRoundupMinorUnits = (
    accountUid: string,
    weekStartIso: string,
    amount: number,
  ): void => {
    const key = getStorageKey(accountUid, weekStartIso);
    setProcessedRoundups((prev) => {
      const next = new Map(prev);
      next.set(key, Math.max(0, Math.floor(amount)));
      return next;
    });
  };

  // Fetch accounts
  useEffect(() => {
    const fetchAccountsData = async () => {
      setLoading(true);
      setError(undefined);
      try {
        const accountsData = await getAccounts();
        setAccounts(accountsData);
        if (accountsData.length > 0) {
          const firstAccount = accountsData[0];
          setSelectedAccountUid(firstAccount.accountUid);
          setSelectedCategoryUid(firstAccount.defaultCategory);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch accounts',
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAccountsData();
  }, []);

  // Fetch savings goal when account is selected
  useEffect(() => {
    if (!selectedAccountUid) return;

    const fetchSavingsGoal = async () => {
      try {
        const goals = await listSavingsGoals(selectedAccountUid);
        const roundUpGoal = goals.find((g) => g.name === 'Round Up');
        if (roundUpGoal) {
          setSavingsGoal(roundUpGoal);
        }
      } catch (err) {
        console.error('Failed to fetch savings goal:', err);
      }
    };
    fetchSavingsGoal();
  }, [selectedAccountUid]);

  // Fetch feed when account or week changes
  useEffect(() => {
    if (!selectedAccountUid || !selectedCategoryUid) return;

    const fetchFeedData = async () => {
      setLoading(true);
      setError(undefined);
      try {
        const items = await getFeedBetween({
          accountUid: selectedAccountUid,
          categoryUid: selectedCategoryUid,
          minTimestampIso: weekStartIso,
          maxTimestampIso: weekEndIso,
        });
        setFeedItems(items);
        const roundup = calculateRoundUpMinorUnits(items);
        setRawRoundupMinorUnits(roundup);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch transactions',
        );
      } finally {
        setLoading(false);
      }
    };
    fetchFeedData();
  }, [selectedAccountUid, selectedCategoryUid, weekStartIso, weekEndIso]);

  const handleAccountChange = (uid: string) => {
    const account = accounts.find((a) => a.accountUid === uid);
    if (account) {
      setSelectedAccountUid(account.accountUid);
      setSelectedCategoryUid(account.defaultCategory);
    }
  };

  const handleWeekStartChange = (dateString: string) => {
    const start = new Date(`${dateString}T00:00:00`);
    const startIso = start.toISOString();
    const end = addDays(start, 6);
    setWeekStartIso(startIso);
    setWeekEndIso(end.toISOString());
  };

  const handleRefresh = async () => {
    if (!selectedAccountUid || !selectedCategoryUid) return;

    setLoading(true);
    setError(undefined);
    try {
      const items = await getFeedBetween({
        accountUid: selectedAccountUid,
        categoryUid: selectedCategoryUid,
        minTimestampIso: weekStartIso,
        maxTimestampIso: weekEndIso,
      });
      setFeedItems(items);
      const roundup = calculateRoundUpMinorUnits(items);
      setRawRoundupMinorUnits(roundup);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to refresh transactions',
      );
    } finally {
      setLoading(false);
    }
  };

  const processedRoundupMinorUnits = selectedAccountUid
    ? getProcessedRoundupMinorUnits(selectedAccountUid, weekStartIso)
    : 0;

  const pendingRoundupMinorUnits = Math.max(
    rawRoundupMinorUnits - processedRoundupMinorUnits,
    0,
  );

  useEffect(() => {
    if (!lastTransferMinorUnits) return;
    const timeoutId = window.setTimeout(() => {
      setLastTransferMinorUnits(0);
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [lastTransferMinorUnits]);

  const handleTransfer = async () => {
    if (!selectedAccountUid) {
      setTransferError('No account selected');
      return;
    }
    if (!pendingRoundupMinorUnits || pendingRoundupMinorUnits <= 0) {
      setTransferError('Round-up amount must be greater than zero');
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);
    setError(undefined);
    setTransferError(undefined);
    try {
      // Find or create the savings goal
      let goal = savingsGoal;
      if (!goal) {
        const existing = await listSavingsGoals(selectedAccountUid);
        goal = existing.find((g) => g.name === 'Round Up');

        if (!goal) {
          goal = await createSavingsGoal({
            accountUid: selectedAccountUid,
            name: 'Round Up',
            currency: 'GBP',
          });
        }
        setSavingsGoal(goal);
      }

      // Transfer the round-up amount
      await addMoneyToSavingsGoal({
        accountUid: selectedAccountUid,
        savingsGoalUid: goal.savingsGoalUid,
        amountMinorUnits: pendingRoundupMinorUnits,
        currency: 'GBP',
      });

      setLastTransferMinorUnits(pendingRoundupMinorUnits);
      const updatedProcessed =
        processedRoundupMinorUnits + pendingRoundupMinorUnits;
      setProcessedRoundupMinorUnits(
        selectedAccountUid,
        weekStartIso,
        updatedProcessed,
      );

      // Refresh the savings goal to show updated total
      const updatedGoals = await listSavingsGoals(selectedAccountUid);
      const updatedGoal = updatedGoals.find((g) => g.name === 'Round Up');
      if (updatedGoal) {
        setSavingsGoal(updatedGoal);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to transfer to savings goal';
      setTransferError(message || 'Transfer failed');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main role="main" aria-label="Starling Round-Up Application">
      <AccountHolderHeader />

      <h2 style={{ fontSize: 26, fontWeight: 600 }}>
        Welcome to Starling Round‑Up
      </h2>
      <p style={{ opacity: 0.8, marginTop: -8 }}>
        Find your weekly round‑ups and transfer them into a savings goal.
      </p>

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: '#fee',
            color: '#c00',
            borderRadius: 6,
            border: '1px solid #fcc',
          }}
          role="alert"
          aria-live="assertive"
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          marginTop: 16,
          flexWrap: 'wrap',
        }}
        role="form"
        aria-label="Account and week selection"
      >
        <label
          htmlFor="account-select"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            flex: '1 1 200px',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500 }}>Account:</span>
          <select
            id="account-select"
            value={selectedAccountUid || ''}
            onChange={(e) => handleAccountChange(e.target.value)}
            disabled={loading || accounts.length === 0}
            aria-label="Select account"
            aria-required="true"
            style={{ width: '100%' }}
          >
            {accounts.length === 0 && (
              <option value="">Loading accounts...</option>
            )}
            {accounts.map((a) => (
              <option key={a.accountUid} value={a.accountUid}>
                {a.name || 'Account'} ({a.currency})
              </option>
            ))}
          </select>
        </label>

        <label
          htmlFor="week-start-date"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            flex: '1 1 200px',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            Week start (Monday):
          </span>
          <input
            id="week-start-date"
            type="date"
            value={new Date(weekStartIso).toISOString().slice(0, 10)}
            onChange={(e) => handleWeekStartChange(e.target.value)}
            disabled={loading}
            aria-label="Select week start date (Monday)"
            aria-required="true"
            style={{ width: '100%' }}
          />
        </label>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 16,
          marginTop: 24,
        }}
        role="region"
        aria-label="Round-up and savings goal summary"
      >
        {/* Round-up Card */}
        <section
          style={{
            padding: 16,
            border: '1px solid #e5e5e5',
            borderRadius: 8,
            backgroundColor: '#fafafa',
          }}
          aria-labelledby="roundup-heading"
        >
          <h3
            id="roundup-heading"
            style={{ fontSize: 18, fontWeight: 600, margin: 0 }}
          >
            This week's round‑up
          </h3>
          <div
            style={{
              fontSize: 36,
              marginTop: 8,
              fontWeight: 700,
              color: '#333',
            }}
            aria-label={`Round-up amount: ${formatMinorUnits(
              pendingRoundupMinorUnits,
            )}`}
            role="status"
          >
            {formatMinorUnits(pendingRoundupMinorUnits)}
          </div>
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={handleRefresh}
              disabled={loading || !selectedAccountUid}
              style={{
                padding: '8px 16px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              aria-label="Refresh transactions and recalculate round-up"
              aria-busy={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={handleTransfer}
              disabled={loading || pendingRoundupMinorUnits <= 0}
              style={{
                padding: '8px 16px',
                cursor:
                  loading || pendingRoundupMinorUnits <= 0
                    ? 'not-allowed'
                    : 'pointer',
                backgroundColor:
                  pendingRoundupMinorUnits > 0 ? '#28a745' : undefined,
                color: pendingRoundupMinorUnits > 0 ? '#fff' : undefined,
                border: pendingRoundupMinorUnits > 0 ? 'none' : undefined,
              }}
              aria-label={`Transfer ${formatMinorUnits(
                pendingRoundupMinorUnits,
              )} to Round Up savings goal`}
              aria-disabled={loading || pendingRoundupMinorUnits <= 0}
            >
              Transfer to Savings Goal
            </button>
          </div>
          {lastTransferMinorUnits && lastTransferMinorUnits > 0 ? (
            <div
              style={{
                color: '#28a745',
                marginTop: 12,
                padding: 8,
                backgroundColor: '#d4edda',
                borderRadius: 4,
                border: '1px solid #c3e6cb',
              }}
              role="status"
              aria-live="polite"
            >
              ✓ Successfully transferred{' '}
              {formatMinorUnits(lastTransferMinorUnits)} to "Round Up" savings
              goal!
            </div>
          ) : null}
          {transferError ? (
            <div
              style={{
                color: '#c00',
                marginTop: 12,
                padding: 8,
                backgroundColor: '#fdecea',
                borderRadius: 4,
                border: '1px solid #f5c2c7',
              }}
              role="alert"
              aria-live="assertive"
            >
              ⚠️ Transfer failed: {transferError}. Money was not moved to the
              savings goal.
            </div>
          ) : null}
        </section>

        {/* Savings Goal Card */}
        <section
          style={{
            padding: 16,
            border: '1px solid #e5e5e5',
            borderRadius: 8,
            backgroundColor: '#f0f8ff',
          }}
          aria-labelledby="savings-goal-heading"
        >
          <h3
            id="savings-goal-heading"
            style={{ fontSize: 18, fontWeight: 600, margin: 0 }}
          >
            Savings Goal
          </h3>
          {savingsGoal ? (
            <>
              <div style={{ marginTop: 8 }}>
                <div
                  style={{ fontSize: 14, color: '#666' }}
                  id="goal-name-label"
                >
                  Goal Name
                </div>
                <div
                  style={{ fontSize: 16, fontWeight: 500 }}
                  aria-labelledby="goal-name-label"
                >
                  {savingsGoal.name}
                </div>
              </div>
              {savingsGoal.totalSaved && (
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{ fontSize: 14, color: '#666' }}
                    id="total-saved-label"
                  >
                    Total Saved
                  </div>
                  <div
                    style={{ fontSize: 28, fontWeight: 700, color: '#28a745' }}
                    aria-labelledby="total-saved-label"
                    role="status"
                  >
                    {formatMinorUnits(
                      savingsGoal.totalSaved.minorUnits,
                      savingsGoal.totalSaved.currency,
                    )}
                  </div>
                </div>
              )}
              {savingsGoal.target && (
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{ fontSize: 14, color: '#666' }}
                    id="target-label"
                  >
                    Target
                  </div>
                  <div
                    style={{ fontSize: 16, fontWeight: 500 }}
                    aria-labelledby="target-label"
                  >
                    {formatMinorUnits(
                      savingsGoal.target.minorUnits,
                      savingsGoal.target.currency,
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p
              style={{
                marginTop: 8,
                color: '#666',
                fontSize: 14,
                margin: '8px 0 0 0',
              }}
            >
              No savings goal yet. Transfer your first round-up to create one!
            </p>
          )}
        </section>
      </div>

      <TransactionsTable feedItems={feedItems} />
    </main>
  );
}
