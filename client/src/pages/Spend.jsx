import { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

const inputCls = 'w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

export default function Spend() {
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({ amount: '', category: '', date: today, note: '' });
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [filters, setFilters] = useState({ start: '', end: '', category: '' });

  async function loadData() {
    try {
      const [cats, spend] = await Promise.all([
        apiRequest('/api/categories'),
        apiRequest('/api/spend'),
      ]);
      setCategories(cats);
      setEntries(spend);
      setForm(f => ({ ...f, category: f.category || cats[0]?.name || '' }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest('/api/spend', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Spend entry added!');
      setForm(f => ({ ...f, amount: '', note: '' }));
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await apiRequest(`/api/spend/${id}`, { method: 'DELETE' });
      toast.success('Entry deleted');
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  }

  const filtered = entries.filter(e => {
    if (filters.start && e.date < filters.start) return false;
    if (filters.end && e.date > filters.end) return false;
    if (filters.category && e.category !== filters.category) return false;
    return true;
  });

  const hasFilters = filters.start || filters.end || filters.category;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-700 mb-5">Spending Entry</h1>

      {/* Entry form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
              <input
                type="number" step="0.01" min="0" required placeholder="0.00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date" required
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              required value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className={inputCls}
            >
              {categories.length === 0 && <option value="">Loading...</option>}
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Note <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text" placeholder="What was this for?"
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className={inputCls}
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Spinner /> : 'Add Entry'}
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <input
          type="date" value={filters.start}
          onChange={e => setFilters(f => ({ ...f, start: e.target.value }))}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
        />
        <input
          type="date" value={filters.end}
          onChange={e => setFilters(f => ({ ...f, end: e.target.value }))}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
        />
        <select
          value={filters.category}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={() => setFilters({ start: '', end: '', category: '' })}
            className="text-sm text-indigo-600 hover:text-indigo-800 underline text-left sm:col-span-3"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
          <h2 className="text-sm sm:text-base font-semibold text-slate-700">
            My Entries{' '}
            {filtered.length !== entries.length && (
              <span className="text-slate-400 font-normal text-sm">({filtered.length} of {entries.length})</span>
            )}
          </h2>
        </div>
        {fetching ? (
          <div className="flex items-center justify-center p-12"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Note</th>
                  <th className="px-4 sm:px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3.5 text-slate-700 whitespace-nowrap">{e.date}</td>
                    <td className="px-4 sm:px-6 py-3.5">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium whitespace-nowrap">{e.category}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-right font-semibold text-red-500 whitespace-nowrap">{formatCurrency(e.amount_cents)}</td>
                    <td className="px-4 sm:px-6 py-3.5 text-slate-500 max-w-[160px] truncate hidden sm:table-cell">{e.note || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 sm:px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
                      >
                        Delete
                      </button>
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
