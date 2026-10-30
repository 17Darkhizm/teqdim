import { isProject } from "./storage";
import {
  Project,
  projectImageSize,
  PROJECT_IMAGE_LIMIT,
  safeFileName,
} from "./model";

export const BACKUP_LIMIT = 2 * 1024 * 1024;
function validateBackupProject(project: unknown): asserts project is Project {
  if (!isProject(project))
    throw new Error("Fayldakı təqdimatın quruluşu düzgün deyil.");
  if (!project.slides.length || project.slides.length > 80)
    throw new Error("Ehtiyat nüsxədə 1–80 slayd olmalıdır.");
  if (new Set(project.slides.map((s) => s.id)).size !== project.slides.length)
    throw new Error("Slayd identifikatorları təkrarlanır.");
  if (
    project.topic.length > 160 ||
    project.author.length > 90 ||
    project.subject.length > 70 ||
    (project.material?.length || 0) > 12000
  )
    throw new Error("Təqdimat məlumatlarının həcmi limiti aşır.");
  if (
    project.slides.some(
      (s) =>
        s.title.length > 160 ||
        s.body.length > 12000 ||
        (s.notes?.length || 0) > 8000,
    )
  )
    throw new Error("Slayd mətni və ya çıxış qeydi həddən artıq uzundur.");
  if (
    (project.references?.length || 0) > 3 ||
    project.references?.some((r) => r.pages.length > 50)
  )
    throw new Error("Materialların sayı və ya səhifə limiti aşılır.");
  if (projectImageSize(project.slides) > PROJECT_IMAGE_LIMIT)
    throw new Error("Layihədəki şəkillər yaddaş limitini aşır.");
  const refs = project.references || [];
  if (new Set(refs.map((r) => r.id)).size !== refs.length)
    throw new Error("Material identifikatorları təkrarlanır.");
  if (
    refs.reduce(
      (sum, r) => sum + r.pages.reduce((n, p) => n + p.text.length, 0),
      0,
    ) > 100000
  )
    throw new Error("Material mətnləri 100 000 simvol limitini aşır.");
}
export function encodeBackup(project: Project): string {
  validateBackupProject(project);
  const text = JSON.stringify(
    {
      format: "teqdim-project",
      version: 4,
      exportedAt: new Date().toISOString(),
      project,
    },
    null,
    2,
  );
  if (new TextEncoder().encode(text).length > BACKUP_LIMIT)
    throw new Error(
      "Ehtiyat nüsxə 2 MB limitini aşır. Şəkilləri, uzun mətnləri və ya çıxış qeydlərini azalt.",
    );
  return text;
}
export function decodeBackup(text: string): Project {
  if (new TextEncoder().encode(text).length > BACKUP_LIMIT)
    throw new Error("Ehtiyat nüsxə ən çox 2 MB ola bilər.");
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(
      "Fayl etibarlı JSON deyil. Təqdim-dən yüklənmiş ehtiyat nüsxəni seç.",
    );
  }
  if (
    value?.format !== "teqdim-project" ||
    ![1, 2, 3, 4].includes(value.version)
  )
    throw new Error("Bu fayl dəstəklənən Təqdim ehtiyat nüsxəsi deyil.");
  validateBackupProject(value.project);
  const p: Project = value.project;
  // Only retain the public data model, never unknown imported fields.
  return {
    id: p.id,
    topic: p.topic,
    author: p.author,
    subject: p.subject,
    theme: p.theme,
    design: p.design
      ? {
          headingFont: p.design.headingFont,
          textSize: p.design.textSize,
          decoration: p.design.decoration,
          showNumbers: p.design.showNumbers,
        }
      : undefined,
    updatedAt: p.updatedAt,
    material: p.material || "",
    brief: p.brief
      ? {
          purpose: p.brief.purpose,
          audience: p.brief.audience,
          targetMinutes: p.brief.targetMinutes,
          goal: p.brief.goal,
          institution: p.brief.institution,
          teacher: p.brief.teacher,
          group: p.brief.group,
        }
      : undefined,
    references: (p.references || []).map((r) => ({
      id: r.id,
      name: r.name,
      pageCount: r.pageCount,
      pages: r.pages.map((page) => ({ number: page.number, text: page.text })),
    })),
    slides: p.slides.map((s) => ({
      id: s.id,
      title: s.title,
      body: s.body,
      layout: s.layout,
      notes: s.notes || "",
      comparison: s.comparison
        ? {
            leftTitle: s.comparison.leftTitle,
            rightTitle: s.comparison.rightTitle,
            left: s.comparison.left,
            right: s.comparison.right,
          }
        : undefined,
      timeline: s.timeline
        ? {
            steps: s.timeline.steps.map((step) => ({
              label: step.label,
              title: step.title,
              body: step.body,
            })),
          }
        : undefined,
      image: s.image
        ? {
            data: s.image.data,
            width: s.image.width,
            height: s.image.height,
            alt: s.image.alt,
            credit: s.image.credit,
          }
        : undefined,
      table: s.table
        ? {
            columns: [...s.table.columns],
            rows: s.table.rows.map((row) => [...row]),
          }
        : undefined,
      chart: s.chart
        ? {
            type: s.chart.type,
            name: s.chart.name,
            unit: s.chart.unit,
            points: s.chart.points.map((p) => ({
              label: p.label,
              value: p.value,
            })),
          }
        : undefined,
      citations: s.citations?.map((c) => ({
        sourceId: c.sourceId,
        name: c.name,
        page: c.page,
      })),
      citationReview: !!s.citationReview,
      ...(s.hidden ? { hidden: true } : {}),
    })),
  };
}
export function downloadBackup(project: Project) {
  const content = encodeBackup(project);
  const url = URL.createObjectURL(
    new Blob([content], { type: "application/json;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeFileName(project.topic)}.teqdim.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
