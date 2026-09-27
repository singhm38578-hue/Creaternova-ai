import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  PowerOff,
  AlertCircle,
  Film,
  Layers
} from 'lucide-react';
import { Project, ShareableTemplate } from '../types/content';
import { studioApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface ShareTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onOpenPreview?: (templateId: string) => void;
}

export const ShareTemplateModal: React.FC<ShareTemplateModalProps> = ({
  isOpen,
  onClose,
  project,
  onOpenPreview,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(project.name);
  const [description, setDescription] = useState(project.topic || '');
  const [category, setCategory] = useState(project.contentType || 'Entertainment');
  const [shareCreatorName, setShareCreatorName] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingTemplate, setExistingTemplate] = useState<ShareableTemplate | null>(null);
  const [shareableUrl, setShareableUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sync state with active project
  useEffect(() => {
    if (project) {
      setTitle(project.name);
      setDescription(project.topic || '');
      setCategory(project.contentType || 'Entertainment');
    }
  }, [project]);

  // Check if project has already been shared as a template
  useEffect(() => {
    if (!isOpen || !project) return;
    studioApi.templates.getMyTemplates()
      .then((res) => {
        const found = res.templates.find((t) => t.originalProjectId === project.id);
        if (found) {
          setExistingTemplate(found);
          setTitle(found.title);
          setDescription(found.description);
          setCategory(found.category);
          setShareCreatorName(found.shareCreatorName);
          const fullUrl = `${window.location.origin}/?template=${found.id}`;
          setShareableUrl(fullUrl);
        } else {
          setExistingTemplate(null);
          setShareableUrl('');
        }
      })
      .catch(console.error);
  }, [isOpen, project]);

  if (!isOpen) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await studioApi.templates.createOrUpdate({
        id: existingTemplate?.id,
        originalProjectId: project.id,
        title: title.trim(),
        description: description.trim(),
        category,
        platform: project.platform || 'YouTube Shorts',
        contentType: project.contentType || 'Entertainment',
        language: project.language || 'English',
        shareCreatorName,
        workflow: {
          format: project.format,
          tone: project.tone,
          targetAudience: project.targetAudience,
          duration: typeof project.duration === 'string' ? project.duration : '60 seconds',
          estimatedDuration: project.script?.estimatedDuration || '60 seconds',
        },
        scenes: project.scenes,
        prompts: {
          ideaHooks: project.ideas?.map((i) => i.hook) || [],
          thumbnailPrompt: project.thumbnail?.aiConceptPrompt || '',
          thumbnailHeadline: project.thumbnail?.headline || '',
          scriptOutline: project.script?.hookSummary || '',
          scriptBeats: project.script?.beats?.map((b) => ({
            sectionType: b.sectionType,
            directionCue: b.directionCue,
            visualCue: b.visualCue,
            dialogueOutline: b.dialogue,
          })),
        },
      });

      setExistingTemplate(res.template);
      const fullUrl = `${window.location.origin}/?template=${res.template.id}`;
      setShareableUrl(fullUrl);
      setStatusMessage('Template successfully published and ready to share!');
    } catch (err: any) {
      console.error('Failed sharing template:', err);
      setStatusMessage(err.message || 'Failed to publish template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareableUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - CreatorNova Template`,
          text: `Use this CreatorNova AI content template: ${title}`,
          url: shareableUrl,
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Clipboard copy failed', err);
    }
  };

  const handleToggleActive = async () => {
    if (!existingTemplate) return;
    const nextState = !existingTemplate.isActive;
    try {
      const res = await studioApi.templates.toggleStatus(existingTemplate.id, nextState);
      setExistingTemplate(res.template);
      setStatusMessage(nextState ? 'Template re-enabled!' : 'Template disabled. Public link is now inactive.');
    } catch (err: any) {
      setStatusMessage('Failed to update template status.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Share as Template</h2>
              <p className="text-xs text-slate-400">Allow other creators to clone your workflow structure</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Notice Guarantee */}
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-xs text-emerald-300">
          <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Strict Privacy Guaranteed</span>
            <p className="text-[11px] text-emerald-400/80 leading-relaxed">
              Your template shares only the blueprint (scene structure, format, and prompt formulas).
              <strong> Private generated videos, media files, email address, account ID, and billing details are NEVER shared.</strong>
            </p>
          </div>
        </div>

        {statusMessage && (
          <div className="p-3 bg-violet-950/50 border border-violet-500/40 rounded-xl text-xs text-violet-200">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleShare} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Template Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              placeholder="e.g., 5-Scene Viral Hook Framework"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Description / Concept</label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
              placeholder="Explain how other creators can use this workflow..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="Education">Education</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Storytelling">Storytelling</option>
                <option value="Kids & Family">Kids & Family</option>
                <option value="Business & Finance">Business & Finance</option>
                <option value="Tech & AI">Tech & AI</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Platform</label>
              <input
                type="text"
                disabled
                value={project.platform || 'YouTube Shorts'}
                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="shareCreatorName"
              checked={shareCreatorName}
              onChange={(e) => setShareCreatorName(e.target.checked)}
              className="w-4 h-4 rounded text-violet-600 focus:ring-0 bg-slate-950 border-slate-700 cursor-pointer"
            />
            <label htmlFor="shareCreatorName" className="text-xs text-slate-300 cursor-pointer select-none">
              Display my creator name ({user?.name || 'Creator'}) on public preview
            </label>
          </div>

          {/* Template Components Included Summary */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 text-xs space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Blueprint Contents Included
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-violet-400" />
                <span>{project.scenes?.length || 0} Scene Formulations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-violet-400" />
                <span>Format: {project.format}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Prompt Structure</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>0 Private Assets Shared</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : existingTemplate ? 'Update Template' : 'Publish Template'}
            </button>
          </div>
        </form>

        {/* Shareable Link Box */}
        {shareableUrl && existingTemplate && (
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Public Template Link</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    existingTemplate.isActive
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-600/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {existingTemplate.isActive ? 'Active' : 'Disabled'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleActive}
                  className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  {existingTemplate.isActive ? 'Disable Link' : 'Re-enable'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold border border-slate-700 transition-colors cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            {onOpenPreview && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPreview(existingTemplate.id);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-bold border border-violet-500/30 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Public Preview</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
