import { UrgencyLevel } from '@prisma/client';
import { AlertTriangle, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';

interface PreVisitSummaryProps {
  symptomForm: {
    rawSymptomsText: string;
    llmUrgency?: UrgencyLevel | null;
    llmChiefComplaint?: string | null;
    llmQuestions?: any;
    llmStatus: string;
  };
}

export function PreVisitSummaryView({ symptomForm }: PreVisitSummaryProps) {
  const getUrgencyBadge = (urgency?: UrgencyLevel | null) => {
    switch (urgency) {
      case 'HIGH':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">Urgency: HIGH</span>;
      case 'MEDIUM':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">Urgency: MEDIUM</span>;
      case 'LOW':
      default:
        return <span className="bg-teal-500/20 text-teal-400 border border-teal-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">Urgency: LOW</span>;
    }
  };

  const questions: string[] = Array.isArray(symptomForm.llmQuestions)
    ? symptomForm.llmQuestions
    : [];

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 className="font-bold text-white text-base flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-400" /> AI Clinical Intake & Triage Summary
        </h4>
        {symptomForm.llmStatus === 'SUCCESS' && getUrgencyBadge(symptomForm.llmUrgency)}
      </div>

      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-400 font-semibold block mb-1">Patient Symptoms (Raw Text):</span>
        <p className="text-slate-200 italic">{symptomForm.rawSymptomsText}</p>
      </div>

      {symptomForm.llmStatus === 'SUCCESS' ? (
        <div className="space-y-4 pt-2">
          {symptomForm.llmChiefComplaint && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Chief Complaint</span>
              <p className="text-sm font-medium text-slate-100 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                {symptomForm.llmChiefComplaint}
              </p>
            </div>
          )}

          {questions.length > 0 && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-brand-400" /> Suggested Doctor Intake Questions
              </span>
              <ul className="space-y-2">
                {questions.map((q, idx) => (
                  <li key={idx} className="text-xs text-slate-200 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>AI Triage summary is pending or degraded. Raw symptom details remain fully available.</span>
        </div>
      )}
    </div>
  );
}
