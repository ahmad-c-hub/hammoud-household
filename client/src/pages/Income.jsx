import { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../api/client';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

const fieldCls = 'border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';

export default function Income() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [historyFilters, setHistoryFilters] = useState({ month: '', person: '' });

  async function loadEntries() {
    try {
      const data = await apiRequest('/api/income');
      setEntries(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => { loadEntries(); }, []);

  const hasCurrentMonth = entries.some(e => e.month?.slice(0, 7) === currentMonth.slice(0, 7));

  const availableMonths = useMemo(() =>
    [...new Set(entries.map(e => e.month?.slice(0, 7)))].filter(Boolean).sort().reverse(),
    [entries]
  );

  const availablePersons = useMemo(() =>
    [...new Set(entries.map(e => e.user_name))].filter(Boolean).sort(),
    [entries]
  );

  const filteredEntries = useMemo(() => entries.filter(e => {
    if (historyFilters.month && e.month?.slice(0, 7) !== historyFilters.month) return false;
    if (historyFilters.person && e.user_name !== historyFilters.person) return false;
    return true;
  }), [entries, historyFilters]);

  const hasFilters = historyFilters.month || historyFilters.person;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest('/api/income', {
        method: 'POST',
        body: JSON.stringify({ amount, month: currentMonth }),
      });
      toast.success('Income recorded!');
      setAmount('');
      loadEntries();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-700 mb-5">Income Entry</h1>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5 max-w-md">
        <h2 className="text-base font-semibold text-slate-700 mb-1">{monthLabel}</h2>
        <p className="text-sm text-slate-500 mb-4">Enter your income for this month.</p>

        {hasCurrentMonth && (
          <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            You already submitted income for this month. Submitting again will fail.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Income Amount ($)</label>
            <input
              type="number" step="0.01" min="0" required placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Spinner /> : 'Submit Income'}
          </button>
        </form>
      </div>

      {/* History filters */}
      <div className="bg-white rounded-2xl border border-slate-200 px-4 py-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Month</label>
            <select value={historyFilters.month}
              onChange={e => setHistoryFilters(f => ({ ...f, month: e.target.value }))}
              className={fieldCls}>
              <option value="">All Months</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {new Date(m + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Person</label>
            <select value={historyFilters.person}
              onChange={e => setHistoryFilters(f => ({ ...f, person: e.target.value }))}
              className={fieldCls}>
              <option value="">All People</option>
              {availablePersons.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        {hasFilters && (
          <div className="mt-2 flex items-center gap-4">
            <button onClick={() => setHistoryFilters({ month: '', person: '' })}
              className="text-xs text-indigo-600 hover:text-indigo-800 underline">
              Clear all filters
            </button>
            <span className="text-xs text-slate-400">
              {filteredEntries.length} of {entries.length} entries
            </span>
          </div>
        )}
      </div>

      {/* History table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
          <h2 className="text-sm sm:text-base font-semibold text-slate-700">Income History</h2>
        </div>
        {fetching ? (
          <div className="flex items-center justify-center p-12"><Spinner size="lg" /></div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No income entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Month</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Person</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3.5 text-slate-700 whitespace-nowrap">
                      {new Date(e.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-slate-700 font-medium whitespace-nowrap">
                      {e.user_name || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-right font-semibold text-green-600 whitespace-nowrap">
                      {formatCurrency(e.amount_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
