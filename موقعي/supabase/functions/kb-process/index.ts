// supabase/functions/kb-process/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { extractText, getDocumentProxy } from "npm:unpdf";
import mammoth from "npm:mammoth";
import * as XLSX from "npm:xlsx";
const json=(b,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
function chunkText(text:string,size=800,overlap=100){const clean=text.replace(/\s+/g," ").trim();const out:string[]=[];for(let i=0;i<clean.length;i+=size-overlap){const c=clean.slice(i,i+size).trim();if(c.length>20)out.push(c);}return out;}
async function extractByType(name:string,buf:Uint8Array){
const ext=(name.split(".").pop()||"").toLowerCase();
try{
if(ext==="pdf"){const pdf=await getDocumentProxy(buf.slice().buffer);const {text}=await extractText(pdf,{mergePages:true});return Array.isArray(text)?text.join("\n"):text;}
if(ext==="docx")return (await mammoth.extractRawText({buffer:buf.slice().buffer})).value;
if(ext==="csv"||ext==="txt"||ext==="md")return new TextDecoder("utf-8").decode(buf);
if(ext==="xlsx"||ext==="xls"){const wb=XLSX.read(buf.slice().buffer,{type:"array"});let out="";for(const sn of wb.SheetNames)out+="\n["+sn+"]\n"+XLSX.utils.sheet_to_csv(wb.Sheets[sn]);return out;}
}catch(e:any){throw new Error("فشل استخراج النص من الملف ("+ext+"): "+(e?.message||String(e)));}
throw new Error("نوع الملف غير مدعوم: "+ext);
}
Deno.serve(async(req)=>{
if(req.method==="OPTIONS")return new Response("ok",{headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"*"}});
try{
const {doc_id,path,agent_id}=await req.json().catch(()=>({}));
if(!doc_id||!path)return json({error:"bad_request",message:"طلب غير صالح."},400);
const admin=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const {data:file,error:dlErr}=await admin.storage.from("kb-files").download(path);
if(dlErr||!file)return json({error:"download",message:"تعذر قراءة الملف من التخزين: "+(dlErr?.message||"")},500);
const buf=new Uint8Array(await file.arrayBuffer());
const text=await extractByType(path.split("/").pop()||"file",buf);
if(!text||!text.trim())return json({error:"empty",message:"الملف لا يحتوي نصًا قابلًا للاستخراج."},422);
const dr=await admin.from("knowledge_docs").select("*").eq("id",doc_id).maybeSingle();
const row:any=dr.data;const dd:any=(row&&row.data)||{};
let agentId=agent_id||null;
if(!agentId)agentId=dd.agentId||null;
const wsId=row?row.workspace_id:null;
let targets:string[]=[];
if(agentId)targets=[agentId];
else{const ar=await admin.from("agents").select("id").eq("workspace_id",wsId);targets=(ar.data||[]).map((a:any)=>a.id);}
if(!targets.length)return json({error:"no_agent",message:"لا يوجد Agent لربط المعرفة به."},422);
const chunks=chunkText(text).slice(0,400);
const genAI=new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY")!);
const embModel=genAI.getGenerativeModel({model:"text-embedding-004"});
await admin.from("knowledge_chunks").delete().eq("doc_id",doc_id);
const rows:any[]=[];
for(let i=0;i<chunks.length;i+=20){
const batch=chunks.slice(i,i+20);
const r=await embModel.batchEmbedContents(batch.map(c=>({content:c})));
r.embeddings.forEach((e:any,j:number)=>{targets.forEach(tg=>rows.push({workspace_id:wsId,doc_id,content:batch[j],embedding:e.values,agent_id:tg}));});
}
const ins=await admin.from("knowledge_chunks").insert(rows);
if(ins.error)return json({error:"insert",message:"فشل إنشاء التضمينات أو تخزين المقاطع: "+ins.error.message},500);
if(row){dd.status="ready";dd.chunkCount=chunks.length;dd.lastSync=Date.now();dd.error="";
await admin.from("knowledge_docs").update({data:dd}).eq("id",doc_id);}
return json({ok:true,chunks:chunks.length,summary:"تمت المعالجة وتخزين التضمينات."});
}catch(err){console.error("kb-process error",err);return json({error:"server",message:err?.message||"فشل في معالجة الملف."},500);}
});
