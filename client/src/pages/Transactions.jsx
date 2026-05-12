import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { apiRequest } from '../api/client';
import { formatCurrency } from '../utils/currency';
import { formatDate, toDateStr } from '../utils/date';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

const COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'user_name', label: 'Person' },
  { key: 'category', label: 'Category' },
  { key: 'amount_cents', label: 'Amount' },
  { key: 'note', label: 'Note' },
];

const fieldCls = 'border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';

export default function Transactions() {
  const [entries, setEntries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  // day overrides start/end when set
  const [filters, setFilters] = useState({ day: '', start: '', end: '', category: '', user_id: '' });
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

  // Setting day clears range; setting range clears day
  function setDay(v) {
    setFilters(f => ({ ...f, day: v, start: v ? '' : f.start, end: v ? '' : f.end }));
  }
  function setStart(v) { setFilters(f => ({ ...f, start: v, day: v ? '' : f.day })); }
  function setEnd(v)   { setFilters(f => ({ ...f, end: v,   day: v ? '' : f.day })); }

  const filtered = useMemo(() => entries.filter(e => {
    const d = toDateStr(e.date);
    if (filters.user_id && String(e.user_id) !== String(filters.user_id)) return false;
    if (filters.category && e.category !== filters.category) return false;
    if (filters.day) return d === filters.day;
    if (filters.start && d < filters.start) return false;
    if (filters.end && d > filters.end) return false;
    return true;
  }), [entries, filters]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let av = a[sort.col] ?? '', bv = b[sort.col] ?? '';
    if (sort.col === 'amount_cents') { av = Number(av); bv = Number(bv); }
    if (sort.col === 'date') { av = toDateStr(av); bv = toDateStr(bv); }
    if (av < bv) return sort.dir === 'asc' ? -1 : 1;
    if (av > bv) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  }), [filtered, sort]);

  function toggleSort(col) {
    setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }));
  }

  const grandTotal = sorted.reduce((s, e) => s + e.amount_cents, 0);

  function exportToExcel() {
    const rows = sorted.map(e => ({
      Date: toDateStr(e.date),
      Person: e.user_name,
      Category: e.category,
      Amount: (e.amount_cents / 100).toFixed(2),
      Note: e.note || '',
    }));
    // Total row
    rows.push({
      Date: '',
      Person: '',
      Category: 'TOTAL',
      Amount: (grandTotal / 100).toFixed(2),
      Note: '',
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `household-transactions-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Exported to Excel!');
  }

  const hasFilters = filters.day || filters.start || filters.end || filters.category || filters.user_id;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-700 flex-1">Transactions</h1>
        <button onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors w-full sm:w-auto">
          Export to Excel
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 px-4 py-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Single day</label>
            <input type="date" value={filters.day} onChange={e => setDay(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">From</label>
            <input type="date" value={filters.start} onChange={e => setStart(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">To</label>
            <input type="date" value={filters.end} onChange={e => setEnd(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Category</label>
            <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className={fieldCls}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          {users.length > 0 && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">Person</label>
              <select value={filters.user_id} onChange={e => setFilters(f => ({ ...f, user_id: e.target.value }))} className={fieldCls}>
                <option value="">All People</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}
        </div>
        {hasFilters && (
          <div className="mt-2 flex items-center gap-4">
            <button onClick={() => setFilters({ day: '', start: '', end: '', category: '', user_id: '' })}
              className="text-xs text-indigo-600 hover:text-indigo-800 underline">
              Clear all filters
            </button>
            <span className="text-xs text-slate-400">
              {sorted.length} of {entries.length} transactions
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {fetching ? (
          <div className="flex items-center justify-center p-12"><Spinner size="lg" /></div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-slate-50">
                <tr>
                  {COLUMNS.map(({ key, label }) => (
                    <th key={key} onClick={() => toggleSort(key)}
                      className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-indigo-600 select-none whitespace-nowrap">
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
                    <td className="px-4 sm:px-6 py-3.5 text-slate-700 whitespace-nowrap">{formatDate(e.date)}</td>
                    <td className="px-4 sm:px-6 py-3.5 text-slate-700 font-medium whitespace-nowrap">{e.user_name}</td>
                    <td className="px-4 sm:px-6 py-3.5">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium whitespace-nowrap">{e.category}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 font-semibold text-red-500 whitespace-nowrap">{formatCurrency(e.amount_cents)}</td>
                    <td className="px-4 sm:px-6 py-3.5 text-slate-500 max-w-[200px] truncate">{e.note || <span className="text-slate-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={3} className="px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Total · {sorted.length} transaction{sorted.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 sm:px-6 py-3 font-bold text-red-500 text-sm whitespace-nowrap">
                    {formatCurrency(grandTotal)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
