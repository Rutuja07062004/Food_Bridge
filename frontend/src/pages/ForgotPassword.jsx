import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import authService from '../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      if (res.success) setSuccess(true);
      else setError(res.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
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
          <h1 className="text-3xl font-extrabold text-slate-800">Forgot Password</h1>
          <p className="text-slate-500 mt-1">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Reset Email Sent!</h3>
              <p className="text-slate-500 text-sm mb-6">Check your inbox (or <strong>backend/logs/emails.log</strong> in dev mode) for the password reset link.</p>
              <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg transition-all">
                Back to Login
              </Link>
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all bg-slate-50 focus:bg-white" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-200 disabled:opacity-60">
                  {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</span> : 'Send Reset Link'}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-slate-500">
                <Link to="/login" className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700">
                  <ArrowLeft className="w-4 h-4" />Back to Login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
