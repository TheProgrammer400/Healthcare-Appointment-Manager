'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SlotPicker } from '@/components/SlotPicker';
import { SymptomModal } from '@/components/SymptomModal';
import { Stethoscope, Clock, ChevronLeft, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function BookDoctorPage({ params }: { params: { doctorId: string } }) {
  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [heldAppointmentId, setHeldAppointmentId] = useState<string | null>(null);
  const [heldSlotTime, setHeldSlotTime] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/doctors/${params.doctorId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDoctor(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, [params.doctorId]);

  const handleHoldSuccess = (appointmentId: string, slotTimeStr: string) => {
    setHeldAppointmentId(appointmentId);
    setHeldSlotTime(slotTimeStr);
  };

  const handleConfirmed = () => {
    router.push('/patient/appointments?booked=true');
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        <span>Loading doctor profile...</span>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-red-400 font-semibold">Doctor profile not found</p>
        <Link href="/patient/doctors" className="text-xs text-brand-400 hover:underline">
          Return to Doctor Search
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/patient/doctors" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Doctors Directory
      </Link>

      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-teal-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-brand-500/20">
            {doctor.user.fullName.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{doctor.user.fullName}</h1>
            <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-brand-950 text-brand-300 border border-brand-800/60">
              {doctor.specialisation}
            </span>
            <p className="text-slate-400 text-xs mt-2 max-w-xl">{doctor.bio || 'Dedicated specialist.'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-300">
          <Clock className="w-4 h-4 text-brand-400" />
          <span>Slot Duration: <strong>{doctor.slotDurationMinutes} Minutes</strong></span>
        </div>
      </div>

      <SlotPicker doctorId={doctor.id} onHoldSuccess={handleHoldSuccess} />

      {heldAppointmentId && heldSlotTime && (
        <SymptomModal
          appointmentId={heldAppointmentId}
          slotTimeStr={heldSlotTime}
          onConfirmed={handleConfirmed}
          onCancel={() => {
            setHeldAppointmentId(null);
            setHeldSlotTime(null);
          }}
        />
      )}
    </div>
  );
}
