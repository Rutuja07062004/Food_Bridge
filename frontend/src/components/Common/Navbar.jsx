import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, Heart, User, LogOut, LayoutDashboard, Utensils, Award, BookOpen, PlusCircle, List } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'Admin') return '/admin';
    if (user.role === 'Donor') return '/donor';
    return '/ngo';
  };

  const linkClass = (path) => 
    `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path) 
        ? 'text-emerald-700 bg-emerald-50' 
        : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
    }`;

  const mobileLinkClass = (path) => 
    `block px-4 py-2.5 rounded-xl text-base font-semibold transition-all ${
      isActive(path) 
        ? 'text-emerald-700 bg-emerald-50' 
        : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
    }`;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-200">
                <Heart className="w-5 h-5 text-white fill-white/10" />
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                FoodBridge
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-2">
            <Link to="/" className={linkClass('/')}>Home</Link>
            
            {user && (
              <>
                <Link to={getDashboardPath()} className={linkClass(getDashboardPath())}>
                  <span className="flex items-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </span>
                </Link>
                {user.role === 'Donor' && (
                  <>
                    <Link to="/donor/add" className={linkClass('/donor/add')}>
                      <span className="flex items-center gap-1.5">
                        <PlusCircle className="w-4 h-4" />
                        Donate Food
                      </span>
                    </Link>
                    <Link to="/donor/listings" className={linkClass('/donor/listings')}>
                      <span className="flex items-center gap-1.5">
                        <List className="w-4 h-4" />
                        My Listings
                      </span>
                    </Link>
                  </>
                )}
                {user.role === 'NGO' && (
                  <>
                    <Link to="/ngo" className={linkClass('/ngo')}>
                      <span className="flex items-center gap-1.5">
                        <Award className="w-4 h-4" />
                        Browse Listings
                      </span>
                    </Link>
                    <Link to="/ngo/claims" className={linkClass('/ngo/claims')}>
                      <span className="flex items-center gap-1.5">
                        <List className="w-4 h-4" />
                        My Claims
                      </span>
                    </Link>
                  </>
                )}
              </>
            )}

            {!user ? (
              <div className="flex items-center space-x-3 ml-4">
                <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-600 transition-colors">
                  Log in
                </Link>
                <Link to="/signup" className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:shadow-lg hover:shadow-emerald-100 transition-all duration-300 transform hover:-translate-y-0.5">
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-3 ml-4 border-l border-slate-100 pl-4">
                {/* User Info & Actions */}
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800">{user.name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded self-end">
                    {user.role}
                  </span>
                </div>
                
                <NotificationBell />
                
                <Link to="/profile" className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                  <User className="w-5 h-5" />
                </Link>
                
                <button onClick={handleLogout} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 animate-fadeIn">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" onClick={() => setIsOpen(false)} className={mobileLinkClass('/')}>
              Home
            </Link>
            
            {user && (
              <>
                <Link to={getDashboardPath()} onClick={() => setIsOpen(false)} className={mobileLinkClass(getDashboardPath())}>
                  Dashboard
                </Link>
                {user.role === 'Donor' && (
                  <>
                    <Link to="/donor/add" onClick={() => setIsOpen(false)} className={mobileLinkClass('/donor/add')}>
                      Donate Food
                    </Link>
                    <Link to="/donor/listings" onClick={() => setIsOpen(false)} className={mobileLinkClass('/donor/listings')}>
                      My Listings
                    </Link>
                  </>
                )}
                {user.role === 'NGO' && (
                  <>
                    <Link to="/ngo" onClick={() => setIsOpen(false)} className={mobileLinkClass('/ngo')}>
                      Browse Food
                    </Link>
                    <Link to="/ngo/claims" onClick={() => setIsOpen(false)} className={mobileLinkClass('/ngo/claims')}>
                      My Claims
                    </Link>
                  </>
                )}
                <Link to="/profile" onClick={() => setIsOpen(false)} className={mobileLinkClass('/profile')}>
                  My Profile
                </Link>
              </>
            )}

            {!user ? (
              <div className="grid grid-cols-2 gap-3 p-4 mt-2 border-t border-slate-100">
                <Link to="/login" onClick={() => setIsOpen(false)} className="flex justify-center items-center px-4 py-2.5 rounded-xl text-base font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-all">
                  Log in
                </Link>
                <Link to="/signup" onClick={() => setIsOpen(false)} className="flex justify-center items-center px-4 py-2.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 transition-all">
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="p-4 mt-2 border-t border-slate-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{user.name}</h4>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-base font-semibold text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
