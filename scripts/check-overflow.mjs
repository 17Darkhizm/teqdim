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
dom.window.close();
console.log('Müqayisə bloklarında ölçüyə əsaslanan daşma yoxlaması keçdi (jsdom, vizual yoxlama deyil).');
