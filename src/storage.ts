import {
  defaultBrief,
  defaultDesign,
  isDesignSettings,
  isAcademicBrief,
  isTableData,
  isChartData,
  isComparisonData,
  isTimelineData,
  isImageAsset,
  layouts,
  Project,
  themes,
} from "./model";

export const PROJECTS_KEY = "teqdim.projects.v1";
export const DRAFT_KEY = "teqdim.draft.v1";
export type Draft = {
  project: Project;
  step: number;
  selected: number;
  count: number;
};
export function isProject(value: unknown): value is Project {
  if (!value || typeof value !== "object") return false;
  const p = value as Project;
  return (
    typeof p.id === "string" &&
    typeof p.topic === "string" &&
    typeof p.author === "string" &&
    typeof p.subject === "string" &&
    typeof p.updatedAt === "string" &&
    themes.some((t) => t.id === p.theme) &&
    (p.brief === undefined || isAcademicBrief(p.brief)) &&
    (p.design === undefined || isDesignSettings(p.design)) &&
    Array.isArray(p.slides) &&
    p.slides.every(
      (s) =>
        s &&
        typeof s.id === "string" &&
        typeof s.title === "string" &&
        typeof s.body === "string" &&
        (s.layout === undefined || layouts.some((l) => l.id === s.layout)) &&
        (s.notes === undefined || typeof s.notes === "string") &&
        (s.table === undefined || isTableData(s.table)) &&
        (s.chart === undefined || isChartData(s.chart)) &&
        (s.comparison === undefined || isComparisonData(s.comparison)) &&
        (s.timeline === undefined || isTimelineData(s.timeline)) &&
        (s.image === undefined || isImageAsset(s.image)) &&
        (s.citations === undefined ||
          (Array.isArray(s.citations) &&
            s.citations.every(
              (c) =>
                c &&
                typeof c.name === "string" &&
                typeof c.sourceId === "string" &&
                Number.isInteger(c.page) &&
                c.page > 0,
            ))),
    ) &&
    (p.material === undefined || typeof p.material === "string") &&
    (p.references === undefined ||
      (Array.isArray(p.references) &&
        p.references.every(
          (r) =>
            r &&
            typeof r.id === "string" &&
            typeof r.name === "string" &&
            Number.isInteger(r.pageCount) &&
            r.pageCount > 0 &&
            Array.isArray(r.pages) &&
            r.pages.length > 0 &&
            r.pages.every(
              (page) =>
                page &&
                Number.isInteger(page.number) &&
                page.number > 0 &&
                page.number <= r.pageCount &&
                typeof page.text === "string",
            ),
        )))
  );
}
export function readProjects(): Project[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(PROJECTS_KEY) || "[]",
    );
    return Array.isArray(value)
      ? value.filter(isProject).filter((p) => p.slides.length)
      : [];
  } catch {
    return [];
  }
}
export function readDraft(): Draft | null {
  try {
    const value = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (
      !value ||
      !isProject(value.project) ||
      !Number.isInteger(value.step) ||
      value.step < 1 ||
      value.step > 3 ||
      !Number.isInteger(value.selected) ||
      value.selected < 0 ||
      !Number.isInteger(value.count) ||
      value.count < 4 ||
      value.count > 12
    )
      return null;
    if (value.step > 1 && !value.project.slides.length) return null;
    return {
      ...value,
      selected: Math.min(
        value.selected,
        Math.max(0, value.project.slides.length - 1),
      ),
    };
  } catch {
    return null;
  }
}
export function projectContent(project: Project): string {
  return JSON.stringify({
    topic: project.topic,
    subject: project.subject,
    author: project.author,
    theme: project.theme,
    design: project.design || defaultDesign,
    slides: project.slides,
    references: project.references || [],
    material: project.material || "",
    brief: project.brief || defaultBrief,
  });
}
