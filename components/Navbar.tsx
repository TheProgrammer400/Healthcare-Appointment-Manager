'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Activity, LogOut, Calendar, User, ShieldAlert, Stethoscope, ChevronDown, X, Mail, Phone, Shield, Clock } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    fullName: string;
    role: string;
    phone?: string | null;
    doctorProfileId?: string | null;
    patientProfileId?: string | null;
  } | null>(null);

  const [showProfileModal, setShowProfileModal] = useState(false);

  const fetchUser = useCallback(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.user) {
          setCurrentUser(data.data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => {
        setCurrentUser(null);
      });
  }, []);

  useEffect(() => {
    fetchUser();
  }, [pathname, fetchUser]);

  useEffect(() => {
    const handleAuthStateChange = () => fetchUser();
    window.addEventListener('auth-state-change', handleAuthStateChange);
    return () => window.removeEventListener('auth-state-change', handleAuthStateChange);
  }, [fetchUser]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    setShowProfileModal(false);
    window.dispatchEvent(new Event('auth-state-change'));
    router.push('/login');
    router.refresh();
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/50';
      case 'DOCTOR':
        return 'bg-teal-950/80 text-teal-300 border-teal-800/50';
      case 'PATIENT':
      default:
        return 'bg-brand-950/80 text-brand-300 border-brand-800/50';
    }
  };

  const getLogoHref = () => {
    if (!currentUser) return '/';
    switch (currentUser.role) {
      case 'PATIENT':
        return '/patient/dashboard';
      case 'DOCTOR':
        return '/doctor/dashboard';
      case 'ADMIN':
        return '/admin/doctors';
      default:
        return '/';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 glass-card border-b border-slate-800/80 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href={getLogoHref()} className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white">Care<span className="gradient-text">Sync</span></span>
              <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Healthcare Manager</span>
            </div>
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6">
            {currentUser ? (
              <div className="flex items-center gap-3 sm:gap-6">
                {currentUser.role === 'PATIENT' && (
                  <div className="flex items-center gap-4">
                    <Link href="/patient/dashboard" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-brand-300 font-medium transition-colors">
                      <Activity className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link href="/patient/doctors" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-brand-300 font-medium transition-colors">
                      <Stethoscope className="w-4 h-4" /> Find Doctors
                    </Link>
                    <Link href="/patient/appointments" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-brand-300 font-medium transition-colors">
                      <Calendar className="w-4 h-4" /> My Appointments
                    </Link>
                  </div>
                )}

                {currentUser.role === 'DOCTOR' && (
                  <div className="flex items-center gap-4">
                    <Link href="/doctor/dashboard" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-brand-300 font-medium transition-colors">
                      <Calendar className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link href="/doctor/profile" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-brand-300 font-medium transition-colors">
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                    <Link href="/doctor/availability" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-brand-300 font-medium transition-colors">
                      <Clock className="w-4 h-4" /> Availability
                    </Link>
                  </div>
                )}

                {currentUser.role === 'ADMIN' && (
                  <div className="flex items-center gap-4">
                    <Link href="/admin/doctors" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-brand-300 font-medium transition-colors">
                      <Stethoscope className="w-4 h-4" /> Doctors Management
                    </Link>
                    <Link href="/admin/appointments" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-brand-300 font-medium transition-colors">
                      <ShieldAlert className="w-4 h-4" /> System Oversight
                    </Link>
                  </div>
                )}

                <div className="h-4 w-px bg-slate-800 hidden sm:block" />

                {/* Profile Pill & Sign Out Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all text-left group"
                    title="View User Profile"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                      {currentUser.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="hidden sm:block">
                      <span className="block text-xs font-semibold text-white group-hover:text-brand-300 transition-colors leading-tight">
                        {currentUser.fullName}
                      </span>
                      <span className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(currentUser.role)}`}>
                        {currentUser.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
                  </button>

                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900/50 text-xs font-semibold transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">Sign Out</span>
                  </button>
                </div>
              </div>
            ) : pathname === '/login' ? null : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm text-slate-300 hover:text-white px-3.5 py-2 rounded-xl hover:bg-slate-900 transition-colors font-medium">
                  Sign In
                </Link>
                <Link href="/register" className="text-sm font-semibold bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 text-white px-4 py-2 rounded-xl shadow-md shadow-brand-600/20 transition-all">
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* User Profile Modal */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-500/20 text-brand-300">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-white">User Profile Details</h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                {currentUser.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h4 className="font-bold text-base text-white">{currentUser.fullName}</h4>
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border mt-1 ${getRoleBadgeStyle(currentUser.role)}`}>
                  {currentUser.role} Account
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email Address</span>
                  <span className="font-medium text-white">{currentUser.email}</span>
                </div>
              </div>

              {currentUser.phone && (
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3">
                  <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone Number</span>
                    <span className="font-medium text-white">{currentUser.phone}</span>
                  </div>
                </div>
              )}

              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3">
                <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">User Account ID</span>
                  <span className="font-mono text-slate-300 text-[11px]">{currentUser.id}</span>
                </div>
              </div>
            </div>

            {currentUser.role === 'DOCTOR' && (
              <Link
                href="/doctor/profile"
                onClick={() => setShowProfileModal(false)}
                className="block text-center text-xs font-semibold text-brand-300 hover:text-white bg-brand-950/60 border border-brand-800/80 p-2.5 rounded-xl transition-colors"
              >
                Edit Doctor Profile & Credentials
              </Link>
            )}

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 font-semibold text-xs px-4 py-2 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
