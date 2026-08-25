'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, Loader2, CheckCircle2, XCircle, FileText, ChevronRight } from 'lucide-react';
import { PreVisitSummaryView } from '@/components/PreVisitSummaryView';
import { PostVisitSummaryView } from '@/components/PostVisitSummaryView';

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data.appointments);
      } else {
        setError(data.error?.message || 'Failed to load appointments');
      }
    } catch (err) {
      setError('Network error loading appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      const res = await fetch(`/api/appointments/${id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchAppointments();
        if (selectedAppt?.id === id) setSelectedAppt(null);
      } else {
        alert(data.error?.message || 'Failed to cancel appointment');
      }
    } catch (err) {
      alert('Error cancelling appointment');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold">CONFIRMED</span>;
      case 'COMPLETED':
        return <span className="bg-brand-500/20 text-brand-300 border border-brand-500/30 px-3 py-1 rounded-full text-xs font-semibold">COMPLETED</span>;
      case 'CANCELLED':
        return <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-full text-xs font-semibold">CANCELLED</span>;
      case 'RESCHEDULED':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold">RESCHEDULED</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <Calendar className="w-8 h-8 text-brand-400" /> My Medical Appointments
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          View upcoming consultations, clinical intake notes, and doctor follow-up instructions.
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
          <span>Loading appointment records...</span>
        </div>
      ) : appointments.length === 0 ? (
        <div className="py-16 text-center glass-card rounded-2xl p-8">
          <Calendar className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Appointments Found</h3>
          <p className="text-xs text-slate-400 mt-1">You haven't scheduled any medical consultations yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">All Appointments</h3>
            <div className="space-y-3">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  onClick={() => setSelectedAppt(appt)}
                  className={`glass-card p-4 rounded-2xl cursor-pointer transition-all border ${
                    selectedAppt?.id === appt.id
                      ? 'border-brand-400 bg-slate-900/90 shadow-lg shadow-brand-500/10'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm">{appt.doctor.user.fullName}</span>
                    {getStatusBadge(appt.status)}
                  </div>
                  <p className="text-xs text-brand-300 font-medium mb-1">{appt.doctor.specialisation}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> {new Date(appt.startAt).toUTCString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedAppt ? (
              <div className="space-y-6">
                <div className="glass-card rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedAppt.doctor.user.fullName}</h2>
                      <p className="text-xs text-brand-300 font-semibold">{selectedAppt.doctor.specialisation}</p>
                    </div>
                    <div>{getStatusBadge(selectedAppt.status)}</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-400 block font-medium">Scheduled Time:</span>
                      <span className="font-semibold text-white">{new Date(selectedAppt.startAt).toUTCString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">End Time:</span>
                      <span className="font-semibold text-white">{new Date(selectedAppt.endAt).toUTCString()}</span>
                    </div>
                  </div>

                  {['CONFIRMED', 'PENDING'].includes(selectedAppt.status) && (
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => handleCancel(selectedAppt.id)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-950/60 border border-red-800/80 text-red-300 hover:bg-red-900 transition-colors"
                      >
                        Cancel Appointment
                      </button>
                    </div>
                  )}
                </div>

                {selectedAppt.symptomForm && (
                  <PreVisitSummaryView symptomForm={selectedAppt.symptomForm} />
                )}

                {selectedAppt.visitSummary && (
                  <PostVisitSummaryView visitSummary={selectedAppt.visitSummary} />
                )}
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[300px]">
                <FileText className="w-12 h-12 text-slate-600 mb-3" />
                <p className="font-semibold text-slate-300 text-sm">Select an appointment to inspect details</p>
                <p className="text-xs text-slate-500 mt-1">View clinical triage notes, prescriptions, and post-visit summaries.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
