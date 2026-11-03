import { sourcesSlides, visibleSlideText, type AcademicBrief, type Citation, type Layout, type Reference, type Slide } from "./model";

export type AiInput = { topic: string; material: string; references: Reference[]; count: number; brief: AcademicBrief };
export type AiPlan = { slides: Slide[]; warnings: string[]; provider: string; model: string };
export type AiStatus = { state: "offline" | "unconfigured" | "ready"; model: string };
export type AssistMode = "shorten" | "clarify" | "notes";
export type AssistInput = { mode: AssistMode; topic: string; brief: AcademicBrief; slide: Slide; layout: Layout; references: Reference[] };
export type AssistResult = { mode: AssistMode; slide: { title: string; body: string; notes: string }; warnings: string[] };

export const TEXT_LAYOUTS: Layout[] = ["text", "bullets", "columns", "statement"];
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
/** Extracted PDF/Word text can hold control characters the API rejects; they carry no meaning. */
export const cleanText = (value: string) => value.replace(CONTROL, " ");
/** The provider writes the content; the cover and, with documents, the sources slide are added around it. */
export const contentSlideCount = (count: number, hasReferences: boolean) => count - 1 - (hasReferences ? 1 : 0);
const BAD_PLAN = "AI planının quruluşu düzgün deyil. Cari təqdimat qorundu.";
const BAD_SLIDE = "AI düzəlişinin quruluşu düzgün deyil. Slayd dəyişdirilmədi.";

const cleanBrief = ({ purpose, audience, targetMinutes, goal }: AcademicBrief) => ({
  purpose, audience, targetMinutes, goal: cleanText(goal),
});
const cleanReference = (ref: Reference): Reference => ({
  id: ref.id, name: "Sənəd", pageCount: ref.pageCount, pages: ref.pages.map(page => ({ number: page.number, text: cleanText(page.text) })),
});
const isText = (value: unknown, max: number): value is string => typeof value === "string" && value.length <= max;
const isWarnings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === "string");

async function postJson(url: string, body: unknown, signal: AbortSignal) {
  let response: Response;
  try {
    response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, signal, body: JSON.stringify(body) });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error("Yerli API serverinə qoşulmaq mümkün olmadı. Serverin başladıldığını yoxla.");
  }
  let value;
  try { value = await response.json(); }
  catch (error) {
    if (signal.aborted) throw error;
    throw new Error("API cavabı oxunmadı. Yerli serverin işlədiyini yoxla.");
  }
  if (!response.ok) throw new Error(typeof value?.error?.message === "string" ? value.error.message : "AI sorğusu tamamlanmadı.");
  return value;
}

/** Reads the local API health route. Any failure counts as an offline server. */
export async function checkAiStatus(signal: AbortSignal): Promise<AiStatus> {
  try {
    const response = await fetch("/api/health", { headers: { Accept: "application/json" }, signal });
    const value = await response.json();
    if (!response.ok || value?.status !== "ok" || typeof value?.ai?.configured !== "boolean") return { state: "offline", model: "" };
    const model = typeof value.ai.model === "string" ? value.ai.model.slice(0, 40) : "";
    return { state: value.ai.configured ? "ready" : "unconfigured", model };
  } catch (error) {
    if (signal.aborted) throw error;
    return { state: "offline", model: "" };
  }
}

// Citations are re-resolved against the local documents; the file name always comes from here.
function readCitations(value: unknown, references: Reference[]): Citation[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  const citations: Citation[] = [];
  for (const item of value) {
    const c = item as Partial<Citation> | null;
    const ref = c && typeof c.sourceId === "string" ? references.find(r => r.id === c.sourceId) : undefined;
    if (!ref || !Number.isInteger(c?.page) || !ref.pages.some(page => page.number === c?.page && page.text.trim())) return null;
    citations.push({ sourceId: ref.id, name: ref.name, page: c!.page! });
  }
  return citations;
}

export async function requestAiPlan(input: AiInput, signal: AbortSignal): Promise<AiPlan> {
  const value = await postJson("/api/generate", {
    topic: cleanText(input.topic), material: cleanText(input.material), count: input.count, consent: true,
    brief: cleanBrief(input.brief), references: input.references.map(cleanReference),
  }, signal);
  const raw: unknown[] = Array.isArray(value?.slides) ? value.slides : [];
  const expected = contentSlideCount(input.count, input.references.length > 0);
  if (raw.length - 1 < Math.max(2, expected - 1) || raw.length - 1 > expected + 1 || !isWarnings(value?.warnings)) throw new Error(BAD_PLAN);
  const slides = raw.map((item, i): Slide => {
    const s = item as Partial<Slide> | null;
    const citations = readCitations(s?.citations, input.references);
    if (!s || !citations || typeof s.id !== "string" || !s.id || s.id.length > 100 ||
      !isText(s.title, 160) || !s.title.trim() || !isText(s.body, 3000) || (i > 0 && !s.body.trim()) ||
      (s.notes !== undefined && !isText(s.notes, 8000)) ||
      (i === 0 ? s.layout !== "cover" : !TEXT_LAYOUTS.includes(s.layout as Layout)))
      throw new Error(BAD_PLAN);
    return { id: s.id, title: s.title, body: s.body, notes: s.notes || "", layout: s.layout, citations, ...(citations.length ? { citationReview: true } : {}) };
  });
  if (new Set(slides.map(slide => slide.id)).size !== slides.length) throw new Error(BAD_PLAN);
  return {
    slides: [...slides, ...sourcesSlides(input.references)],
    warnings: value.warnings, provider: "deepseek", model: typeof value.model === "string" ? value.model : "deepseek",
  };
}

/** Only the document pages this slide cites travel with it. */
export function citedSources(slide: Slide, references: Reference[]): Reference[] {
  const wanted = new Map<string, Set<number>>();
  for (const c of slide.citations || []) wanted.set(c.sourceId, (wanted.get(c.sourceId) || new Set<number>()).add(c.page));
  return references.flatMap(ref => {
    const pages = ref.pages.filter(page => wanted.get(ref.id)?.has(page.number) && page.text.trim());
    return pages.length ? [{ ...ref, pages }] : [];
  });
}
/** Modes a slide supports: rewriting needs body text on a text layout, notes need any visible text. */
export function assistModes(slide: Slide, layout: Layout): AssistMode[] {
  const modes: AssistMode[] = [];
  if (TEXT_LAYOUTS.includes(layout) && slide.body.trim()) modes.push("shorten", "clarify");
  if (visibleSlideText(slide).trim()) modes.push("notes");
  return modes;
}

export function slideAssistPayload(input: Omit<AssistInput, "mode">) {
  const { slide, layout } = input;
  const structural = !TEXT_LAYOUTS.includes(layout) && layout !== "cover";
  return {
    topic: cleanText(input.topic), consent: true, brief: cleanBrief(input.brief),
    slide: { title: cleanText(slide.title), body: cleanText(slide.body), notes: cleanText(slide.notes || ""), layout, content: structural ? cleanText(visibleSlideText(slide)) : "" },
    references: citedSources(slide, input.references).map(cleanReference),
  };
}

export async function requestSlideAssist(input: AssistInput, signal: AbortSignal): Promise<AssistResult> {
  const { mode } = input;
  const value = await postJson("/api/slide", { ...slideAssistPayload(input), mode }, signal);
  const s = value?.slide;
  if (!s || !isText(s.title, 160) || !isText(s.body, 3000) || !isText(s.notes, 8000) || !isWarnings(value?.warnings) ||
    (mode === "notes" ? !s.notes.trim() : !s.title.trim() || !s.body.trim()))
    throw new Error(BAD_SLIDE);
  return { mode, slide: { title: s.title, body: s.body, notes: s.notes }, warnings: value.warnings };
}
