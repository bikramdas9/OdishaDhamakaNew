import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, clearAuth, isAdmin } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount());
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAuth();
      toast.success('Logged out');
      navigate('/');
    }
  };

  const scrollToSection = (id: string) => {
    setMobileOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-brand-500">🍛 Odisha Dhamaka</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => scrollToSection('menu')} className="text-sm font-medium text-gray-600 hover:text-brand-500 transition-colors">Menu</button>
          <button onClick={() => scrollToSection('our-story')} className="text-sm font-medium text-gray-600 hover:text-brand-500 transition-colors">Our Story</button>
          <button onClick={() => scrollToSection('contact')} className="text-sm font-medium text-gray-600 hover:text-brand-500 transition-colors">Contact</button>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {isAdmin() && (
                <Link to="/admin" className="hidden md:flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
                  <LayoutDashboard size={16} />
                  Admin
                </Link>
              )}
              <Link to="/orders" className="hidden md:flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-500">
                <User size={16} />
                {user.name.split(' ')[0]}
              </Link>
              <button onClick={handleLogout} className="hidden md:flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition-colors">
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <Link to="/auth" className="hidden md:block btn-primary text-sm py-2 px-4">Login</Link>
          )}

          <Link to="/cart" className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <ShoppingCart size={22} className="text-gray-700" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 space-y-3 animate-fade-in">
          <button onClick={() => scrollToSection('menu')} className="block py-2 text-sm font-medium text-gray-700">Menu</button>
          <button onClick={() => scrollToSection('our-story')} className="block py-2 text-sm font-medium text-gray-700">Our Story</button>
          <button onClick={() => scrollToSection('contact')} className="block py-2 text-sm font-medium text-gray-700">Contact</button>
          {user ? (
            <>
              {isAdmin() && <Link to="/admin" className="block py-2 text-sm font-medium text-brand-600" onClick={() => setMobileOpen(false)}>Admin Dashboard</Link>}
              <Link to="/orders" className="block py-2 text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>My Orders</Link>
              <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="block py-2 text-sm font-medium text-red-500">Logout</button>
            </>
          ) : (
            <Link to="/auth" className="block btn-primary text-center text-sm" onClick={() => setMobileOpen(false)}>Login / Sign Up</Link>
          )}
        </div>
      )}
    </nav>
  );
}
