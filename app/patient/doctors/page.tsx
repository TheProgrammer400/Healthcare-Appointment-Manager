'use client';

import { useState, useEffect } from 'react';
import { DoctorCard } from '@/components/DoctorCard';
import { Stethoscope, Search, Loader2, AlertCircle } from 'lucide-react';

export default function PatientDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [specialisation, setSpecialisation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, [specialisation]);

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = specialisation
        ? `/api/doctors?specialisation=${encodeURIComponent(specialisation)}`
        : '/api/doctors';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDoctors(data.data.doctors);
      } else {
        setError(data.error?.message || 'Failed to load doctors list');
      }
    } catch (err) {
      setError('Network error loading doctors');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-brand-400" /> Find & Book Specialists
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse certified doctors and reserve instant appointment slots with AI intake support.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by specialisation..."
            value={specialisation}
            onChange={(e) => setSpecialisation(e.target.value)}
            className="w-full bg-slate-900/90 text-white text-xs border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-brand-400 placeholder:text-slate-500"
          />
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
          <span>Loading specialist doctor profiles...</span>
        </div>
      ) : doctors.length === 0 ? (
        <div className="py-16 text-center glass-card rounded-2xl p-8">
          <Stethoscope className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Specialists Found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search filter or clearing the specialisation term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  );
}
