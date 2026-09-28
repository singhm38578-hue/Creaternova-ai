import React, { useState } from 'react';
import {
  LifeBuoy,
  ArrowLeft,
  Mail,
  Send,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ShieldQuestion,
  FileQuestion,
  Zap,
  Coins,
  CreditCard,
  Wrench,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { studioApi } from '../../services/api';

type SupportCategory =
  | 'Account'
  | 'Projects'
  | 'AI Generation'
  | 'Credits'
  | 'Billing'
  | 'Technical Problem'
  | 'Other';

interface ContactSupportViewProps {
  onBack?: () => void;
  defaultCategory?: SupportCategory;
}

export const ContactSupportView: React.FC<ContactSupportViewProps> = ({
  onBack,
  defaultCategory = 'Projects',
}) => {
  const { user } = useAuth();

  const [category, setCategory] = useState<SupportCategory>(defaultCategory);
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const categories: Array<{ id: SupportCategory; label: string; icon: any; desc: string }> = [
    { id: 'Account', label: 'Account', icon: ShieldQuestion, desc: 'Login, 2FA, password, profile settings' },
    { id: 'Projects', label: 'Projects', icon: FileQuestion, desc: 'Script drafts, scene generation, templates' },
    { id: 'AI Generation', label: 'AI Generation', icon: Zap, desc: 'Model inference, output accuracy, prompts' },
    { id: 'Credits', label: 'Credits', icon: Coins, desc: 'Wallet balances, deductions, refills' },
    { id: 'Billing', label: 'Billing', icon: CreditCard, desc: 'Plans, subscription cycles, invoices' },
    { id: 'Technical Problem', label: 'Technical Problem', icon: Wrench, desc: 'Rendering errors, browser compatibility, bugs' },
    { id: 'Other', label: 'Other', icon: MessageSquare, desc: 'General creator inquiries, feedback, partnerships' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address so we can reply.');
      return;
    }
    if (!subject.trim()) {
      setErrorMessage('Please provide a subject line for your inquiry.');
      return;
    }
    if (!message.trim()) {
      setErrorMessage('Please describe your issue or question.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await studioApi.support.submitTicket({
        category,
        subject,
        message,
        email: email.trim(),
      });

      setSubmitSuccess(res.message || 'Support ticket registered successfully.');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit support request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-600/30 pb-20">
      {/* Top sticky navigation bar */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center">
                <LifeBuoy className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black text-white tracking-tight">CreatorNova AI</h1>
                <span className="text-[10px] text-slate-400 block font-mono">Help & Support Desk</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-full">
              Live Desk Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30 text-xs font-bold font-mono">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Creator Help & Inquiries</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            How can we assist your creator journey?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Whether you need assistance troubleshooting scene generation, configuring Brand Kit voice consistency,
            or reviewing credit usage, submit your ticket below.
          </p>

          {/* Configured Contact Notice */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-violet-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[11px]">Direct Inbound Support Email:</span>
                <span className="font-mono font-bold text-amber-300">Support contact setup required.</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Response Time: <span className="text-slate-200 font-bold">Within 24 business hours</span>
            </div>
          </div>
        </div>

        {/* Support Ticket Submission Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="space-y-1 border-b border-slate-800 pb-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-violet-400" />
              <span>Submit a Support Request</span>
            </h3>
            <p className="text-xs text-slate-400">
              Select the appropriate category so your ticket reaches the right workflow specialist.
            </p>
          </div>

          {submitSuccess ? (
            <div className="p-6 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-center space-y-3 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">Ticket Submitted Successfully</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto">{submitSuccess}</p>
              <button
                onClick={() => setSubmitSuccess(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Support Category Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Select Category <span className="text-violet-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-violet-950/60 border-violet-500/70 text-white shadow-md shadow-violet-600/20'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold block">{cat.label}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{cat.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Your Contact Email <span className="text-violet-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@example.com"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Subject <span className="text-violet-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Issue generating Scene 3 teleprompter cue"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Message Details */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Message Details <span className="text-violet-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe what you were trying to do, relevant project title, and any error message displayed..."
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-slate-500">
                  Tickets are stored securely and addressed by CreatorNova engineering.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Send Support Request'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Back navigation button */}
        {onBack && (
          <div className="pt-4 flex justify-center">
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to CreatorNova Workspace</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
