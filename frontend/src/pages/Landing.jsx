import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight, Utensils, Users, Award, TrendingUp, CheckCircle, Globe, Shield, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StatBadge = ({ value, label }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-extrabold text-white">{value}</div>
    <div className="text-sm text-emerald-200 mt-1 font-medium">{label}</div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, desc, color }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-emerald-100 transition-all duration-300 group">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${color} group-hover:scale-110 transition-transform`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

const StepCard = ({ num, title, desc }) => (
  <div className="flex gap-5 items-start">
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-extrabold flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-200">
      {num}
    </div>
    <div>
      <h4 className="font-bold text-slate-800 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const Landing = () => {
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/signup';
    if (user.role === 'Admin') return '/admin';
    if (user.role === 'Donor') return '/donor';
    return '/ngo';
  };

  return (
    <div className="overflow-x-hidden">
      {/* ─── Hero ─── */}
      <section className="relative min-h-[92vh] flex items-center bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold mb-8">
              <div className="pulse-dot" />
              Platform actively connecting donors and NGOs
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6">
              Bridging the Gap Between
              <span className="block bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Surplus Food & Need
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl">
              FoodBridge connects restaurants, hotels, households, and caterers with verified NGOs — turning food waste into community nourishment in real time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={user ? getDashboardPath() : '/signup'}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 transition-all duration-300 shadow-2xl shadow-emerald-900 hover:shadow-emerald-700 transform hover:-translate-y-1 text-lg">
                {user ? 'Go to Dashboard' : 'Get Started Free'}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-white border border-white/20 hover:bg-white/10 transition-all duration-300 text-lg">
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Floating food emoji cards */}
        <div className="absolute right-8 top-1/4 hidden xl:flex flex-col gap-4">
          {['🍱', '🥗', '🍛', '🥘', '🧁'].map((emoji, i) => (
            <div key={i} className="w-14 h-14 bg-white/10 backdrop-blur border border-white/10 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
              style={{ transform: `translateX(${i % 2 === 0 ? '0' : '20px'})`, animation: `float ${2 + i * 0.4}s ease-in-out infinite alternate` }}>
              {emoji}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Stats Banner ─── */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-600 py-14">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatBadge value="15,000+" label="Meals Redistributed" />
            <StatBadge value="120+" label="NGO Partners" />
            <StatBadge value="300+" label="Active Donors" />
            <StatBadge value="98%" label="Zero Waste Goal" />
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Simple & Effective</span>
            <h2 className="text-4xl font-extrabold text-slate-800 mt-2">How FoodBridge Works</h2>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto">A three-step process connecting food donors with NGOs in minutes.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <StepCard num="1" title="Donor Lists Surplus Food"
                desc="Restaurants, hotels, and households list surplus food with quantity, category, pickup location, and expiry time." />
              <StepCard num="2" title="NGO Discovers & Claims"
                desc="Verified NGOs browse real-time listings, filter by category or location, and claim food with a planned pickup time." />
              <StepCard num="3" title="Food Reaches Those in Need"
                desc="The donor is notified instantly. The NGO picks up the food and marks it complete — turning waste into nutrition." />
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-100">
                <div className="space-y-4">
                  {[
                    { label: 'Dal Makhani & Rice', category: 'Veg Meal', serves: 40, status: 'available', time: '2h left' },
                    { label: 'Assorted Pastries', category: 'Bakery', serves: 25, status: 'claimed', time: 'Claimed' },
                    { label: 'Fresh Vegetables', category: 'Fruits & Veg', serves: 60, status: 'available', time: '5h left' },
                  ].map((item, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl flex-shrink-0">🍽️</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.category} · Feeds {item.serves}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${item.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-slate-400 mt-4 font-medium">Live food listings preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Platform Features</span>
            <h2 className="text-4xl font-extrabold text-slate-800 mt-2">Everything You Need</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={Zap} title="Real-Time Notifications" color="bg-amber-400"
              desc="Socket.io powered live alerts when food is listed or claimed — no need to manually refresh." />
            <FeatureCard icon={Globe} title="Interactive Maps" color="bg-teal-500"
              desc="Leaflet.js maps show exact pickup locations, helping NGOs plan efficient routes." />
            <FeatureCard icon={Shield} title="Role-Based Access" color="bg-blue-500"
              desc="Donors, NGOs, and Admins each get a purpose-built dashboard with appropriate permissions." />
            <FeatureCard icon={TrendingUp} title="Analytics Dashboard" color="bg-purple-500"
              desc="Admin insights on meals saved, donation trends, NGO activity, and waste reduction goals." />
            <FeatureCard icon={Users} title="NGO Management" color="bg-rose-500"
              desc="Admin approval queue for NGOs ensures only verified organizations access food listings." />
            <FeatureCard icon={CheckCircle} title="Full Claim Lifecycle" color="bg-emerald-600"
              desc="Track donations from listed → claimed → picked up → completed with email notifications at each step." />
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center px-4">
          <Heart className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Ready to Make a Difference?</h2>
          <p className="text-slate-300 text-lg mb-10">Join hundreds of donors and NGOs already using FoodBridge to reduce food waste and feed communities in need.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 transition-all shadow-2xl shadow-emerald-900 text-lg transform hover:-translate-y-1">
              Join FoodBridge Today
            </Link>
            <Link to="/login" className="px-8 py-4 rounded-2xl font-bold text-white border border-white/20 hover:bg-white/10 transition-all text-lg">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-white">FoodBridge</span>
          </div>
          <p className="text-sm">© 2026 FoodBridge. Built to reduce food waste and nourish communities.</p>
          <div className="flex gap-6 text-sm">
            <Link to="/login" className="hover:text-emerald-400 transition-colors">Login</Link>
            <Link to="/signup" className="hover:text-emerald-400 transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
