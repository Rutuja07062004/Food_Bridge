import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ngoService from '../services/ngoService';
import {
  Eye, EyeOff, Award, Mail, Lock, AlertCircle
} from 'lucide-react';

const NgoLogin = () => {
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
      return setError('Please enter both email and password.');
    }

    setLoading(true);
    try {
      const res = await ngoService.login(form);
      if (res.success) {
        setUser(res.user);
        navigate('/ngo'); // Go to Dashboard
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all bg-slate-50 focus:bg-white";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-40 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-40 -translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shadow-emerald-200 mb-4">
            <Award className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">NGO Login</h1>
          <p className="text-slate-500 mt-1">Sign in to search & claim food donations</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 p-8">
          {error && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Address */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputCls} />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input name="password" type={showPassword ? 'text' : 'password'} required value={form.password} onChange={handleChange} placeholder="••••••••" className={inputCls} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg shadow-emerald-100 hover:shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            New organization?{' '}
            <Link to="/ngo/register" className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NgoLogin;
