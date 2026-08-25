'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  Sparkles,
  FileText,
  Pill,
  ChevronRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Bot,
  MessageSquare,
  Send,
  X
} from 'lucide-react';
import { PostVisitSummaryView } from '@/components/PostVisitSummaryView';

export default function PatientDashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedVisitSummary, setSelectedVisitSummary] = useState<any | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState<any | null>(null);
  const [newRescheduleTime, setNewRescheduleTime] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [showAiAssistantModal, setShowAiAssistantModal] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, apptRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/appointments'),
      ]);

      const meData = await meRes.json();
      if (meData.success && meData.data?.user) {
        setCurrentUser(meData.data.user);
      }

      const apptData = await apptRes.json();
      if (apptData.success) {
        setAppointments(apptData.data.appointments);
      } else {
        setError(apptData.error?.message || 'Failed to load appointments');
      }
    } catch (err) {
      setError('Network error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  // 1. Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const firstName = currentUser?.fullName?.split(' ')[0] || 'Patient';

  // 2. Next Appointment (earliest upcoming active appointment)
  const now = new Date();
  const upcomingAppointments = appointments
    .filter((a) => ['CONFIRMED', 'PENDING', 'HOLD'].includes(a.status) && new Date(a.startAt) >= now)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const nextAppointment = upcomingAppointments[0];

  // 3. Recent Visit (most recent completed appointment with visit summary)
  const completedVisits = appointments
    .filter((a) => a.status === 'COMPLETED' && a.visitSummary)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

  const recentVisit = completedVisits[0];

  // 4. Active Prescriptions
  const activeMedications: { medicine: string; dosage: string; frequency: string; durationDays: number; daysRemaining: number }[] = [];
  completedVisits.forEach((visit) => {
    const prescription: any[] = Array.isArray(visit.visitSummary?.prescription) ? visit.visitSummary.prescription : [];
    const visitDate = new Date(visit.startAt);

    prescription.forEach((p) => {
      const daysPassed = Math.floor((now.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));
      const remaining = p.durationDays - daysPassed;
      if (remaining > 0) {
        activeMedications.push({
          medicine: p.medicine,
          dosage: p.dosage,
          frequency: p.frequency,
          durationDays: p.durationDays,
          daysRemaining: remaining,
        });
      }
    });
  });

  // Action Handlers
  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this upcoming appointment?')) return;
    try {
      const res = await fetch(`/api/appointments/${id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
      } else {
        alert(data.error?.message || 'Failed to cancel appointment');
      }
    } catch (err) {
      alert('Error cancelling appointment');
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRescheduleModal || !newRescheduleTime) return;
    setRescheduleLoading(true);

    try {
      const res = await fetch(`/api/appointments/${showRescheduleModal.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStartAt: new Date(newRescheduleTime).toISOString() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to reschedule appointment');
      }
      setShowRescheduleModal(null);
      setNewRescheduleTime('');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Error rescheduling appointment');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleAskAiAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiResponse(null);

    try {
      // Use pre-visit symptom triage endpoint or sample AI query
      const res = await fetch('/api/doctors');
      // Simulated response for general health query or symptom triage
      setTimeout(() => {
        setAiResponse(
          `Based on clinical triage guidance: "${aiQuestion}". If you are experiencing severe, persistent, or worsening symptoms, we recommend booking a consultation with one of our specialized doctors.`
        );
        setAiLoading(false);
      }, 1000);
    } catch (err) {
      setAiResponse('AI Assistant is temporarily unavailable. Please consult your physician directly.');
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {getGreeting()}, <span className="gradient-text">{firstName}</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Here's an overview of your healthcare appointments and recent activity.
          </p>
        </div>
        <div className="bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800 text-xs font-semibold text-brand-300 flex items-center gap-2 w-fit">
          <Calendar className="w-4 h-4 text-brand-400" />
          <span>{formattedDate}</span>
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
          <span>Loading healthcare dashboard...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 2. Next Appointment — Most Important Card */}
          <section className="space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Upcoming Appointment
            </h2>

            {nextAppointment ? (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-brand-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950/30 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Stethoscope className="w-48 h-48 text-brand-300" />
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                        {nextAppointment.doctor.user.fullName.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white">
                          {nextAppointment.doctor.user.fullName}
                        </h3>
                        <span className="inline-block text-xs font-semibold px-3 py-0.5 rounded-full bg-brand-950 text-brand-300 border border-brand-800/60 mt-1">
                          {nextAppointment.doctor.specialisation}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 pt-2">
                      <div className="flex items-center gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <Calendar className="w-4 h-4 text-brand-400" />
                        <span className="font-semibold text-white">
                          {new Date(nextAppointment.startAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <Clock className="w-4 h-4 text-teal-400" />
                        <span className="font-semibold text-white">
                          {new Date(nextAppointment.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold text-white">CityCare Medical Center</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider self-start sm:self-auto">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {nextAppointment.status}
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href="/patient/appointments"
                        className="flex-1 sm:flex-none text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-colors"
                      >
                        View Details
                      </Link>

                      <button
                        onClick={() => setShowRescheduleModal(nextAppointment)}
                        className="flex-1 sm:flex-none text-center bg-brand-950/80 hover:bg-brand-900 text-brand-300 border border-brand-800 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors"
                      >
                        Reschedule
                      </button>

                      <button
                        onClick={() => handleCancelAppointment(nextAppointment.id)}
                        className="flex-1 sm:flex-none text-center bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-900/50 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-3xl p-8 text-center space-y-4 border border-slate-800">
                <Calendar className="w-12 h-12 text-slate-500 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">No Upcoming Appointments</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Schedule your next consultation with our certified doctors.
                  </p>
                </div>
                <Link
                  href="/patient/doctors"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-lg shadow-brand-600/30 transition-all"
                >
                  <Stethoscope className="w-4 h-4" /> Book an Appointment
                </Link>
              </div>
            )}
          </section>

          {/* 3. Quick Actions Row */}
          <section className="space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/patient/doctors"
                className="glass-card glass-card-hover rounded-2xl p-5 space-y-3 group"
              >
                <div className="p-3 rounded-xl bg-brand-500/20 text-brand-300 w-fit group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-brand-300 transition-colors flex items-center justify-between">
                    Book Appointment <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-brand-300" />
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Find a specialist doctor and reserve a slot</p>
                </div>
              </Link>

              <Link
                href="/patient/appointments"
                className="glass-card glass-card-hover rounded-2xl p-5 space-y-3 group"
              >
                <div className="p-3 rounded-xl bg-teal-500/20 text-teal-300 w-fit group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-teal-300 transition-colors flex items-center justify-between">
                    My Appointments <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-300" />
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">View upcoming and past consultations</p>
                </div>
              </Link>

              <button
                onClick={() => setShowAiAssistantModal(true)}
                className="glass-card glass-card-hover rounded-2xl p-5 space-y-3 text-left group w-full"
              >
                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 w-fit group-hover:scale-110 transition-transform">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-purple-300 transition-colors flex items-center justify-between">
                    Health Assistant <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300" />
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Ask the AI assistant healthcare questions</p>
                </div>
              </button>

              <Link
                href="/patient/appointments"
                className="glass-card glass-card-hover rounded-2xl p-5 space-y-3 group"
              >
                <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300 w-fit group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-amber-300 transition-colors flex items-center justify-between">
                    Medical History <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-300" />
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">View previous clinical notes and records</p>
                </div>
              </Link>
            </div>
          </section>

          {/* 4. Recent Visit & Prescriptions Dual Column */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 4. Recent Visit / Post-Visit Summary */}
            <section className="space-y-3">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Recent Visit
              </h2>

              {recentVisit ? (
                <div className="glass-card rounded-2xl p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-white">{recentVisit.doctor.user.fullName}</h3>
                      <span className="text-xs text-brand-300 font-semibold">{recentVisit.doctor.specialisation}</span>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(recentVisit.startAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold uppercase">
                      Visit Summary Available
                    </span>
                  </div>

                  {Array.isArray(recentVisit.visitSummary?.prescription) && recentVisit.visitSummary.prescription.length > 0 && (
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>💊 <strong>{recentVisit.visitSummary.prescription.length} medications</strong> prescribed during this visit.</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setSelectedVisitSummary(recentVisit.visitSummary)}
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Summary & Prescription
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-6 text-center text-slate-400 text-xs space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="font-semibold text-slate-300">No Recent Visit Records</p>
                  <p className="text-slate-500">Post-visit clinical summaries will appear here after your consultation.</p>
                </div>
              )}
            </section>

            {/* 5. Prescriptions / Active Medications */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Active Medications
                </h2>
                {activeMedications.length > 0 && (
                  <Link href="/patient/appointments" className="text-xs text-brand-300 hover:underline">
                    View All Medications
                  </Link>
                )}
              </div>

              {activeMedications.length > 0 ? (
                <div className="glass-card rounded-2xl p-6 space-y-3">
                  {activeMedications.slice(0, 3).map((med, idx) => (
                    <div key={idx} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
                          <Pill className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{med.medicine}</h4>
                          <p className="text-xs text-slate-400">{med.dosage} · {med.frequency}</p>
                        </div>
                      </div>

                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 text-amber-300 border border-slate-700">
                        {med.daysRemaining} days remaining
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-6 text-center text-slate-400 text-xs space-y-2">
                  <Pill className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="font-semibold text-slate-300">No Active Medications</p>
                  <p className="text-slate-500">Your prescribed medications and dosage reminders will be listed here.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-card rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Reschedule Appointment</h3>
              <button onClick={() => setShowRescheduleModal(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select New Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newRescheduleTime}
                  onChange={(e) => setNewRescheduleTime(e.target.value)}
                  className="w-full bg-slate-900/90 text-white text-xs border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowRescheduleModal(null)} className="px-4 py-2 text-xs text-slate-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" disabled={rescheduleLoading} className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-4 py-2 rounded-xl">
                  {rescheduleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Visit Summary View Modal */}
      {selectedVisitSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setSelectedVisitSummary(null)} className="p-2 text-slate-400 hover:text-white glass-card rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <PostVisitSummaryView visitSummary={selectedVisitSummary} />
          </div>
        </div>
      )}

      {/* Health Assistant Modal */}
      {showAiAssistantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-card rounded-3xl max-w-lg w-full p-6 space-y-4 border border-purple-500/20 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">AI Health Assistant</h3>
                  <p className="text-[11px] text-slate-400">Ask medical symptom or intake questions</p>
                </div>
              </div>
              <button onClick={() => setShowAiAssistantModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAskAiAssistant} className="space-y-3">
              <textarea
                rows={3}
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Ask about symptoms, visit preparation, or specialist guidance..."
                className="w-full bg-slate-900/90 text-white text-xs border border-slate-700/80 rounded-xl p-3 focus:outline-none focus:border-purple-400 placeholder:text-slate-500"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Ask Assistant</>}
                </button>
              </div>
            </form>

            {aiResponse && (
              <div className="bg-slate-900/80 p-4 rounded-xl border border-purple-500/30 text-xs text-slate-200 space-y-2">
                <span className="font-bold text-purple-300 block">AI Triage Guidance:</span>
                <p className="leading-relaxed">{aiResponse}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
