import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, PieChart, User, LogOut, Shield } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-zinc-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-emerald-600 p-1.5 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-zinc-900 tracking-tight">ShopEZ <span className="text-emerald-600">Trader</span></span>
            </Link>
            
            {user && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Link to="/" className="text-zinc-600 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors">Market</Link>
                <Link to="/portfolio" className="text-zinc-600 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors">Portfolio</Link>
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className="text-zinc-600 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1">
                    <Shield className="w-4 h-4" /> Admin
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Balance</span>
                  <span className="text-sm font-bold text-zinc-900">${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-100 p-2 rounded-full">
                    <User className="w-5 h-5 text-zinc-600" />
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-zinc-600 hover:text-zinc-900 px-3 py-2 text-sm font-medium">Login</Link>
                <Link to="/register" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
