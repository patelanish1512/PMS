import React, { useState } from 'react';
import { login } from '../../services/authService';
import { Building2, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);

  React.useEffect(() => {
    // Check backend connectivity by hitting the new /health endpoint
    fetch('http://localhost:5000/health')
      .then(res => setIsBackendConnected(res.ok))
      .catch(() => setIsBackendConnected(false));
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', email);
      const res = await login({ email, password });
      console.log('Login success:', res);
      window.location.href = '/';
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 rotate-45 mb-4">
            <div className="rotate-[-45deg]">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Project Monitor</h1>
          <p className="text-gray-600 mt-2 text-center">Design Project Progress Monitoring System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-orange-100/50 border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center justify-between">
            Sign In
            {isBackendConnected === false && (
              <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse">Backend Offline</span>
            )}
            {isBackendConnected === true && (
              <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Backend Online</span>
            )}
          </h2>


          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                <span className="text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-orange-600 font-medium hover:text-orange-700 transition-colors">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Demo Access Section */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Quick Access (Demo)</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setEmail('admin@example.com'); setPassword('Password@123'); }}
                className="px-3 py-2 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                Admin
              </button>
              <button
                onClick={() => { setEmail('manager@example.com'); setPassword('Password@123'); }}
                className="px-3 py-2 text-xs font-semibold bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
              >
                Project Manager
              </button>
              <button
                onClick={() => { setEmail('member@example.com'); setPassword('Password@123'); }}
                className="px-3 py-2 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Member
              </button>
              <button
                onClick={() => { setEmail('client@example.com'); setPassword('Password@123'); }}
                className="px-3 py-2 text-xs font-semibold bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
              >
                Client
              </button>
            </div>
          </div>


          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <a href="#" className="text-orange-600 font-semibold hover:text-orange-700 transition-colors">Contact Administrator</a>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          &copy; 2026 Project Progress Monitoring System. All rights reserved.
        </div>
      </div>
    </div>
  );
}
