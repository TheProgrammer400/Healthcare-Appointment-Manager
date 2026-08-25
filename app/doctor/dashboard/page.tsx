'use client';

import { useState, useEffect } from 'react';
import { Stethoscope, Calendar, Clock, CheckCircle2, FileText, Loader2, AlertCircle } from 'lucide-react';
import { PreVisitSummaryView } from '@/components/PreVisitSummaryView';
import { PostVisitSummaryView } from '@/components/PostVisitSummaryView';
import { VisitSummaryModal } from '@/components/VisitSummaryModal';

export default function DoctorDashboardPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModalAppt, setActiveModalAppt] = useState<any | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);

  useEffect(() => {
    fetchDoctorAppointments();
  }, []);

  const fetchDoctorAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data.appointments);
        if (data.data.appointments.length > 0 && !selectedAppt) {
          setSelectedAppt(data.data.appointments[0]);
        }
      } else {
        setError(data.error?.message || 'Failed to fetch doctor appointments');
      }
    } catch (err) {
      setError('Network error fetching appointments');
    } finally {
      setLoading(false);
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
      default:
        return <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-brand-400" /> Doctor Portal Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review patient triage notes, conduct consultations, and issue AI-formatted post-visit summaries.
          </p>
        </div>
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
          <span>Loading patient consultations...</span>
        </div>
      ) : appointments.length === 0 ? (
        <div className="py-16 text-center glass-card rounded-2xl p-8">
          <Calendar className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Consultations Scheduled</h3>
          <p className="text-xs text-slate-400 mt-1">You currently have no patient appointments assigned.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Patient Queue</h3>
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
                    <span className="font-bold text-white text-sm">{appt.patient.user.fullName}</span>
                    {getStatusBadge(appt.status)}
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                    <Clock className="w-3.5 h-3.5 text-brand-400" /> {new Date(appt.startAt).toUTCString()}
                  </p>
                  {appt.symptomForm?.llmUrgency && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                      Triage: {appt.symptomForm.llmUrgency} Urgency
                    </span>
                  )}
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
                      <h2 className="text-xl font-bold text-white">{selectedAppt.patient.user.fullName}</h2>
                      <p className="text-xs text-slate-400">Patient Contact: {selectedAppt.patient.user.email} | {selectedAppt.patient.user.phone || 'No phone'}</p>
                    </div>
                    <div>{getStatusBadge(selectedAppt.status)}</div>
                  </div>

                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                    <span className="text-slate-400 block font-medium">Scheduled Consultation Window:</span>
                    <span className="font-semibold text-white">{new Date(selectedAppt.startAt).toUTCString()} — {new Date(selectedAppt.endAt).toUTCString()}</span>
                  </div>

                  {selectedAppt.status === 'CONFIRMED' && (
                    <div className="flex items-center justify-end pt-2">
                      <button
                        onClick={() => setActiveModalAppt(selectedAppt)}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-teal-600/30 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Complete Consultation & Prescribe
                      </button>
                    </div>
                  )}
                </div>

                {selectedAppt.symptomForm && (
                  <PreVisitSummaryView symptomForm={selectedAppt.symptomForm} />
                )}

                {selectedAppt.visitSummary && (
                  <PostVisitSummaryView visitSummary={selectedAppt.visitSummary} isDoctorOrAdmin={true} />
                )}
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-12 text-center text-slate-400 min-h-[300px] flex items-center justify-center">
                Select a patient from the queue to view intake details.
              </div>
            )}
          </div>
        </div>
      )}

      {activeModalAppt && (
        <VisitSummaryModal
          appointmentId={activeModalAppt.id}
          patientName={activeModalAppt.patient.user.fullName}
          onCompleted={() => {
            setActiveModalAppt(null);
            fetchDoctorAppointments();
          }}
          onCancel={() => setActiveModalAppt(null)}
        />
      )}
    </div>
  );
}
