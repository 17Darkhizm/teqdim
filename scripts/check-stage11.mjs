import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';

// Stage 11 model/XML/component checks in a network-free simulated DOM, not a browser.
const rootPath = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(rootPath, '.checks', 'stage11');
await fs.mkdir(out, { recursive: true });
for (const name of await fs.readdir(path.join(rootPath, 'src'))) {
  if (!/\.tsx?$/.test(name) || name.endsWith('.d.ts') || name === 'main.tsx') continue;
  const source = await fs.readFile(path.join(rootPath, 'src', name), 'utf8');
  let code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  code = code.replace(/(from\s+|import\()(['"])(\.\/[^'"]+)\2/g, (_, prefix, quote, specifier) => `${prefix}${quote}${specifier}.mjs${quote}`);
  await fs.writeFile(path.join(out, name.replace(/\.tsx?$/, '.mjs')), code);
}
const load = name => import(pathToFileURL(path.join(out, name + '.mjs')).href);
const m = await load('model');
const storage = await load('storage');
const { encodeBackup, decodeBackup } = await load('backup');
const authoring = await load('authoring');

// 1. Model: hidden slides leave the PowerPoint, unfinished hidden data does not block it.
const slides = [
  { id: 'c', layout: 'cover', title: 'Gizli sınaq', body: 'Giriş' },
  { id: 'q', layout: 'text', title: 'Sual-cavab üçün ehtiyat', body: 'Əlavə izah.', hidden: true },
  { id: 'd', layout: 'chart', title: 'Yarımçıq diaqram', body: '', chart: m.emptyChart(), hidden: true },
  { id: 'e', layout: 'text', title: 'Yekun', body: 'Nəticə.' },
];
assert.deepEqual(m.shownSlides(slides).map(item => item.index), [0, 3]);
const project = { id: 'p', topic: 'Gizli sınaq', subject: 'Sınaq', author: 'İbrahim', theme: 'paper', slides, updatedAt: new Date().toISOString() };
const exportFolder = path.join(out, 'exports');
await fs.mkdir(exportFolder, { recursive: true });
const previousCwd = process.cwd();
process.chdir(exportFolder);
try {
  await m.exportPptx(project);
  const zip = await JSZip.loadAsync(await fs.readFile('Gizli sınaq.pptx'));
  const slideFiles = Object.keys(zip.files).filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name));
  assert.equal(slideFiles.length, 2, 'Gizli slaydlar PowerPoint-ə düşməməlidir');
  const all = (await Promise.all(slideFiles.map(name => zip.file(name).async('string')))).join('');
  assert.ok(!all.includes('Sual-cavab üçün ehtiyat'));
  assert.ok(all.includes('2 / 2') && !all.includes('/ 4'), 'Nömrələmə görünən slaydlara görədir');
  await assert.rejects(m.exportPptx({ ...project, slides: slides.map(s => ({ ...s, hidden: true })) }), /Bütün slaydlar gizlədilib/);
  await assert.rejects(m.exportPptx({ ...project, slides: slides.map(s => ({ ...s, hidden: false })) }), /Slayd 3:/, 'Göstərilən yarımçıq slayd əvvəlki kimi saxlanır');
} finally {
  process.chdir(previousCwd);
}

// 2. Storage, backup and text exports keep the flag.
assert.ok(storage.isProject(project));
assert.equal(storage.isProject({ ...project, slides: [{ ...slides[0], hidden: 'bəli' }] }), false);
const restored = decodeBackup(encodeBackup(project));
assert.deepEqual(restored.slides.map(s => !!s.hidden), [false, true, true, false]);
assert.equal('hidden' in restored.slides[0], false, 'Görünən slayda artıq sahə yazılmır');
assert.ok(authoring.outlineMarkdown(project).includes('Sual-cavab üçün ehtiyat (təqdimatda gizli)'));
assert.ok(authoring.speakerText(project).includes('2. Sual-cavab üçün ehtiyat (təqdimatda gizli)'));

// 3. App flow.
const dom = new JSDOM('<!doctype html><html data-mode="light"><body><div id="root"></div></body></html>', { url: 'https://teqdim.test/' });
for (const key of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event', 'MouseEvent', 'KeyboardEvent', 'localStorage']) Object.defineProperty(globalThis, key, { value: key === 'window' ? dom.window : dom.window[key], configurable: true });
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import('react-dom/client');
const { default: App } = await load('App');
const click = async element => { assert.ok(element, 'Element tapılmalıdır'); await act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true }))); };
const button = text => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === text);
const key = async init => { const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }); await act(async () => window.dispatchEvent(event)); return event; };
const rail = () => document.querySelectorAll('.slide-rail>button');
const root = createRoot(document.getElementById('root'));
await act(async () => root.render(React.createElement(App)));
await click(document.querySelector('[aria-label="Nümunə materialı əlavə et"]'));
await act(async () => document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
await click(button('Dizayna keç'));
const count = rail().length;
assert.ok(count >= 4);
const hiddenTitle = rail()[1].getAttribute('title');

await click(rail()[1]);
await click(button('Təqdimatda gizlət'));
assert.ok(rail()[1].classList.contains('is-hidden'));
assert.equal(rail()[1].querySelector('.slide-hidden-badge').textContent, 'Gizli');
assert.ok(document.querySelector('.hidden-note'));
assert.ok(button('Təqdimatda göstər'));
assert.ok(document.querySelector('.deck-metrics').textContent.includes(`${count - 1}slayd · 1 gizli`));
assert.equal(document.querySelectorAll('.print-slides > .slide').length, count - 1, 'Çapda gizli slayd yoxdur');

// Presenting from a hidden slide starts at the next shown one and never shows it.
await click(button('Təqdim et'));
const progress = () => Number(document.querySelector('.presentation-progress').getAttribute('aria-valuenow'));
const presentedTitle = () => document.querySelector('.presentation-overlay > .slide h2').textContent;
assert.equal(document.querySelector('.presentation-progress').getAttribute('aria-valuemax'), String(count - 1));
assert.equal(progress(), 2);
await key({ key: 'Home' });
const seen = [];
for (let i = 0; i < count; i++) { seen.push(presentedTitle()); await key({ key: 'ArrowRight' }); }
assert.ok(!seen.includes(hiddenTitle), 'Gizli slayd təqdimatda görünməməlidir');
assert.equal(new Set(seen).size, count - 1);
assert.equal(document.querySelector('.presentation-controls span').textContent.replace(/\s/g, ''), `${count - 1}/${count - 1}`);

// Number + Enter jumps by shown position; Backspace edits; wrong numbers do nothing.
await key({ key: '2' });
assert.equal(document.querySelector('.presentation-jump').textContent, 'Slayd 2 · Enter');
await key({ key: 'Enter' });
assert.equal(progress(), 2);
assert.equal(document.querySelector('.presentation-jump'), null);
await key({ key: '1' }); await key({ key: '3' }); await key({ key: 'Backspace' });
assert.equal(document.querySelector('.presentation-jump').textContent, 'Slayd 1 · Enter');
await key({ key: 'Enter' });
assert.equal(progress(), 1);
await key({ key: '9' }); await key({ key: '9' }); await key({ key: 'Enter' });
assert.equal(progress(), 1);
assert.ok(document.querySelector('.toast.toast-error').textContent.includes(`1–${count - 1}`));
await key({ key: 'Escape' });

// Practice uses the same shown deck.
await click(rail()[0]);
await click(button('Məşq et'));
assert.ok(document.querySelector('.practice-navigation span').textContent.replace(/\s/g, '').endsWith(`/${count - 1}`));
await key({ key: 'Escape' });

// The last shown slide cannot be hidden; undo restores visibility.
await click(rail()[1]);
await click(button('Təqdimatda göstər'));
assert.equal(rail()[1].classList.contains('is-hidden'), false);
await click(button('Geri al'));
assert.ok(rail()[1].classList.contains('is-hidden'));
for (let i = 0; i < count; i++) {
  await click(rail()[i]);
  if (button('Təqdimatda gizlət')) await click(button('Təqdimatda gizlət'));
}
assert.equal(document.querySelectorAll('.slide-rail>button:not(.is-hidden)').length, 1);
assert.ok(document.querySelector('.toast.toast-error').textContent.includes('Ən azı bir slayd'));

await click(button('Qısayollar'));
assert.ok(document.querySelector('[aria-labelledby="help-title"]').textContent.includes('Rəqəm + Enter'));
await act(async () => root.unmount());
console.log('Keçdi: gizli slaydlar (PPTX/çap/təqdimat/məşq/vaxt/backup/mətn ixracı, son görünən slaydın qorunması, undo) və təqdimatda nömrə ilə keçid.');
