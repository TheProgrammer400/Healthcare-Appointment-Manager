'use client';

import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Loader2, Stethoscope, Pill, AlertCircle } from 'lucide-react';
import { PrescriptionItemInput } from '@/lib/validation';

interface VisitSummaryModalProps {
  appointmentId: string;
  patientName: string;
  onCompleted: () => void;
  onCancel: () => void;
}

export function VisitSummaryModal({ appointmentId, patientName, onCompleted, onCancel }: VisitSummaryModalProps) {
  const [doctorNotes, setDoctorNotes] = useState('');
  const [prescription, setPrescription] = useState<PrescriptionItemInput[]>([
    { medicine: '', dosage: '', frequency: 'twice daily', durationDays: 5 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPrescriptionItem = () => {
    setPrescription([
      ...prescription,
      { medicine: '', dosage: '', frequency: 'twice daily', durationDays: 5 },
    ]);
  };

  const removePrescriptionItem = (index: number) => {
    setPrescription(prescription.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PrescriptionItemInput, value: any) => {
    const updated = [...prescription];
    updated[index] = { ...updated[index], [field]: value };
    setPrescription(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorNotes.trim()) {
      setError('Please provide clinical doctor notes.');
      return;
    }

    // Filter out empty rows
    const validPrescription = prescription.filter((p) => p.medicine.trim() && p.dosage.trim());

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/appointments/${appointmentId}/visit-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorNotes,
          prescription: validPrescription,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to submit visit summary');
      }

      onCompleted();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the visit summary.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="glass-card rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-teal-500/20 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Post-Visit Notes & Prescription</h3>
              <p className="text-xs text-slate-400">Patient: <span className="text-white font-semibold">{patientName}</span></p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Clinical Doctor Notes <span className="text-red-400">*</span>
            </label>
            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              rows={4}
              placeholder="Record clinical diagnosis, observations, and care instructions..."
              className="w-full bg-slate-900/90 text-white text-sm border border-slate-700/80 rounded-xl p-3 focus:outline-none focus:border-teal-400 placeholder:text-slate-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Groq LLM will automatically generate a simplified patient-friendly summary from these notes.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-teal-400" /> Prescribe Medications & Reminders
              </label>
              <button
                type="button"
                onClick={addPrescriptionItem}
                className="inline-flex items-center gap-1 text-xs text-teal-300 hover:text-teal-200 bg-teal-950/60 border border-teal-800/80 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Medicine
              </button>
            </div>

            <div className="space-y-3">
              {prescription.map((item, idx) => (
                <div key={idx} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Medicine Name (e.g. Amoxicillin)"
                    value={item.medicine}
                    onChange={(e) => updateItem(idx, 'medicine', e.target.value)}
                    className="flex-1 bg-slate-950 text-white text-xs border border-slate-700 rounded-lg p-2 focus:outline-none focus:border-teal-400"
                  />
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 500mg)"
                    value={item.dosage}
                    onChange={(e) => updateItem(idx, 'dosage', e.target.value)}
                    className="w-28 bg-slate-950 text-white text-xs border border-slate-700 rounded-lg p-2 focus:outline-none focus:border-teal-400"
                  />
                  <input
                    type="text"
                    placeholder="Frequency (e.g. twice daily)"
                    value={item.frequency}
                    onChange={(e) => updateItem(idx, 'frequency', e.target.value)}
                    className="w-32 bg-slate-950 text-white text-xs border border-slate-700 rounded-lg p-2 focus:outline-none focus:border-teal-400"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={item.durationDays}
                      onChange={(e) => updateItem(idx, 'durationDays', Number(e.target.value))}
                      className="w-16 bg-slate-950 text-white text-xs border border-slate-700 rounded-lg p-2 text-center focus:outline-none focus:border-teal-400"
                    />
                    <span className="text-[10px] text-slate-400">days</span>
                  </div>
                  {prescription.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePrescriptionItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
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
              className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-teal-600/30 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Visit Summary...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Visit & Send Summary</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
