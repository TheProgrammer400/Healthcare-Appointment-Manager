'use client';

import { useState, useEffect } from 'react';
import { Stethoscope, UserPlus, AlertCircle, CheckCircle2, Loader2, Clock, ShieldAlert, Check, X } from 'lucide-react';

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [credentialRequests, setCredentialRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialisation, setSpecialisation] = useState('');
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(30);
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch doctors
      const docRes = await fetch('/api/doctors');
      const docData = await docRes.json();
      if (docData.success) {
        setDoctors(docData.data.doctors);
      }

      // 2. Fetch pending credential requests
      const reqRes = await fetch('/api/admin/credential-requests');
      const reqData = await reqRes.json();
      if (reqData.success) {
        setCredentialRequests(reqData.data.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialAction = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    setProcessingId(requestId);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/credential-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to process request');
      }
      setSuccessMsg(data.data.message || `Request ${action.toLowerCase()}d successfully.`);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Error processing credential request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          specialisation,
          slotDurationMinutes: Number(slotDurationMinutes),
          bio,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to create doctor account');
      }

      setSuccessMsg(`Doctor profile for ${fullName} created successfully.`);
      setShowAddModal(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setSpecialisation('');
      setBio('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Error creating doctor account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-brand-400" /> Admin Doctor Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Provision doctor accounts, review staff details, and approve credential change requests.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all"
        >
          <UserPlus className="w-4 h-4" /> Provision New Doctor Account
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pending Credential Requests Section */}
      {credentialRequests.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-amber-500/30 bg-amber-950/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" /> Pending Doctor Credential Change Requests ({credentialRequests.length})
            </h3>
          </div>

          <div className="space-y-3">
            {credentialRequests.map((req) => (
              <div key={req.id} className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">{req.doctorName}</h4>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-300">
                    {req.requestedEmail && req.requestedEmail !== req.currentEmail && (
                      <span>Email: <span className="line-through text-slate-500">{req.currentEmail}</span> ➔ <strong className="text-amber-300">{req.requestedEmail}</strong></span>
                    )}
                    {req.requestedPhone && req.requestedPhone !== req.currentPhone && (
                      <span>Phone: <span className="line-through text-slate-500">{req.currentPhone || 'None'}</span> ➔ <strong className="text-amber-300">{req.requestedPhone}</strong></span>
                    )}
                  </div>
                  {req.reason && <p className="text-xs text-slate-400 italic mt-1">Reason: "{req.reason}"</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    disabled={processingId === req.id}
                    onClick={() => handleCredentialAction(req.id, 'REJECT')}
                    className="inline-flex items-center gap-1 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    disabled={processingId === req.id}
                    onClick={() => handleCredentialAction(req.id, 'APPROVE')}
                    className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all"
                  >
                    {processingId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Approve Change</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          <span>Loading doctor profiles...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="glass-card p-6 rounded-2xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                  {doctor.user.fullName.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{doctor.user.fullName}</h3>
                  <span className="text-xs text-brand-300 font-semibold">{doctor.specialisation}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400">{doctor.user.email}</p>
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-brand-400" /> Slot: {doctor.slotDurationMinutes} mins</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-card rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-800">
            <h3 className="font-bold text-lg text-white mb-4">Provision Doctor Account</h3>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Alexander Wright"
                  className="w-full bg-slate-900/90 text-white text-xs border border-slate-700/80 rounded-xl p-2.5 focus:outline-none focus:border-brand-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@clinic.com"
                    className="w-full bg-slate-900/90 text-white text-xs border border-slate-700/80 rounded-xl p-2.5 focus:outline-none focus:border-brand-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/90 text-white text-xs border border-slate-700/80 rounded-xl p-2.5 focus:outline-none focus:border-brand-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Specialisation</label>
                  <input
                    type="text"
                    required
                    value={specialisation}
                    onChange={(e) => setSpecialisation(e.target.value)}
                    placeholder="Neurology"
                    className="w-full bg-slate-900/90 text-white text-xs border border-slate-700/80 rounded-xl p-2.5 focus:outline-none focus:border-brand-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Slot Duration (Minutes)</label>
                  <select
                    value={slotDurationMinutes}
                    onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-900/90 text-white text-xs border border-slate-700/80 rounded-xl p-2.5 focus:outline-none focus:border-brand-400"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bio / Qualifications</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Specialist credentials..."
                  className="w-full bg-slate-900/90 text-white text-xs border border-slate-700/80 rounded-xl p-2.5 focus:outline-none focus:border-brand-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
