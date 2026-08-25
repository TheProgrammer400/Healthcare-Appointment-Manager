'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface SlotPickerProps {
  doctorId: string;
  onHoldSuccess: (appointmentId: string, slotTimeStr: string) => void;
}

export function SlotPicker({ doctorId, onHoldSuccess }: SlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [holdingSlot, setHoldingSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    setError(null);

    fetch(`/api/doctors/${doctorId}/availability?date=${selectedDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSlots(data.data.slots);
        } else {
          setError(data.error?.message || 'Failed to fetch available slots');
          setSlots([]);
        }
      })
      .catch((err) => {
        setError('Network error fetching slots');
        setSlots([]);
      })
      .finally(() => setLoading(false));
  }, [doctorId, selectedDate]);

  const handleSelectSlot = async (slotIsoStr: string) => {
    setHoldingSlot(slotIsoStr);
    setError(null);

    try {
      const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `idemp-${Date.now()}`;

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          doctorId,
          startAt: slotIsoStr,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to hold appointment slot');
      }

      onHoldSuccess(data.data.appointment.id, slotIsoStr);
    } catch (err: any) {
      setError(err.message || 'Slot booking conflict occurred');
    } finally {
      setHoldingSlot(null);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-400" /> Select Appointment Date & Time
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            Choose an open slot. Slot will be held for 5 minutes while you complete intake.
          </p>
        </div>

        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-900/90 text-white text-sm border border-slate-700/80 rounded-xl px-4 py-2 focus:outline-none focus:border-brand-400"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
          <span>Checking real-time doctor availability...</span>
        </div>
      ) : slots.length === 0 ? (
        <div className="py-12 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800/60">
          <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="font-medium text-sm text-slate-300">No open slots available on this date</p>
          <p className="text-xs text-slate-500 mt-1">Doctor may be on leave or fully booked. Try another date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {slots.map((slotIso) => {
            const timeFormatted = new Date(slotIso).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'UTC',
            });
            const isHolding = holdingSlot === slotIso;

            return (
              <button
                key={slotIso}
                disabled={isHolding}
                onClick={() => handleSelectSlot(slotIso)}
                className="group relative p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-gradient-to-r hover:from-brand-600 hover:to-teal-600 hover:border-transparent text-slate-200 hover:text-white transition-all text-center flex flex-col items-center justify-center gap-1 shadow-sm"
              >
                {isHolding ? (
                  <Loader2 className="w-4 h-4 animate-spin text-brand-300" />
                ) : (
                  <>
                    <span className="font-semibold text-sm">{timeFormatted}</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-200">Available</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
