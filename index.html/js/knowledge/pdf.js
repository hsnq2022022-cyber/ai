async function extractFileClient(file){
const ext=(file.name.split('.').pop()||'').toLowerCase();
if(ext==='txt'||ext==='csv'||ext==='md'){
const t=await file.text();
if(t&&t.trim())return t;
throw new Error('الملف فارغ أو بترميز غير مدعوم');}
if(ext==='pdf'){
const ok=await ensureLib(function(){return !!window.pdfjsLib},['https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js','https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js']);
if(ok){
try{
window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const buf=await file.arrayBuffer();
const pdf=await window.pdfjsLib.getDocument({data:buf}).promise;
let out='';
for(let i=1;i<=Math.min(pdf.numPages,200);i++){const page=await pdf.getPage(i);const tc=await page.getTextContent();out+=tc.items.map(function(it){return it.str}).join(' ')+'\n';}
if(out.trim())return out;
}catch(e){console.warn('pdf primary failed:',e)}}
try{
const raw=await file.text();
const naive=raw.replace(/[^\u0600-\u06FFa-zA-Z0-9 \n.,()\-:%]/g,' ').replace(/ {3,}/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
if(naive.length>200)return naive;
}catch(e2){}
throw new Error('تعذر استخراج النص من ملف PDF — إن كان صورًا ضوئية فحوّله إلى PDF نصي أولًا');}
if(ext==='docx'){
const ok=await ensureLib(function(){return !!window.mammoth},['https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js','https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js']);
if(ok){
try{
const buf=await file.arrayBuffer();
const r=await window.mammoth.extractRawText({arrayBuffer:buf});
if(r.value&&r.value.trim())return r.value;
}catch(e){console.warn('mammoth failed:',e)}}
const zok=await ensureLib(function(){return !!window.JSZip},['https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js']);
if(zok){
try{
const buf=await file.arrayBuffer();
const zip=await window.JSZip.loadAsync(buf);
const xf=zip.file('word/document.xml');
if(xf){
const xml=await xf.async('string');
const txt=xml.replace(/<w:tab[^>]*\/>/g,'\t').replace(/<\/w:p>/g,'\n').replace(/<[^>]+>/g,'')
.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').trim();
if(txt)return txt;}
}catch(e2){console.warn('jszip docx fallback failed:',e2)}}
throw new Error('تعذر استخراج النص من ملف DOCX — جرّب تصديره كنص عادي (.txt)');}
if(ext==='xlsx'||ext==='xls'){
const ok=await ensureLib(function(){return !!window.XLSX},['https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js','https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js']);
if(ok){
try{
const buf=await file.arrayBuffer();
const wb=window.XLSX.read(buf,{type:'array'});
let out='';wb.SheetNames.forEach(function(sn){out+='\n['+sn+']\n'+window.XLSX.utils.sheet_to_csv(wb.Sheets[sn])});
if(out.trim())return out;
}catch(e){console.warn('xlsx failed:',e)}}
const zok2=await ensureLib(function(){return !!window.JSZip},['https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js']);
if(zok2){
try{
const buf=await file.arrayBuffer();
const zip=await window.JSZip.loadAsync(buf);
const ss=zip.file('xl/sharedStrings.xml');
let out='';
if(ss){const xml=await ss.async('string');
const m=xml.match(/<t[^>]*>([^<]*)<\/t>/g)||[];
out=m.map(function(x){return x.replace(/<[^>]+>/g,'')}).join('\n');}
if(out.trim())return out;
}catch(e2){console.warn('jszip xlsx fallback failed:',e2)}}
throw new Error('تعذر استخراج البيانات من ملف Excel — جرّب تصديره بصيغة CSV');}
try{
const t=await file.text();
const clean=t.replace(/[^\u0600-\u06FFa-zA-Z0-9 \n.,()\-:%\r]/g,' ');
if(clean.trim().length>40)return clean;
}catch(e3){}
throw new Error('نوع الملف غير مدعوم: '+ext);}
