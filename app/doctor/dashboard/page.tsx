'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Loader2,
  AlertCircle,
  Search,
  UserCheck,
  ClipboardList,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Pill,
  User,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { PreVisitSummaryView } from '@/components/PreVisitSummaryView';
import { PostVisitSummaryView } from '@/components/PostVisitSummaryView';
import { VisitSummaryModal } from '@/components/VisitSummaryModal';

export default function DoctorDashboardPage() {
  const [user, setUser] = useState<any | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModalAppt, setActiveModalAppt] = useState<any | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch current doctor profile
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (userData.success) {
        setUser(userData.data.user);
      }

      // 2. Fetch doctor appointments
      const apptRes = await fetch('/api/appointments');
      const apptData = await apptRes.json();
      if (apptData.success) {
        const list = apptData.data.appointments || [];
        setAppointments(list);
        if (list.length > 0 && !selectedAppt) {
          // Select first upcoming or first appointment
          const firstActive = list.find((a: any) => a.status === 'CONFIRMED') || list[0];
          setSelectedAppt(firstActive);
        }
      } else {
        setError(apptData.error?.message || 'Failed to fetch doctor appointments');
      }
    } catch (err) {
      setError('Network error loading dashboard data');
    } fontally: {
      setLoading(false);
    }
  };

  const refreshAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      if (data.success) {
        const list = data.data.appointments || [];
        setAppointments(list);
        if (selectedAppt) {
          const updatedSelected = list.find((a: any) => a.id === selectedAppt.id);
          if (updatedSelected) setSelectedAppt(updatedSelected);
        }
      }
    } catch (err) {
      console.error('Error refreshing appointments:', err);
    }
  };

  // Greeting based on current hour
  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const doctorLastName = useMemo(() => {
    if (!user?.fullName) return 'Doctor';
    const parts = user.fullName.trim().split(' ');
    return parts.length > 1 ? `Dr. ${parts[parts.length - 1]}` : `Dr. ${user.fullName}`;
  }, [user]);

  const doctorSpecialization = user?.doctorProfile?.specialization || 'Clinical Care';

  // Computed Overview Statistics
  const stats = useMemo(() => {
    const totalToday = appointments.length;
    const waiting = appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'HOLD').length;
    const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
    const pendingNotes = appointments.filter(
      (a) => a.status === 'COMPLETED' && (!a.visitSummary || a.visitSummary.llmStatus !== 'SUCCESS')
    ).length;
    const cancelled = appointments.filter((a) => a.status === 'CANCELLED').length;

    return { totalToday, waiting, completed, pendingNotes, cancelled };
  }, [appointments]);

  // Next Patient (First upcoming CONFIRMED appointment)
  const nextPatient = useMemo(() => {
    return appointments.find((a) => a.status === 'CONFIRMED') || null;
  }, [appointments]);

  // Filtered Appointments list
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      // Filter by status
      if (statusFilter === 'UPCOMING' && appt.status !== 'CONFIRMED') return false;
      if (statusFilter === 'WAITING' && appt.status !== 'CONFIRMED' && appt.status !== 'HOLD') return false;
      if (statusFilter === 'COMPLETED' && appt.status !== 'COMPLETED') return false;
      if (statusFilter === 'CANCELLED' && appt.status !== 'CANCELLED') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const patientName = appt.patient?.user?.fullName?.toLowerCase() || '';
        const patientEmail = appt.patient?.user?.email?.toLowerCase() || '';
        const apptId = appt.id.toLowerCase();
        return patientName.includes(q) || patientEmail.includes(q) || apptId.includes(q);
      }

      return true;
    });
  }, [appointments, statusFilter, searchQuery]);

  // Recent Patients (Completed visits)
  const recentPatients = useMemo(() => {
    return appointments
      .filter((a) => a.status === 'COMPLETED')
      .slice(0, 5);
  }, [appointments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Upcoming
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
            {status}
          </span>
        );
    }
  };

  const getUrgencyPill = (urgency?: string | null) => {
    switch (urgency) {
      case 'HIGH':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">🔴 High Urgency</span>;
      case 'MEDIUM':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">🟡 Medium Urgency</span>;
      case 'LOW':
      default:
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">🟢 Low Urgency</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Personalized Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            {greetingTime}, {doctorLastName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Here's your schedule, patient queue, and today's clinical activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl text-xs text-slate-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-400" />
            <span className="font-semibold text-white">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <span className="bg-brand-500/20 text-brand-300 border border-brand-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold">
            🩺 {doctorSpecialization}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Today's Overview (Statistics Row) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Today's Visits</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white">{stats.totalToday}</span>
            <span className="text-[10px] text-slate-500 font-medium">Scheduled</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/40 transition-all">
          <span className="text-xs font-semibold text-emerald-400 block mb-1">Waiting / Upcoming</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-300">{stats.waiting}</span>
            <span className="text-[10px] text-emerald-400/70 font-medium">Ready</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-brand-500/20 bg-brand-950/10 hover:border-brand-500/40 transition-all">
          <span className="text-xs font-semibold text-brand-400 block mb-1">Completed</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-brand-300">{stats.completed}</span>
            <span className="text-[10px] text-brand-400/70 font-medium">Done Today</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-amber-500/20 bg-amber-950/10 hover:border-amber-500/40 transition-all">
          <span className="text-xs font-semibold text-amber-400 block mb-1">Pending Notes</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-300">{stats.pendingNotes}</span>
            <span className="text-[10px] text-amber-400/70 font-medium">Action Needed</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          <span>Loading patient consultations...</span>
        </div>
      ) : appointments.length === 0 ? (
        <div className="py-16 text-center glass-card rounded-2xl p-8">
          <Calendar className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Consultations Scheduled</h3>
          <p className="text-xs text-slate-400 mt-1">You currently have no patient appointments assigned for today.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column (2/3 width): Next Patient, Queue & Patient Workspace */}
          <div className="lg:col-span-2 space-y-6">
            {/* 3. Next Patient Card */}
            {nextPatient && (
              <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-slate-900/90 to-slate-900/90 relative overflow-hidden shadow-xl shadow-emerald-950/20">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Next Patient in Queue
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(nextPatient.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                      {nextPatient.patient?.user?.fullName}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {doctorSpecialization} • Scheduled Appointment
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        AI Intake ✓
                      </span>
                      {getUrgencyPill(nextPatient.symptomForm?.llmUrgency)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedAppt(nextPatient)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      View Intake
                    </button>
                    <button
                      onClick={() => setActiveModalAppt(nextPatient)}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
                    >
                      <span>Start Consultation</span> <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Patient Queue Section with Search & Filter */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-brand-400" /> Today's Patient Queue
                </h3>
                {/* Search Patient Bar */}
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patients..."
                    className="w-full bg-slate-900/90 text-white text-xs border border-slate-800 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-brand-400 placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* 5. Queue Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {[
                  { key: 'ALL', label: `All (${appointments.length})` },
                  { key: 'UPCOMING', label: `Upcoming (${stats.waiting})` },
                  { key: 'COMPLETED', label: `Completed (${stats.completed})` },
                  { key: 'CANCELLED', label: `Cancelled (${stats.cancelled})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                      statusFilter === tab.key
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Queue List Cards */}
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredAppointments.length === 0 ? (
                  <div className="p-8 text-center glass-card rounded-2xl text-xs text-slate-400">
                    No patients match your search filter.
                  </div>
                ) : (
                  filteredAppointments.map((appt) => {
                    const isSelected = selectedAppt?.id === appt.id;
                    const isCancelled = appt.status === 'CANCELLED';

                    return (
                      <div
                        key={appt.id}
                        onClick={() => setSelectedAppt(appt)}
                        className={`glass-card p-4 rounded-2xl cursor-pointer transition-all border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isCancelled ? 'opacity-50 bg-slate-950/40 border-slate-900' : ''
                        } ${
                          isSelected
                            ? 'border-brand-400 bg-slate-900/90 shadow-lg shadow-brand-500/10'
                            : 'border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-brand-300 font-mono text-xs font-bold shrink-0">
                            {new Date(appt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{appt.patient?.user?.fullName}</h4>
                            <p className="text-xs text-slate-400">{doctorSpecialization}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {appt.symptomForm && (
                            <span className="text-[10px] text-emerald-400 font-semibold hidden sm:inline">
                              AI Intake ✓
                            </span>
                          )}
                          {getUrgencyPill(appt.symptomForm?.llmUrgency)}
                          {getStatusBadge(appt.status)}

                          {appt.status === 'CONFIRMED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveModalAppt(appt);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-md transition-all ml-1"
                            >
                              Start Visit
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 6. Selected Patient Workspace & Consultation Workflow Tracker */}
            {selectedAppt && (
              <div className="space-y-6 pt-4 border-t border-slate-800">
                {/* Patient Information Card */}
                <div className="glass-card rounded-2xl p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-brand-400" /> {selectedAppt.patient?.user?.fullName}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Patient ID: <span className="font-mono text-slate-300">PT-{selectedAppt.patient?.id.slice(-6).toUpperCase()}</span> • Contact: {selectedAppt.patient?.user?.email}
                      </p>
                    </div>
                    <div>{getStatusBadge(selectedAppt.status)}</div>
                  </div>

                  {/* Consultation Workflow Step Tracker */}
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                      Consultation Workflow Progress
                    </span>
                    <div className="flex items-center justify-between text-xs overflow-x-auto pb-1 gap-2">
                      <div className={`flex items-center gap-1.5 ${selectedAppt.symptomForm ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                        <CheckCircle2 className="w-4 h-4" /> <span>Pre-Visit Intake</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-700 shrink-0" />
                      <div className={`flex items-center gap-1.5 ${selectedAppt.symptomForm?.llmStatus === 'SUCCESS' ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                        <CheckCircle2 className="w-4 h-4" /> <span>AI Triage</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-700 shrink-0" />
                      <div className={`flex items-center gap-1.5 ${selectedAppt.status === 'COMPLETED' ? 'text-emerald-400 font-semibold' : 'text-brand-400 font-bold'}`}>
                        <Activity className="w-4 h-4" /> <span>Consultation</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-700 shrink-0" />
                      <div className={`flex items-center gap-1.5 ${selectedAppt.visitSummary ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                        <FileText className="w-4 h-4" /> <span>Clinical Notes & Prescription</span>
                      </div>
                    </div>
                  </div>

                  {selectedAppt.status === 'CONFIRMED' && (
                    <div className="flex items-center justify-end pt-2">
                      <button
                        onClick={() => setActiveModalAppt(selectedAppt)}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Complete Consultation & Prescribe
                      </button>
                    </div>
                  )}
                </div>

                {/* AI Clinical Intake View */}
                {selectedAppt.symptomForm && (
                  <PreVisitSummaryView symptomForm={selectedAppt.symptomForm} />
                )}

                {/* Post-Visit Summary & Prescription View */}
                {selectedAppt.visitSummary && (
                  <PostVisitSummaryView visitSummary={selectedAppt.visitSummary} isDoctorOrAdmin={true} />
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar (1/3 width): Needs Attention, Availability, Recent Patients */}
          <div className="space-y-6">
            {/* 7. Needs Your Attention Card */}
            <div className="glass-card rounded-2xl p-5 border border-amber-500/30 bg-amber-950/10 space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Needs Your Attention
              </h4>

              <div className="space-y-2.5 text-xs">
                {stats.waiting > 0 && (
                  <div
                    onClick={() => setStatusFilter('UPCOMING')}
                    className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 hover:border-amber-500/40 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <span className="text-slate-300 font-medium">⚠️ {stats.waiting} appointments awaiting visit</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                )}

                {stats.pendingNotes > 0 && (
                  <div
                    onClick={() => setStatusFilter('COMPLETED')}
                    className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 hover:border-amber-500/40 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <span className="text-slate-300 font-medium">⚠️ {stats.pendingNotes} visits awaiting clinical notes</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                )}

                {stats.waiting === 0 && stats.pendingNotes === 0 && (
                  <div className="p-3 bg-slate-900/40 rounded-xl text-slate-400 text-center italic">
                    ✓ All appointments up to date!
                  </div>
                )}
              </div>
            </div>

            {/* 8. Today's Availability Shortcut */}
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-400" /> Today's Shift Availability
                </h4>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Standard Shift:</span>
                  <span className="font-semibold text-white">09:00 AM – 05:00 PM</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Clinic Timezone:</span>
                  <span>Asia/Kolkata</span>
                </div>
              </div>
              <Link
                href="/doctor/availability"
                className="inline-flex items-center justify-between w-full text-xs font-semibold text-brand-300 hover:text-brand-200 bg-brand-950/60 border border-brand-800/80 px-3.5 py-2.5 rounded-xl transition-colors"
              >
                <span>Manage Availability & Leave</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 9. Recent Patients List */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" /> Recent Completed Patients
              </h4>

              <div className="space-y-2.5">
                {recentPatients.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-2 text-center">No completed visits today yet.</p>
                ) : (
                  recentPatients.map((appt) => (
                    <div
                      key={appt.id}
                      onClick={() => setSelectedAppt(appt)}
                      className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white block">{appt.patient?.user?.fullName}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(appt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-[10px] bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2 py-0.5 rounded-full font-semibold">
                        Completed
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consultation & Visit Summary Modal */}
      {activeModalAppt && (
        <VisitSummaryModal
          appointmentId={activeModalAppt.id}
          patientName={activeModalAppt.patient?.user?.fullName || 'Patient'}
          onCompleted={() => {
            setActiveModalAppt(null);
            refreshAppointments();
          }}
          onCancel={() => setActiveModalAppt(null)}
        />
      )}
    </div>
  );
}
