import Link from 'next/link';
import { Activity, CalendarCheck, Sparkles, ShieldCheck, Clock, ArrowRight, UserCheck, Stethoscope } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-950/80 border border-brand-800/60 text-brand-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span>Next-Generation Healthcare Management System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Seamless Medical Booking & <br />
          <span className="gradient-text">AI-Powered Follow-up Care</span>
        </h1>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Book specialist appointments instantly with real-time double-booking prevention, receive AI-driven pre-visit intake summaries, and access patient-friendly follow-up instructions.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/patient/doctors"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 text-white font-semibold text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-brand-600/30 transition-all hover:gap-3"
          >
            <Stethoscope className="w-5 h-5" /> Book an Appointment <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 glass-card hover:bg-slate-900 text-slate-200 font-semibold text-sm px-6 py-3.5 rounded-2xl transition-all"
          >
            Doctor / Portal Sign In
          </Link>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="p-3 rounded-xl bg-brand-500/20 text-brand-300 w-fit">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Atomic Slot Booking</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Database-level partial unique indexing ensures zero double-booking under concurrent requests with a 5-minute temporary hold.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="p-3 rounded-xl bg-teal-500/20 text-teal-300 w-fit">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Pre-Visit AI Triage</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Groq LLM extracts chief complaints, urgency levels, and intake questions from patient symptoms for instant doctor review.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 w-fit">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Automated Reminders</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Prescription dosages automatically break down into medication reminder schedules delivered via asynchronous background queues.
          </p>
        </div>
      </section>
    </div>
  );
}
