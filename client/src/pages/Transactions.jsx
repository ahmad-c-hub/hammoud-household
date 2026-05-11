import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { apiRequest } from '../api/client';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

const COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'user_name', label: 'Person' },
  { key: 'category', label: 'Category' },
  { key: 'amount_cents', label: 'Amount' },
  { key: 'note', label: 'Note' },
];

export default function Transactions() {
  const [entries, setEntries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ start: '', end: '', category: '', user_id: '' });
  const [sort, setSort] = useState({ col: 'date', dir: 'desc' });
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest('/api/spend'),
      apiRequest('/api/categories'),
      apiRequest('/api/admin/users').catch(() => []),
    ])
      .then(([spend, cats, adminUsers]) => {
        setEntries(spend);
        setCategories(cats);
        setUsers(adminUsers);
      })
      .catch(err => toast.error(err.message))
      .finally(() => setFetching(false));
  }, []);

  const filtered = useMemo(() => entries.filter(e => {
    if (filters.start && e.date < filters.start) return false;
    if (filters.end && e.date > filters.end) return false;
    if (filters.category && e.category !== filters.category) return false;
    if (filters.user_id && String(e.user_id) !== String(filters.user_id)) return false;
    return true;
  }), [entries, filters]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let av = a[sort.col] ?? '';
    let bv = b[sort.col] ?? '';
    if (sort.col === 'amount_cents') { av = Number(av); bv = Number(bv); }
    if (av < bv) return sort.dir === 'asc' ? -1 : 1;
    if (av > bv) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  }), [filtered, sort]);

  function toggleSort(col) {
    setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }));
  }

  function exportToExcel() {
    const rows = sorted.map(e => ({
      Date: e.date,
      Person: e.user_name,
      Category: e.category,
      Amount: (e.amount_cents / 100).toFixed(2),
      Note: e.note || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `household-transactions-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Exported to Excel!');
  }

  const selectClass = 'border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-700">Transactions</h1>
        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
        >
          Export to Excel
        </button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input type="date" value={filters.start}
          onChange={e => setFilters(f => ({ ...f, start: e.target.value }))}
          className={selectClass} />
        <input type="date" value={filters.end}
          onChange={e => setFilters(f => ({ ...f, end: e.target.value }))}
          className={selectClass} />
        <select value={filters.category}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
          className={selectClass}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        {users.length > 0 && (
          <select value={filters.user_id}
            onChange={e => setFilters(f => ({ ...f, user_id: e.target.value }))}
            className={selectClass}>
            <option value="">All People</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        {(filters.start || filters.end || filters.category || filters.user_id) && (
          <button onClick={() => setFilters({ start: '', end: '', category: '', user_id: '' })}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 underline">
            Clear
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {fetching ? (
          <div className="flex items-center justify-center p-12"><Spinner size="lg" /></div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No transactions found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {COLUMNS.map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-indigo-600 select-none"
                  >
                    {label}
                    <span className="ml-1 opacity-50">
                      {sort.col === key ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map(e => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 text-slate-700">{e.date}</td>
                  <td className="px-6 py-3.5 text-slate-700 font-medium">{e.user_name}</td>
                  <td className="px-6 py-3.5">
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">{e.category}</span>
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-red-500">{formatCurrency(e.amount_cents)}</td>
                  <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate">{e.note || <span className="text-slate-300">—</span>}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr>
                <td colSpan={3} className="px-6 py-3 text-xs text-slate-500">
                  {sorted.length} transaction{sorted.length !== 1 ? 's' : ''}
                </td>
                <td className="px-6 py-3 font-bold text-red-500 text-sm">
                  {formatCurrency(sorted.reduce((sum, e) => sum + e.amount_cents, 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
