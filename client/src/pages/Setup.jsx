import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

function Field({ label, type = 'text', placeholder, value, onChange, autoComplete }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type} required placeholder={placeholder} value={value}
        onChange={onChange} autoComplete={autoComplete}
        className="w-full border border-slate-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  );
}

export default function Setup() {
  const [form, setForm] = useState({ householdName: '', adminName: '', username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    apiRequest('/api/auth/setup-status')
      .then(data => { if (data.exists) navigate('/login'); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiRequest('/api/auth/register-household', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      login(data.token, data.user);
      toast.success('Household created! Welcome.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function set(key) {
    return e => setForm(f => ({ ...f, [key]: e.target.value }));
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full max-w-md p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-700">Set Up Your Household</h1>
          <p className="text-sm text-slate-500 mt-1">Create your household and admin account to get started.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Household Name" placeholder="The Hammoud Family" value={form.householdName} onChange={set('householdName')} />
          <Field label="Your Full Name" placeholder="Ahmad Hammoud" value={form.adminName} onChange={set('adminName')} />
          <Field label="Username" placeholder="ahmad" value={form.username} onChange={set('username')} autoComplete="username" />
          <Field label="Password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} autoComplete="new-password" />
          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Spinner /> : 'Create Household'}
          </button>
        </form>
      </div>
    </div>
  );
}
