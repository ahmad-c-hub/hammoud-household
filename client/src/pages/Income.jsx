import { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

export default function Income() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [fetching, setFetching] = useState(true);

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

  const hasCurrentMonth = entries.some(
    e => e.month?.slice(0, 7) === currentMonth.slice(0, 7)
  );

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
      <h1 className="text-2xl font-bold text-slate-700 mb-6">Income Entry</h1>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 max-w-md">
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
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Spinner /> : 'Submit Income'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-700">Income History</h2>
        </div>
        {fetching ? (
          <div className="flex items-center justify-center p-12"><Spinner size="lg" /></div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No income entries yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Month</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 text-slate-700">
                    {new Date(e.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                  </td>
                  <td className="px-6 py-3.5 text-right font-semibold text-green-600">
                    {formatCurrency(e.amount_cents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
