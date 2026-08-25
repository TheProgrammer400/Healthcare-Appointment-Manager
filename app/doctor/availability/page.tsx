'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, Loader2, UserX } from 'lucide-react';

export default function DoctorAvailabilityPage() {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSessionAndDoctor();
  }, []);

  const fetchSessionAndDoctor = async () => {
    setLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (meData.success && meData.data?.user?.doctorProfileId) {
        setSessionUser(meData.data.user);
        const docRes = await fetch(`/api/doctors/${meData.data.user.doctorProfileId}`);
        const docData = await docRes.json();
        if (docData.success) {
          setDoctorProfile(docData.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveDate || !doctorProfile) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/doctors/${doctorProfile.id}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveDate,
          reason: leaveReason || 'Doctor on leave',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to record leave day');
      }

      setMessage({
        type: 'success',
        text: `Leave recorded for ${leaveDate}. ${data.data.affectedAppointments?.length || 0} conflicting appointments automatically cancelled and patients notified.`,
      });
      setLeaveDate('');
      setLeaveReason('');
      fetchSessionAndDoctor();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error recording leave day.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        <span>Loading availability configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <Clock className="w-8 h-8 text-brand-400" /> Availability & Leave Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure consultation working hours, slot granularity, and mark scheduled leave days.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-red-950/60 border border-red-800 text-red-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-400" /> Current Slot Configuration
          </h3>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Specialisation:</span>
              <span className="font-semibold text-white">{doctorProfile?.specialisation}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Slot Duration:</span>
              <span className="font-semibold text-brand-300">{doctorProfile?.slotDurationMinutes} Minutes</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UserX className="w-5 h-5 text-amber-400" /> Register Scheduled Leave Day
          </h3>
          <p className="text-xs text-slate-400">
            Marking leave automatically cancels conflicting patient bookings and dispatches email notifications.
          </p>

          <form onSubmit={handleRegisterLeave} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Leave Date</label>
              <input
                type="date"
                required
                value={leaveDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setLeaveDate(e.target.value)}
                className="w-full bg-slate-900/90 text-white text-xs border border-slate-700/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reason (Optional)</label>
              <input
                type="text"
                placeholder="Attending medical conference / Personal leave..."
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                className="w-full bg-slate-900/90 text-white text-xs border border-slate-700/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-xs py-2.5 rounded-xl shadow-lg transition-all"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register Leave & Notify Patients'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
