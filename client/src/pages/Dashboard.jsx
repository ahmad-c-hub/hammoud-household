import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { apiRequest } from '../api/client';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

const COLORS = ['#4f46e5', '#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777', '#6d28d9'];

function toMonthParam(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
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
      className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{formatCurrency(value)}</p>
    </div>
  );
}

export default function Dashboard() {
  const defaultMonth = toMonthParam(new Date());
  const [month, setMonth] = useState(defaultMonth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest(`/api/dashboard/summary?month=${month}`)
      .then(setData)
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [month]);

  const net = data ? data.totalIncome - data.totalSpent : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-700">Dashboard</h1>
        <MonthSelector value={month} onChange={setMonth} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : !data ? null : (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total Income" value={data.totalIncome} color="text-green-600" />
            <StatCard label="Total Spent" value={data.totalSpent} color="text-red-500" />
            <StatCard label="Net Balance" value={net} color={net >= 0 ? 'text-indigo-600' : 'text-red-500'} />
          </div>

          {data.incomeByUser?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-700 mb-4">Income by Person</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.incomeByUser} margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                  <YAxis tickFormatter={v => `$${(v / 100).toFixed(0)}`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={v => formatCurrency(Number(v))} />
                  <Bar dataKey="amount" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {(data.spentByCategory?.length > 0 || data.spentByUser?.length > 0) && (
            <div className="grid grid-cols-2 gap-6">
              {data.spentByCategory?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h2 className="text-base font-semibold text-slate-700 mb-4">Spending by Category</h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={data.spentByCategory}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {data.spentByCategory.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={v => formatCurrency(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {data.spentByUser?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h2 className="text-base font-semibold text-slate-700 mb-4">Spending by Person</h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.spentByUser} margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                      <YAxis tickFormatter={v => `$${(v / 100).toFixed(0)}`} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={v => formatCurrency(Number(v))} />
                      <Bar dataKey="amount" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {data.totalIncome === 0 && data.totalSpent === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
              <p className="text-slate-400 text-sm">No data yet for this month.</p>
              <p className="text-slate-300 text-xs mt-1">Add income or spending entries to see charts here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
