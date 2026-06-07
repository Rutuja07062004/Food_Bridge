import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Heart, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import authService from '../services/authService';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      const res = await authService.resetPassword(token, form.password);
      if (res.success) setSuccess(true);
      else setError(res.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shadow-emerald-200 mb-4">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">Reset Password</h1>
          <p className="text-slate-500 mt-1">Choose a strong new password</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Password Reset!</h3>
              <p className="text-slate-500 text-sm mb-6">Your password has been updated successfully.</p>
              <button onClick={() => navigate('/login')} className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg transition-all">
                Sign In Now
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input id="new-password" name="password" type={showPass ? 'text' : 'password'} required value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters"
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-slate-50 focus:bg-white transition-all" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input id="confirm-password" name="confirmPassword" type={showPass ? 'text' : 'password'} required value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Repeat password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-slate-50 focus:bg-white transition-all" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-200 disabled:opacity-60">
                  {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Resetting...</span> : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
