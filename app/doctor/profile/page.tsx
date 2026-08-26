'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Stethoscope,
  MapPin,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Clock,
  Send,
} from 'lucide-react';

export default function DoctorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialisation, setSpecialisation] = useState('');
  const [age, setAge] = useState<string>('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');

  // Credential Change Request State (Email / Phone)
  const [showCredentialRequestModal, setShowCredentialRequestModal] = useState(false);
  const [requestedEmail, setRequestedEmail] = useState('');
  const [requestedPhone, setRequestedPhone] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [pendingCredentialRequest, setPendingCredentialRequest] = useState<any | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/doctor/profile');
      const data = await res.json();

      if (data.success) {
        const { profile, pendingCredentialRequest } = data.data;
        setFullName(profile.fullName || '');
        setEmail(profile.email || '');
        setPhone(profile.phone || '');
        setSpecialisation(profile.specialisation || '');
        setAge(profile.age ? String(profile.age) : '');
        setAddress(profile.address || '');
        setBio(profile.bio || '');

        setRequestedEmail(profile.email || '');
        setRequestedPhone(profile.phone || '');
        setPendingCredentialRequest(pendingCredentialRequest);
      } else {
        setError(data.error?.message || 'Failed to load profile details');
      }
    } catch (err) {
      setError('Network error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const isEmailChanged = requestedEmail.trim().toLowerCase() !== email.trim().toLowerCase();
      const isPhoneChanged = requestedPhone.trim() !== phone.trim();

      const res = await fetch('/api/doctor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          specialisation,
          age: age ? parseInt(age, 10) : null,
          address,
          bio,
          requestedEmail: isEmailChanged ? requestedEmail : null,
          requestedPhone: isPhoneChanged ? requestedPhone : null,
          requestReason: (isEmailChanged || isPhoneChanged) ? requestReason : null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to update profile');
      }

      setSuccessMsg(data.data.message || 'Profile details updated successfully');
      setShowCredentialRequestModal(false);
      fetchProfile();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        <span>Loading profile details...</span>
      </div>
    );
  }

  const isCredentialChanged =
    requestedEmail.trim().toLowerCase() !== email.trim().toLowerCase() ||
    requestedPhone.trim() !== phone.trim();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <User className="w-8 h-8 text-brand-400" /> Doctor Profile & Credentials
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your personal clinical details, specialization, and account credentials.
          </p>
        </div>
        <span className="bg-brand-500/20 text-brand-300 border border-brand-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold self-start sm:self-auto">
          🩺 Certified Physician
        </span>
      </div>

      {/* Error & Success Banners */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Pending Credential Change Request Banner */}
      {pendingCredentialRequest && (
        <div className="glass-card p-5 rounded-2xl border border-amber-500/40 bg-amber-950/20 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Credential Change Request Pending Admin Review</span>
          </div>
          <p className="text-xs text-slate-300">
            You submitted a request to update your restricted credentials on{' '}
            <span className="font-mono text-amber-200">
              {new Date(pendingCredentialRequest.createdAt).toLocaleDateString()}
            </span>.
          </p>
          <div className="flex flex-wrap gap-4 text-xs pt-1">
            {pendingCredentialRequest.requestedEmail && (
              <span className="bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800 text-slate-200">
                New Email: <strong className="text-amber-300">{pendingCredentialRequest.requestedEmail}</strong>
              </span>
            )}
            {pendingCredentialRequest.requestedPhone && (
              <span className="bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800 text-slate-200">
                New Phone: <strong className="text-amber-300">{pendingCredentialRequest.requestedPhone}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Section 1: Basic Clinical Information */}
        <div className="glass-card rounded-2xl p-6 space-y-6 border border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Stethoscope className="w-5 h-5 text-brand-400" /> Basic Clinical Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Full Name"
                  className="w-full bg-slate-900/90 text-white text-sm border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-brand-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Speciality / Medical Department <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Stethoscope className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={specialisation}
                  onChange={(e) => setSpecialisation(e.target.value)}
                  placeholder="e.g. Cardiology, Dermatology"
                  className="w-full bg-slate-900/90 text-white text-sm border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-brand-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Age
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={18}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 42"
                  className="w-full bg-slate-900/90 text-white text-sm border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-brand-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Clinic / Practice Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Clinic address or office location"
                  className="w-full bg-slate-900/90 text-white text-sm border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-brand-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Professional Biography & Qualifications
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief summary of board certifications, medical background, and patient care philosophy..."
                className="w-full bg-slate-900/90 text-white text-sm border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-brand-400 placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Account Credentials & Admin Approval Policy */}
        <div className="glass-card rounded-2xl p-6 space-y-6 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" /> Restricted Account Credentials
            </h3>
            <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5">
              🔒 Admin Approval Required to Change
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Per healthcare security policy, changes to your <strong>Email Address</strong> or <strong>Mobile Phone Number</strong> require an explicit approval request to the System Administrator.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Current Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full bg-slate-950 text-slate-400 text-sm border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Current Mobile Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled
                  value={phone || 'No mobile registered'}
                  className="w-full bg-slate-950 text-slate-400 text-sm border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Trigger button for Credential Change Request */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowCredentialRequestModal(true)}
              className="inline-flex items-center gap-2 bg-amber-950/80 hover:bg-amber-900/90 text-amber-300 border border-amber-800/80 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
            >
              <Send className="w-4 h-4" /> Request Email or Mobile Change
            </button>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-lg shadow-brand-500/20 transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Credential Change Request Modal */}
      {showCredentialRequestModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          onClick={() => setShowCredentialRequestModal(false)}
        >
          <div
            className="glass-card rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-500/30 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Request Credential Update</h3>
                  <p className="text-xs text-slate-400">Requires Admin Verification</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Specify your new Email Address or Mobile Number. An official request will be sent to the System Administrator for approval.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Requested Email Address
                </label>
                <input
                  type="email"
                  value={requestedEmail}
                  onChange={(e) => setRequestedEmail(e.target.value)}
                  placeholder="dr.newemail@clinic.com"
                  className="w-full bg-slate-900 text-white text-sm border border-slate-700 rounded-xl p-2.5 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Requested Mobile Phone Number
                </label>
                <input
                  type="text"
                  value={requestedPhone}
                  onChange={(e) => setRequestedPhone(e.target.value)}
                  placeholder="+1-555-0199"
                  className="w-full bg-slate-900 text-white text-sm border border-slate-700 rounded-xl p-2.5 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Request
                </label>
                <textarea
                  rows={2}
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="e.g. Changed personal phone carrier / official clinic email address updated"
                  className="w-full bg-slate-900 text-white text-sm border border-slate-700 rounded-xl p-2.5 focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCredentialRequestModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isCredentialChanged || saving}
                onClick={handleSaveProfile}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Submit Request to Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
