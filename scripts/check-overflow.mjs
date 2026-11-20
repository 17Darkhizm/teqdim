import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';

// Simulated dimensions verify detection and reporting, not visual layout.
const rootPath = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(rootPath, '.checks', 'overflow');
await fs.mkdir(out, { recursive: true });
for (const name of await fs.readdir(path.join(rootPath, 'src'))) {
  if (!/\.tsx?$/.test(name) || name.endsWith('.d.ts') || name === 'main.tsx') continue;
  const source = await fs.readFile(path.join(rootPath, 'src', name), 'utf8');
  let code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  code = code.replace(/(from\s+|import\()(['"])(\.\/[^'"]+)\2/g, (_, prefix, quote, specifier) => `${prefix}${quote}${specifier}.mjs${quote}`);
  await fs.writeFile(path.join(out, name.replace(/\.tsx?$/, '.mjs')), code);
}
const dom = new JSDOM('<!doctype html><body><div id="root"></div></body>', { url: 'https://teqdim.test/' });
for (const key of ['window', 'document', 'HTMLElement']) Object.defineProperty(globalThis, key, { value: key === 'window' ? dom.window : dom.window[key], configurable: true });
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import('react-dom/client');
const { default: SlideView, clippedText } = await import(pathToFileURL(path.join(out, 'SlideView.mjs')).href);

const sizes = new Map();
for (const prop of ['scrollHeight', 'clientHeight', 'scrollWidth', 'clientWidth'])
  Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, get() { return sizes.get(this)?.[prop] ?? 0; } });
const box = document.createElement('div');
box.innerHTML = '<div class="slide-copy"><h2>Başlıq</h2><div class="comparison-view"><div><h3>Əsas fikir</h3><p>İzah</p></div><div><h3>Digər fikir</h3><p>İzah</p></div></div></div>';
const title = box.querySelector('h3');
const card = title.parentElement;
const view = card.parentElement;
assert.equal(clippedText(box), false, 'Ölçüsüz DOM daşma bildirməməlidir');

// Same character count, different measured width: character counts cannot decide.
title.textContent = 'iiiiiiii';
sizes.set(title, { scrollWidth: 60, clientWidth: 100 });
assert.equal(clippedText(box), false);
title.textContent = 'WWWWWWWW';
sizes.set(title, { scrollWidth: 130, clientWidth: 100 });
assert.equal(clippedText(box), true, 'Eyni uzunluqlu geniş başlıq ölçüyə görə daşır');

// Each clipping boundary matters even when its ancestors do not overflow.
for (const [element, label] of [[title, 'Müqayisə başlığı'], [card, 'Müqayisə kartı'], [view, 'Müqayisə bloku']]) {
  sizes.clear();
  sizes.set(element, { scrollHeight: 102, clientHeight: 100 });
  assert.equal(clippedText(box), false, `${label}: 2 px həddi`);
  sizes.set(element, { scrollHeight: 103, clientHeight: 100 });
  assert.equal(clippedText(box), true, `${label}: şaquli kəsilmə`);
  sizes.set(element, { scrollWidth: 103, clientWidth: 100 });
  assert.equal(clippedText(box), true, `${label}: üfüqi kəsilmə`);
}
sizes.clear();
title.textContent = 'Azərbaycan hərfləri: Əə Çç Ğğ Iı İi Öö Şş Üü '.repeat(20);
sizes.set(title, { scrollHeight: 100, clientHeight: 100 });
assert.equal(clippedText(box), false, 'Uzun mətn sığırsa daşma sayılmamalıdır');

// Decorative elements outside the comparison text must not create issues.
const decoration = document.createElement('div');
decoration.className = 'creative-art';
box.append(decoration);
sizes.set(decoration, { scrollHeight: 500, clientHeight: 10 });
assert.equal(clippedText(box), false);

let resize;
let disconnected = false;
globalThis.ResizeObserver = class {
  constructor(callback) { resize = callback; }
  observe() {}
  disconnect() { disconnected = true; }
};
const reports = [];
const slide = { id: 'comparison', layout: 'comparison', title: 'Müqayisə', body: '', comparison: { leftTitle: 'Əsas fikir', left: 'İzah', rightTitle: 'Digər fikir', right: 'İzah' } };
const original = JSON.stringify(slide);
const root = createRoot(document.getElementById('root'));
const render = async current => act(async () => root.render(React.createElement(SlideView, { slide: current, index: 1, total: 2, theme: 'sage', subject: '', author: '', onOverflow: value => reports.push(value) })));
await render(slide);
assert.deepEqual(reports, [false]);
const renderedTitle = document.querySelector('#root .comparison-view h3');
sizes.set(renderedTitle, { scrollHeight: 150, clientHeight: 40 });
await act(async () => resize());
assert.deepEqual(reports, [false, true], 'Ölçü dəyişəndə mövcud xəbərdarlıq kanalı işləyir');
await act(async () => resize());
assert.deepEqual(reports, [false, true], 'Dəyişməyən nəticə təkrar bildirilmir');
sizes.clear();
await render({ ...slide, comparison: { ...slide.comparison, leftTitle: 'Qısa' } });
assert.deepEqual(reports, [false, true, false], 'Redaktədən sonra sığan başlığın xəbərdarlığı silinir');
assert.equal(JSON.stringify(slide), original, 'Ölçmə slayd mətnini dəyişməməlidir');
await act(async () => root.unmount());
assert.equal(disconnected, true);

Object.defineProperty(globalThis, 'localStorage', { value: dom.window.localStorage, configurable: true });
const { default: App } = await import(pathToFileURL(path.join(out, 'App.mjs')).href);
const { DRAFT_KEY, readDraft } = await import(pathToFileURL(path.join(out, 'storage.mjs')).href);
const longBody = 'İlkin müşahidəni və onun izahını öz materialından göstər. '.repeat(14).trim();
const reference = { id: 'source', name: 'Mənbə.pdf', pageCount: 1, pages: [{ number: 1, text: longBody }] };
const textSlides = [
  { id: 'first', title: 'Daşan birinci mətn', layout: 'text', body: longBody, notes: 'Çıxış qeydi', citations: [{ sourceId: reference.id, name: reference.name, page: 1 }] },
  { id: 'second', title: 'Daşan ikinci mətn', layout: 'columns', body: longBody, citationReview: true },
  { id: 'short', title: 'Daşan qısa mətn', layout: 'text', body: 'Qısa mətn' },
  { id: 'fits', title: 'Sığan uzun mətn', layout: 'bullets', body: longBody },
];
const structured = ['table', 'chart', 'image', 'comparison', 'timeline'].map(layout => ({
  id: layout, title: `Daşan ${layout}`, layout, body: longBody,
}));
const slides = [...textSlides, ...structured];
const project = { id: 'bulk-split', topic: 'Toplu bölgü sınağı', subject: '', author: '', theme: 'sage', updatedAt: '', references: [reference] };
Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
  configurable: true,
  get() {
    const title = this.querySelector('h2')?.textContent ?? '';
    const clipped = title === textSlides[2].title || structured.some(slide => slide.title === title) ||
      (title.startsWith('Daşan') && this.textContent.length > 600);
    return this.matches('.measure-layer .slide-copy') && clipped ? 110 : 100;
  },
});
Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return 100; } });
async function mountDeck(slides, selected = 0) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ project: { ...project, slides }, step: 3, count: 6, selected }));
  const app = createRoot(document.getElementById('root'));
  await act(async () => app.render(React.createElement(App)));
  return app;
}
const button = label => [...document.querySelectorAll('button')].find(item => item.textContent.trim() === label);
const splitButton = () => button('Sığmayan mətn slaydlarını böl');
const click = async element => act(async () => element.click());
async function draftSlides() {
  await act(async () => window.dispatchEvent(new window.Event('pagehide')));
  return readDraft().project.slides;
}
let app = await mountDeck(slides, 3);
assert.equal(splitButton().disabled, false);
await click(splitButton());
const divided = await draftSlides();
assert.equal(divided.length, slides.length + 2);
for (const [index, original] of textSlides.slice(0, 2).entries()) {
  const parts = divided.slice(index * 2, index * 2 + 2);
  assert.equal(parts[0].id, original.id);
  assert.equal(parts.map(part => part.body).join(' '), original.body);
  assert.equal(parts[0].notes, original.notes);
  for (const part of parts) {
    assert.deepEqual(part.citations, original.citations);
    assert.equal(part.citationReview, true);
  }
}
assert.deepEqual(divided.slice(4), slides.slice(2), 'Sığan, bölünməyən və struktur slaydları qorunur');
assert.equal(document.getElementById('edit-title').value, textSlides[3].title);
assert.equal(splitButton().disabled, true, 'Uyğun slayd qalmayıb');
await click(button('Geri al'));
assert.deepEqual(await draftSlides(), slides);
assert.equal(button('Geri al').disabled, true, 'Toplu bölgü bir addımda geri alınır');
await act(async () => app.unmount());

const fillers = Array.from({ length: 79 - slides.length }, (_, i) => ({
  id: `fill-${i}`, title: `Slayd ${i + 1}`, layout: 'text', body: 'Qısa mətn',
}));
app = await mountDeck([...slides, ...fillers]);
await click(splitButton());
const limited = await draftSlides();
assert.equal(limited.length, 80);
assert.deepEqual(limited[2], textSlides[1], 'İlk bölgüdən sonra yer çatmayan slayd toxunulmaz qalır');
assert.equal(splitButton().disabled, true);
await act(async () => app.unmount());
dom.window.close();
console.log('Müqayisə bloklarında ölçüyə əsaslanan daşma yoxlaması keçdi (jsdom, vizual yoxlama deyil).');
console.log('Ölçülmüş mətn daşmasının toplu bölgüsü, istinadlar, geri alma və 80 slayd həddi yoxlandı.');
