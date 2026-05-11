import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { apiRequest } from '../api/client';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

const PIE_COLORS = [
  '#4f46e5', '#7c3aed', '#2563eb', '#0891b2',
  '#059669', '#d97706', '#dc2626', '#db2777', '#9333ea',
];

function toMonthParam(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function monthEndDate(monthParam) {
  const [y, m] = monthParam.split('-').map(Number);
  return new Date(y, m, 0).toISOString().slice(0, 10);
}

function MonthSelector({ value, onChange }) {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      value: toMonthParam(d),
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    });
  }
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function StatCard({ label, value, color, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold mt-1 ${color}`}>{formatCurrency(value)}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-slate-700">{payload[0].name}</p>
      <p className="text-indigo-600 font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-slate-700">{payload[0].payload.category}</p>
      <p className="text-indigo-600 font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

const inputCls = 'border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';

export default function Dashboard() {
  const defaultMonth = toMonthParam(new Date());
  const [month, setMonth] = useState(defaultMonth);
  const [incomeSummary, setIncomeSummary] = useState(null);
  const [spendEntries, setSpendEntries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ start: '', end: '', userId: '' });

  useEffect(() => {
    setLoading(true);
    setFilters({ start: '', end: '', userId: '' });
    const end = monthEndDate(month);
    Promise.all([
      apiRequest(`/api/dashboard/summary?month=${month}`),
      apiRequest(`/api/spend?start=${month}&end=${end}`),
      apiRequest('/api/admin/users').catch(() => []),
    ])
      .then(([summary, spend, adminUsers]) => {
        setIncomeSummary(summary);
        setSpendEntries(spend);
        setUsers(adminUsers);
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [month]);

  const filteredSpend = useMemo(() => spendEntries.filter(e => {
    if (filters.start && e.date < filters.start) return false;
    if (filters.end && e.date > filters.end) return false;
    if (filters.userId && String(e.user_id) !== String(filters.userId)) return false;
    return true;
  }), [spendEntries, filters]);

  const totalSpent = useMemo(() => filteredSpend.reduce((s, e) => s + e.amount_cents, 0), [filteredSpend]);

  const spentByCategory = useMemo(() => {
    const map = {};
    filteredSpend.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount_cents; });
    return Object.entries(map).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  }, [filteredSpend]);

  const spentByUser = useMemo(() => {
    const map = {};
    filteredSpend.forEach(e => { map[e.user_name] = (map[e.user_name] || 0) + e.amount_cents; });
    return Object.entries(map).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  }, [filteredSpend]);

  const totalIncome = incomeSummary?.totalIncome ?? 0;
  const incomeByUser = incomeSummary?.incomeByUser ?? [];
  const net = totalIncome - totalSpent;
  const isFiltered = filters.start || filters.end || filters.userId;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-700 flex-1">Dashboard</h1>
        <MonthSelector value={month} onChange={setMonth} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-4 sm:space-y-5">

          {/* Filter bar */}
          <div className="bg-white rounded-2xl border border-slate-200 px-4 py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Filter spending</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-7 shrink-0">From</span>
                <input
                  type="date" value={filters.start}
                  min={month} max={filters.end || monthEndDate(month)}
                  onChange={e => setFilters(f => ({ ...f, start: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-7 shrink-0">To</span>
                <input
                  type="date" value={filters.end}
                  min={filters.start || month} max={monthEndDate(month)}
                  onChange={e => setFilters(f => ({ ...f, end: e.target.value }))}
                  className={inputCls}
                />
              </div>
              {users.length > 0 && (
                <select
                  value={filters.userId}
                  onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">All People</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              )}
              {isFiltered && (
                <button
                  onClick={() => setFilters({ start: '', end: '', userId: '' })}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline text-left"
                >
                  Clear filters
                </button>
              )}
            </div>
            {isFiltered && (
              <p className="text-xs text-slate-400 mt-2">
                Showing {filteredSpend.length} of {spendEntries.length} transactions
              </p>
            )}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard label="Total Income" value={totalIncome} color="text-green-600" sub="Full month" />
            <StatCard
              label={isFiltered ? 'Filtered Spending' : 'Total Spending'}
              value={totalSpent} color="text-red-500"
              sub={isFiltered ? 'Filtered view' : 'Full month'}
            />
            <StatCard
              label="Net Balance" value={net}
              color={net >= 0 ? 'text-indigo-600' : 'text-red-500'}
              sub={net >= 0 ? 'Surplus' : 'Deficit'}
            />
          </div>

          {/* Income by person */}
          {incomeByUser.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm sm:text-base font-semibold text-slate-700 mb-4">Income by Person</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={incomeByUser} margin={{ top: 4, right: 0, bottom: 0, left: 8 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `$${(v / 100).toLocaleString()}`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={80} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Spending charts */}
          {spentByCategory.length > 0 || spentByUser.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Pie */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="text-sm sm:text-base font-semibold text-slate-700 mb-1">Spending by Category</h2>
                {isFiltered && <p className="text-xs text-slate-400 mb-2">Filtered view</p>}
                {spentByCategory.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-300 text-sm">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={spentByCategory}
                        dataKey="amount" nameKey="category"
                        cx="50%" cy="42%"
                        innerRadius={50} outerRadius={90}
                        paddingAngle={2}
                      >
                        {spentByCategory.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend
                        iconType="circle" iconSize={8}
                        formatter={(v, entry) => (
                          <span style={{ color: '#475569', fontSize: 12 }}>{entry.payload.category}</span>
                        )}
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Bar by person */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="text-sm sm:text-base font-semibold text-slate-700 mb-1">Spending by Person</h2>
                {isFiltered && <p className="text-xs text-slate-400 mb-2">Filtered view</p>}
                {spentByUser.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-300 text-sm">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={spentByUser} margin={{ top: 4, right: 0, bottom: 0, left: 8 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => `$${(v / 100).toLocaleString()}`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" fill="#7c3aed" radius={[6, 6, 0, 0]} maxBarSize={80} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          ) : (
            !isFiltered && totalIncome === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <p className="text-slate-400 text-sm">No data yet for this month.</p>
                <p className="text-slate-300 text-xs mt-1">Add income or spending entries to see charts here.</p>
              </div>
            )
          )}

          {/* Filtered transactions table */}
          {isFiltered && filteredSpend.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                <h2 className="text-sm sm:text-base font-semibold text-slate-700 flex-1">Filtered Transactions</h2>
                <span className="text-xs sm:text-sm text-slate-400">{filteredSpend.length} entries · {formatCurrency(totalSpent)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Person</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSpend.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 sm:px-6 py-3 text-slate-700">{e.date}</td>
                        <td className="px-4 sm:px-6 py-3 text-slate-700">{e.user_name}</td>
                        <td className="px-4 sm:px-6 py-3">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium whitespace-nowrap">{e.category}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-right font-semibold text-red-500 whitespace-nowrap">{formatCurrency(e.amount_cents)}</td>
                        <td className="px-4 sm:px-6 py-3 text-slate-400 max-w-[160px] truncate hidden sm:table-cell">{e.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
