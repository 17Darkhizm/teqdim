import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import ts from 'typescript';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';

// Isolated component tests only: no browser process and no local-origin access.
const rootPath=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(rootPath,'.checks','editing');await fs.mkdir(out,{recursive:true});
for(const name of await fs.readdir(path.join(rootPath,'src'))){
 if(!/\.tsx?$/.test(name)||name.endsWith('.d.ts')||name==='main.tsx')continue;
 const source=await fs.readFile(path.join(rootPath,'src',name),'utf8');
 let code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 code=code.replace(/(from\s+|import\()(['"])(\.\/[^'"]+)\2/g,(_,prefix,quote,specifier)=>`${prefix}${quote}${specifier}.mjs${quote}`);
 await fs.writeFile(path.join(out,name.replace(/\.tsx?$/,'.mjs')),code);
}
const moduleFile=name=>pathToFileURL(path.join(out,name+'.mjs')).href;
const editing=await import(moduleFile('editing'));
const {defaultBrief,bodyBlocks,BODY_LIMIT}=await import(moduleFile('model'));
const source={id:'pdf',name:'Material.pdf',pageCount:9,pages:[{number:3,text:'İqlim haqqında faktiki mətn.'}]};
const deck=[{id:'cover',title:'İqlim',body:'Mövzunun izahı',layout:'cover'},{id:'text',title:'İqlim dəyişməsi',body:'İqlim və iqlimlər. İQLİM',notes:'İqlim qeydi',layout:'text',citations:[{sourceId:'pdf',name:'Material.pdf',page:3}],citationReview:false},{id:'chart',title:'Ölçü',body:'',layout:'chart',chart:{name:'Ölçü',unit:'%',type:'line',points:[{label:'Birinci',value:'12,5'},{label:'İkinci',value:'0'}]}}];
const options={query:'iqlim',replacement:'təbiət',matchCase:false,wholeWord:true,scope:'all',fields:['title','body','notes']};
const replaced=editing.replaceAcross(deck,1,options);
assert.ok(!replaced.error);assert.equal(replaced.count,5);assert.equal(replaced.slides[1].body,'təbiət və iqlimlər. təbiət');assert.equal(replaced.slides[1].citationReview,true);
assert.equal(deck[1].body,'İqlim və iqlimlər. İQLİM');assert.equal(replaced.slides[2],deck[2]);assert.equal(replaced.slides[1].citations,deck[1].citations);
assert.equal(editing.replaceAcross(deck,1,{...options,scope:'current'}).slides[0],deck[0]);
assert.equal(editing.replaceAcross(deck,1,{...options,matchCase:true}).count,0);
assert.ok(editing.replaceAcross(deck,1,{...options,wholeWord:false}).slides[1].body.includes('təbiətlər'));
assert.equal(editing.replaceAcross(deck,1,{...options,fields:['notes']}).slides[1].citationReview,false);
assert.equal(editing.replaceAcross(deck,1,{...options,fields:['notes'],replacement:'$&'}).slides[1].notes,'$& qeydi');
assert.equal(editing.replaceAcross([{id:'word',title:'',body:'iqlim\u0301 iqlim_ iqlim2 iqlim'}],0,options).count,1);
assert.ok(editing.replaceAcross(deck,1,{...options,query:''}).error);
assert.ok(editing.replaceAcross(deck,1,{...options,fields:[]}).error);
assert.ok(editing.replaceAcross(deck,1,{...options,replacement:'\u0000'}).error);
const failed=editing.replaceAcross(deck,1,{...options,replacement:'a'.repeat(161)});assert.ok(failed.error);assert.equal(failed.slides,deck);assert.equal(failed.changes.length,0);
const caseDeck=[{id:'az',title:'I İ ı i',body:''}];
assert.equal(editing.replaceAcross(caseDeck,0,{...options,query:'i',replacement:'X',wholeWord:true}).slides[0].title,'I X ı X');
assert.equal(editing.replaceAcross(caseDeck,0,{...options,query:'I',replacement:'X',wholeWord:true}).slides[0].title,'X İ X i');
const dotted=[{id:'dotted',title:'',body:'I\u0307qlim və İqlim! 👨‍👩‍👧'}];
assert.equal(editing.replaceAcross(dotted,0,options).slides[0].body,'təbiət və təbiət! 👨‍👩‍👧');
assert.equal(editing.replaceAcross(dotted,0,{...options,query:'👨',replacement:'X',wholeWord:false}).slides[0].body,'I\u0307qlim və İqlim! X‍👩‍👧');
const headings=[deck[0],...Array.from({length:12},(_,i)=>({id:`heading-${i}`,title:`Başlıq ${i} `+'a'.repeat(145),body:'',layout:'text'}))];
const candidates=editing.agendaCandidates(headings);assert.equal(candidates.length,12);
const agenda=editing.createAgenda(headings,candidates.map(item=>item.id));
assert.ok(agenda.every(slide=>slide.body.length<=BODY_LIMIT && bodyBlocks(slide.body).length<=5));
assert.deepEqual(agenda.flatMap(slide=>bodyBlocks(slide.body)),candidates.map(item=>item.title));
assert.equal(new Set(agenda.map(slide=>slide.id)).size,agenda.length);
assert.throws(()=>editing.createAgenda(deck,[]),/başlıq/);
assert.ok(!editing.createAgenda(deck,['text'])[0].citations);
const rawTsv='\uFEFFEtiket\tQiymət\r\nBirinci\t-12,5\r\nİkinci\t0\r\n';
const points=editing.parseChartPaste(rawTsv);assert.equal(points[0].value,'-12,5');assert.equal(points[1].value,'0');
for(const bad of ['A\tB\nC\t1\nD\t2','Etiket\tQiymət\nA\t1','Etiket\tQiymət\nA\t\nB\t2','Etiket\tQiymət\nA\t=2+2\nB\t2','Etiket\tQiymət\nA\t1000000001\nB\t2','Etiket\tQiymət\nA\t0.1234567\nB\t2','Etiket\tQiymət\nA\t2\textra\nB\t2','Etiket\tQiymət\n\t2\nB\t2'])assert.throws(()=>editing.parseChartPaste(bad));
assert.throws(()=>editing.parseChartPaste('Etiket\tQiymət\n'+Array.from({length:9},(_,i)=>`A${i}\t2`).join('\n')),/2–8/);
assert.throws(()=>editing.parseChartPaste('x'.repeat(6001)),/6000/);
const chart={...deck[2].chart,points};assert.ok(editing.chartTsv(chart).includes('-12.5'));assert.ok(editing.chartTsv(chart).includes('İkinci\t0'));
assert.throws(()=>editing.chartTsv({...chart,points:[{label:'A',value:''},{label:'B',value:'2'}]}));
const tsv=editing.tableTsv({columns:['Ad','=HYPERLINK("x")'],rows:[['İqlim','+SUM(A1)'],['@x','-1']]});
assert.ok(tsv.includes("'=HYPERLINK"));assert.ok(tsv.includes("'+SUM"));assert.ok(tsv.includes("'@x"));assert.ok(tsv.includes("'-1"));
assert.deepEqual(editing.parseTsvRows('Ad\tDəyər\n"Dırnaq ""içində"""\t12'),[['Ad','Dəyər'],['Dırnaq "içində"','12']]);
assert.throws(()=>editing.parseTsvRows('Ad\tDəyər\n"A\t12'),/dırnağı/);
const quotedChart={...chart,points:[{label:'A "B"',value:'2'},{label:'İkinci',value:'3'}]};
assert.equal(editing.parseChartPaste(editing.chartTsv(quotedChart))[0].label,'A "B"');
const sourceOutput=editing.sourceText([source]);assert.ok(sourceOutput.includes('Material.pdf'));assert.ok(sourceOutput.includes('Səhifə 3'));assert.ok(sourceOutput.includes(source.pages[0].text));assert.ok(!sourceOutput.includes('Səhifə 1'));

const dom=new JSDOM('<html data-mode="light"><body><div id="root"></div></body></html>',{url:'https://teqdim-editing.test/'});
for(const key of ['window','document','HTMLElement','HTMLInputElement','HTMLTextAreaElement','Event','MouseEvent','localStorage'])Object.defineProperty(globalThis,key,{value:key==='window' ? dom.window : dom.window[key],configurable:true});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {createRoot}=await import('react-dom/client');
const {default:App}=await import(moduleFile('App'));
const {DRAFT_KEY,PROJECTS_KEY,readDraft}=await import(moduleFile('storage'));
const {encodeBackup,decodeBackup}=await import(moduleFile('backup'));
let root;
const project={id:'project-test',topic:'İqlim layihəsi',author:'Tələbə',subject:'Coğrafiya',theme:'sage',updatedAt:'2026-10-30T10:00:00.000Z',slides:deck,references:[source],material:'',brief:defaultBrief};
localStorage.setItem(DRAFT_KEY,JSON.stringify({project,step:3,selected:1,count:4}));
async function mount(){root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(App)));}
async function click(element){assert.ok(element,'Düymə tapılmalıdır');await act(async()=>element.dispatchEvent(new MouseEvent('click',{bubbles:true})));}
const button=text=>[...document.querySelectorAll('button')].find(item=>item.textContent.trim()===text);
async function fill(id,value){const field=document.getElementById(id);assert.ok(field,id);const proto=field.tagName==='TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;await act(async()=>{Object.getOwnPropertyDescriptor(proto,'value').set.call(field,value);field.dispatchEvent(new Event('input',{bubbles:true}));});}
async function select(label,value){const field=document.querySelector(`[aria-label="${label}"]`);assert.ok(field,label);await act(async()=>{field.value=value;field.dispatchEvent(new Event('change',{bubbles:true}));});}
async function key(key){await act(async()=>window.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true})));}
async function settle(){await act(async()=>new Promise(resolve=>setTimeout(resolve,750)));}
await mount();
const replaceButton=button('Mətni tap və əvəzlə');replaceButton.focus();await click(replaceButton);
await fill('replace-query','iqlim');await fill('replace-value','təbiət');
assert.ok(document.querySelector('.replace-preview').textContent.includes('Əvvəl:'));
await click([...document.querySelectorAll('.replace-dialog label')].find(item=>item.textContent.includes('Yalnız tam söz')).querySelector('input'));
await click(button('Əvəzləmələri tətbiq et'));
assert.equal(document.activeElement,replaceButton);await settle();
let saved=readDraft();assert.equal(saved.project.slides[1].body,'təbiət və iqlimlər. təbiət');assert.equal(saved.project.slides[1].citationReview,true);
await click(button('Geri al'));await click(document.querySelectorAll('.slide-rail>button')[1]);assert.equal(document.getElementById('edit-title').value,'İqlim dəyişməsi');
await click(button('Yenidən et'));assert.equal(document.getElementById('edit-title').value,'təbiət dəyişməsi');
const beforeLimit=document.getElementById('edit-title').value;
await click(button('Mətni tap və əvəzlə'));await fill('replace-query','təbiət');await fill('replace-value','a'.repeat(161));assert.equal(button('Əvəzləmələri tətbiq et').disabled,true);await key('Escape');assert.equal(document.getElementById('edit-title').value,beforeLimit);

await click(button('Başlıqlardan plan slaydı'));assert.equal(document.querySelectorAll('.agenda-choices input').length,2);
await click(button('Seçimi təmizlə'));assert.equal(button('Plan slaydlarını əlavə et').disabled,true);
await click(button('Hamısını seç'));assert.ok(document.querySelector('.agenda-preview').textContent.includes('təbiət dəyişməsi'));
await click(button('Plan slaydlarını əlavə et'));assert.equal(document.querySelectorAll('.slide-rail>button').length,4);
assert.equal(document.getElementById('edit-title').value,'Təqdimatın planı');
await click(button('Geri al'));assert.equal(document.querySelectorAll('.slide-rail>button').length,3);
await click(button('Yenidən et'));assert.equal(document.querySelectorAll('.slide-rail>button').length,4);
await click(document.querySelectorAll('.slide-rail>button')[3]);
assert.equal(document.getElementById('chart-name').value,'Ölçü');
await fill('chart-paste-text','Etiket\tQiymət\nYeni A\t-2,5\nYeni B\t0');
assert.equal(document.querySelectorAll('.chart-paste-preview tbody tr').length,2);
await click(button('Göstəriciləri tətbiq et'));await settle();saved=readDraft();
assert.deepEqual(saved.project.slides[3].chart.points,[{label:'Yeni A',value:'-2,5'},{label:'Yeni B',value:'0'}]);assert.equal(saved.project.slides[3].chart.type,'line');assert.equal(saved.project.slides[3].chart.name,'Ölçü');assert.equal(saved.project.slides[3].chart.unit,'%');
await click(button('Geri al'));assert.equal(document.querySelector('[aria-label="1-ci göstəricinin etiketi"]').value,'Birinci');
await click(button('Yenidən et'));assert.equal(document.querySelector('[aria-label="1-ci göstəricinin etiketi"]').value,'Yeni A');
await fill('chart-paste-text','Etiket\tQiymət\nA\t\nB\t2');assert.equal(button('Göstəriciləri tətbiq et').disabled,true);
await select('Yoxlama növünə görə süz','citation');assert.ok([...document.querySelectorAll('.quality-issues button')].every(item=>item.textContent.includes('istinad') || item.textContent.includes('İstinad')));
await select('Yoxlama növünə görə süz','all');

const downloads=[],revoked=[];
const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL,oldClick=dom.window.HTMLAnchorElement.prototype.click;
URL.createObjectURL=blob=>{downloads.push({blob});return `blob:editing-${downloads.length}`;};URL.revokeObjectURL=url=>revoked.push(url);
dom.window.HTMLAnchorElement.prototype.click=function(){downloads.at(-1).name=this.download;};
try{
 await click(button('Diaqram məlumatını TSV kimi yüklə'));assert.ok(downloads.at(-1).name.endsWith('.tsv'));assert.ok(downloads.at(-1).blob.type.startsWith('text/tab-separated-values'));assert.ok((await downloads.at(-1).blob.text()).includes('Yeni A\t-2.5'));
 await click(button('Mənbə mətnlərini yüklə'));assert.ok((await downloads.at(-1).blob.text()).includes('Səhifə 3'));
 await act(async()=>new Promise(resolve=>setTimeout(resolve,1100)));assert.equal(revoked.length,2);
}finally{URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;dom.window.HTMLAnchorElement.prototype.click=oldClick;}
await settle();saved=readDraft();assert.deepEqual(JSON.parse(JSON.stringify(decodeBackup(encodeBackup(saved.project)).slides)),saved.project.slides.map(slide=>({...slide,notes:slide.notes||'',citationReview:!!slide.citationReview})));
await act(async()=>root.unmount());

// Direct component checks for library filter composition and agenda capacity.
const {default:ProjectLibrary}=await import(moduleFile('ProjectLibrary'));
root=createRoot(document.getElementById('root'));
const projects=[project,{...project,id:'other',topic:'Başqa mövzu',subject:'Riyaziyyat',theme:'noir'},{...project,id:'unset',topic:'Fənnsiz',subject:'',theme:'noir'}];
await act(async()=>root.render(React.createElement(ProjectLibrary,{projects,onOpen(){},onNew(){},onDelete(){},onImport(){return true;},onClone(){}})));
await select('Təqdimatları fənnə görə süz',JSON.stringify('Coğrafiya'));assert.equal(document.querySelectorAll('.project-card').length,1);
await select('Təqdimatları dizayna görə süz','noir');assert.equal(document.querySelectorAll('.project-card').length,0);
await click(button('Filtrləri sıfırla'));assert.equal(document.querySelectorAll('.project-card').length,3);
await select('Təqdimatları fənnə görə süz',JSON.stringify(''));assert.equal(document.querySelectorAll('.project-card').length,1);
await click(button('Filtrləri sıfırla'));await select('Təqdimatları dizayna görə süz','noir');assert.equal(document.querySelectorAll('.project-card').length,2);
await act(async()=>root.unmount());
const {default:AgendaBuilder}=await import(moduleFile('AgendaBuilder'));
root=createRoot(document.getElementById('root'));
await act(async()=>root.render(React.createElement(AgendaBuilder,{slides:Array.from({length:80},(_,i)=>({id:'limit-'+i,title:'Başlıq '+i,body:'',layout:'text'})),onClose(){},onInsert(){throw new Error('Limit aşılmamalıdır');}})));
assert.equal(button('Plan slaydlarını əlavə et').disabled,true);
await act(async()=>root.unmount());
const {default:DataEditor}=await import(moduleFile('DataEditor'));
root=createRoot(document.getElementById('root'));
await act(async()=>root.render(React.createElement(DataEditor,{slide:{id:'table-export',title:'Cədvəl',body:'',layout:'table',table:{columns:['Ad','Dəyər'],rows:[['Nümunə','=A1']]}},onTable(){},onChart(){}})));
const tableDownloads=[];
URL.createObjectURL=blob=>{tableDownloads.push(blob);return 'blob:table-export';};URL.revokeObjectURL=()=>{};dom.window.HTMLAnchorElement.prototype.click=function(){};
try{await click(button('Cədvəli TSV kimi yüklə'));assert.ok((await tableDownloads[0].text()).includes("'=A1"));await act(async()=>new Promise(resolve=>setTimeout(resolve,1100)));}
finally{URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;dom.window.HTMLAnchorElement.prototype.click=oldClick;}
await act(async()=>root.unmount());dom.window.close();
console.log('Keçdi: AZ hərfləri/tam söz/sahə/əhatə/literal əvəzləmə, atomik limit və citationReview, toplu undo/redo, plan seçimi/yerləşmə/limit, diaqram TSV parser/önizləmə/undo, TSV formula literal qoruması və yükləmə, PDF mətn ixracı, problem filtri və fənn/dizayn filtrləri.');
