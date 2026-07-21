import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, Mail, Loader2 } from 'lucide-react';

const Login = ({ onSwitchRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slatebg-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-900/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="w-full max-w-md bg-slatebg-900 border border-slatebg-800 shadow-2xl rounded-2xl p-8 z-10 animate-slide-up relative">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-brand-950/40 border border-brand-800 rounded-2xl text-brand-400 mb-3 shadow-inner">
            <GraduationCap className="h-10 w-10 stroke-[1.2]" />
          </div>
          <h2 className="text-xl font-bold text-white">Academic Collaboration Portal</h2>
          <p className="text-xs text-slatebg-400 mt-1">Cross-Institutional Event Notification Hub</p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-950/20 border border-red-900/40 text-red-400 rounded-lg text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slatebg-500">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                type="email"
                placeholder="you@institution.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-sm placeholder-slatebg-600 focus:outline-none focus:border-brand-500 text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slatebg-500">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-sm placeholder-slatebg-600 focus:outline-none focus:border-brand-500 text-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-brand-950/40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slatebg-800 text-center">
          <p className="text-xs text-slatebg-400">
            Don't have an account?{' '}
            <button
              onClick={onSwitchRegister}
              className="text-brand-400 hover:text-brand-300 font-semibold underline transition-colors"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
