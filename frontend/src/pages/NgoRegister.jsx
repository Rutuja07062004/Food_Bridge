import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ngoService from '../services/ngoService';
import {
  Eye, EyeOff, Heart, Award, FileText, User, Mail, Phone, MapPin, Lock, AlertCircle
} from 'lucide-react';
import DocumentUploader from '../components/Upload/DocumentUploader';

const NgoRegister = () => {
  const [form, setForm] = useState({
    ngoName: '',
    registrationNumber: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    verificationDocument: null
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field checks
    if (!form.ngoName || !form.registrationNumber || !form.contactPerson || !form.email || !form.phone || !form.address || !form.password) {
      return setError('Please fill in all required fields.');
    }
    if (!form.verificationDocument) {
      return setError('Please upload your NGO verification certificate.');
    }
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      const res = await ngoService.register({
        ngoName: form.ngoName,
        registrationNumber: form.registrationNumber,
        contactPerson: form.contactPerson,
        email: form.email,
        phone: form.phone,
        address: form.address,
        password: form.password,
        verificationDocument: form.verificationDocument
      });

      if (res.success) {
        setUser(res.user);
        navigate('/ngo'); // Go to Dashboard (which handles pending status)
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all bg-slate-50 focus:bg-white";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4 py-12">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-40 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-40 -translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shadow-emerald-200 mb-4">
            <Award className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">NGO Registration</h1>
          <p className="text-slate-500 mt-1">Register your organization to collect surplus food</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 p-8">
          {error && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NGO Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">NGO / Organization Name *</label>
              <div className="relative">
                <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input name="ngoName" type="text" required value={form.ngoName} onChange={handleChange} placeholder="e.g. Hope Kitchen Charity" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Registration Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reg Number *</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="registrationNumber" type="text" required value={form.registrationNumber} onChange={handleChange} placeholder="e.g. REG-12345-67" className={inputCls} />
                </div>
              </div>

              {/* Contact Person Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Person *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="contactPerson" type="text" required value={form.contactPerson} onChange={handleChange} placeholder="e.g. Rajiv Kumar" className={inputCls} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email Address */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputCls} />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="phone" type="tel" required value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className={inputCls} />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">NGO Head Office Address *</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <textarea name="address" required rows={2} value={form.address} onChange={handleChange} placeholder="Street address, City, Pin Code" className={`${inputCls} pl-10 resize-none`} />
              </div>
            </div>

            {/* NGO Certificate Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">NGO Verification Certificate *</label>
              <DocumentUploader
                initialDocument={form.verificationDocument}
                onChange={(docData) => setForm(f => ({ ...f, verificationDocument: docData }))}
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="password" type={showPassword ? 'text' : 'password'} required value={form.password} onChange={handleChange} placeholder="••••••••" className={inputCls} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="confirmPassword" type={showPassword ? 'text' : 'password'} required value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" className={inputCls} />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg shadow-emerald-100 hover:shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating organization account...
                </>
              ) : 'Register NGO'}
            </button>
          </form>

          <p className="mt-4 text-xs text-center text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2">
            ⚠️ NGO accounts require admin approval before accessing food listings.
          </p>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already registered?{' '}
            <Link to="/ngo/login" className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NgoRegister;
