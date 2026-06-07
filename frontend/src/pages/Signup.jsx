import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Heart, User, Mail, Phone, Lock, AlertCircle, Utensils, Award } from 'lucide-react';

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleRoleSelect = (role) => setForm({ ...form, role });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.role) return setError('Please select your role (Donor or NGO).');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    const result = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password, role: form.role });
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 -translate-x-1/2 translate-y-1/2" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shadow-emerald-200 mb-4">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">Join FoodBridge</h1>
          <p className="text-slate-500 mt-1">Make a difference in your community</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 p-8">
          {error && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="role-donor"
                  onClick={() => handleRoleSelect('Donor')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                    form.role === 'Donor'
                      ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100'
                      : 'border-slate-200 hover:border-emerald-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.role === 'Donor' ? 'bg-emerald-500' : 'bg-slate-100'}`}>
                    <Utensils className={`w-5 h-5 ${form.role === 'Donor' ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <span className={`text-sm font-bold ${form.role === 'Donor' ? 'text-emerald-700' : 'text-slate-600'}`}>Food Donor</span>
                  <span className="text-[10px] text-slate-400 text-center leading-tight">Restaurants, Hotels, Households</span>
                </button>

                <button
                  type="button"
                  id="role-ngo"
                  onClick={() => handleRoleSelect('NGO')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                    form.role === 'NGO'
                      ? 'border-teal-500 bg-teal-50 shadow-md shadow-teal-100'
                      : 'border-slate-200 hover:border-teal-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.role === 'NGO' ? 'bg-teal-500' : 'bg-slate-100'}`}>
                    <Award className={`w-5 h-5 ${form.role === 'NGO' ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <span className={`text-sm font-bold ${form.role === 'NGO' ? 'text-teal-700' : 'text-slate-600'}`}>NGO / Charity</span>
                  <span className="text-[10px] text-slate-400 text-center leading-tight">Collect & distribute food</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="name" name="name" type="text" required value={form.name} onChange={handleChange} placeholder="Your full name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all bg-slate-50 focus:bg-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all bg-slate-50 focus:bg-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="phone" name="phone" type="tel" required value={form.phone} onChange={handleChange} placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all bg-slate-50 focus:bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} required value={form.password} onChange={handleChange} placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all bg-slate-50 focus:bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} required value={form.confirmPassword} onChange={handleChange} placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all bg-slate-50 focus:bg-white" />
                </div>
              </div>
            </div>

            <button
              id="signup-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          {form.role === 'NGO' && (
            <p className="mt-4 text-xs text-center text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2">
              ⚠️ NGO accounts require admin approval before accessing food listings.
            </p>
          )}

          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
