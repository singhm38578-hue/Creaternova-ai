import React from 'react';
import { FileText, ArrowLeft, AlertCircle, Scale, ShieldAlert, CheckCircle, Zap } from 'lucide-react';

interface TermsOfServiceViewProps {
  onBack?: () => void;
}

export const TermsOfServiceView: React.FC<TermsOfServiceViewProps> = ({ onBack }) => {
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
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black text-white tracking-tight">CreatorNova AI</h1>
                <span className="text-[10px] text-slate-400 block font-mono">Terms of Service Terms</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950/80 border border-amber-500/30 px-3 py-1 rounded-full">
              DRAFT v1.0
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-600/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>DRAFT — OWNER/LEGAL REVIEW REQUIRED</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Terms of Service & Creator Agreement
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            Please read these draft terms carefully before using CreatorNova AI. They govern your access to the studio,
            AI generation tools, credit subscriptions, and workspace assets.
          </p>
          <div className="p-3 bg-amber-950/50 border border-amber-500/40 rounded-2xl flex items-start gap-3 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                Notice of Draft Status:
              </strong>
              <span>
                These terms are a operational draft framework. They do not constitute approved legal advice and are marked{' '}
                <span className="font-mono font-bold bg-amber-950 px-1 py-0.5 rounded text-amber-300 border border-amber-500/40">
                  DRAFT — OWNER/LEGAL REVIEW REQUIRED
                </span>{' '}
                pending formal review by corporate legal counsel.
              </span>
            </div>
          </div>
        </div>

        {/* 13 Draft Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-violet-400 text-xs font-mono font-bold uppercase">Section 1</span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                DRAFT — OWNER/LEGAL REVIEW REQUIRED
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Eligibility</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You must be at least 13 years of age (or the minimum legal age for digital consent in your jurisdiction)
              to create an account on CreatorNova AI. If you are using the service on behalf of a company, agency,
              or educational institution, you represent that you possess the authority to bind that entity.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-violet-400 text-xs font-mono font-bold uppercase">Section 2</span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                DRAFT — OWNER/LEGAL REVIEW REQUIRED
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Account Responsibilities</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials, passwords, and
              authentication sessions. You agree to notify CreatorNova immediately if you discover any unauthorized use
              or breach of your account security.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-violet-400 text-xs font-mono font-bold uppercase">Section 3</span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                DRAFT — OWNER/LEGAL REVIEW REQUIRED
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Acceptable Use</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You agree not to use CreatorNova AI to generate or distribute defamatory, unlawful, sexually explicit,
              harassing, or violent content, or content that infringes upon third-party intellectual property rights.
              Automated scraping, denial-of-wallet abuse, and attempting to reverse engineer model endpoints are strictly prohibited.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-violet-400 text-xs font-mono font-bold uppercase">Section 4</span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                DRAFT — OWNER/LEGAL REVIEW REQUIRED
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">User Content</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You retain all right, title, and interest in the original textual briefs, topics, character concepts,
              and video production assets you submit to CreatorNova. You grant CreatorNova a limited license to host
              and process your content solely to deliver the studio services to you.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-violet-400 text-xs font-mono font-bold uppercase">Section 5</span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                DRAFT — OWNER/LEGAL REVIEW REQUIRED
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">AI-Generated Content</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              AI-generated suggestions (such as script ideas, scene angles, or tags) are probabilistic outputs computed
              by foundation models. CreatorNova does not warrant that AI-generated scripts are entirely unique or
              guaranteed to achieve specific viewership or monetization results.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-violet-400 text-xs font-mono font-bold uppercase">Section 6</span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                DRAFT — OWNER/LEGAL REVIEW REQUIRED
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Intellectual Property</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              The CreatorNova AI name, logo, user interface design, teleprompter layouts, and proprietary workflow
              orchestration code are the intellectual property of CreatorNova. All rights not expressly granted are reserved.
            </p>
          </section>

          {/* Section 7 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-violet-400 text-xs font-mono font-bold uppercase">Section 7</span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                DRAFT — OWNER/LEGAL REVIEW REQUIRED
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Credits</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              CreatorNova credits represent internal units of computational consumption utilized across scripts,
              storyboards, SEO packs, and scene generation. Credits do not constitute real currency, bank deposits,
              or digital assets and possess no monetary cash surrender value.
            </p>
          </section>

          {/* Section 8 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-violet-400 text-xs font-mono font-bold uppercase">Section 8</span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                DRAFT — OWNER/LEGAL REVIEW REQUIRED
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Subscriptions</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Optional paid plans (Pro, Creator, Business) provide monthly credit allocations and advanced workspace limits.
              Subscriptions auto-renew according to the selected billing cycle unless cancelled before the renewal date.
            </p>
          </section>

          {/* Section 9 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-violet-400 text-xs font-mono font-bold uppercase">Section 9</span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                DRAFT — OWNER/LEGAL REVIEW REQUIRED
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Refund & Cancellation Policy Placeholder</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Creators may cancel recurring subscriptions at any time via <em>Profile → Subscription & Billing</em>.
              Upon cancellation, access and remaining credits continue through the end of the active billing period.
            </p>
            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-[11px] text-amber-200">
              <span className="font-bold text-amber-300">[DRAFT — OWNER/LEGAL REVIEW REQUIRED]</span>: Placeholder for explicit refund
              eligibility window (e.g., 7-day money-back guarantee for unused credit allocations upon gateway setup).
            </div>
          </section>

          {/* Section 10 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-violet-400 text-xs font-mono font-bold uppercase">Section 10</span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                DRAFT — OWNER/LEGAL REVIEW REQUIRED
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Service Availability</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              We strive for high uptime and rapid latency. However, third-party model inference endpoints, network
              maintenance, and upstream provider status may cause temporary interruptions. The service is provided on
              an "as-is" and "as-available" basis.
            </p>
          </section>

          {/* Section 11 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-violet-400 text-xs font-mono font-bold uppercase">Section 11</span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                DRAFT — OWNER/LEGAL REVIEW REQUIRED
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Account Suspension & Termination</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              CreatorNova reserves the right to suspend or terminate accounts that repeatedly violate acceptable use rules,
              attempt payment fraud, or engage in automated abuse. Users are given opportunity to appeal suspensions via
              Help & Support where appropriate.
            </p>
          </section>

          {/* Section 12 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-violet-400 text-xs font-mono font-bold uppercase">Section 12</span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                DRAFT — OWNER/LEGAL REVIEW REQUIRED
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Liability & Legal Disclaimers Placeholder</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              To the fullest extent permitted by applicable law, CreatorNova shall not be liable for indirect, incidental,
              or consequential damages, including loss of anticipated YouTube or social media earnings.
            </p>
            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-[11px] text-amber-200">
              <span className="font-bold text-amber-300">[DRAFT — OWNER/LEGAL REVIEW REQUIRED]</span>: Placeholder for governing law,
              arbitration venue, and statutory limitation of liability clauses under relevant jurisdiction.
            </div>
          </section>

          {/* Section 13 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-violet-400 text-xs font-mono font-bold uppercase">Section 13</span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                DRAFT — OWNER/LEGAL REVIEW REQUIRED
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Contact</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Questions regarding these Terms of Service may be directed to our team via the in-app <strong>Help & Support</strong>
              desk or submitted via the <code>/contact</code> page.
            </p>
            <div className="text-[11px] text-slate-500 pt-1">
              Draft Version 1.0 • Awaiting Final Owner/Legal Sign-off
            </div>
          </section>
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
