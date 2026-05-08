import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Eye, EyeOff, Loader2, AlertCircle, User, Mail, Lock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AuthPage() {
  const { login } = useAuth();
  const [tab, setTab]           = useState('login');
  const [form, setForm]         = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const update = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const endpoint = tab === 'login'
        ? `${API_BASE}/api/auth/login`
        : `${API_BASE}/api/auth/register`;
      const payload  = tab === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const { data } = await axios.post(endpoint, payload);
      login(data.token, data.user);
    } catch (e) {
      setError(e.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">InvoicePro</h1>
          <p className="text-blue-300 text-sm mt-1">Professional Invoice Generator</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Tab switcher */}
          <div className="flex border-b border-slate-100">
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setForm({ name: '', email: '', password: '' }); }}
                className={`flex-1 py-4 text-sm font-semibold transition-all ${
                  tab === t
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div className="p-7">
            {/* Google OAuth */}
            <button
              onClick={handleGoogle}
              type="button"
              className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors mb-5 shadow-sm"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or with email</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {tab === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="form-label">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        className="form-input pl-10"
                        placeholder="Meet Savani"
                        value={form.name}
                        onChange={e => update('name', e.target.value)}
                        required
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="form-label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    className="form-input pl-10"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-input pl-10 pr-10"
                    placeholder={tab === 'register' ? 'Min 6 characters' : '••••••••'}
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Please wait...</>
                  : tab === 'login' ? 'Sign In' : 'Create Account'
                }
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-5">
              {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); }}
                className="text-blue-600 font-semibold hover:underline"
              >
                {tab === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </motion.div>

        <p className="text-center text-blue-400/60 text-xs mt-6">
          Your invoices are private and secure 🔒
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
