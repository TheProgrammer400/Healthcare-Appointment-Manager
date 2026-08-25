import { Activity } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-4 mt-auto text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-400" />
          <span className="font-semibold text-slate-300">CareSync Healthcare Appointment & Follow-up Manager</span>
        </div>
        <div className="flex items-center gap-6 text-slate-400">
          <span>Powered by Groq LLM & Neon PostgreSQL</span>
          <span>•</span>
          <span>Vercel Serverless Architecture</span>
        </div>
      </div>
    </footer>
  );
}
