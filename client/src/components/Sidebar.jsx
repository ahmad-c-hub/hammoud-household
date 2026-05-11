import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
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

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="fixed inset-y-0 left-0 flex flex-col w-60 bg-white border-r border-slate-200">
      <div className="px-6 py-5 border-b border-slate-200">
        <h1 className="text-base font-bold text-indigo-600 leading-tight">Household Finance</h1>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{user?.name}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <NavItem to="/dashboard">Dashboard</NavItem>
        {user?.has_income && <NavItem to="/income">Income</NavItem>}
        {user?.can_spend && <NavItem to="/spend">Spending</NavItem>}
        <NavItem to="/transactions">Transactions</NavItem>
        {user?.role === 'admin' && <NavItem to="/admin">Admin</NavItem>}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
