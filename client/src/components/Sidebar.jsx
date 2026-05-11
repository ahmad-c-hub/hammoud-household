import { useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function NavItem({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-indigo-600 text-white'
            : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close drawer on route change (mobile)
  useEffect(() => { onClose(); }, [location.pathname]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 flex flex-col w-64 bg-white border-r border-slate-200
        transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
        <div className="min-w-0">
          <h1 className="text-base font-bold text-indigo-600 leading-tight">Household Finance</h1>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{user?.name}</p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 -mr-1"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <NavItem to="/dashboard">Dashboard</NavItem>
        {user?.has_income && <NavItem to="/income">Income</NavItem>}
        {user?.can_spend && <NavItem to="/spend">Spending</NavItem>}
        <NavItem to="/transactions">Transactions</NavItem>
        {user?.role === 'admin' && <NavItem to="/admin">Admin</NavItem>}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
