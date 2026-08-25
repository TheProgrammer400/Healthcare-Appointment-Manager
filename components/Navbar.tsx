'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, LogOut, Calendar, User, ShieldAlert, Stethoscope } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Navbar() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; fullName: string; role: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.user) {
          setCurrentUser(data.data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-white">Care<span className="gradient-text">Sync</span></span>
            <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Healthcare Manager</span>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          {currentUser ? (
            <div className="flex items-center gap-4">
              {currentUser.role === 'PATIENT' && (
                <>
                  <Link href="/patient/doctors" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-brand-300 font-medium transition-colors">
                    <Stethoscope className="w-4 h-4" /> Find Doctors
                  </Link>
                  <Link href="/patient/appointments" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-brand-300 font-medium transition-colors">
                    <Calendar className="w-4 h-4" /> My Appointments
                  </Link>
                </>
              )}

              {currentUser.role === 'DOCTOR' && (
                <>
                  <Link href="/doctor/dashboard" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-brand-300 font-medium transition-colors">
                    <Calendar className="w-4 h-4" /> Appointments
                  </Link>
                  <Link href="/doctor/availability" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-brand-300 font-medium transition-colors">
                    <User className="w-4 h-4" /> Availability & Leave
                  </Link>
                </>
              )}

              {currentUser.role === 'ADMIN' && (
                <>
                  <Link href="/admin/doctors" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-brand-300 font-medium transition-colors">
                    <Stethoscope className="w-4 h-4" /> Doctors Management
                  </Link>
                  <Link href="/admin/appointments" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-brand-300 font-medium transition-colors">
                    <ShieldAlert className="w-4 h-4" /> System Oversight
                  </Link>
                </>
              )}

              <div className="h-4 w-px bg-slate-800" />

              <div className="flex items-center gap-2">
                <span className="text-xs bg-brand-950/80 text-brand-300 border border-brand-800/50 px-2.5 py-1 rounded-full font-semibold uppercase">
                  {currentUser.role}
                </span>
                <span className="text-sm font-medium text-slate-200 hidden sm:inline">{currentUser.fullName}</span>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900/80 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="text-sm font-medium bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 text-white px-4 py-2 rounded-xl shadow-md shadow-brand-600/20 transition-all">
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
