import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const scratch = path.join(root, '.checks');
await fs.mkdir(scratch, { recursive: true });
const worker = pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
let source = await fs.readFile(path.join(root, 'src/pdf.ts'), 'utf8');
source = source.replace(/import workerUrl from ["']pdfjs-dist\/legacy\/build\/pdf\.worker\.min\.mjs\?url["'];/, `const workerUrl = ${JSON.stringify(worker)};`);
const result = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const modulePath = path.join(scratch, 'pdf.mjs');
await fs.writeFile(modulePath, result.outputText);
const { openPdf, readPdfPages, validatePdfFile } = await import(pathToFileURL(modulePath).href);

// Tiny deterministic parser fixtures, generated in memory; no external documents.
function fixture(blank = false) {
  const stream = blank ? '' : 'BT /F1 12 Tf 50 700 Td (Reference material page one) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R 6 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 4 0 R >> >> /Contents 7 0 R >>',
    `<< /Length ${stream.length} >>\nstream\n${stream.replace('one', 'two')}\nendstream`
  ];
  let text = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, i) => { offsets.push(text.length); text += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const start = text.length;
  text += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` + offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('');
  text += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return new File([text], 'reference.pdf', { type: 'application/pdf' });
}
assert.throws(() => validatePdfFile({ name: 'wrong.txt', size: 5 }), /PDF/);
assert.throws(() => validatePdfFile({ name: 'huge.pdf', size: 21 * 1024 * 1024 }), /20 MB/);
assert.throws(() => validatePdfFile({ name: 'empty.pdf', size: 0 }), /boşdur/);
await assert.rejects(openPdf(new File(['not pdf'], 'fake.pdf')), /etibarlı PDF/);
const doc = await openPdf(fixture());
try {
  assert.equal(doc.numPages, 2);
  const progress = [];
  const pages = await readPdfPages(doc, 1, 2, n => progress.push(n));
  assert.equal(pages.length, 2);
  assert.ok(pages[0].text.includes('Reference material page one'));
  assert.ok(pages[1].text.includes('Reference material page two'));
  assert.deepEqual(progress, [1, 2]);
  const single = await readPdfPages(doc, 2, 2, () => {});
  assert.equal(single[0].number, 2);
  await assert.rejects(readPdfPages(doc, 2, 1, () => {}), /aralığını/);
  await assert.rejects(readPdfPages(doc, 1, 3, () => {}), /aralığını/);
  await assert.rejects(readPdfPages(doc, NaN, 2, () => {}), /aralığını/);
} finally { await doc.loadingTask.destroy(); }
const blank = await openPdf(fixture(true));
try { await assert.rejects(readPdfPages(blank, 1, 2, () => {}), /OCR/); }
finally { await blank.loadingTask.destroy(); }
console.log('Keçdi: real PDF oxunuşu, səhifə aralığı, irəliləyiş, boş/skan mətn xətası, saxta/boş/böyük fayl yoxlamaları.');
