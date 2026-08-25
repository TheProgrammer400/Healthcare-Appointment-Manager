'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Calendar, Clock, Loader2, AlertCircle } from 'lucide-react';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data.appointments);
      } else {
        setError(data.error?.message || 'Failed to load system appointments');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-brand-400" /> Admin System Appointments Oversight
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Complete audit visibility over all patient-doctor consultations across the clinic system.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          <span>Loading system appointment records...</span>
        </div>
      ) : appointments.length === 0 ? (
        <div className="py-16 text-center glass-card rounded-2xl p-8">
          <Calendar className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">No appointments recorded yet</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Doctor</th>
                  <th className="p-4">Specialisation</th>
                  <th className="p-4">Time (UTC)</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-semibold text-white">{appt.patient.user.fullName}</td>
                    <td className="p-4 text-brand-300">{appt.doctor.user.fullName}</td>
                    <td className="p-4">{appt.doctor.specialisation}</td>
                    <td className="p-4 font-mono">{new Date(appt.startAt).toUTCString()}</td>
                    <td className="p-4 font-bold text-teal-300">{appt.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
