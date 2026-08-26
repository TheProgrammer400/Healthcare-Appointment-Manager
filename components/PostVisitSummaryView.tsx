import { Pill, FileCheck, ClipboardList, AlertCircle } from 'lucide-react';

interface PostVisitSummaryProps {
  visitSummary: {
    doctorNotes?: string;
    prescription: any;
    llmPatientSummary?: string | null;
    llmStatus: string;
  };
  isDoctorOrAdmin?: boolean;
}

export function PostVisitSummaryView({ visitSummary, isDoctorOrAdmin }: PostVisitSummaryProps) {
  const prescriptionList: any[] = Array.isArray(visitSummary.prescription) ? visitSummary.prescription : [];

  const renderFormattedSummary = (summaryText: string) => {
    // Split by markdown headers starting with ###
    const sections = summaryText.split(/(?=###\s+)/g);

    return (
      <div className="space-y-3">
        {sections.map((section, idx) => {
          const trimmed = section.trim();
          if (!trimmed) return null;

          if (trimmed.startsWith('###')) {
            const lines = trimmed.split('\n');
            const title = lines[0].replace(/^###\s*/, '').trim();
            const body = lines.slice(1).join('\n').trim();

            return (
              <div key={idx} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <h6 className="text-xs font-extrabold uppercase tracking-wider text-brand-300">
                  {title}
                </h6>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                  {body}
                </p>
              </div>
            );
          }

          return (
            <p key={idx} className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h4 className="font-bold text-white text-base flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-teal-400" /> Post-Visit Summary & Prescription
        </h4>
        <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full font-semibold">
          Completed Visit
        </span>
      </div>

      {visitSummary.llmPatientSummary ? (
        <div className="space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-brand-400" /> Patient-Friendly Summary
          </h5>
          {renderFormattedSummary(visitSummary.llmPatientSummary)}
        </div>
      ) : (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Patient-friendly summary generation is processing or unavailable. Prescription details below are official.</span>
        </div>
      )}

      {prescriptionList.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Pill className="w-4 h-4 text-teal-400" /> Prescribed Medications
          </h5>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Medicine</th>
                  <th className="p-3">Dosage</th>
                  <th className="p-3">Frequency</th>
                  <th className="p-3">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {prescriptionList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 font-semibold text-white">{item.medicine}</td>
                    <td className="p-3 text-brand-300">{item.dosage}</td>
                    <td className="p-3">{item.frequency}</td>
                    <td className="p-3">{item.durationDays} Days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isDoctorOrAdmin && visitSummary.doctorNotes && (
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800/80 space-y-2 mt-4">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
            Clinical Notes (Confidential Doctor View)
          </span>
          <p className="text-xs text-slate-300 italic whitespace-pre-wrap">{visitSummary.doctorNotes}</p>
        </div>
      )}
    </div>
  );
}
