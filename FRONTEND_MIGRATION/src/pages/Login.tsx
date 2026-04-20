import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await auth.login(email, password);
      localStorage.setItem('brims_token', data.access_token);
      localStorage.setItem('brims_role', data.role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Half - Dark Navy Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brims-navy-dark relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10 brims-grid" />
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative z-10 text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-brims-amber rounded-sm flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-brims-navy" />
                <span className="text-white font-bold text-3xl z-10">B</span>
              </div>
              <span className="text-white text-5xl font-bold tracking-tighter">BRIMS</span>
            </div>
          </div>
          <p className="text-slate-300 text-xl font-light tracking-wide max-w-md mx-auto">
            Manage your real estate portfolio with precision
          </p>
        </div>
      </div>

      {/* Right Half - White Panel */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 sm:p-12 lg:p-24">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-brims-amber rounded-sm flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-brims-navy" />
                <span className="text-white font-bold text-xl z-10">B</span>
              </div>
              <span className="text-brims-navy text-3xl font-bold tracking-tighter">BRIMS</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-slate-500">Enter your credentials to access your account</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 font-medium">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-brims-navy focus:border-transparent transition-all outline-none"
                  placeholder="name@company.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-brims-navy focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-md text-white bg-brims-navy hover:bg-brims-navy-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brims-navy transition-all shadow-lg shadow-brims-navy/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
