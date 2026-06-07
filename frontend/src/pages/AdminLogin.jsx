import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import { Lock, Mail, ShieldAlert, Eye, EyeOff, AlertCircle } from 'lucide-react';

const AdminLogin = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      return setError('Please enter email and password.');
    }

    setLoading(true);
    try {
      const res = await adminService.loginAdmin(form);
      if (res.success) {
        setUser(res.user);
        navigate('/admin');
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid administrative credentials.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-slate-50 focus:bg-white transition-all";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/10 mb-4">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Admin Console</h1>
          <p className="text-slate-400 mt-1">Sign in to manage system operations</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 text-slate-100">
          {error && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Address */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@foodbridge.com"
                  className={`${inputCls} bg-slate-800 border-slate-700 text-white focus:bg-slate-800`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`${inputCls} bg-slate-800 border-slate-700 text-white focus:bg-slate-800`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : 'Authenticate Admin'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-500 leading-normal">
            🛡️ Authorized administrative access only. System interactions are fully audited.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
