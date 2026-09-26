import React, { useState, useEffect } from 'react';
import {
  Palette,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Bot,
  User,
  Volume2,
  Shirt,
  Eye,
  Check,
  Edit2,
  X
} from 'lucide-react';
import { Character } from '../types/content';
import { studioApi } from '../services/api';

interface CharacterLibraryViewProps {
  onSelectActiveCharacter?: (character: Character) => void;
  activeCharacterId?: string;
}

export const CharacterLibraryView: React.FC<CharacterLibraryViewProps> = ({
  onSelectActiveCharacter,
  activeCharacterId,
}) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState<string>(activeCharacterId || '');

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('Host / Science Guide');
  const [visualDescription, setVisualDescription] = useState('');
  const [clothing, setClothing] = useState('');
  const [mainColors, setMainColors] = useState<string>('#8b5cf6, #06b6d4, #1e1b4b');
  const [personality, setPersonality] = useState('Curious, energetic, explanatory');
  const [voiceStyle, setVoiceStyle] = useState('Energetic, friendly with slight robotic reverb');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const res = await studioApi.characters.list();
      setCharacters(res.characters || []);
      if (!selectedCharId && res.characters?.length > 0) {
        setSelectedCharId(res.characters[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load characters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !visualDescription.trim()) {
      setError('Name and visual description are required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const colorsArray = mainColors
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const res = await studioApi.characters.create({
        name,
        role,
        visualDescription,
        clothing,
        mainColors: colorsArray.length > 0 ? colorsArray : ['#8b5cf6', '#06b6d4'],
        personality,
        voiceStyle,
      });

      setCharacters((prev) => [res.character, ...prev]);
      setIsModalOpen(false);
      // Reset form
      setName('');
      setVisualDescription('');
      setClothing('');
    } catch (err: any) {
      setError(err.message || 'Failed to save character');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this character?')) return;
    try {
      await studioApi.characters.delete(id);
      setCharacters((prev) => prev.filter((c) => c.id !== id));
      if (selectedCharId === id) setSelectedCharId('');
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleUseCharacter = (char: Character) => {
    setSelectedCharId(char.id);
    if (onSelectActiveCharacter) {
      onSelectActiveCharacter(char);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      {/* Header Banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border border-violet-800/40 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30 text-xs font-semibold mb-2">
            <Palette className="w-3.5 h-3.5" /> Character Consistency Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Character Library</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Save recurring hosts & personas. When generating video scenes, CreatorNova automatically weaves their physical description, clothing, and colors into every shot.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Character
        </button>
      </div>

      {/* Grid of Characters */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : characters.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl space-y-3">
          <Bot className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Characters Saved Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Create your first recurring avatar (e.g. Dr. Nova, Robo Guide, Coach Alex) to guarantee visual continuity across your YouTube Shorts and TikToks.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl"
          >
            Create Character
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {characters.map((char) => {
            const isSelected = selectedCharId === char.id;
            return (
              <div
                key={char.id}
                className={`relative rounded-2xl bg-slate-900 border transition-all overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-violet-500 shadow-xl shadow-violet-500/10 ring-1 ring-violet-500'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Active Badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow">
                    <Check className="w-3 h-3" /> Active In Agent
                  </div>
                )}

                <div className="p-5 space-y-4">
                  {/* Top Character Profile */}
                  <div className="flex items-center gap-3">
                    <img
                      src={char.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${char.name}`}
                      alt={char.name}
                      className="w-14 h-14 rounded-xl bg-slate-800 border border-violet-500/30 object-cover shadow-inner"
                    />
                    <div>
                      <h3 className="text-base font-bold text-white">{char.name}</h3>
                      <p className="text-xs text-violet-400 font-medium">{char.role}</p>
                    </div>
                  </div>

                  {/* Attributes */}
                  <div className="space-y-2.5 text-xs text-slate-300">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Eye className="w-3 h-3 text-cyan-400" /> Visual Description
                      </span>
                      <p className="text-xs text-slate-300 mt-0.5 line-clamp-3 leading-relaxed">
                        {char.visualDescription}
                      </p>
                    </div>

                    {char.clothing && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Shirt className="w-3 h-3 text-pink-400" /> Clothing & Attire
                        </span>
                        <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                          {char.clothing}
                        </p>
                      </div>
                    )}

                    {char.voiceStyle && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-amber-400" /> Voice Style
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">{char.voiceStyle}</p>
                      </div>
                    )}

                    {/* Color Swatches */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Signature Colors
                      </span>
                      <div className="flex items-center gap-1.5">
                        {char.mainColors?.map((color, cIdx) => (
                          <div
                            key={cIdx}
                            className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => handleDelete(char.id, e)}
                    className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors"
                    title="Delete Character"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleUseCharacter(char)}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-violet-600 hover:bg-violet-500 text-white'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                      </>
                    ) : (
                      'Use Character'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Character Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-violet-500/40 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-5 bg-gradient-to-r from-violet-950 to-slate-900 border-b border-violet-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-violet-400" />
                <h3 className="text-lg font-bold text-white">Add Recurring Character</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Character Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Nova, Captain Cosmo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Role / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Cosmic Guide, Fitness Mentor"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">
                  Visual Description (Exact physical features) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Futuristic robot with sleek deep violet armor, glowing cyan optic visor with an expressive holographic display, polished chrome joints..."
                  value={visualDescription}
                  onChange={(e) => setVisualDescription(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Clothing & Costume</label>
                <input
                  type="text"
                  placeholder="e.g. Violet titanium exoskeleton with subtle neon circuit engravings"
                  value={clothing}
                  onChange={(e) => setClothing(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Main Colors (Hex or names)</label>
                  <input
                    type="text"
                    placeholder="#8b5cf6, #06b6d4, #1e1b4b"
                    value={mainColors}
                    onChange={(e) => setMainColors(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Personality</label>
                  <input
                    type="text"
                    placeholder="Curious, mind-blown by science"
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Voice Style</label>
                <input
                  type="text"
                  placeholder="Energetic, friendly with slight metallic reverberation"
                  value={voiceStyle}
                  onChange={(e) => setVoiceStyle(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold"
                >
                  {saving ? 'Saving...' : 'Save Character'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
