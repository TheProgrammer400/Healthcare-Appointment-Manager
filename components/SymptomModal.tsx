'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Clock, AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

interface SymptomModalProps {
  appointmentId: string;
  slotTimeStr: string;
  onConfirmed: () => void;
  onCancel: () => void;
}

export function SymptomModal({ appointmentId, slotTimeStr, onConfirmed, onCancel }: SymptomModalProps) {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(300); // 5 minute hold countdown

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setError('Please describe your symptoms before confirming.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/appointments/${appointmentId}/symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to submit symptom form');
      }

      onConfirmed();
    } catch (err: any) {
      setError(err.message || 'An error occurred during confirmation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-card rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-brand-500/20">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-500/20 text-brand-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Complete Pre-Visit Intake</h3>
              <p className="text-xs text-slate-400">AI Intake Assistant Summary</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Hold: {formatCountdown(timeLeftSeconds)}</span>
          </div>
        </div>

        {timeLeftSeconds === 0 ? (
          <div className="py-8 text-center text-red-400 space-y-3">
            <AlertCircle className="w-10 h-10 mx-auto" />
            <p className="font-semibold text-sm">Slot Hold Expired</p>
            <p className="text-xs text-slate-400">Your 5-minute slot hold has expired. Please select a new slot.</p>
            <button
              onClick={onCancel}
              className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl"
            >
              Select Another Slot
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 text-xs text-slate-300">
              <span className="text-slate-400 block font-medium">Target Time:</span>
              <span className="font-semibold text-brand-300 text-sm">{new Date(slotTimeStr).toUTCString()}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Describe Your Symptoms & Reason for Visit <span className="text-red-400">*</span>
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={4}
                placeholder="Describe what you are experiencing (e.g. persistent headache for 3 days, mild fever, dizziness)..."
                className="w-full bg-slate-900/90 text-white text-sm border border-slate-700/80 rounded-xl p-3 focus:outline-none focus:border-brand-400 placeholder:text-slate-500"
              />
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400 inline" /> AI will prepare a triage summary for your doctor before your visit.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Intake...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Book Appointment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
