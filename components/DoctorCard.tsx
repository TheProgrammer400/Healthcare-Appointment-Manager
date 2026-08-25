'use client';

import Link from 'next/link';
import { User, Clock, CalendarCheck, ChevronRight } from 'lucide-react';

interface DoctorCardProps {
  doctor: {
    id: string;
    specialisation: string;
    slotDurationMinutes: number;
    bio?: string | null;
    user: {
      fullName: string;
      email: string;
    };
  };
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <div className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand-500/20">
              {doctor.user.fullName.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <h3 className="font-bold text-lg text-white group-hover:text-brand-300 transition-colors">
                {doctor.user.fullName}
              </h3>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-950/80 text-brand-300 border border-brand-800/50">
                {doctor.specialisation}
              </span>
            </div>
          </div>
        </div>

        <p className="text-slate-400 text-xs leading-relaxed mb-6 line-clamp-3">
          {doctor.bio || 'Experienced specialist committed to providing personalized patient care.'}
        </p>
      </div>

      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-brand-400" />
          <span>{doctor.slotDurationMinutes} min slot</span>
        </div>

        <Link
          href={`/patient/book/${doctor.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 text-white px-3 py-2 rounded-xl shadow-md shadow-brand-600/20 transition-all hover:gap-2"
        >
          <CalendarCheck className="w-3.5 h-3.5" /> Book Slot <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
