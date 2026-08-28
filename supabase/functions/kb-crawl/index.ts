// supabase/functions/kb-crawl/index.ts — زحف حتى 10 صفحات ضمن نفس النطاق
import { createClient } from "npm:@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { parse } from "npm:node-html-parser";
const json=(b,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
const MAX_PAGES=10;
function chunkText(text:string,size=800,overlap=100){const clean=text.replace(/\s+/g," ").trim();const out:string[]=[];for(let i=0;i<clean.length;i+=size-overlap){const c=clean.slice(i,i+size).trim();if(c.length>20)out.push(c);}return out;}
function extractPage(html:string){const root=parse(html);
root.querySelectorAll("script,style,noscript,svg,iframe,nav,footer,form,button").forEach(n=>n.remove());
const links=root.querySelectorAll("a[href]").map(a=>a.getAttribute("href")||"").filter(h=>h&&!h.startsWith("#")&&!h.startsWith("mailto:")&&!h.startsWith("tel:")&&!h.startsWith("javascript:"));
const title=(root.querySelector("title")?.text||"").trim();
const body=root.querySelector("main")||root.querySelector("body");
return {text:((title?title+"\n":"")+(body?.text||"")).replace(/\s+/g," ").trim(),links};}
Deno.serve(async(req)=>{
if(req.method==="OPTIONS")return new Response("ok",{headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"*"}});
try{
const {url,doc_id,workspace_id,agent_id}=await req.json().catch(()=>({}));
if(!url||!doc_id)return json({error:"bad_request",message:"طلب غير صالح."},400);
if(!/^https?:\/\//i.test(url))return json({error:"bad_url",message:"الرابط يجب أن يبدأ بـ http أو https."},400);
const admin=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const authHeader=req.headers.get("Authorization")||"";
const jwt=authHeader.replace(/^Bearer\s+/i,"");
if(!jwt)return json({error:"unauthorized",message:"الجلسة غير صالحة."},401);
const{data:userData,error:userErr}=await admin.auth.getUser(jwt);
if(userErr||!userData?.user)return json({error:"unauthorized",message:"الجلسة غير صالحة."},401);
const wsChk=await admin.from("workspaces").select("id").eq("id",workspace_id).eq("owner_id",userData.user.id).maybeSingle();
if(!wsChk.data)return json({error:"forbidden",message:"لا تملك صلاحية على مساحة العمل هذه."},403);
const origin=new URL(url).origin;
const queue:string[]=[url];const visited=new Set<string>();const pages:string[]=[];
while(queue.length&&visited.size<MAX_PAGES){
const next=queue.shift()!;let u:URL;try{u=new URL(next,origin);}catch{continue;}
const key=u.origin+u.pathname;
if(u.origin!==origin||visited.has(key))continue;
visited.add(key);
try{const res=await fetch(u.toString(),{headers:{"User-Agent":"SocialBot/1.0"},redirect:"follow",signal:AbortSignal.timeout(15000)});
if(!res.ok){continue;}
const ct=res.headers.get("content-type")||"";
if(!ct.includes("html"))continue;
const {text,links}=extractPage(await res.text());
if(text.length>40)pages.push("صفحة: "+u.pathname+"\n"+text.slice(0,20000));
for(const l of links)queue.push(new URL(l,u.toString()).toString());
}catch(fetchErr){continue;}
}
if(!pages.length)return json({error:"empty",message:"الموقع لا يحتوي نصًا كافيًا — قد يعتمد على JavaScript أو يمنع القراءة الآلية."},422);
const dr=await admin.from("knowledge_docs").select("*").eq("id",doc_id).maybeSingle();
const row:any=dr.data;const dd:any=(row&&row.data)||{};
if(row&&row.workspace_id!==workspace_id)return json({error:"forbidden"},403);
let agentId=agent_id||null;
if(!agentId)agentId=dd.agentId||null;
const wsId=workspace_id||(row?row.workspace_id:null);
let targets:string[]=[];
if(agentId)targets=[agentId];
else{const ar=await admin.from("agents").select("id").eq("workspace_id",wsId);targets=(ar.data||[]).map((a:any)=>a.id);}
if(!targets.length)return json({error:"no_agent",message:"لا يوجد Agent لربط المعرفة به."},422);
const chunks=chunkText(pages.join("\n")).slice(0,600);
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
if(ins.error)return json({error:"insert",message:"فشل تخزين المقاطع: "+ins.error.message},500);
if(row){dd.status="ready";dd.chunkCount=chunks.length;dd.lastSync=Date.now();dd.pages=visited.size;dd.error="";
await admin.from("knowledge_docs").update({data:dd}).eq("id",doc_id);}
return json({ok:true,chunks:chunks.length,pages:visited.size});
}catch(err){console.error("kb-crawl error",err);return json({error:"server",message:"فشل الزحف: "+(err?.message||String(err))},500);}
});
