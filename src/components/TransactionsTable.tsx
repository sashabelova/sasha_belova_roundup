import { useState } from 'react';
import type { FeedItem } from '../api/starling';
import { formatMinorUnits } from '../utils/roundup';

interface TransactionsTableProps {
  feedItems: FeedItem[];
}

type FilterType = 'ALL' | 'IN' | 'OUT';

export default function TransactionsTable({
  feedItems,
}: TransactionsTableProps) {
  const [filter, setFilter] = useState<FilterType>('ALL');

  if (feedItems.length === 0) {
    return (
      <div
        style={{ padding: 16, textAlign: 'center', opacity: 0.6 }}
        role="status"
        aria-live="polite"
      >
        No transactions found for this week
      </div>
    );
  }

  // Filter transactions based on selected filter
  const filteredTransactions = feedItems.filter((item) => {
    if (filter === 'ALL') return true;
    return item.direction === filter;
  });

  const inCount = feedItems.filter((item) => item.direction === 'IN').length;
  const outCount = feedItems.filter((item) => item.direction === 'OUT').length;

  return (
    <section style={{ marginTop: 24 }} aria-labelledby="transactions-heading">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <h2
          id="transactions-heading"
          style={{ fontSize: 20, fontWeight: 600, margin: 0 }}
        >
          Transactions ({filteredTransactions.length} of {feedItems.length})
        </h2>
        <div
          style={{ display: 'flex', gap: 8 }}
          role="group"
          aria-label="Transaction filter buttons"
        >
          <button
            onClick={() => setFilter('ALL')}
            style={{
              padding: '6px 12px',
              fontSize: 14,
              fontWeight: filter === 'ALL' ? 600 : 400,
              backgroundColor: filter === 'ALL' ? '#333' : '#fff',
              color: filter === 'ALL' ? '#fff' : '#333',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
            }}
            aria-label={`Show all ${feedItems.length} transactions`}
            aria-pressed={filter === 'ALL'}
          >
            All ({feedItems.length})
          </button>
          <button
            onClick={() => setFilter('IN')}
            style={{
              padding: '6px 12px',
              fontSize: 14,
              fontWeight: filter === 'IN' ? 600 : 400,
              backgroundColor: filter === 'IN' ? '#28a745' : '#fff',
              color: filter === 'IN' ? '#fff' : '#333',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
            }}
            aria-label={`Show ${inCount} incoming transactions`}
            aria-pressed={filter === 'IN'}
          >
            In ({inCount})
          </button>
          <button
            onClick={() => setFilter('OUT')}
            style={{
              padding: '6px 12px',
              fontSize: 14,
              fontWeight: filter === 'OUT' ? 600 : 400,
              backgroundColor: filter === 'OUT' ? '#dc3545' : '#fff',
              color: filter === 'OUT' ? '#fff' : '#333',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
            }}
            aria-label={`Show ${outCount} outgoing transactions`}
            aria-pressed={filter === 'OUT'}
          >
            Out ({outCount})
          </button>
        </div>
      </div>
      <div
        style={{ overflowX: 'auto' }}
        role="region"
        aria-label="Scrollable transactions table"
        tabIndex={0}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #e5e5e5',
            backgroundColor: '#fff',
          }}
          role="table"
          aria-label="Transactions list"
          aria-rowcount={filteredTransactions.length + 1}
        >
          <thead>
            <tr
              style={{
                backgroundColor: '#f9f9f9',
                borderBottom: '2px solid #e5e5e5',
              }}
              role="row"
            >
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: 14,
                }}
                scope="col"
                role="columnheader"
              >
                Date / Time
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: 14,
                }}
                scope="col"
                role="columnheader"
              >
                Amount
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: 14,
                }}
                scope="col"
                role="columnheader"
              >
                Round-up
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: 14,
                }}
                scope="col"
                role="columnheader"
              >
                Direction
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: 14,
                }}
                scope="col"
                role="columnheader"
              >
                Category
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: 14,
                }}
                scope="col"
                role="columnheader"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((item, index) => {
              const minorUnits = item.amount?.minorUnits ?? 0;
              const remainder = minorUnits % 100;
              const roundup =
                item.direction === 'OUT' && remainder !== 0
                  ? 100 - remainder
                  : 0;

              // Use transactionTime first, fallback to timestamp
              const dateTime = item.transactionTime || item.timestamp;
              const formattedDate = dateTime
                ? new Date(dateTime).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'N/A';

              return (
                <tr
                  key={item.feedItemUid}
                  style={{
                    borderBottom: '1px solid #e5e5e5',
                  }}
                  role="row"
                  aria-rowindex={index + 2}
                >
                  <td
                    style={{ padding: '12px 16px', fontSize: 14 }}
                    role="cell"
                    aria-label={`Transaction date: ${formattedDate}`}
                  >
                    {formattedDate}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                    role="cell"
                    aria-label={`Amount: ${formatMinorUnits(
                      minorUnits,
                      item.amount?.currency || 'GBP',
                    )}`}
                  >
                    {formatMinorUnits(
                      minorUnits,
                      item.amount?.currency || 'GBP',
                    )}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: 14,
                      color: roundup > 0 ? '#28a745' : '#999',
                    }}
                    role="cell"
                    aria-label={
                      roundup > 0
                        ? `Round-up: ${formatMinorUnits(roundup)}`
                        : 'No round-up'
                    }
                  >
                    {roundup > 0 ? `+${formatMinorUnits(roundup)}` : '—'}
                  </td>
                  <td
                    style={{ padding: '12px 16px', fontSize: 14 }}
                    role="cell"
                  >
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        backgroundColor:
                          item.direction === 'OUT' ? '#fee' : '#efe',
                        color: item.direction === 'OUT' ? '#c00' : '#0a0',
                      }}
                      role="status"
                      aria-label={`Direction: ${
                        item.direction === 'OUT' ? 'Outgoing' : 'Incoming'
                      }`}
                    >
                      {item.direction}
                    </span>
                  </td>
                  <td
                    style={{ padding: '12px 16px', fontSize: 14, opacity: 0.7 }}
                    role="cell"
                    aria-label={`Category: ${
                      item.spendingCategory || 'Not available'
                    }`}
                  >
                    {item.spendingCategory || 'N/A'}
                  </td>
                  <td
                    style={{ padding: '12px 16px', fontSize: 14, opacity: 0.7 }}
                    role="cell"
                    aria-label={`Status: ${item.status || 'Not available'}`}
                  >
                    {item.status || 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
