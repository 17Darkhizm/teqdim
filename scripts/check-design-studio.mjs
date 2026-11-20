import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import ts from 'typescript';
import JSZip from 'jszip';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createCanvas} from '@napi-rs/canvas';

// Model/XML/component verification only. Does not launch or access a browser.
const rootPath=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(rootPath,'.checks','design-studio');await fs.mkdir(out,{recursive:true});
for(const name of await fs.readdir(path.join(rootPath,'src'))){
 if(!/\.tsx?$/.test(name)||name.endsWith('.d.ts')||name==='main.tsx')continue;
 const source=await fs.readFile(path.join(rootPath,'src',name),'utf8');
 let code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 code=code.replace(/(from\s+|import\()(['"])(\.\/[^'"]+)\2/g,(_,prefix,quote,specifier)=>`${prefix}${quote}${specifier}.mjs${quote}`);
 await fs.writeFile(path.join(out,name.replace(/\.tsx?$/,'.mjs')),code);
}
const moduleFile=name=>pathToFileURL(path.join(out,name+'.mjs')).href;
const m=await import(moduleFile('model'));
const designModule=await import(moduleFile('design'));
const storage=await import(moduleFile('storage'));
const {encodeBackup,decodeBackup}=await import(moduleFile('backup'));
assert.equal(m.themes.length,10);assert.equal(new Set(m.themes.map(theme=>theme.id)).size,10);
for(const theme of m.themes){const colors=m.themeColors[theme.id];assert.ok(designModule.contrastRatio(colors.bg,colors.fg)>=4.5,theme.name);}
assert.equal(designModule.contrastRatio('000000','FFFFFF'),21);
const styling = new JSDOM(`
  <div class="slide">
    <p class="slide-citations"></p>
    <div class="data-table-view"><table><tr><th>Başlıq</th></tr></table></div>
    <svg><text class="chart-name">Ölçü</text></svg>
  </div>
  <input><textarea></textarea><select></select>
  <div class="search-field"></div>
  <div class="edit-fields"><textarea class="speaker-notes"></textarea></div>
`);
const styleDocument = styling.window.document;
for (const name of ['style.css', 'data-editor.css', 'design-studio.css', 'aic-brand.css']) {
  const style = styleDocument.createElement('style');
  style.textContent = await fs.readFile(path.join(rootPath, 'src', name), 'utf8');
  styleDocument.head.append(style);
}
const cssRules = [...styleDocument.styleSheets].flatMap(sheet => [...sheet.cssRules]);
function declaredColor(element, property) {
  const value = cssRules.filter(rule => rule.selectorText && element.matches(rule.selectorText))
    .map(rule => rule.style.getPropertyValue(property)).filter(Boolean).at(-1);
  const token = /^var\((--[\w-]+)\)$/.exec(value)?.[1];
  if (token) return declaredColor(element.closest('.slide') ?? styleDocument.documentElement, token);
  assert.match(value, /^#[\da-f]{6}$/i, property);
  return value.slice(1);
}
const slideElement = styleDocument.querySelector('.slide');
const contrastThemes = ['atelier', 'sunset'];
for (const theme of contrastThemes) {
  slideElement.className = `slide theme-${theme}`;
  const bg = declaredColor(slideElement, '--s-bg');
  for (const [selector, property, background] of [
    ['.slide-citations', 'color', bg],
    ['.chart-name', 'fill', bg],
    ['th', 'color', declaredColor(slideElement.querySelector('th'), 'background')],
  ]) {
    const color = declaredColor(slideElement.querySelector(selector), property);
    assert.ok(designModule.contrastRatio(color, background) >= 4.5, `${theme} ${selector}`);
  }
}
for (const mode of ['light', 'dark']) {
  const root = styleDocument.documentElement;
  root.dataset.mode = mode;
  for (const field of styleDocument.querySelectorAll('input, textarea, select, .search-field')) {
    const border = declaredColor(field, 'border-color');
    for (const surface of ['page', 'surface', 'raised']) {
      const background = declaredColor(root, `--aic-${surface}`);
      assert.ok(designModule.contrastRatio(border, background) >= 3, `${mode} ${field.tagName} ${surface}`);
    }
  }
}
styling.window.close();
assert.equal(designModule.themeTone('caspian'),'dark');assert.equal(designModule.themeTone('heritage'),'light');
assert.equal(designModule.filterThemes('İRS','all','all')[0].id,'heritage');
assert.equal(designModule.filterThemes('','Klassik','all').length,2);
assert.equal(designModule.filterThemes('','Klassik','dark').length,0);
const custom={headingFont:'serif',textSize:'large',decoration:'minimal',showNumbers:false};
assert.ok(m.isDesignSettings(custom));assert.equal(m.isDesignSettings({...custom,headingFont:'url(x)'}),false);assert.equal(m.isDesignSettings({...custom,showNumbers:'false'}),false);
const canvas=createCanvas(4,3);canvas.getContext('2d').fillRect(0,0,4,3);
const image={data:canvas.toDataURL('image/png'),width:4,height:3,alt:'Sınaq şəkli',credit:'Yerli sınaq'};
const slides=[
 {id:'cover',layout:'cover',title:'Dizayn sınağı',body:'Azərbaycan dilində əsas fikir.'},
 {id:'text',layout:'text',title:'Mətn başlığı',body:'Bir fikir. '.repeat(32),notes:'Çıxış qeydi.'},
 {id:'columns',layout:'columns',title:'İki sütun',body:'Birinci hissə.\n\nİkinci hissə.'},
 {id:'bullets',layout:'bullets',title:'Məqamlar',body:'Birinci məqam.\n\nİkinci məqam.'},
 {id:'statement',layout:'statement',title:'Əsas fikir',body:'Aydın mətn.'},
 {id:'table',layout:'table',title:'Cədvəl',body:'',table:{columns:['Ad','Say'],rows:[['A','12'],['B','18']]}},
 {id:'chart',layout:'chart',title:'Diaqram',body:'',chart:{type:'bar',name:'Ölçü',unit:'%',points:[{label:'A',value:'12,5'},{label:'B',value:'0'}]}},
 {id:'comparison',layout:'comparison',title:'İki yol',body:'',comparison:{leftTitle:'Birinci',rightTitle:'İkinci',left:'İlk izah',right:'Digər izah'}},
 {id:'timeline',layout:'timeline',title:'Ardıcıllıq',body:'',timeline:{steps:[{label:'Bir',title:'Hazırlıq',body:'İlkin iş'},{label:'İki',title:'Nəticə',body:'Son iş'}]}},
 {id:'image',layout:'image',title:'Şəkilli izah',body:'Şəkil haqqında',image}
];
const project={id:'studio',topic:'Dizayn layihəsi',subject:'Fənn',author:'',theme:'sage',slides,updatedAt:'2026-10-30T10:00:00Z',brief:m.defaultBrief,references:[],material:''};
const encoded=encodeBackup({...project,theme:'heritage',design:custom});assert.equal(JSON.parse(encoded).version,4);assert.deepEqual(decodeBackup(encoded).design,custom);
for(const version of [1,2,3]){const old=JSON.parse(encoded);old.version=version;old.project.theme='sage';delete old.project.design;assert.deepEqual(m.resolveDesign(decodeBackup(JSON.stringify(old)).design),m.defaultDesign);}
const corrupt=JSON.parse(encoded);corrupt.project.design.showNumbers='yes';assert.throws(()=>decodeBackup(JSON.stringify(corrupt)));
const extra=JSON.parse(encoded);extra.project.design.extra='ignored';assert.equal(decodeBackup(JSON.stringify(extra)).design.extra,undefined);
assert.ok(m.inspectDeck(slides,[],custom).some(issue=>issue.message.includes('İri mətn')));
assert.ok(!m.inspectDeck(slides,[],m.defaultDesign).some(issue=>issue.message.includes('İri mətn')));

// Native PowerPoint shapes, fonts, text scale, numbers and data in every theme.
const exportFolder=path.join(out,'exports');await fs.mkdir(exportFolder,{recursive:true});
const previousCwd=process.cwd();process.chdir(exportFolder);
const xmlDom=new JSDOM();
const parseXml=text=>{const doc=new xmlDom.window.DOMParser().parseFromString(text,'text/xml');assert.equal(doc.getElementsByTagName('parsererror').length,0);return doc;};
const texts=doc=>[...doc.getElementsByTagName('a:t')].map(node=>node.textContent);
const decorativeShapes=doc=>[...doc.getElementsByTagName('p:sp')].filter(shape=>!texts(shape).join('').trim()).length;
const citations = [{ refId: 'studio-ref', name: 'Sınaq mənbəyi.pdf', page: 1 }];
const exportSlides = slides.map((slide, index) => index === 1 ? { ...slide, citations } : slide);
try{
 for(const theme of m.themes){
  for(const minimal of [false,true]){
   const preferences=minimal ? custom : m.defaultDesign;
   const topic=`studio-${theme.id}-${minimal ? 'minimal' : 'full'}`;
   await m.exportPptx({...project,topic,theme:theme.id,design:preferences,slides:exportSlides});
   const zip=await JSZip.loadAsync(await fs.readFile(topic+'.pptx'));
   const cover=parseXml(await zip.file('ppt/slides/slide1.xml').async('string'));
   const textXml=await zip.file('ppt/slides/slide2.xml').async('string');const textDoc=parseXml(textXml);
   assert.ok(texts(cover).includes('Dizayn sınağı'));assert.ok(texts(cover).includes('Təqdim · AIC tərəfindən hazırlanıb'));
   assert.equal(texts(cover).includes('1 / 10'),!minimal);
   assert.ok(textXml.includes(m.themeColors[theme.id].bg));
   if(minimal){assert.equal(decorativeShapes(cover),0);assert.ok(textXml.includes('typeface="Georgia"'));}
   else if(['caspian','heritage','prism'].includes(theme.id))assert.ok(decorativeShapes(cover)>0);
   const bodyShape=[...textDoc.getElementsByTagName('p:sp')].find(shape=>texts(shape).join('')===slides[1].body);
   assert.ok(bodyShape);const sizes=[...bodyShape.getElementsByTagName('a:rPr')].map(node=>Number(node.getAttribute('sz')));
   assert.ok(sizes.some(size=>minimal ? size>2100 : size===2100));
   const table=await zip.file('ppt/slides/slide6.xml').async('string');assert.ok(table.includes('<a:tbl>'));assert.ok(table.includes('12'));
   const chart=await zip.file(Object.keys(zip.files).find(name=>/^ppt\/charts\/chart\d+\.xml$/.test(name))).async('string');const chartDoc=parseXml(chart);assert.ok(chart.includes('12.5'));assert.ok(chart.includes(m.themeColors[theme.id].accent));
   if (contrastThemes.includes(theme.id)) {
    const color = node => node?.getElementsByTagName('a:srgbClr')[0]?.getAttribute('val');
    const citationShape = [...textDoc.getElementsByTagName('p:sp')]
      .find(shape => texts(shape).includes(m.citationLabel(citations)));
    const header = parseXml(table).getElementsByTagName('a:tc')[0];
    const headerFill = [...header.getElementsByTagName('a:tcPr')[0].children]
      .find(node => node.tagName === 'a:solidFill');
    const slideBg = color(textDoc.getElementsByTagName('p:bg')[0]);
    const chartBg = color([...chartDoc.documentElement.children].find(node => node.tagName === 'c:spPr'));
    for (const [label, textColor, background] of [
      ['istinad', color(citationShape), slideBg],
      ['cədvəl başlığı', color(header.getElementsByTagName('a:rPr')[0]), color(headerFill)],
      ['diaqram adı', color(chartDoc.getElementsByTagName('c:title')[0]), chartBg],
    ]) {
      assert.ok(textColor && background, `${theme.id} ${label}: PPTX rəngləri`);
      assert.ok(designModule.contrastRatio(textColor, background) >= 4.5, `${theme.id} ${label}: PPTX kontrastı`);
    }
   }
   const imageXml=await zip.file('ppt/slides/slide10.xml').async('string');assert.ok(imageXml.includes('Sınaq şəkli'));assert.ok(imageXml.includes('<a:blip'));
  }
 }
 const hiddenTopic='studio-atelier-hidden-full';await m.exportPptx({...project,topic:hiddenTopic,theme:'atelier',design:{...m.defaultDesign,showNumbers:false}});
 const hiddenZip=await JSZip.loadAsync(await fs.readFile(hiddenTopic+'.pptx'));const hiddenCover=parseXml(await hiddenZip.file('ppt/slides/slide1.xml').async('string'));assert.ok(!texts(hiddenCover).includes('01'));assert.ok(!texts(hiddenCover).includes('1 / 10'));
}finally{process.chdir(previousCwd);xmlDom.window.close();}

const dom=new JSDOM('<html data-mode="light"><body><div id="root"></div></body></html>',{url:'https://teqdim-design.test/'});
for(const key of ['window','document','HTMLElement','HTMLInputElement','HTMLTextAreaElement','Event','MouseEvent','localStorage'])Object.defineProperty(globalThis,key,{value:key==='window' ? dom.window : dom.window[key],configurable:true});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {createRoot}=await import('react-dom/client');const {default:App}=await import(moduleFile('App'));
localStorage.setItem(storage.DRAFT_KEY,JSON.stringify({project,step:3,selected:1,count:10}));
let root;
async function mount(){root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(App)));}
const button=text=>[...document.querySelectorAll('button')].find(item=>item.textContent.trim()===text);
async function click(element){assert.ok(element,'Düymə tapılmalıdır');await act(async()=>element.dispatchEvent(new MouseEvent('click',{bubbles:true})));}
async function fillAria(label,value){const field=document.querySelector(`[aria-label="${label}"]`);assert.ok(field,label);await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(field,value);field.dispatchEvent(new Event('input',{bubbles:true}));});}
async function select(selector,value){const field=document.querySelector(selector);assert.ok(field,selector);await act(async()=>{field.value=value;field.dispatchEvent(new Event('change',{bubbles:true}));});}
async function key(key){await act(async()=>window.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true})));}
async function settle(){await act(async()=>new Promise(resolve=>setTimeout(resolve,750)));}
await mount();assert.ok(document.querySelector('.editor-center>.slide.theme-sage'));
const galleryButton=button('Dizayn qalereyasını aç');galleryButton.focus();await click(galleryButton);
assert.equal(document.querySelectorAll('.gallery-card').length,10);assert.ok(document.querySelector('.gallery-card .palette-dots').textContent.includes(':1'));
await fillAria('Dizaynlarda axtar','İRS');assert.equal(document.querySelectorAll('.gallery-card').length,1);
await click(button('Dizayn filtrlərini sıfırla'));await select('[aria-label="Dizayn kateqoriyası"]','Klassik');assert.equal(document.querySelectorAll('.gallery-card').length,2);
await select('[aria-label="Dizayn fonu"]','dark');assert.equal(document.querySelectorAll('.gallery-card').length,0);
await click(button('Dizayn filtrlərini sıfırla'));
assert.equal(document.querySelector('.gallery-preview h2').textContent,'Mətn başlığı');
await select('[aria-label="Önizləmə slaydı"]','first');assert.equal(document.querySelector('.gallery-preview h2').textContent,'Dizayn sınağı');
const applyFocus=button('Dizaynı tətbiq et');applyFocus.focus();
const tabEvent=new dom.window.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true});await act(async()=>applyFocus.dispatchEvent(tabEvent));assert.equal(tabEvent.defaultPrevented,true);assert.equal(document.activeElement.getAttribute('aria-label'),'Dizayn qalereyasını bağla');
await click(document.querySelector('[aria-label="Xəzər dizaynına bax"]'));assert.ok(document.querySelector('.editor-center>.slide.theme-sage'));
await key('Escape');assert.equal(document.querySelector('.design-gallery'),null);assert.equal(document.activeElement,galleryButton);assert.ok(document.querySelector('.editor-center>.slide.theme-sage'));
await click(galleryButton);await click(document.querySelector('[aria-label="Xəzər dizaynına bax"]'));assert.equal(document.querySelector('[aria-label="Xəzər dizaynına bax"]').getAttribute('aria-pressed'),'true');
await click(button('Dizaynı tətbiq et'));assert.ok(document.querySelector('.editor-center>.slide.theme-caspian'));
await click(button('Geri al'));assert.ok(document.querySelector('.editor-center>.slide.theme-sage'));await click(button('Yenidən et'));assert.ok(document.querySelector('.editor-center>.slide.theme-caspian'));
await select('#design-font','serif');assert.equal(document.querySelector('.editor-center>.slide h2').style.fontFamily,'Georgia');
await select('#design-text-size','large');assert.ok(document.querySelector('.editor-center>.slide.text-large'));assert.ok(document.querySelector('.quality-panel').textContent.includes('İri mətn'));
await select('#design-decoration','minimal');assert.ok(document.querySelector('.editor-center>.slide.decoration-minimal'));
await click(document.querySelector('.number-toggle input'));assert.equal(document.querySelector('.editor-center .page-number'),null);
assert.ok([...document.querySelectorAll('.print-slides>.slide')].every(slide=>slide.classList.contains('text-large')&&slide.classList.contains('decoration-minimal')&&!slide.querySelector('.page-number')));
assert.ok(document.querySelector('.slide-rail .slide.text-large.decoration-minimal'));
await click(button('Üslub ayarlarını sıfırla'));assert.equal(document.getElementById('design-font').value,'default');await click(button('Geri al'));assert.equal(document.getElementById('design-font').value,'serif');assert.equal(document.getElementById('design-text-size').value,'large');
await click(button('Məşq et'));assert.ok(document.querySelector('.practice-overlay .slide.text-large.decoration-minimal'));await key('Escape');
await settle();let saved=storage.readDraft();assert.equal(saved.project.theme,'caspian');assert.deepEqual(saved.project.design,custom);
await click(button('Saxla'));assert.deepEqual(storage.readProjects()[0].design,custom);
await act(async()=>root.unmount());await mount();assert.ok(document.querySelector('.editor-center>.slide.theme-caspian.text-large.decoration-minimal'));assert.equal(document.querySelector('.editor-center .page-number'),null);
await act(async()=>root.unmount());
const {default:ProjectLibrary}=await import(moduleFile('ProjectLibrary'));root=createRoot(document.getElementById('root'));
await act(async()=>root.render(React.createElement(ProjectLibrary,{projects:[{...project,theme:'caspian',design:custom}],onOpen(){},onDelete(){},onNew(){},onClone(){},onImport(){return true;}})));
assert.ok(document.querySelector('.project-preview>.slide.theme-caspian.text-large.decoration-minimal'));assert.equal(document.querySelector('.project-preview .page-number'),null);
await act(async()=>root.unmount());dom.window.close();
console.log('Keçdi: 10 palitra və kontrast, qalereya filtrləri/önizləmə/imtina/tətbiq/fokus/undo, üslub ayarları/reset/bərpa, v1–v4 backup, bütün dizaynlarda 10 düzülüş × tam/sadə PPTX, şrift/iri mətn/nömrə/dekor və kitabxana/məşq/çap propagasiyası.');
