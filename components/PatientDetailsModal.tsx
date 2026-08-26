'use client';

import { useEffect } from 'react';
import {
  X,
  User,
  Calendar,
  CheckCircle2,
  FileText,
  Activity,
  ChevronRight,
  AlertCircle,
  Stethoscope,
  ArrowRight,
} from 'lucide-react';
import { PreVisitSummaryView } from '@/components/PreVisitSummaryView';
import { PostVisitSummaryView } from '@/components/PostVisitSummaryView';

interface PatientDetailsModalProps {
  appointment: any;
  doctorSpecialization: string;
  onClose: () => void;
  onStartConsultation: (appointment: any) => void;
}

export function PatientDetailsModal({
  appointment,
  doctorSpecialization,
  onClose,
  onStartConsultation,
}: PatientDetailsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!appointment) return null;

  const patientName = appointment.patient?.user?.fullName || 'Patient';
  const patientEmail = appointment.patient?.user?.email || 'N/A';
  const patientId = appointment.patient?.id
    ? `PT-${appointment.patient.id.slice(-6).toUpperCase()}`
    : 'N/A';
  const apptTime = new Date(appointment.startAt).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Upcoming
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="bg-brand-500/20 text-brand-300 border border-brand-500/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-semibold">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-brand-500/20 max-h-[90vh] overflow-y-auto space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-white">{patientName}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Patient ID: <span className="font-mono text-slate-300">{patientId}</span> • {patientEmail}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(appointment.status)}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Appointment Detail Meta & Workflow Tracker */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-brand-400" />
              <span className="font-semibold text-white">{apptTime}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Stethoscope className="w-4 h-4 text-teal-400" />
              <span>Specialty: <strong className="text-white">{doctorSpecialization}</strong></span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Consultation Progress
            </span>
            <div className="flex items-center justify-between text-xs overflow-x-auto pb-1 gap-2">
              <div className={`flex items-center gap-1.5 ${appointment.symptomForm ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                <CheckCircle2 className="w-4 h-4" /> <span>Pre-Visit Intake</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-700 shrink-0" />
              <div className={`flex items-center gap-1.5 ${appointment.symptomForm?.llmStatus === 'SUCCESS' ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                <CheckCircle2 className="w-4 h-4" /> <span>AI Triage</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-700 shrink-0" />
              <div className={`flex items-center gap-1.5 ${appointment.status === 'COMPLETED' ? 'text-emerald-400 font-semibold' : 'text-brand-400 font-bold'}`}>
                <Activity className="w-4 h-4" /> <span>Consultation</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-700 shrink-0" />
              <div className={`flex items-center gap-1.5 ${appointment.visitSummary ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                <FileText className="w-4 h-4" /> <span>Clinical Notes</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Clinical Intake Section */}
        {appointment.symptomForm ? (
          <PreVisitSummaryView symptomForm={appointment.symptomForm} />
        ) : (
          <div className="glass-card rounded-2xl p-6 text-center text-slate-400 border border-slate-800 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="font-bold text-white text-sm">AI Clinical Intake Not Available</h4>
            <p className="text-xs text-slate-400">No pre-visit symptom intake form was submitted for this appointment.</p>
          </div>
        )}

        {/* Post-Visit Summary & Prescription Section */}
        {appointment.visitSummary ? (
          <PostVisitSummaryView visitSummary={appointment.visitSummary} isDoctorOrAdmin={true} />
        ) : (
          <div className="glass-card rounded-2xl p-6 text-center text-slate-400 border border-slate-800 space-y-2">
            <FileText className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="font-bold text-white text-sm">Post-Visit Summary Not Available</h4>
            <p className="text-xs text-slate-400">Post-visit summary and prescription have not been submitted for this consultation yet.</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div>
            {appointment.status === 'CONFIRMED' && (
              <button
                onClick={() => {
                  onClose();
                  onStartConsultation(appointment);
                }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Stethoscope className="w-4 h-4" /> Start Consultation & Complete Visit <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
