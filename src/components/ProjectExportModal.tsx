import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, Code2, Sparkles } from 'lucide-react';
import { Project } from '../types/content';
import { exportProjectMarkdown } from '../services/storage';

interface ProjectExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const ProjectExportModal: React.FC<ProjectExportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'json'>('markdown');

  if (!isOpen) return null;

  const markdownContent = exportProjectMarkdown(project);
  const jsonContent = JSON.stringify(project, null, 2);

  const activeContent = exportFormat === 'markdown' ? markdownContent : jsonContent;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = exportFormat === 'markdown' ? 'md' : 'json';
    const mime = exportFormat === 'markdown' ? 'text/markdown' : 'application/json';
    const filename = `${project.name.toLowerCase().replace(/\s+/g, '_')}_production_packet.${ext}`;

    const blob = new Blob([activeContent], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
              <Download className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Production Packet</h2>
              <p className="text-xs text-slate-400">{project.name} — Full video assets & metadata</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setExportFormat('markdown')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  exportFormat === 'markdown' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Markdown (.md)
              </button>
              <button
                onClick={() => setExportFormat('json')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  exportFormat === 'json' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Raw JSON (.json)
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="p-6 flex-1 overflow-y-auto font-mono text-xs text-slate-200 bg-slate-950/80 leading-relaxed whitespace-pre-wrap selection:bg-violet-600 border-b border-slate-800">
          {activeContent}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Includes: Ideas, Script Beats, Scenes Storyboard, SEO & Thumbnail config
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
