import { randomUUID } from 'node:crypto';
import { ApiError, invalid } from './errors.mjs';

// Hard limits mirror the editor (title 160, body 3000, notes 8000); targets are what the prompt asks for.
export const LIMITS = { topic: 160, material: 12000, title: 160, body: 3000, bodyTarget: 460, notes: 8000, content: 12000 };
export const TEXT_LAYOUTS = ['text', 'bullets', 'columns', 'statement'];
export const ALL_LAYOUTS = ['cover', ...TEXT_LAYOUTS, 'table', 'chart', 'comparison', 'timeline', 'image'];
export const ASSIST_MODES = ['shorten', 'clarify', 'notes'];
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const object = value => value && typeof value === 'object' && !Array.isArray(value);
function text(value, label, max, required = false) {
  if (typeof value !== 'string') throw invalid(`${label} mətn olmalıdır.`);
  if (CONTROL.test(value)) throw invalid(`${label} icazə verilməyən idarəetmə simvolu daxil edir.`);
  if (value.length > max) throw invalid(`${label} ${max} simvol limitini aşır.`);
  if (required && !value.trim()) throw invalid(`${label} boş ola bilməz.`);
  return value.trim();
}
function exactKeys(value, keys) {
  if (Object.keys(value).some(key => !keys.includes(key))) throw invalid('Sorğuda dəstəklənməyən sahə var.');
}
function readReferences(refs = []) {
  if (!Array.isArray(refs) || refs.length > 3) throw invalid('Ən çox 3 mənbə sənədi göndər.');
  let total = 0;
  const ids = new Set();
  return refs.map(ref => {
    if (!object(ref)) throw invalid('Mənbə sənədinin quruluşu düzgün deyil.');
    exactKeys(ref, ['id', 'name', 'pageCount', 'pages']);
    const id = text(ref.id, 'Mənbə identifikatoru', 100, true);
    if (ids.has(id)) throw invalid('Mənbə identifikatorları təkrarlanır.');
    ids.add(id);
    const name = text(ref.name, 'Fayl adı', 255, true);
    if (!Number.isSafeInteger(ref.pageCount) || ref.pageCount < 1 || ref.pageCount > 1000000 || !Array.isArray(ref.pages) || !ref.pages.length || ref.pages.length > 50)
      throw invalid('Mənbənin səhifə məlumatları düzgün deyil.');
    const numbers = new Set();
    let sourceLength = 0;
    const pages = ref.pages.map(page => {
      if (!object(page) || !Number.isInteger(page.number) || page.number < 1 || page.number > ref.pageCount || numbers.has(page.number)) throw invalid('Mənbə səhifəsi düzgün deyil və ya təkrarlanır.');
      exactKeys(page, ['number', 'text']);
      numbers.add(page.number);
      const content = text(page.text, 'Mənbə mətni', 60000);
      sourceLength += content.length;
      total += content.length;
      if (sourceLength > 60000 || total > 100000) throw invalid('Mənbə mətnlərinin həcmi limiti aşır.');
      return { number: page.number, text: content };
    });
    return { id, name, pageCount: ref.pageCount, pages };
  });
}
function readBrief(b) {
  if (b === undefined) return undefined;
  if (!object(b)) throw invalid('Təqdimat məlumatları düzgün deyil.');
  exactKeys(b, ['purpose', 'audience', 'targetMinutes', 'goal', 'institution', 'teacher', 'group']);
  if (!['seminar', 'coursework', 'project'].includes(b.purpose) || !['classmates', 'teacher', 'general'].includes(b.audience) || ![3, 5, 7, 10, 15, 20].includes(b.targetMinutes)) throw invalid('Təqdimat məqsədi, auditoriya və ya müddət düzgün deyil.');
  // Identity fields are checked but never sent to the AI provider.
  for (const [key, limit] of [['institution', 120], ['teacher', 90], ['group', 40]]) text(b[key] ?? '', 'Akademik məlumat', limit);
  return { purpose: b.purpose, audience: b.audience, targetMinutes: b.targetMinutes, goal: text(b.goal ?? '', 'Məqsəd', 160) };
}
/** Content slides the provider writes: the deck minus the cover and, with documents, the sources slide the client appends. */
export const contentCount = input => input.count - 1 - (input.references.length ? 1 : 0);

export function validateInput(value) {
  if (!object(value)) throw invalid('Sorğu JSON obyekti olmalıdır.');
  exactKeys(value, ['topic', 'material', 'references', 'count', 'brief', 'consent']);
  if (value.consent !== true) throw invalid('Materialın DeepSeek-ə göndərilməsinə razılıq tələb olunur.');
  const topic = text(value.topic, 'Mövzu', LIMITS.topic, true);
  const material = text(value.material ?? '', 'Material', LIMITS.material);
  if (!Number.isInteger(value.count) || value.count < 4 || value.count > 12) throw invalid('Slayd sayı 4–12 arasında tam ədəd olmalıdır.');
  const references = readReferences(value.references ?? []);
  if (!material && !references.some(ref => ref.pages.some(page => page.text))) throw invalid('Mənbəyə əsaslanan plan üçün öz mətnini və ya sənəd materialını əlavə et.');
  return { topic, material, references, count: value.count, brief: readBrief(value.brief) };
}

const outputError = scope => () => { throw new ApiError(502, 'INVALID_AI_OUTPUT', `AI nəticəsinin quruluşu düzgün deyil. ${scope} dəyişdirilmədi.`); };
function readCitations(list, references, fail) {
  if (list === undefined || list === null) return [];
  if (!Array.isArray(list) || list.length > 50) fail();
  const seen = new Map();
  for (const citation of list) {
    if (!object(citation) || typeof citation.sourceId !== 'string') fail();
    const page = typeof citation.page === 'string' && /^\d{1,7}$/.test(citation.page.trim()) ? Number(citation.page) : citation.page;
    if (!Number.isInteger(page)) fail();
    // A source or page that was never sent is an invented citation: reject the whole answer.
    const ref = references.find(ref => ref.id === citation.sourceId);
    if (!ref || !ref.pages.some(item => item.number === page && item.text)) fail();
    seen.set(`${ref.id}:${page}`, { sourceId: ref.id, name: ref.name, page });
  }
  return [...seen.values()];
}

export function validateOutput(value, input) {
  const fail = outputError('Mövcud təqdimat');
  if (!object(value) || !Array.isArray(value.slides)) fail();
  const wanted = contentCount(input);
  const got = value.slides.length;
  // The count is a target, as in the local planner; a far-off answer means the model ignored the brief.
  if (got < Math.max(2, wanted - 1) || got > wanted + 1) fail();
  const long = [];
  const uncited = [];
  const slides = value.slides.map((slide, i) => {
    if (!object(slide)) fail();
    let title, body, notes;
    try {
      title = text(slide.title, 'Slayd başlığı', LIMITS.title, true);
      body = text(slide.body, 'Slayd mətni', LIMITS.body, true);
      notes = text(slide.notes ?? '', 'Çıxış qeydi', LIMITS.notes);
    } catch { fail(); }
    const citations = readCitations(slide.citations, input.references, fail);
    if (body.length > LIMITS.bodyTarget) long.push(i + 2);
    if (input.references.length && !citations.length) uncited.push(i + 2);
    return { id: randomUUID(), title, body, notes, layout: TEXT_LAYOUTS.includes(slide.layout) ? slide.layout : 'text', citations, ...(citations.length ? { citationReview: true } : {}) };
  });
  const warnings = [];
  if (got !== wanted) warnings.push(`AI ${wanted} əvəzinə ${got} məzmun slaydı hazırladı.`);
  if (long.length) warnings.push(`Uzun mətnli slaydlar: ${long.join(', ')}. Redaktorda «Böl» ilə ayıra bilərsən.`);
  if (uncited.length) warnings.push(`Mənbəsi göstərilməyən slaydlar: ${uncited.join(', ')}. Bu slaydların mətnini sənədlə müqayisə et.`);
  const cover = { id: randomUUID(), title: input.topic, body: input.brief?.goal || 'Mövzuya baxış və əsas məqamlar', layout: 'cover' };
  return { slides: [cover, ...slides], warnings };
}

export function validateAssistInput(value) {
  if (!object(value)) throw invalid('Sorğu JSON obyekti olmalıdır.');
  exactKeys(value, ['mode', 'topic', 'slide', 'references', 'brief', 'consent']);
  if (value.consent !== true) throw invalid('Slaydın DeepSeek-ə göndərilməsinə razılıq tələb olunur.');
  if (!ASSIST_MODES.includes(value.mode)) throw invalid('Düzəliş növü dəstəklənmir.');
  const s = value.slide;
  if (!object(s)) throw invalid('Slayd məlumatı düzgün deyil.');
  exactKeys(s, ['title', 'body', 'notes', 'layout', 'content']);
  if (!ALL_LAYOUTS.includes(s.layout)) throw invalid('Slaydın düzülüşü düzgün deyil.');
  const slide = {
    title: text(s.title ?? '', 'Slayd başlığı', LIMITS.title),
    body: text(s.body ?? '', 'Slayd mətni', LIMITS.body),
    notes: text(s.notes ?? '', 'Çıxış qeydi', LIMITS.notes),
    layout: s.layout,
    content: text(s.content ?? '', 'Slaydın görünən mətni', LIMITS.content),
  };
  if (value.mode !== 'notes') {
    if (!TEXT_LAYOUTS.includes(slide.layout)) throw invalid('Bu düzülüşdə yalnız çıxış qeydi hazırlamaq olar.');
    if (!slide.body) throw invalid('Düzəltmək üçün slaydda mətn olmalıdır.');
  } else if (!slide.title && !slide.body && !slide.content) throw invalid('Çıxış qeydi üçün slaydda mətn olmalıdır.');
  return { mode: value.mode, topic: text(value.topic ?? '', 'Mövzu', LIMITS.topic), slide, references: readReferences(value.references ?? []), brief: readBrief(value.brief) };
}

export function validateAssistOutput(value, input) {
  const fail = outputError('Slayd');
  if (!object(value)) fail();
  const { slide, mode } = input;
  let title = slide.title, body = slide.body, notes = slide.notes;
  try {
    if (mode === 'notes') notes = text(value.notes, 'Çıxış qeydi', LIMITS.notes, true);
    else {
      title = text(value.title ?? slide.title, 'Slayd başlığı', LIMITS.title, true);
      body = text(value.body, 'Slayd mətni', LIMITS.body, true);
    }
  } catch { fail(); }
  const warnings = [];
  if (mode === 'shorten') {
    let moved = '';
    try { moved = text(value.movedToNotes, 'Qeydlərə köçürülən mətn', LIMITS.notes); } catch { fail(); }
    if (!moved && (title !== slide.title || body !== slide.body)) {
      moved = ['Qısaltmadan əvvəlki mətn:', slide.title, slide.body].filter(Boolean).join('\n');
    }
    // Details cut from the slide are appended to the notes, never dropped silently.
    const joined = [slide.notes, moved].filter(Boolean).join('\n\n');
    if (joined.length > LIMITS.notes) throw new ApiError(422, 'NOTES_FULL', 'Köçürülən mətn çıxış qeydlərinə sığmır. Qeydləri qısaldıb yenidən cəhd et.');
    notes = joined;
    if (body.length >= slide.body.length) warnings.push('AI mətni qısaltmadı. Nəticəni orijinalla müqayisə et.');
  }
  if (mode !== 'notes' && body.length > LIMITS.bodyTarget) warnings.push('Mətn hələ də uzundur. «Böl» düyməsindən istifadə edə bilərsən.');
  warnings.push(mode === 'notes'
    ? 'Qeydin slayddakı fikirlərdən kənara çıxmadığını yoxla.'
    : 'Mənanın dəyişmədiyini və yeni fakt əlavə olunmadığını orijinalla müqayisə et.');
  return { slide: { title, body, notes }, warnings };
}
