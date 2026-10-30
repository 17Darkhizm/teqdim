import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import JSZip from 'jszip';

const root = fileURLToPath(new URL('../', import.meta.url));
const scratch = path.join(root, '.checks');
await fs.mkdir(scratch, { recursive: true });
const source = await fs.readFile(path.join(root, 'src/model.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const modelPath = path.join(scratch, 'model.mjs');
await fs.writeFile(modelPath, compiled.outputText);
const { createSlides, exportPptx, sample, themes, BODY_LIMIT, splitText, splitSlide, inspectDeck, textColumns, defaultBrief, purposes, isAcademicBrief } = await import(pathToFileURL(modelPath).href);
for (const count of [4, 6, 12]) {
  const slides = createSlides(sample.topic, sample.material, count);
  assert.ok(slides.length >= 3 && slides.length <= 80);
  assert.equal(new Set(slides.map(s => s.id)).size, slides.length);
  assert.ok(slides.slice(1).every(s => s.body.length <= BODY_LIMIT));
  assert.equal(slides[0].title, sample.topic);
  for (const paragraph of sample.material.split('\n\n')) assert.ok(slides.some(s => s.body.includes(paragraph)), 'Material itirilməməlidir');
}
process.chdir(scratch);
const longText = Array.from({ length: 70 }, (_, i) => `${i + 1}. Azərbaycan dilində geniş izah mətnini və bütün faktları olduğu kimi qoruyuruq.`).join(' ');
const expanded = createSlides('Uzun material', longText, 4);
assert.ok(expanded.length > 4, 'Oxunaqlılıq üçün slayd sayı artmalıdır');
assert.equal(expanded.slice(1, -1).map(s => s.body).join('').replace(/\s/g, ''), longText.replace(/\s/g, ''));
assert.ok(expanded.every(s => s.body.length <= BODY_LIMIT));
assert.throws(() => createSlides('Çox böyük', 'a'.repeat(50000), 4), /80/);
const chunks = splitText('😀'.repeat(500));
assert.equal(chunks.join(''), '😀'.repeat(500));
assert.ok(chunks.every(s => s.length <= BODY_LIMIT));
const split = splitSlide({ id: 'long', title: 'Uzun slayd', body: longText, notes: 'Çıxış qeydi', citations: [{ name: 'mənbə.pdf', sourceId: 'source', page: 9 }] });
assert.equal(split[0].id, 'long');
assert.equal(split[0].notes, 'Çıxış qeydi');
assert.ok(split.slice(1).every(s => !s.notes));
assert.ok(split.every(s => s.citations[0].page === 9 && s.citationReview));
assert.equal(new Set(split.map(s => s.id)).size, split.length);
assert.ok(inspectDeck([{ id: 'q', title: '', body: 'Mətnini buraya yaz.', citationReview: true }]).some(i => i.kind === 'placeholder'));
assert.ok(inspectDeck([{ id: 'q', title: 'Başlıq', body: 'a'.repeat(600) }]).some(i => i.kind === 'length'));
assert.equal(inspectDeck([{ id: 'q', title: 'Hazır slayd', body: 'Öz yoxlanmış izahımız.' }]).length, 0);
assert.equal(textColumns('Birinci abzas.\n\nİkinci abzas.').join(' '), 'Birinci abzas. İkinci abzas.');
const references = [{ id: 'ref-test', name: 'Mühazirə.pdf', pageCount: 3, pages: [{ number: 2, text: 'İstinad materialının ikinci səhifəsi.' }, { number: 3, text: 'Üçüncü səhifədən yoxlanılan mətn.' }] }];
for (const count of [4, 6, 12]) {
  const slides = createSlides('PDF əsasında təqdimat', '', count, references);
  assert.ok(slides.length >= 4);
  assert.ok(slides.some(s => s.body.includes('İstinad materialının ikinci səhifəsi.')));
  assert.ok(slides.some(s => s.citations?.some(c => c.page === 2 && c.name === 'Mühazirə.pdf')));
  assert.ok(slides.some(s => s.citations?.some(c => c.page === 3)));
  assert.equal(slides.at(-1).title, 'İstifadə olunan materiallar');
}
const brief={...defaultBrief,purpose:'coursework',audience:'teacher',institution:'Sınaq Universiteti & Araşdırma',teacher:'Sınaq müəllimi',group:'101',goal:'Mövzunun əsas anlayışlarını izah etmək.',targetMinutes:7};
assert.ok(isAcademicBrief(brief));
assert.equal(isAcademicBrief({...brief,targetMinutes:0}),false);
assert.equal(isAcademicBrief({...brief,institution:'x'.repeat(121)}),false);
for(const purpose of purposes){
 const generated=createSlides(sample.topic,sample.material,6,[],{...brief,purpose:purpose.id});
 assert.equal(generated[0].body,brief.goal);
 assert.ok(generated.at(-1).body.includes('buraya yaz'));
 for(const paragraph of sample.material.split('\n\n')) assert.ok(generated.some(s=>s.body.includes(paragraph)));
}
for (const { id: theme } of themes) {
  const topic = `İxrac yoxlaması ${theme} əçğıöşü`;
  const slides = createSlides(sample.topic, sample.material, 6, references, brief);
  slides[1].notes = 'İbrahim üçün çıxış qeydi: mənbəni izah et.';
  await exportPptx({ id: 'check', topic, subject: 'İnformatika', author: 'İbrahim', theme, slides, brief, updatedAt: new Date().toISOString() });
  const zip = await JSZip.loadAsync(await fs.readFile(`${topic}.pptx`));
  const slidePaths = Object.keys(zip.files).filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p));
  assert.equal(slidePaths.length, slides.length);
  const first = await zip.file('ppt/slides/slide1.xml').async('string');
  assert.ok(first.includes('Süni intellektin təhsildə rolu'));
  assert.ok(first.includes('İbrahim'));
  assert.ok(first.includes('Sınaq Universiteti &amp; Araşdırma'));
  assert.ok(first.includes('Sınaq müəllimi'));
  assert.ok(first.includes('Qrup: 101'));
  assert.ok(first.includes(brief.goal));
  assert.ok(first.includes('<a:t>'), 'Mətn şəkil deyil, redaktə edilən mətn olmalıdır');
  const allXml = await Promise.all(slidePaths.map(p => zip.file(p).async('string')));
  assert.ok(allXml.some(xml => xml.includes('Fərdiləşdirilmiş')));
  assert.ok(allXml.some(xml => xml.includes('Mühazirə.pdf · səh. 2')));
  assert.ok(Object.keys(zip.files).some(p => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(p)));
  const notes = await Promise.all(Object.keys(zip.files).filter(p => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(p)).map(p => zip.file(p).async('string')));
  assert.ok(notes.some(xml => xml.includes('İbrahim üçün çıxış qeydi')));
  if (['atelier', 'blueprint', 'sunset', 'noir'].includes(theme)) assert.ok(first.includes('<p:sp>'), 'Yaradıcı dizaynın vektor formaları PPTX-də qalmalıdır');
}
for (const layout of ['cover', 'text', 'columns', 'bullets', 'statement']) {
  const project = { id: 'layout', topic: `Düzülüş ${layout}`, subject: 'İnformatika', author: 'İbrahim', theme: 'sage', updatedAt: '', slides: [{ id: 'slide', layout, title: 'Düzülüş yoxlaması', body: 'Birinci məqam.\n\nİkinci məqam.', notes: 'Çıxış qeydi.' }] };
  await exportPptx(project);
  const zip = await JSZip.loadAsync(await fs.readFile(`Düzülüş ${layout}.pptx`));
  const xml = await zip.file('ppt/slides/slide1.xml').async('string');
  assert.ok(xml.includes('Birinci məqam.') && xml.includes('İkinci məqam.'));
  assert.ok(xml.includes('Düzülüş yoxlaması'));
}
console.log('Keçdi: itkisiz mətn bölgüsü, 80 slayd limiti, emoji, PDF istinadları, keyfiyyət yoxlaması, 10 dizayn, 5 PPTX düzülüşü, çıxış qeydləri və akademik üz qabığı.');
