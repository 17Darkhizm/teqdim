import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';

// Stage 9 component checks in a network-free simulated DOM, not a browser.
// jsdom has no layout, so clipped text is simulated with scroll/client sizes.
const rootPath = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(rootPath, '.checks', 'stage9');
await fs.mkdir(out, { recursive: true });
for (const name of await fs.readdir(path.join(rootPath, 'src'))) {
  if (!/\.tsx?$/.test(name) || name.endsWith('.d.ts') || name === 'main.tsx') continue;
  const source = await fs.readFile(path.join(rootPath, 'src', name), 'utf8');
  let code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  code = code.replace(/(from\s+|import\()(['"])(\.\/[^'"]+)\2/g, (_, prefix, quote, specifier) => `${prefix}${quote}${specifier}.mjs${quote}`);
  await fs.writeFile(path.join(out, name.replace(/\.tsx?$/, '.mjs')), code);
}
const dom = new JSDOM('<!doctype html><html data-mode="light"><body><div id="root"></div></body></html>', { url: 'https://teqdim.test/' });
for (const key of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event', 'MouseEvent', 'KeyboardEvent', 'localStorage']) Object.defineProperty(globalThis, key, { value: key === 'window' ? dom.window : dom.window[key], configurable: true });
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import('react-dom/client');
const { clippedText } = await import(pathToFileURL(path.join(out, 'SlideView.mjs')).href);
const { default: App } = await import(pathToFileURL(path.join(out, 'App.mjs')).href);

// 1. clippedText only reports real overflow.
const sizes = new Map();
const size = prop => function () { return sizes.get(this)?.[prop] ?? 0; };
for (const prop of ['scrollHeight', 'clientHeight', 'scrollWidth', 'clientWidth'])
  Object.defineProperty(HTMLElement.prototype, prop, { get: size(prop), configurable: true });
const box = document.createElement('div');
box.innerHTML = '<div class="slide-copy"><h2>Başlıq</h2><p>Mətn</p></div>';
assert.equal(clippedText(box), false, 'Ölçüsüz mühitdə yalançı daşma olmamalıdır');
sizes.set(box.querySelector('p'), { scrollHeight: 101, clientHeight: 100 });
assert.equal(clippedText(box), false, '2 px-dək yuvarlaqlaşdırma daşma sayılmır');
sizes.set(box.querySelector('p'), { scrollHeight: 180, clientHeight: 100 });
assert.equal(clippedText(box), true);
sizes.clear();

let root;
const click = async element => { assert.ok(element, 'Element tapılmalıdır'); await act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true }))); };
const button = text => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === text);
const key = async (init, target = window) => { const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }); await act(async () => target.dispatchEvent(event)); return event; };
const railIds = () => [...document.querySelectorAll('.slide-rail>button')].map(b => b.getAttribute('title'));
root = createRoot(document.getElementById('root'));
await act(async () => root.render(React.createElement(App)));
await click(document.querySelector('[aria-label="Nümunə təqdimatını aç"]'));
assert.ok(railIds().length >= 4, 'Bir klik nümunəni redaktorda açır');

// 2. Overflow warning follows the rendered editor slide.
assert.equal(document.querySelector('.overflow-warning'), null);
let clip = false;
const clipSize = prop => function () {
  if (clip && this.matches('.slide-copy h2')) return prop === 'scrollHeight' ? 400 : prop === 'clientHeight' ? 120 : 0;
  return sizes.get(this)?.[prop] ?? 0;
};
for (const prop of ['scrollHeight', 'clientHeight', 'scrollWidth', 'clientWidth'])
  Object.defineProperty(HTMLElement.prototype, prop, { get: clipSize(prop), configurable: true });
const setTitle = async value => {
  const field = document.getElementById('edit-title');
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(field, value); field.dispatchEvent(new Event('input', { bubbles: true })); });
};
const originalTitle = document.getElementById('edit-title').value;
clip = true;
await setTitle(originalTitle + ' uzun');
assert.ok(document.querySelector('.overflow-warning'), 'Kəsilən mətn üçün xəbərdarlıq görünməlidir');
assert.equal(document.querySelectorAll('.overflow-warning').length, 1, 'Yalnız redaktor slaydı ölçülür');
clip = false;
await setTitle(originalTitle);
assert.equal(document.querySelector('.overflow-warning'), null, 'Mətn sığanda xəbərdarlıq itməlidir');
await click(button('Geri al'));

// 3. Alt+Arrow reorders the selected slide in one undoable step.
const before = railIds();
await click(document.querySelectorAll('.slide-rail>button')[1]);
await key({ key: 'ArrowDown', altKey: true });
assert.deepEqual(railIds(), [before[0], before[2], before[1], ...before.slice(3)]);
assert.equal(document.querySelector('.slide-rail>button[aria-current="true"]').getAttribute('title'), before[1]);
const typing = await key({ key: 'ArrowUp', altKey: true }, document.getElementById('edit-title'));
assert.equal(typing.defaultPrevented, false, 'Mətn sahəsində Alt+ox köçürmə etməməlidir');
await click(button('Geri al'));
assert.deepEqual(railIds(), before);

// 4. Drag and drop reorders; selection follows the moved slide.
const drag = async (type, element) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { setData() {}, effectAllowed: '', dropEffect: '' } });
  await act(async () => element.dispatchEvent(event));
};
const rail = () => document.querySelectorAll('.slide-rail>button');
assert.equal(rail()[0].getAttribute('draggable'), 'true');
await drag('dragstart', rail()[0]);
await drag('dragover', rail()[2]);
assert.ok(rail()[2].classList.contains('drop-target'));
await drag('drop', rail()[2]);
assert.deepEqual(railIds(), [before[1], before[2], before[0], ...before.slice(3)]);
assert.equal(document.querySelector('.slide-rail>button[aria-current="true"]').getAttribute('title'), before[0]);
assert.equal(document.querySelector('.drop-target'), null);
await click(button('Geri al'));
assert.deepEqual(railIds(), before);
await click(button('Yenidən et'));
assert.deepEqual(railIds(), [before[1], before[2], before[0], ...before.slice(3)]);
await click(button('Geri al'));

// 5. Presentation: progress, click to advance, fullscreen only when supported.
await click(rail()[0]);
await click(button('Təqdim et'));
const progress = () => Number(document.querySelector('.presentation-progress').getAttribute('aria-valuenow'));
assert.equal(progress(), 1);
assert.equal([...document.querySelectorAll('.presentation-actions button')].length, 1, 'Fullscreen API yoxdursa düymə gizlənir');
await click(document.querySelector('.presentation-overlay>.slide'));
assert.equal(progress(), 2);
await click(button('Əvvəlki'));
assert.equal(progress(), 1, 'Düymələr slayda klik kimi sayılmamalıdır');
await key({ key: 'Escape' });
assert.equal(document.querySelector('.presentation-overlay'), null);

let fullscreenElement = null, exits = 0;
Object.defineProperty(document, 'fullscreenElement', { get: () => fullscreenElement, configurable: true });
HTMLElement.prototype.requestFullscreen = async function () { fullscreenElement = this; document.dispatchEvent(new Event('fullscreenchange')); };
document.exitFullscreen = async () => { exits++; fullscreenElement = null; document.dispatchEvent(new Event('fullscreenchange')); };
await click(button('Təqdim et'));
await click(button('Tam ekran · F'));
assert.ok(fullscreenElement?.classList.contains('presentation-overlay'));
assert.ok(button('Tam ekrandan çıx · F'));
await key({ key: 'f' });
assert.equal(fullscreenElement, null);
await key({ key: 'F' });
assert.ok(fullscreenElement);
await key({ key: 'Escape' });
assert.equal(document.querySelector('.presentation-overlay'), null);
assert.equal(fullscreenElement, null, 'Təqdimat bağlananda tam ekrandan çıxılmalıdır');
assert.ok(exits >= 2);

// 6. Help lists the new shortcuts.
await click(button('Qısayollar'));
const help = document.querySelector('[aria-labelledby="help-title"]').textContent;
for (const text of ['Ctrl + Y', 'Alt + ↑ / ↓', 'F · PageUp / PageDown']) assert.ok(help.includes(text), text);

await act(async () => root.unmount());
console.log('Keçdi: görünən mətn daşmasının aşkarlanması, Alt+ox və sürükləmə ilə sıralama/undo/redo, təqdimatda irəliləyiş, kliklə keçid, tam ekran və bələdçi qısayolları.');
