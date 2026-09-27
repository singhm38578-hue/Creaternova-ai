import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Share2,
  Copy,
  Check,
  Film,
  Layers,
  ArrowRight,
  ShieldCheck,
  User,
  Tv,
  Tag,
  Clock,
  ExternalLink,
  Lock
} from 'lucide-react';
import { PublicTemplatePreview } from '../types/content';
import { studioApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface TemplatePreviewModalProps {
  templateId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (newProject: any) => void;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  templateId,
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const { user, openAuthModal } = useAuth();
  const [template, setTemplate] = useState<PublicTemplatePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !templateId) {
      setTemplate(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    studioApi.templates.getPublic(templateId)
      .then((res) => {
        setTemplate(res.template);
      })
      .catch((err) => {
        console.error('Failed fetching template preview:', err);
        setError(err.message || 'Template is either private, disabled, or does not exist.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, templateId]);

  if (!isOpen) return null;

  const handleUseTemplate = async () => {
    if (!template) return;

    if (!user) {
      // Ask the visitor to sign in or create an account
      openAuthModal('register');
      return;
    }

    setIsCloning(true);
    try {
      const res = await studioApi.templates.use(template.id);
      if (res.project) {
        onProjectCreated(res.project);
        onClose();
      }
    } catch (err: any) {
      console.error('Error cloning template:', err);
      setError(err.message || 'Failed creating project from template.');
    } finally {
      setIsCloning(false);
    }
  };

  const handleCopyLink = async () => {
    if (!template) return;
    const url = `${window.location.origin}/?template=${template.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${template.title} - CreatorNova Template`,
          text: `Check out this creator template on CreatorNova: ${template.title}`,
          url,
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      } catch (e) {
        // Fallback
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-violet-600/30 text-violet-300 border border-violet-500/40">
              Template Preview
            </span>
            {template?.category && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {template.category}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading template details...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-950/50 text-red-400 flex items-center justify-center mx-auto border border-red-800/40">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Template Unavailable</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">{error}</p>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : template ? (
          <div className="space-y-6">
            {/* Title & Creator */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {template.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {template.description}
              </p>
              <div className="flex items-center gap-3 pt-1 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-violet-400" />
                  <strong className="text-slate-200">
                    {template.creatorDisplayName || 'CreatorNova Creator'}
                  </strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{template.platform}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-pink-400" />
                  <span>{template.contentType}</span>
                </span>
                {template.usesCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">
                      {template.usesCount} {template.usesCount === 1 ? 'creator cloned' : 'creators cloned'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Workflow & Audience Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Format</span>
                <span className="text-slate-200 font-semibold">{template.workflow?.format || 'Video'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Tone</span>
                <span className="text-slate-200 font-semibold capitalize">{template.workflow?.tone?.replace('_', ' ') || 'Energetic'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Target Audience</span>
                <span className="text-slate-200 font-semibold truncate block">{template.workflow?.targetAudience || 'General'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Duration</span>
                <span className="text-slate-200 font-semibold">{template.workflow?.duration || '60 seconds'}</span>
              </div>
            </div>

            {/* Scenes Breakdown Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-violet-400" />
                  <span>Scene Structure ({template.scenes?.length || 0} Scenes)</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Clean Blueprint (No Private Media)
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {(template.scenes || []).map((scene) => (
                  <div
                    key={scene.sceneNumber}
                    className="p-3 bg-slate-950/50 border border-slate-800/60 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span className="font-bold text-violet-300">Scene {scene.sceneNumber}</span>
                      <span>{scene.timestampRange} • {scene.shotType} ({scene.cameraAngle})</span>
                    </div>
                    <p className="text-slate-200">{scene.visualDescription}</p>
                    {scene.aiVideoPrompt && (
                      <p className="text-[11px] text-slate-400 font-mono italic truncate">
                        Prompt Formula: "{scene.aiVideoPrompt}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Prompt Structure Preview */}
            {template.prompts && (template.prompts.thumbnailPrompt || template.prompts.scriptOutline) && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-xs space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Prompt & Thumbnail Formula</span>
                </span>
                {template.prompts.thumbnailHeadline && (
                  <p className="text-slate-300 text-[11px]">
                    <strong className="text-white">Thumbnail Formula:</strong> "{template.prompts.thumbnailHeadline}"
                  </p>
                )}
                {template.prompts.scriptOutline && (
                  <p className="text-slate-400 text-[11px]">
                    <strong className="text-slate-300">Hook Concept:</strong> {template.prompts.scriptOutline}
                  </p>
                )}
              </div>
            )}

            {/* Sign in prompt banner if not authenticated */}
            {!user && (
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-center justify-between gap-3">
                <span>Sign in to create your personal copy in your CreatorNova workspace.</span>
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-xl font-bold shrink-0 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Link Copied!' : 'Copy Template Link'}</span>
              </button>

              <button
                type="button"
                disabled={isCloning}
                onClick={handleUseTemplate}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black shadow-xl shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{isCloning ? 'Copying to Workspace...' : 'Use This Template'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
