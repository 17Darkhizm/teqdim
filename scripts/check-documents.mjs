import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, '.checks', 'documents');
await fs.mkdir(out, { recursive: true });
for (const name of await fs.readdir(path.join(root, 'src'))) {
  if (!/\.tsx?$/.test(name) || name.endsWith('.d.ts') || name === 'main.tsx') continue;
  const source = await fs.readFile(path.join(root, 'src', name), 'utf8');
  let code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  code = code.replace(/(from\s+|import\()(['"])(\.\/[^'"]+)\2/g, (_, prefix, quote, specifier) => `${prefix}${quote}${specifier}.mjs${quote}`);
  await fs.writeFile(path.join(out, name.replace(/\.tsx?$/, '.mjs')), code);
}
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://teqdim.test/' });
for (const key of ['window', 'document', 'DOMParser', 'HTMLElement', 'HTMLInputElement', 'Event', 'MouseEvent'])
  Object.defineProperty(globalThis, key, { value: key === 'window' ? dom.window : dom.window[key], configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const moduleUrl = name => pathToFileURL(path.join(out, `${name}.mjs`)).href;
const { readDocument, validateDocumentFile, DOCUMENT_ACCEPT, rtfText } = await import(moduleUrl('documents'));
const { createSlides, citationLabel, exportPptx, defaultBrief } = await import(moduleUrl('model'));
const { encodeBackup, decodeBackup } = await import(moduleUrl('backup'));
const { sourceText } = await import(moduleUrl('editing'));
const sample = 'Azərbaycan dili: Əə Ğğ İı Öö Şş Üü Çç.\n\nİkinci abzas.';
for (const ext of ['txt', 'text', 'md', 'markdown', 'rst', 'adoc', 'tex', 'log', 'csv', 'tsv', 'json', 'yaml', 'yml', 'org', 'srt', 'vtt', 'ini', 'cfg']) {
  const pages = await readDocument(new File([sample], `mənbə.${ext}`));
  assert.deepEqual(pages, [{ number: 1, text: sample }]);
  assert.ok(DOCUMENT_ACCEPT.includes(`.${ext}`));
}
const utf16 = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(sample, 'utf16le')]);
assert.equal((await readDocument(new File([sample], 'notes.custom', { type: 'text/plain' })))[0].text, sample);
assert.equal((await readDocument(new File([utf16], 'utf16.TXT')))[0].text, sample);
const be = Buffer.from(utf16); for (let i = 0; i < be.length; i += 2) [be[i], be[i + 1]] = [be[i + 1], be[i]];
assert.equal((await readDocument(new File([be], 'utf16be.txt')))[0].text, sample);
const html = await readDocument(new File(['<h1>Azərbaycan</h1><p>Bir &amp; iki</p><script>secret()</script><style>hidden</style><p>Son</p>'], 'material.html'));
assert.equal(html[0].text, 'Azərbaycan\n\nBir & iki\n\nSon');
assert.ok(!html[0].text.includes('secret'));
assert.equal((await readDocument(new File(['<root><p>Əlifba</p></root>'], 'm.xml')))[0].text, 'Əlifba');
assert.equal((await readDocument(new File(['<root><p>Bir</p><p>İki</p></root>'], 'm.xml')))[0].text, 'Bir\nİki');
await assert.rejects(readDocument(new File(['<root>'], 'm.xml')), /zədələnib/);
await assert.rejects(readDocument(new File(['<!DOCTYPE root [<!ENTITY x "no">]><root>&x;</root>'], 'm.xml')), /XML/);
assert.equal(rtfText('{\\rtf1\\ansi{\\fonttbl{\\f0 Arial;}}A\\tab B\\par \\uc1\\u399?\\u601?}').trim(), 'A\tB\n\nƏə');
assert.equal(rtfText("{\\rtf1\\ansi\\ansicpg1254 \\'de\\'fe}"), 'Şş');
assert.equal(rtfText('{\\rtf1 first{\\*\\unknown hidden} last}'), 'first last');
assert.equal(rtfText('{\\rtf1 a{\\pict\\bin3 {x}}b}'), 'ab');
assert.equal((await readDocument(new File(['{\\rtf1\\uc1\\u399?lifba}'], 'm.rtf')))[0].text, 'Əlifba');
assert.throws(() => rtfText('{\\rtf1 broken'), /zədələnib/);
assert.throws(() => rtfText('{\\rtf1\\ansicpg99999 no}'), /kodlaşdırma/);
async function zipped(name, content) {
  return new File([await new JSZip().file(name, content).generateAsync({ type: 'uint8array', compression: 'DEFLATE' })], name === 'content.xml' ? 'm.odt' : 'm.docx');
}
const word = '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Azərbaycan</w:t><w:tab/><w:t>dili</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Cədvəl Əə</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p><w:del><w:r><w:delText>silinmiş</w:delText></w:r></w:del><w:r><w:t>Son</w:t></w:r></w:p></w:body></w:document>';
const wordFile = await zipped('word/document.xml', word);
assert.equal((await readDocument(wordFile))[0].text, 'Azərbaycan\tdili\n\nCədvəl Əə\n\nSon');
const odt = '<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><office:body><text:h>Başlıq</text:h><text:p>Əlifba<text:s text:c="2"/>izah<text:line-break/>son</text:p></office:body></office:document-content>';
assert.equal((await readDocument(await zipped('content.xml', odt)))[0].text, 'Başlıq\n\nƏlifba  izah\nson');
await assert.rejects(readDocument(await zipped('content.xml', odt.replace('text:c="2"', 'text:c="60001"'))), /limiti/);
await assert.rejects(readDocument(await zipped('word/document.xml', ' '.repeat(8 * 1024 * 1024 + 1))), /8 MB/);
await assert.rejects(readDocument(await zipped('wrong.xml', word)), /tapılmadı/);
await assert.rejects(readDocument(new File(['not a zip'], 'm.docx')), /açılmadı/);
await assert.rejects(readDocument(new File(['not rtf'], 'm.rtf')), /etibarlı/);
await assert.rejects(readDocument(new File([new Uint8Array([0, 1, 2, 255])], 'binary.txt')), /kodlaşdırma/);
await assert.rejects(readDocument(new File(['a'.repeat(60001)], 'long.txt')), /60 000/);
await assert.rejects(readDocument(new File(['   '], 'empty.txt')), /mətn tapılmadı/);
for (const name of ['old.doc', 'm.pages', 'macro.docm']) assert.throws(() => validateDocumentFile({ name, size: 10 }), /əvvəlcə/);
assert.throws(() => validateDocumentFile({ name: 'm.exe', size: 10 }), /dəstəklənmir/);
assert.throws(() => validateDocumentFile({ name: 'm.txt', size: 0 }), /boşdur/);
assert.throws(() => validateDocumentFile({ name: 'm.txt', size: 21 * 1024 * 1024 }), /20 MB/);

const reference = { id: 'doc', name: 'Material.docx', pageCount: 1, pages: await readDocument(wordFile) };
const project = { id: 'project', topic: 'Dil', author: '', subject: '', material: '', brief: defaultBrief, theme: 'sage', updatedAt: new Date().toISOString(), references: [reference], slides: createSlides('Dil', '', 4, [reference]) };
assert.deepEqual(decodeBackup(encodeBackup(project)).references, project.references);
assert.ok(citationLabel(project.slides[1].citations).includes('Sənəd mətni'));
assert.ok(!sourceText([reference]).includes('fiziki səhifə'));
process.chdir(out);
delete globalThis.window;
await exportPptx(project);
globalThis.window = dom.window;
const pptx = await JSZip.loadAsync(await fs.readFile(path.join(out, 'Dil.pptx')));
assert.ok((await pptx.file('ppt/slides/slide2.xml').async('string')).includes('Sənəd mətni'));

const { createRoot } = await import('react-dom/client');
const { default: Upload } = await import(moduleUrl('PdfUpload'));
const reactRoot = createRoot(document.getElementById('root'));
let writes = [], refs = [];
const onChange = value => { writes.push(value); refs = value; };
async function render() { await act(async () => reactRoot.render(React.createElement(Upload, { references: refs, onChange }))); }
async function pick(file) {
  const input = document.getElementById('pdf-file');
  Object.defineProperty(input, 'files', { configurable: true, value: [file] });
  await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); await new Promise(resolve => setTimeout(resolve, 30)); });
}
async function click(text) { const button = [...document.querySelectorAll('button')].find(el => el.textContent.trim() === text); assert.ok(button); await act(async () => button.click()); }
await render();
assert.ok(document.getElementById('pdf-file').accept.includes('.docx'));
await pick(new File([sample], 'Əlifba.txt'));
assert.equal(writes.length, 0, 'Önizləmə təsdiqdən əvvəl materiala yazılmır');
assert.equal(document.querySelector('.document-preview pre').textContent, sample);
assert.equal(document.querySelector('.pdf-range'), null);
await click('Materiala əlavə et'); await render();
assert.equal(writes.length, 1); assert.equal(refs[0].pages[0].text, sample);
assert.ok(!document.querySelector('.pdf-reference').textContent.includes('Səh.'));
await pick(new File(['bad'], 'bad.docx')); assert.ok(document.querySelector('[role="alert"]').textContent.includes('açılmadı'));
let finish;
const delayed = new File([sample], 'delayed.txt'); delayed.arrayBuffer = () => new Promise(resolve => { finish = resolve; });
await pick(delayed); refs = []; await render();
await act(async () => { finish(new TextEncoder().encode(sample).buffer); await new Promise(resolve => setTimeout(resolve, 30)); });
assert.equal(document.querySelector('.pdf-pending'), null, 'Köhnə işin nəticəsi yeni materiallara yazılmır');
assert.equal(writes.length, 1);
refs = [{ ...reference, pages: [{ number: 1, text: 'a'.repeat(60000) }] }]; await render();
await pick(new File(['b'.repeat(40001)], 'limit.txt')); await click('Materiala əlavə et');
assert.ok(document.querySelector('[role="alert"]').textContent.includes('100 000'));
assert.equal(writes.length, 1, 'Limitdə mövcud material qorunur');
await act(async () => reactRoot.unmount()); dom.window.close();
console.log('Keçdi: mətn formatları, UTF-8/UTF-16 və Azərbaycan hərfləri, DOCX/ODT/RTF/HTML/XML, ZIP və həcm xətaları, önizləmə/təsdiq, köhnə async nəticə qoruması, ümumi limit, backup və PPTX mənbələri.');
