import { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

const inputCls = 'w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

function UserModal({ user, onClose, onSave }) {
  const isEdit = !!user;
  const [form, setForm] = useState(
    user
      ? { name: user.name, email: user.email || '', has_income: user.has_income, can_spend: user.can_spend, role: user.role }
      : { name: '', username: '', email: '', password: '', role: 'member', has_income: false, can_spend: false }
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await apiRequest(`/api/admin/users/${user.id}`, { method: 'PUT', body: JSON.stringify(form) });
        toast.success('User updated!');
      } else {
        await apiRequest('/api/admin/users', { method: 'POST', body: JSON.stringify(form) });
        toast.success('User created!');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-slate-700 mb-5">{isEdit ? 'Edit User' : 'Add New User'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input required type="text" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={inputCls} />
          </div>
          {!isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input required type="text" value={form.username} autoComplete="off"
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input required type="password" value={form.password} autoComplete="new-password"
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className={inputCls} />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input required type="email" value={form.email} autoComplete="email"
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={inputCls}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-6 pt-1">
            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none">
              <input type="checkbox" checked={form.has_income}
                onChange={e => setForm(f => ({ ...f, has_income: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
              Has Income
            </label>
            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none">
              <input type="checkbox" checked={form.can_spend}
                onChange={e => setForm(f => ({ ...f, can_spend: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
              Can Spend
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Spinner /> : (isEdit ? 'Save Changes' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null);
  const [newCat, setNewCat] = useState('');
  const [catLoading, setCatLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [reminderLoading, setReminderLoading] = useState(false);

  async function loadData() {
    try {
      const [u, c] = await Promise.all([
        apiRequest('/api/admin/users'),
        apiRequest('/api/categories'),
      ]);
      setUsers(u);
      setCategories(c);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleDeleteUser(id) {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await apiRequest(`/api/admin/users/${id}`, { method: 'DELETE' });
      toast.success('User deleted');
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleTriggerReminders() {
    setReminderLoading(true);
    try {
      const data = await apiRequest('/api/admin/reminders/trigger', { method: 'POST' });
      toast.success(`Reminders sent to ${data.sent} user${data.sent !== 1 ? 's' : ''}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReminderLoading(false);
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCat.trim()) return;
    setCatLoading(true);
    try {
      await apiRequest('/api/categories', { method: 'POST', body: JSON.stringify({ name: newCat.trim() }) });
      toast.success('Category added!');
      setNewCat('');
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCatLoading(false);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-700">Admin Panel</h1>

      {/* User management */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <h2 className="text-sm sm:text-base font-semibold text-slate-700">User Management</h2>
          <button
            onClick={() => setModal('create')}
            className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            Add User
          </button>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center p-12"><Spinner size="lg" /></div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No users found.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Income</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Spend</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-slate-700">{u.name}</td>
                      <td className="px-6 py-3.5 text-slate-500">@{u.username}</td>
                      <td className="px-6 py-3.5 text-slate-500">{u.email || <span className="text-slate-300">—</span>}</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {u.has_income ? <span className="text-green-500 font-bold">✓</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {u.can_spend ? <span className="text-green-500 font-bold">✓</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-4">
                        <button onClick={() => setModal(u)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Edit</button>
                        <button onClick={() => handleDeleteUser(u.id)} className="text-xs font-medium text-red-400 hover:text-red-600">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-slate-100">
              {users.map(u => (
                <div key={u.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-700 truncate">{u.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">@{u.username}</p>
                      {u.email && <p className="text-xs text-slate-400 mt-0.5 truncate">{u.email}</p>}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                      {u.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2.5">
                    <span className="text-xs text-slate-500">
                      Income: {u.has_income ? <span className="text-green-500 font-bold">✓</span> : <span className="text-slate-300">—</span>}
                    </span>
                    <span className="text-xs text-slate-500">
                      Spend: {u.can_spend ? <span className="text-green-500 font-bold">✓</span> : <span className="text-slate-300">—</span>}
                    </span>
                    <div className="ml-auto flex gap-3">
                      <button onClick={() => setModal(u)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Edit</button>
                      <button onClick={() => handleDeleteUser(u.id)} className="text-xs font-medium text-red-400 hover:text-red-600">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Category management */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <h2 className="text-sm sm:text-base font-semibold text-slate-700 mb-4">Category Management</h2>
        <form onSubmit={handleAddCategory} className="flex gap-3 mb-5">
          <input
            type="text" placeholder="New category name" value={newCat}
            onChange={e => setNewCat(e.target.value)}
            className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-0"
          />
          <button
            type="submit" disabled={catLoading}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            {catLoading ? <Spinner /> : 'Add'}
          </button>
        </form>
        {categories.length === 0 ? (
          <p className="text-sm text-slate-400">No categories yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <span key={c.id} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                {c.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <h2 className="text-sm sm:text-base font-semibold text-slate-700 mb-1">Notifications</h2>
        <p className="text-sm text-slate-500 mb-4">
          Spending reminders are sent automatically at 9 PM Beirut time to users who haven't logged anything today.
        </p>
        <button
          onClick={handleTriggerReminders}
          disabled={reminderLoading}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {reminderLoading ? <Spinner /> : 'Send Spending Reminder Now'}
        </button>
      </div>

      {modal && (
        <UserModal
          user={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={loadData}
        />
      )}
    </div>
  );
}
