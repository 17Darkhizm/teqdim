import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';

// Stage 10 component checks in a network-free simulated DOM, not a browser.
// jsdom has no layout, so clipped text is simulated with scroll/client sizes.
const rootPath = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(rootPath, '.checks', 'stage10');
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
const { default: App } = await import(pathToFileURL(path.join(out, 'App.mjs')).href);

const model = await import(pathToFileURL(path.join(out, 'model.mjs')).href);

// 1. Clipped ids become ordinary, sorted length issues; unknown ids are ignored.
const deck = [{ id: 'a', title: 'A', body: 'Mətn' }, { id: 'b', title: 'B', body: '' }];
const base = model.inspectDeck(deck);
assert.equal(model.withClippedIssues(base, deck, new Set()), base);
const merged = model.withClippedIssues(base, deck, new Set(['a', 'silinmiş']));
assert.equal(merged.filter(i => i.message === model.CLIPPED_MESSAGE).length, 1);
assert.deepEqual(merged.map(i => i.index), [...merged.map(i => i.index)].sort((x, y) => x - y));
assert.equal(merged.find(i => i.message === model.CLIPPED_MESSAGE).kind, 'length');

// Simulated layout: only the measuring copy of one chosen slide overflows.
let clipIndex = -1;
for (const prop of ['scrollHeight', 'clientHeight', 'scrollWidth', 'clientWidth'])
  Object.defineProperty(HTMLElement.prototype, prop, {
    configurable: true,
    get() {
      if (clipIndex < 0 || !this.matches('.slide-copy h2')) return 0;
      const slide = this.closest('.measure-layer > .slide');
      if (!slide || [...slide.parentElement.children].indexOf(slide) !== clipIndex) return 0;
      return prop === 'scrollHeight' ? 400 : prop === 'clientHeight' ? 120 : 0;
    },
  });
const click = async element => { assert.ok(element, 'Element tapılmalıdır'); await act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true }))); };
const button = text => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === text);
const key = async init => { const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }); await act(async () => window.dispatchEvent(event)); return event; };
const rail = () => document.querySelectorAll('.slide-rail>button');
const root = createRoot(document.getElementById('root'));
await act(async () => root.render(React.createElement(App)));

// 5. Error toasts are alerts with their own style; success toasts stay status.
await click(button('Material olmadan özüm qurum'));
assert.ok(document.querySelector('.toast.toast-error[role="alert"]'));
await click(document.querySelector('[aria-label="Nümunə materialı əlavə et"]'));
assert.equal(document.querySelector('.toast-error'), null);
assert.ok(document.querySelector('.toast[role="status"]'));
assert.equal(document.querySelector('.measure-layer'), null, 'Ölçmə qatı yalnız redaktorda lazımdır');

await act(async () => document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
await click(button('Dizayna keç'));
const count = rail().length;
assert.equal(document.querySelectorAll('.measure-layer > .slide').length, count);
assert.equal(document.querySelector('.measure-layer').getAttribute('aria-hidden'), 'true');

// 2. Whole-deck measuring marks a slide that is not open in the editor.
clipIndex = 2;
await click(rail()[1]);
const clippedIssue = () => [...document.querySelectorAll('.quality-issues button')].find(b => b.textContent.includes(model.CLIPPED_MESSAGE));
assert.ok(clippedIssue()?.textContent.includes('Slayd 3'), 'Son baxış kəsilən slaydı göstərməlidir');
assert.ok(rail()[2].querySelector('.slide-issue-dot'));
assert.equal(document.querySelector('.overflow-warning'), null, 'Açıq slayd sığır');
await click(document.querySelector('.slide-navigator input[type="checkbox"]'));
assert.ok([...rail()].some(b => b.getAttribute('aria-label') === '3 nömrəli slaydı seç'));
await click(document.querySelector('.slide-navigator input[type="checkbox"]'));
await click(clippedIssue());
assert.equal(document.querySelector('.slide-rail>button[aria-current="true"]').getAttribute('aria-label'), '3 nömrəli slaydı seç');
clipIndex = -1;
await click(rail()[0]);
assert.equal(clippedIssue(), undefined, 'Mətn sığanda qeyd itməlidir');

// 3. Blackout hides the slide; the key or click that ends it never moves on.
await click(button('Təqdim et'));
const progress = () => Number(document.querySelector('.presentation-progress').getAttribute('aria-valuenow'));
assert.equal((await key({ key: 'b' })).defaultPrevented, true);
assert.ok(document.querySelector('.presentation-blackout'));
await key({ key: 'ArrowRight' });
assert.equal(document.querySelector('.presentation-blackout'), null);
assert.equal(progress(), 1);
await key({ key: '.' });
await key({ key: 'Shift' });
assert.ok(document.querySelector('.presentation-blackout'), 'Tək Shift ekranı qaytarmır');
await click(document.querySelector('.presentation-blackout'));
assert.equal(document.querySelector('.presentation-blackout'), null);
assert.equal(progress(), 1);
await key({ key: 'B' });
await key({ key: 'Escape' });
assert.equal(document.querySelector('.presentation-overlay'), null, 'Qara ekranda da Esc təqdimatı bağlayır');
await key({ key: 'Escape' });
assert.equal(document.querySelector('.presentation-overlay'), null);
await click(button('Təqdim et'));
assert.equal(document.querySelector('.presentation-blackout'), null, 'Yeni təqdimat qara ekranla başlamır');
await key({ key: 'Escape' });

// 4. Practice room previews the next slide, except on the last one.
await click(rail()[0]);
await click(button('Məşq et'));
assert.ok(document.querySelector('.practice-next .slide'));
assert.equal(document.querySelector('.practice-next .slide h2').textContent, document.querySelectorAll('.slide-rail>button')[1].getAttribute('title').split(' · ')[0]);
await key({ key: 'End' });
assert.equal(document.querySelector('.practice-next'), null);
await key({ key: 'Escape' });

await click(button('Qısayollar'));
assert.ok(document.querySelector('[aria-labelledby="help-title"]').textContent.includes('B / .'));
await act(async () => root.unmount());
console.log('Keçdi: bütün slaydların görünən daşma ölçüsü (siyahı, filtr, Son baxış), qara ekran, məşqdə növbəti slayd, xəta bildirişləri və bələdçi.');
