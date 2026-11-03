import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';

const repo = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(repo, '.checks', 'ai'); await fs.mkdir(out, { recursive: true });
for (const name of await fs.readdir(path.join(repo, 'src'))) {
  if (!/\.tsx?$/.test(name) || name.endsWith('.d.ts') || name === 'main.tsx') continue;
  let code = ts.transpileModule(await fs.readFile(path.join(repo, 'src', name), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  code = code.replace(/(from\s+|import\()(['"])(\.\/[^'"]+)\2/g, (_, prefix, quote, specifier) => `${prefix}${quote}${specifier}.mjs${quote}`);
  await fs.writeFile(path.join(out, name.replace(/\.tsx?$/, '.mjs')), code);
}
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://teqdim.test/' });
for (const key of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event', 'MouseEvent', 'localStorage'])
  Object.defineProperty(globalThis, key, { value: key === 'window' ? dom.window : dom.window[key], configurable: true });
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const moduleUrl = name => pathToFileURL(path.join(out, name + '.mjs')).href;
const { createRoot } = await import('react-dom/client');
const { default: AiDraft } = await import(moduleUrl('AiDraft'));
const { defaultBrief } = await import(moduleUrl('model'));
const input = { topic: 'Mətn', material: 'İstifadəçi materialı.', references: [], count: 4, brief: defaultBrief };
const plan = { provider: 'deepseek', model: 'deepseek-flash', warnings: ['Faktları yoxla.'], slides: Array.from({ length: 4 }, (_, i) => ({ id: `ai-${i}`, title: `AI başlığı ${i}`, body: i ? 'Materialdan izah.' : '', notes: 'Qeyd', layout: i ? 'text' : 'cover', citations: [] })) };
const requests = [];
const healthRequests = [];
const slideRequests = [];
let handler = async () => Response.json(plan);
const healthy = async () => Response.json({ status: 'ok', ai: { configured: true, provider: 'deepseek', model: 'deepseek-flash' } });
let healthHandler = healthy;
let slideHandler = async () => Response.json({ error: { message: 'Gözlənilməz sorğu.' } }, { status: 500 });
const previousFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  if (url === '/api/health') { healthRequests.push({ signal: options.signal }); return healthHandler(url, options); }
  if (url === '/api/slide') { slideRequests.push({ body: JSON.parse(options.body), signal: options.signal }); return slideHandler(url, options); }
  assert.equal(url, '/api/generate', 'Sınaqda başqa şəbəkə sorğusu yoxdur');
  requests.push({ body: JSON.parse(options.body), signal: options.signal });
  return handler(url, options);
};
const serverStatus = () => document.querySelector('.ai-server-status')?.textContent || '';
let root = createRoot(document.getElementById('root'));
const applied = [];
async function render(key = 'first') { await act(async () => root.render(React.createElement(AiDraft, { input, inputKey: key, onApply: (...value) => applied.push(value) }))); }
const button = text => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === text);
async function click(el) { assert.ok(el, 'İdarə tapılmalıdır'); await act(async () => { el.click(); await new Promise(resolve => setTimeout(resolve, 5)); }); }
async function fill(id, value) { const el = document.getElementById(id); await act(async () => { Object.getOwnPropertyDescriptor(el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); }); }
function deferred() { let resolve; return { promise: new Promise(done => { resolve = done; }), resolve: value => resolve(value) }; }
try {
  await render(); assert.equal(requests.length + healthRequests.length, 0, 'Panel açılmadan şəbəkə sorğusu yoxdur');
  // Server state is read from /api/health; generation stays locked until the server reports a key.
  healthHandler = async () => { throw new TypeError('Failed to fetch'); };
  await click(button('DeepSeek ilə plan hazırla'));
  assert.equal(healthRequests.length, 1); assert.ok(serverStatus().includes('işləmir'), 'Server işləməyəndə bu açıq deyilir');
  await click(document.querySelector('.ai-consent input'));
  assert.equal(button('AI planını yarat').disabled, true, 'Server işləməyəndə AI düyməsi bağlıdır');
  healthHandler = async () => new Response('<!doctype html>', { status: 502, headers: { 'Content-Type': 'text/html' } });
  await click(button('Yenidən yoxla')); assert.ok(serverStatus().includes('işləmir'), 'JSON olmayan proxy cavabı serveri işlək saymır');
  healthHandler = async () => Response.json({ status: 'ok', ai: { configured: false, provider: 'deepseek', model: 'deepseek-flash' } });
  await click(button('Yenidən yoxla')); assert.ok(serverStatus().includes('açarı qurulmayıb'));
  assert.equal(button('AI planını yarat').disabled, true, 'Açar qurulmayanda AI düyməsi bağlıdır');
  const pendingHealth = deferred(); healthHandler = () => pendingHealth.promise;
  await click(button('Yenidən yoxla')); assert.ok(serverStatus().includes('yoxlanılır'));
  await click(button('DeepSeek ilə plan hazırla')); assert.equal(healthRequests.at(-1).signal.aborted, true, 'Panel bağlananda yoxlama ləğv edilir');
  await act(async () => { pendingHealth.resolve(Response.json({ status: 'ok', ai: { configured: true, model: 'deepseek-flash' } })); await new Promise(resolve => setTimeout(resolve, 5)); });
  assert.equal(document.querySelector('.ai-server-status'), null);
  healthHandler = healthy;
  await click(button('DeepSeek ilə plan hazırla'));
  assert.ok(serverStatus().includes('hazırdır') && serverStatus().includes('deepseek-flash'));
  assert.equal(document.querySelector('.ai-consent input').checked, false, 'Panel yenidən açılanda razılıq sıfırlanır');
  assert.equal(button('AI planını yarat').disabled, true);
  await click(document.querySelector('.ai-consent input'));
  const slow = deferred(); handler = () => slow.promise;
  await click(button('AI planını yarat'));
  assert.equal(requests.length, 1); assert.equal(requests[0].body.consent, true);
  await render('changed'); assert.equal(requests[0].signal.aborted, true);
  await act(async () => { slow.resolve(Response.json(plan)); await new Promise(resolve => setTimeout(resolve, 5)); });
  assert.equal(document.querySelector('.ai-plan-preview'), null, 'Köhnə materialın cavabı görünmür');
  assert.equal(document.querySelector('.ai-consent input').checked, false);
  handler = async () => Response.json(plan);
  await click(document.querySelector('.ai-consent input')); await click(button('AI planını yarat'));
  assert.ok(document.querySelector('.ai-plan-preview')); assert.equal(applied.length, 0);
  await click(button('AI planını tətbiq et')); assert.equal(applied.length, 1); assert.equal(applied[0][1], 'changed');
  handler = async () => Response.json({ error: { message: 'DeepSeek açarı serverdə hələ qurulmayıb.' } }, { status: 503 });
  await click(button('AI planını yarat')); assert.ok(document.querySelector('[role="alert"]').textContent.includes('açarı'));
  handler = async () => Response.json({ ...plan, slides: plan.slides.map(s => ({ ...s, citations: [{ name: 'Saxta.pdf', sourceId: 'fake', page: 9 }] })) });
  await click(button('AI planını yarat')); assert.ok(document.querySelector('[role="alert"]').textContent.includes('quruluşu'));
  const cancelled = deferred(); handler = () => cancelled.promise;
  await click(button('AI planını yarat')); const lastSignal = requests.at(-1).signal;
  await click(button('Sorğunu ləğv et')); assert.equal(lastSignal.aborted, true);
  await act(async () => { cancelled.resolve(Response.json(plan)); await new Promise(resolve => setTimeout(resolve, 5)); });
  assert.equal(document.querySelector('.ai-plan-preview'), null); assert.equal(document.querySelector('[role="alert"]'), null);
  await act(async () => root.unmount());

  // Plan client: control characters are cleaned, names come from the local document, the sources slide is appended.
  const { requestAiPlan, requestSlideAssist } = await import(moduleUrl('ai'));
  const docInput = { topic: 'Mətn\u0007', material: 'Qeyd\u0000 mətni.', count: 5, brief: { ...defaultBrief, institution: 'Yerli universitet', teacher: 'Yerli müəllim', group: 'Yerli qrup' },
    references: [{ id: 'doc', name: 'Mənbə.pdf', pageCount: 3, pages: [{ number: 2, text: 'Səhifə\u000c mətni.' }] }] };
  const docSlides = count => [{ id: 'c', title: 'Mətn', body: 'Örtük', layout: 'cover' },
    ...Array.from({ length: count }, (_, i) => ({ id: `s${i}`, title: `B${i}`, body: 'İzah.', notes: '', layout: 'text', citations: [{ sourceId: 'doc', name: 'başqa ad', page: 2 }] }))];
  handler = async () => Response.json({ provider: 'deepseek', model: 'deepseek-flash', warnings: ['AI 3 əvəzinə 4 məzmun slaydı hazırladı.'], slides: docSlides(4) });
  const docPlan = await requestAiPlan(docInput, new AbortController().signal);
  const sent = requests.at(-1).body;
  assert.ok(!/[\u0000-\u0008\u000b\u000c]/.test(sent.topic + sent.material + sent.references[0].pages[0].text), 'İdarəetmə simvolları göndərilmir');
  const expectedBrief = { purpose: defaultBrief.purpose, audience: defaultBrief.audience, targetMinutes: defaultBrief.targetMinutes, goal: defaultBrief.goal };
  assert.deepEqual(sent.brief, expectedBrief);
  assert.equal(sent.references[0].name, 'Sənəd');
  assert.equal(docPlan.slides.length, 6); assert.equal(docPlan.slides.at(-1).title, 'İstifadə olunan materiallar');
  assert.equal(docPlan.slides[1].citations[0].name, 'Mənbə.pdf'); assert.equal(docPlan.slides[1].citationReview, true);
  handler = async () => Response.json({ provider: 'deepseek', model: 'deepseek-flash', warnings: [], slides: docSlides(6) });
  await assert.rejects(requestAiPlan(docInput, new AbortController().signal), error => error.message.includes('quruluşu'));
  handler = async () => Response.json({ provider: 'deepseek', model: 'deepseek-flash', warnings: [], slides: docSlides(3).map((s, i) => i ? { ...s, citations: [{ sourceId: 'doc', page: 3 }] } : s) });
  await assert.rejects(requestAiPlan(docInput, new AbortController().signal), error => error.message.includes('quruluşu'), 'Mətni olmayan səhifəyə istinad rədd edilir');

  slideHandler = async () => Response.json({ slide: { title: 'Başlıq', body: 'Mətn', notes: 'Qeyd' }, warnings: [] });
  await requestSlideAssist({
    mode: 'notes', topic: docInput.topic, brief: docInput.brief,
    references: [{ ...docInput.references[0], pages: [...docInput.references[0].pages, { number: 3, text: 'İstinadsız mətn.' }] }],
    slide: docPlan.slides[1], layout: 'text',
  }, new AbortController().signal);
  const sentAssist = slideRequests.pop().body;
  assert.deepEqual(sentAssist.brief, expectedBrief);
  assert.deepEqual(sentAssist.references, sent.references, 'Yalnız istinad edilən səhifə, yerli fayl adı olmadan göndərilir');

  const { default: App } = await import(moduleUrl('App'));
  root = createRoot(document.getElementById('root')); handler = async () => Response.json(plan);
  await act(async () => root.render(React.createElement(App)));
  await fill('topic', 'Mətn'); await fill('material', 'İstifadəçi materialı.');
  // The application starts with six; align the response count with the form.
  await click(document.querySelector('[aria-label="Slayd sayını azalt"]')); await click(document.querySelector('[aria-label="Slayd sayını azalt"]'));
  await click(button('DeepSeek ilə plan hazırla')); await click(document.querySelector('.ai-consent input')); await click(button('AI planını yarat'));
  assert.equal(document.querySelectorAll('.outline-item').length, 0);
  await click(button('AI planını tətbiq et')); assert.equal(document.querySelectorAll('.outline-item').length, 4);
  assert.equal(button('Geri al').disabled, true, 'Yeni plan boş redaktor vəziyyətinə geri alınmır');
  await fill('title-ai-0', 'Əl ilə düzəltdiyim başlıq');
  await click(button('Geri'));
  await click(button('DeepSeek ilə plan hazırla')); await click(document.querySelector('.ai-consent input')); await click(button('AI planını yarat'));
  await click(button('AI planını tətbiq et'));
  assert.ok(document.querySelector('[role="dialog"]'), 'Mövcud plan təsdiqsiz əvəz edilmir');
  await click(button('Geri qayıt')); assert.equal(document.querySelector('[role="dialog"]'), null);
  await click(button('AI planını tətbiq et')); await click(button('Davam et'));
  assert.equal(document.getElementById('title-ai-0').value, 'AI başlığı 0');
  await click(button('Geri al'));
  assert.equal(document.getElementById('title-ai-0').value, 'Əl ilə düzəltdiyim başlıq');

  // Slide assistant in the editor: preview first, one undo step, stale suggestions dropped.
  await click(button('Dizayna keç'));
  await click(button('AI ilə düzəliş (DeepSeek)'));
  assert.ok(serverStatus().includes('hazırdır'));
  const inside = (selector, text) => [...document.querySelectorAll(selector)].find(el => el.textContent.trim() === text);
  const mode = name => inside('.slide-assist-modes button', name);
  const assistConsent = () => document.querySelector('.slide-assist .ai-consent input');
  await click(assistConsent());
  assert.equal(mode('Qısalt').disabled, true, 'Üz qabığında mətn düzəlişi yoxdur'); assert.equal(mode('Çıxış qeydi yaz').disabled, false);
  await click(document.querySelector('[aria-label="Növbəti slayd"]'));
  assert.equal(assistConsent().checked, false, 'Başqa slayd üçün razılıq yenidən soruşulur'); assert.equal(mode('Qısalt').disabled, true);
  await click(assistConsent());
  slideHandler = async () => Response.json({ slide: { title: 'Qısa başlıq', body: 'Qısa mətn.', notes: 'Qeyd\n\nKöçürülən təfərrüat.' }, warnings: ['Yoxla.'] });
  await click(mode('Qısalt'));
  assert.equal(slideRequests.length, 1); assert.equal(slideRequests[0].body.mode, 'shorten'); assert.equal(slideRequests[0].body.consent, true);
  assert.equal(slideRequests[0].body.slide.layout, 'text'); assert.deepEqual(slideRequests[0].body.references, []);
  assert.ok(document.querySelector('.assist-compare')); assert.equal(document.getElementById('edit-body').value, 'Materialdan izah.', 'Təklif təsdiqsiz tətbiq olunmur');
  await click(inside('.assist-actions button', 'Tətbiq et'));
  assert.equal(document.getElementById('edit-body').value, 'Qısa mətn.'); assert.equal(document.getElementById('edit-title').value, 'Qısa başlıq');
  assert.equal(document.getElementById('speaker-notes').value, 'Qeyd\n\nKöçürülən təfərrüat.');
  await click(button('Geri al'));
  assert.equal(document.getElementById('edit-body').value, 'Materialdan izah.', 'Bir geri alma slaydı tam bərpa edir');
  assert.equal(document.getElementById('edit-title').value, 'AI başlığı 1'); assert.equal(document.getElementById('speaker-notes').value, 'Qeyd');
  await click(assistConsent());
  await click(mode('Qısalt')); assert.ok(document.querySelector('.assist-compare'));
  await fill('edit-body', 'Əl ilə yazdığım yeni mətn.');
  assert.equal(document.querySelector('.assist-compare'), null, 'Slayd dəyişəndə köhnə təklif silinir');
  assert.equal(assistConsent().checked, false, 'Mətn dəyişəndə yenidən razılıq tələb olunur');
  assert.equal(mode('Qısalt').disabled, true);
  await click(assistConsent());
  slideHandler = async () => Response.json({ slide: { title: 'X', body: 'Y', notes: 'AI çıxış qeydi.' }, warnings: [] });
  await click(mode('Çıxış qeydi yaz')); await click(inside('.assist-actions button', 'Tətbiq et'));
  assert.equal(document.getElementById('speaker-notes').value, 'AI çıxış qeydi.');
  assert.equal(document.getElementById('edit-body').value, 'Əl ilə yazdığım yeni mətn.', 'Qeyd rejimi slayd mətninə toxunmur');
  slideHandler = async () => Response.json({ error: { message: 'Çıxış qeydləri dolu olduğu üçün qısaldılmış təfərrüatlar oraya sığmır.' } }, { status: 422 });
  await click(assistConsent());
  await click(mode('Qısalt')); assert.ok(document.querySelector('.slide-assist [role="alert"]').textContent.includes('dolu'));
  const pendingSlide = deferred(); slideHandler = () => pendingSlide.promise;
  await click(mode('Aydın yaz')); assert.ok(document.querySelector('.assist-busy'));
  await click(inside('.assist-busy button', 'Ləğv et')); assert.equal(slideRequests.at(-1).signal.aborted, true);
  await act(async () => { pendingSlide.resolve(Response.json({ slide: { title: 'Gec', body: 'Gec cavab.', notes: '' }, warnings: [] })); await new Promise(resolve => setTimeout(resolve, 5)); });
  assert.equal(document.querySelector('.assist-compare'), null, 'Ləğv edilmiş sorğunun cavabı görünmür');
  const staleSlide = deferred(); slideHandler = () => staleSlide.promise;
  await click(mode('Aydın yaz'));
  await fill('edit-body', 'Sorğu gedərkən dəyişən mətn.');
  assert.equal(slideRequests.at(-1).signal.aborted, true);
  assert.equal(assistConsent().checked, false);
  await act(async () => { staleSlide.resolve(Response.json({ slide: { title: 'Köhnə', body: 'Köhnə mətn.', notes: '' }, warnings: [] })); await staleSlide.promise; });
  assert.equal(document.querySelector('.assist-compare'), null);
  console.log('Keçdi: AI serverinin vəziyyəti (işləmir/açarsız/hazır, ləğv), plan müştərisi (mənbələr slaydı, yerli fayl adı, idarəetmə simvolları), slayd köməkçisi (razılıq, önizləmə, tətbiq/geri alma, köhnə təklif, qeyd rejimi, xəta, ləğv), AI razılığı, önizləmə/təsdiq, server xətaları, saxta mənbənin rəddi, köhnə nəticə və ləğv, App planına tətbiq və bir addımda geri alma. Şəbəkə saxta API ilə əvəzlənib.');
} finally {
  await act(async () => root.unmount()); globalThis.fetch = previousFetch; dom.window.close();
}
