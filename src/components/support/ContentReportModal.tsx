import React, { useState } from 'react';
import { Flag, X, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { studioApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

type ReportCategory = 'Spam' | 'Copyright concern' | 'Privacy concern' | 'Other';

interface ContentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'template' | 'project' | 'content';
  targetId: string;
  targetTitle?: string;
}

export const ContentReportModal: React.FC<ContentReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}) => {
  const { user } = useAuth();
  const [category, setCategory] = useState<ReportCategory>('Spam');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories: Array<{ id: ReportCategory; label: string; desc: string }> = [
    { id: 'Spam', label: 'Spam', desc: 'Misleading, automated, or unsolicited commercial content' },
    { id: 'Copyright concern', label: 'Copyright concern', desc: 'Infringes upon protected scripts, trademarks, or copyrighted IP' },
    { id: 'Privacy concern', label: 'Privacy concern', desc: 'Exposes private personal information, credentials, or unauthorized likeness' },
    { id: 'Other', label: 'Other', desc: 'Harassment, policy violation, or other safety concern' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      setErrorMessage('Please describe the concern so our moderation team can review.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await studioApi.reports.submitReport({
        targetType,
        targetId,
        targetTitle,
        category,
        details: details.trim(),
        email: email.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Report Content</h3>
              <span className="text-[10px] text-slate-400 block">Community Trust & Safety Review</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target summary banner */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Target Item ({targetType}):
          </span>
          <p className="text-white font-semibold truncate">{targetTitle || targetId}</p>
        </div>

        {success ? (
          <div className="p-6 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-center space-y-2 animate-in fade-in">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Report Received for Human Review</h4>
            <p className="text-xs text-slate-300">
              Thank you. Reports are stored securely for team review. Users are not automatically penalized without manual verification.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Category selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Reason for Report <span className="text-violet-400">*</span>
              </label>
              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all cursor-pointer ${
                      category === cat.id
                        ? 'bg-amber-950/40 border-amber-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_category"
                      checked={category === cat.id}
                      onChange={() => setCategory(cat.id)}
                      className="mt-0.5 accent-amber-500"
                    />
                    <div>
                      <strong className="block font-bold">{cat.label}</strong>
                      <span className="text-[11px] text-slate-400">{cat.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional details */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Details / Explanation <span className="text-violet-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Explain the specific issue with this template..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-none leading-relaxed"
              />
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-300 block">Fair Process Guarantee:</strong>
              Submission of a report flags the content for moderator review. It does not automatically delete templates or punish creators without investigation.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
