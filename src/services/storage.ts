import { Project } from '../types/content';
import { STARTER_PROJECTS } from '../data/starterProjects';

const STORAGE_KEY = 'creatornova_projects_v1';
const ACTIVE_PROJECT_KEY = 'creatornova_active_project_id';

export function getStoredProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(STARTER_PROJECTS));
      return STARTER_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : STARTER_PROJECTS;
  } catch (e) {
    console.error('Failed reading projects from storage', e);
    return STARTER_PROJECTS;
  }
}

export function saveProjects(projects: Project[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed saving projects to storage', e);
  }
}

export function getActiveProjectId(projects: Project[]): string {
  try {
    const saved = localStorage.getItem(ACTIVE_PROJECT_KEY);
    if (saved && projects.some(p => p.id === saved)) {
      return saved;
    }
  } catch (e) {
    // fallback
  }
  return projects[0]?.id || 'project-kids-colors';
}

export function setActiveProjectId(id: string) {
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  } catch (e) {
    // ignore
  }
}

export function exportProjectMarkdown(project: Project): string {
  const lines: string[] = [];
  lines.push(`# 🎬 CreatorNova Production Packet: ${project.name}`);
  lines.push(`**Topic:** ${project.topic}`);
  lines.push(`**Format:** ${project.format.replace('_', ' ').toUpperCase()} | **Audience:** ${project.targetAudience} | **Tone:** ${project.tone}`);
  lines.push(`**Created:** ${new Date(project.createdAt).toLocaleDateString()} | **Last Updated:** ${new Date(project.updatedAt).toLocaleDateString()}\n`);

  // SEO Section
  if (project.seo) {
    lines.push(`## 🔍 SEO Strategy & Metadata`);
    lines.push(`### Recommended Titles`);
    project.seo.titles.forEach((t, i) => {
      lines.push(`${i + 1}. **${t.title}** (CTR Score: ${t.score} | Category: ${t.category})`);
    });
    lines.push(`\n### Tags`);
    lines.push(`\`${project.seo.tags.join(', ')}\`\n`);
    lines.push(`### Hashtags`);
    lines.push(`${project.seo.hashtags.join(' ')}\n`);
    lines.push(`### Full Video Description`);
    lines.push('```markdown\n' + project.seo.description + '\n```\n');
  }

  // Script Section
  if (project.script) {
    lines.push(`## 📝 Complete Production Script`);
    lines.push(`**Estimated Duration:** ${project.script.estimatedDuration} | **Word Count:** ${project.script.wordCount}`);
    lines.push(`**Hook Note:** ${project.script.hookSummary}\n`);
    project.script.beats.forEach((b) => {
      lines.push(`### [${b.timestamp}] ${b.speaker} - ${b.sectionType.toUpperCase()}`);
      lines.push(`*Direction: ${b.directionCue}*`);
      lines.push(`**Visual Cue:** ${b.visualCue}`);
      lines.push(`> "${b.dialogue}"\n`);
    });
    lines.push(`**Call to Action:** ${project.script.callToAction}\n`);
  }

  // Storyboard Scenes
  if (project.scenes && project.scenes.length > 0) {
    lines.push(`## 🎬 Storyboard & Scene Breakdown`);
    project.scenes.forEach((s) => {
      lines.push(`### Scene ${s.sceneNumber}: [${s.timestampRange}] - ${s.shotType} (${s.cameraAngle})`);
      lines.push(`- **Visual:** ${s.visualDescription}`);
      lines.push(`- **Audio/SFX:** ${s.audioSfx}`);
      lines.push(`- **On-Screen Text:** ${s.onScreenText}`);
      lines.push(`- **Lighting:** ${s.lightingMood}`);
      lines.push(`- **B-Roll Keywords:** ${s.brollKeywords.join(', ')}\n`);
    });
  }

  // Thumbnail
  if (project.thumbnail) {
    lines.push(`## 🖼️ Thumbnail Blueprint`);
    lines.push(`- **Headline:** "${project.thumbnail.headline}"`);
    lines.push(`- **Subheadline:** "${project.thumbnail.subheadline}"`);
    lines.push(`- **Badge Text:** "${project.thumbnail.badgeText}"`);
    lines.push(`- **Aspect Ratio:** ${project.thumbnail.aspectRatio}`);
    lines.push(`- **Theme:** ${project.thumbnail.templateTheme}`);
    if (project.thumbnail.aiConceptPrompt) {
      lines.push(`- **AI Image Prompt:** ${project.thumbnail.aiConceptPrompt}`);
    }
    lines.push('');
  }

  // Translations
  if (project.translations && project.translations.length > 0) {
    lines.push(`## 🌐 Translations & Localization`);
    project.translations.forEach((t) => {
      lines.push(`### ${t.targetLanguage} (${t.mode.toUpperCase()})`);
      lines.push(`> "${t.translatedText}"`);
      lines.push(`*Cultural Notes: ${t.culturalNotes}*`);
      lines.push(`*Pacing Tip: ${t.speechPacingTip}*\n`);
    });
  }

  return lines.join('\n');
}
