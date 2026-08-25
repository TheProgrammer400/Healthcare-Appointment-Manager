'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Activity, Lock, Mail, AlertCircle, Loader2, LogIn } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPath = searchParams.get('from');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Login failed');
      }

      window.dispatchEvent(new Event('auth-state-change'));
      const role = data.data.role;
      if (fromPath) {
        router.push(fromPath);
      } else if (role === 'PATIENT') {
        router.push('/patient/dashboard');
      } else if (role === 'DOCTOR') {
        router.push('/doctor/dashboard');
      } else if (role === 'ADMIN') {
        router.push('/admin/doctors');
      } else {
        router.push('/');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-800">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white mb-2">
          <Activity className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Sign In to CareSync</h2>
        <p className="text-xs text-slate-400">Access your healthcare portal account</p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-slate-900/90 text-white text-sm border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-brand-400 placeholder:text-slate-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900/90 text-white text-sm border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-brand-400 placeholder:text-slate-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 text-white font-semibold text-sm py-3 rounded-xl shadow-lg shadow-brand-600/30 transition-all"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <LogIn className="w-4 h-4" /> Sign In
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
        Don't have a patient account?{' '}
        <Link href="/register" className="text-brand-400 hover:underline font-semibold">
          Register Here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="py-12 flex items-center justify-center">
      <Suspense fallback={<div className="text-slate-400 text-xs">Loading login form...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
