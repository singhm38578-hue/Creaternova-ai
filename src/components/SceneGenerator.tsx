import React, { useState } from 'react';
import {
  Clapperboard,
  Sparkles,
  Camera,
  Music,
  Tv,
  Sun,
  Tag,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  LayoutGrid,
  List,
  Edit2
} from 'lucide-react';
import { Project, SceneItem } from '../types/content';
import { studioApi } from '../services/api';

interface SceneGeneratorProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  initialScriptContext?: string;
}

export const SceneGenerator: React.FC<SceneGeneratorProps> = ({
  project,
  onUpdateProject,
  initialScriptContext,
}) => {
  const [sceneCount, setSceneCount] = useState(6);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateScenes = async () => {
    setIsLoading(true);
    try {
      const scriptText = initialScriptContext || project.script?.rawFullText || project.topic;
      const res = await studioApi.generateScenes({
        title: project.script?.title || project.name,
        scriptText,
        format: project.format,
        sceneCount,
      });

      if (res.scenes && Array.isArray(res.scenes)) {
        const scenes: SceneItem[] = res.scenes.map((s, idx) => ({
          id: s.id || `scene-${Date.now()}-${idx}`,
          sceneNumber: s.sceneNumber || idx + 1,
          timestampRange: s.timestampRange || `0:${String(idx * 15).padStart(2, '0')} - 0:${String((idx + 1) * 15).padStart(2, '0')}`,
          shotType: s.shotType || 'Medium Shot',
          cameraAngle: s.cameraAngle || 'Eye Level',
          visualDescription: s.visualDescription || '',
          audioSfx: s.audioSfx || '',
          onScreenText: s.onScreenText || '',
          lightingMood: s.lightingMood || 'Vibrant Studio',
          brollKeywords: Array.isArray(s.brollKeywords) ? s.brollKeywords : ['cinematic', 'b-roll'],
        }));

        onUpdateProject({
          ...project,
          scenes,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed generating scenes', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddScene = () => {
    const nextNum = (project.scenes.length || 0) + 1;
    const newScene: SceneItem = {
      id: `scene-${Date.now()}`,
      sceneNumber: nextNum,
      timestampRange: `Scene ${nextNum}`,
      shotType: 'Close Up',
      cameraAngle: 'Eye Level',
      visualDescription: 'Describe what appears on camera here...',
      audioSfx: 'Ambient sound, voiceover, music swell',
      onScreenText: 'LOWER THIRD TITLE',
      lightingMood: 'Natural high-key lighting',
      brollKeywords: ['b-roll', 'stock footage'],
    };

    onUpdateProject({
      ...project,
      scenes: [...project.scenes, newScene],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteScene = (id: string) => {
    const updated = project.scenes
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));

    onUpdateProject({
      ...project,
      scenes: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateSceneField = (id: string, field: keyof SceneItem, value: any) => {
    const updated = project.scenes.map((s) => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    });

    onUpdateProject({
      ...project,
      scenes: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleCopyShotlist = () => {
    const text = project.scenes
      .map(
        (s) =>
          `SCENE ${s.sceneNumber} (${s.timestampRange})\n- Shot: ${s.shotType} [${s.cameraAngle}]\n- Visual: ${s.visualDescription}\n- Audio/SFX: ${s.audioSfx}\n- Graphics: ${s.onScreenText}\n- Lighting: ${s.lightingMood}\n- B-Roll Keywords: ${s.brollKeywords.join(', ')}\n`
      )
      .join('\n---\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in">
      {/* Setup Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <Clapperboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Scene Generator & Storyboard</h2>
              <p className="text-xs text-slate-400">Cinematography shotlist, camera angles, lighting notes, and audio/SFX cues</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg border text-xs font-semibold ${
                viewMode === 'grid' ? 'bg-purple-600/30 text-purple-300 border-purple-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg border text-xs font-semibold ${
                viewMode === 'table' ? 'bg-purple-600/30 text-purple-300 border-purple-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-300 uppercase">Target Scene Count:</span>
            {[4, 6, 8, 10].map((num) => (
              <button
                key={num}
                onClick={() => setSceneCount(num)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  sceneCount === num
                    ? 'bg-purple-600 text-white border-purple-500'
                    : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {num} Shots
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {project.scenes.length > 0 && (
              <>
                <button
                  onClick={handleCopyShotlist}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Shotlist'}</span>
                </button>
                <button
                  onClick={handleAddScene}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Scene</span>
                </button>
              </>
            )}

            <button
              onClick={handleGenerateScenes}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Storyboarding Shots...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{project.scenes.length > 0 ? 'Regenerate Storyboard' : 'Generate Storyboard with AI'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Storyboard Content */}
      {project.scenes.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {project.scenes.map((scene) => (
              <div
                key={scene.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
              >
                <div className="space-y-3">
                  {/* Top Bar: Scene # & Angles */}
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/50 text-purple-300 font-bold text-xs flex items-center justify-center">
                      #{scene.sceneNumber}
                    </span>
                    <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {scene.timestampRange}
                    </span>
                    <button
                      onClick={() => handleDeleteScene(scene.id)}
                      className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                      title="Delete scene"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Shot Type & Angle Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      {scene.shotType}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/30">
                      {scene.cameraAngle}
                    </span>
                  </div>

                  {/* Visual Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Visual & Action:
                    </label>
                    <textarea
                      rows={3}
                      value={scene.visualDescription}
                      onChange={(e) => handleUpdateSceneField(scene.id, 'visualDescription', e.target.value)}
                      className="w-full text-xs text-white bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 leading-relaxed focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  {/* Audio / SFX */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      <Music className="w-3 h-3" />
                      Audio & Sound FX
                    </div>
                    <p className="text-xs text-slate-300 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                      {scene.audioSfx}
                    </p>
                  </div>

                  {/* On Screen Text */}
                  {scene.onScreenText && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                        <Tv className="w-3 h-3" />
                        On-Screen Graphics
                      </div>
                      <p className="text-xs font-mono font-semibold text-cyan-200 bg-cyan-950/20 p-2 rounded-lg border border-cyan-800/40">
                        {scene.onScreenText}
                      </p>
                    </div>
                  )}
                </div>

                {/* B-roll Tags */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
                  <Tag className="w-3 h-3 text-slate-500" />
                  {scene.brollKeywords.map((kw, i) => (
                    <span key={i} className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Shot & Angle</th>
                  <th className="py-3 px-4 min-w-[280px]">Visual Action</th>
                  <th className="py-3 px-4 min-w-[200px]">Audio / SFX</th>
                  <th className="py-3 px-4">Graphics</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {project.scenes.map((scene) => (
                  <tr key={scene.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-purple-400">#{scene.sceneNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{scene.timestampRange}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{scene.shotType}</div>
                      <div className="text-[10px] text-slate-400">{scene.cameraAngle}</div>
                    </td>
                    <td className="py-3 px-4 text-white leading-relaxed">{scene.visualDescription}</td>
                    <td className="py-3 px-4 text-amber-300/90 italic">{scene.audioSfx}</td>
                    <td className="py-3 px-4 font-mono text-cyan-300 font-semibold">{scene.onScreenText}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteScene(scene.id)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <Clapperboard className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300 mb-1">No scenes broken down yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Convert your script into an actionable filming shotlist with camera angles, visual descriptions, and audio cues.
          </p>
          <button
            onClick={handleGenerateScenes}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-colors cursor-pointer"
          >
            Generate Storyboard Now
          </button>
        </div>
      )}
    </div>
  );
};
