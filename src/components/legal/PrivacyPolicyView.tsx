import React from 'react';
import { Shield, ArrowLeft, Lock, FileText, CheckCircle2, AlertTriangle, Eye, Database, Server, RefreshCw } from 'lucide-react';

interface PrivacyPolicyViewProps {
  onBack?: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBack }) => {
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
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black text-white tracking-tight">CreatorNova AI</h1>
                <span className="text-[10px] text-slate-400 block font-mono">Trust & Privacy Architecture</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-violet-400 bg-violet-950/80 border border-violet-500/30 px-3 py-1 rounded-full">
              Policy v1.0
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-950 border border-violet-500/30 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30 text-xs font-bold font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>Transparency & Privacy Policy</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            How CreatorNova Protects Your Creator Data
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            This Privacy Policy explains in clear, plain language how CreatorNova AI handles your account data,
            creative project drafts, script ideas, and AI interactions. We prioritize creator data isolation and
            do not sell your private creative drafts to third-party ad networks.
          </p>
          <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-start gap-3 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                Owner & Legal Review Notice:
              </strong>
              <span>
                Standard operational sections are documented below. Specific contractual entity details and regional legal jurisdictions are flagged as{' '}
                <span className="font-mono font-bold bg-amber-950 px-1 py-0.5 rounded text-amber-300 border border-amber-500/40">
                  OWNER REVIEW REQUIRED
                </span>{' '}
                for final corporate governance.
              </span>
            </div>
          </div>
        </div>

        {/* 12 Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-mono font-bold uppercase tracking-wider">
              <span>Section 1</span>
            </div>
            <h3 className="text-lg font-bold text-white">Information Users Provide</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When using CreatorNova AI, you directly provide information needed to configure your creator workspace,
              generate video assets, and calibrate brand kits. This includes your name, email address, preferred content
              languages, content topics, and creator niche preferences.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div>• Registration details (name, email, password credential).</div>
              <div>• Custom Brand Kit specifications (channel name, tone of voice, visual hooks).</div>
              <div>• Support requests and feedback forms submitted via Help & Support.</div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-mono font-bold uppercase tracking-wider">
              <span>Section 2</span>
            </div>
            <h3 className="text-lg font-bold text-white">Account Information</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your account record maintains your subscription tier, billing period status, and credit wallet allocations.
              We assign a unique cryptographic identifier to your profile to securely isolate your private projects
              from other creators.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
              <strong className="text-slate-300">Identity Security:</strong> Account authentication is handled via
              industry-standard signed tokens. We never store raw passwords in plain text.
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-mono font-bold uppercase tracking-wider">
              <span>Section 3</span>
            </div>
            <h3 className="text-lg font-bold text-white">Creator Projects & Content</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You retain intellectual property ownership of your original ideas, video concepts, outlines, and custom
              scripts. CreatorNova stores your project drafts strictly to allow you to edit, retrieve, and export them.
              Projects are private to your authenticated account by default unless you explicitly choose to publish a
              shareable template.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-mono font-bold uppercase tracking-wider">
              <span>Section 4</span>
            </div>
            <h3 className="text-lg font-bold text-white">Generated Content</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Outputs generated using CreatorNova tools—including teleprompter scripts, scene camera shotlists, SEO title
              formulas, and thumbnail concepts—are stored in your workspace. You maintain full rights to publish, modify,
              or commercialize these outputs subject to the acceptable use rules.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-mono font-bold uppercase tracking-wider">
              <span>Section 5</span>
            </div>
            <h3 className="text-lg font-bold text-white">Usage & Analytics Information</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              To guarantee system reliability, monitor credit balances, and prevent abuse, CreatorNova records privacy-conscious
              technical metrics. This includes credit transaction logs, operational errors, and anonymous navigation counts.
              Analytics events do NOT capture your confidential script drafts or raw passwords.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-mono font-bold uppercase tracking-wider">
              <span>Section 6</span>
            </div>
            <h3 className="text-lg font-bold text-white">AI Provider Processing</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When you prompt an AI generator (such as Idea Generator, Script Writer, Scene Generator, or Autonomous Agent),
              your specific input prompt is transmitted securely over HTTPS to upstream foundation model APIs (such as
              Google Gemini) solely for the purpose of computing your output.
            </p>
            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-[11px] text-amber-200">
              <span className="font-bold text-amber-300">[OWNER REVIEW REQUIRED]</span>: Verification of enterprise zero-retention
              agreements with third-party neural video and voice synthesis providers when live external providers are active.
            </div>
          </section>

          {/* Section 7 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-mono font-bold uppercase tracking-wider">
              <span>Section 7</span>
            </div>
            <h3 className="text-lg font-bold text-white">Storage & Security</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Data is stored using hardened server architectures with encrypted transports (TLS/HTTPS). Multi-tenant isolation
              enforces that database read and write permissions check user identity on every request to prevent unauthorized access.
            </p>
          </section>

          {/* Section 8 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-mono font-bold uppercase tracking-wider">
              <span>Section 8</span>
            </div>
            <h3 className="text-lg font-bold text-white">Data Retention</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your projects, brand kits, and calendar items remain saved in your account for as long as your account remains
              active. You may delete individual projects or export your workspace data at any time.
            </p>
            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-[11px] text-amber-200">
              <span className="font-bold text-amber-300">[OWNER REVIEW REQUIRED]</span>: Formal specification of inactive account
              dormancy thresholds (e.g., automated archival after 24 months of total inactivity).
            </div>
          </section>

          {/* Section 9 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-mono font-bold uppercase tracking-wider">
              <span>Section 9</span>
            </div>
            <h3 className="text-lg font-bold text-white">Account Deletion</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Creators have the absolute right to delete their accounts. Through <em>Profile → Account Settings → Delete Account</em>,
              you can initiate deliberate account termination. Deletion permanently removes your profile, private projects,
              calendar schedules, private video renders, and credit history.
            </p>
          </section>

          {/* Section 10 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-mono font-bold uppercase tracking-wider">
              <span>Section 10</span>
            </div>
            <h3 className="text-lg font-bold text-white">User Choices & Data Export</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You have the right to access, download, and control your creator data. CreatorNova provides a built-in
              <strong> "Download My Data"</strong> function in Account Settings, delivering an authenticated export of your
              profile, projects, calendar, and usage logs in standardized JSON format.
            </p>
          </section>

          {/* Section 11 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-mono font-bold uppercase tracking-wider">
              <span>Section 11</span>
            </div>
            <h3 className="text-lg font-bold text-white">Contact Information</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              For privacy inquiries, rights requests, or data protection questions, creators can submit inquiries directly
              through the in-app <strong>Help & Support</strong> desk under the "Account" or "Other" categories.
            </p>
            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-[11px] text-amber-200">
              <span className="font-bold text-amber-300">[OWNER REVIEW REQUIRED]</span>: Designated Data Protection Officer (DPO)
              contact address and physical corporate mailing address upon company incorporation.
            </div>
          </section>

          {/* Section 12 */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-mono font-bold uppercase tracking-wider">
              <span>Section 12</span>
            </div>
            <h3 className="text-lg font-bold text-white">Policy Updates</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              We may update this Privacy Policy as new studio tools, video neural engines, or statutory compliance standards evolve.
              Material updates will be posted to this page with an updated revision date.
            </p>
            <div className="text-[11px] text-slate-500 pt-1">
              Last Revised: September 2026 • Document Status: Live Initial Release
            </div>
          </section>
        </div>

        {/* Back / Navigation button at bottom */}
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
