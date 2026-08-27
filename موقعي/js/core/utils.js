const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

const uid=p=>(p||'')+Math.random().toString(36).slice(2,9);

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const now=()=>Date.now();

const DAY=864e5;

const fmtDate=t=>new Intl.DateTimeFormat('ar',{day:'numeric',month:'short'}).format(t);

const fmtTime=t=>new Intl.DateTimeFormat('ar',{hour:'numeric',minute:'2-digit'}).format(t);

const timeAgo=t=>{const d=now()-t;if(d<6e4)return 'الآن';if(d<36e5)return 'قبل '+Math.floor(d/6e4)+' د';if(d<DAY)return 'قبل '+Math.floor(d/36e5)+' س';return 'قبل '+Math.floor(d/DAY)+' يوم'};

const hashPw=s=>{let h=9;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),387420489);return 'h'+(h^h>>>9)};

const norm=s=>String(s||'').replace(/[\u064B-\u0652\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').toLowerCase();

const tokens=s=>norm(s).split(/[^\u0600-\u06FFa-z0-9]+/).filter(w=>w.length>2);

const isNetErr=m=>/failed to fetch|networkerror|load failed|network request|timeout|aborted/i.test(String(m||''));

function fmtSize(b){if(b==null)return '';if(b<1024)return b+' B';if(b<1048576)return (b/1024).toFixed(1)+' KB';return (b/1048576).toFixed(1)+' MB'}

function arErr(m){m=String(m||'');if(isNetErr(m))return 'تعذر الوصول إلى الخادم — تحقق من اتصال الإنترنت';if(/401|invalid api key|invalid key/i.test(m))return 'خطأ في مفتاح الاتصال بالخادم';return m}

function md(s){let t=esc(s);t=t.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
t=t.replace(/\[(.+?)\]\((.+?)\)/g,function(m,txt,rawUrl){const u=String(rawUrl||'').trim();
if(/^https?:\/\//i.test(u))return '<a class="underline text-tiffany-400" target="_blank" rel="noopener noreferrer" href="'+u+'">'+txt+'</a>';return txt;});
return t.replace(/\n/g,'<br>');}

function toast(msg,type){const c=document.getElementById('toasts');if(!c)return;const el=document.createElement('div');
el.className='fadeUp glass rounded-xl px-4 py-3 text-sm flex items-center gap-2 shadow-soft '+(type==='err'?'!border-red-500/40 text-red-300':type==='ok'?'!border-tiffany-500/40 text-tiffany-300':'text-ink-100');
el.innerHTML=(type==='err'?'⚠️':type==='ok'?'✅':'ℹ️')+'<span>'+esc(msg)+'</span>';c.appendChild(el);
setTimeout(function(){el.style.opacity='0';el.style.transition='.4s';setTimeout(function(){el.remove()},400)},3600)}

function copyText(t){const done=()=>toast('تم النسخ إلى الحافظة','ok');
if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(done).catch(function(){fbCopy(t,done)})}else fbCopy(t,done);
function fbCopy(x,cb){const ta=document.createElement('textarea');ta.value=x;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(e){}ta.remove();cb()}}

function beep(){try{const c=new (window.AudioContext||window.webkitAudioContext)();const o=c.createOscillator(),g=c.createGain();o.frequency.value=880;g.gain.value=.04;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.12)}catch(e){}}

function busy(btn,label){if(!btn)return null;var old=btn.innerHTML;btn.disabled=true;btn.innerHTML=label;return function(){btn.disabled=false;btn.innerHTML=old}}

function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}

function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}

function loadScriptOnce(src,checkFn){
return new Promise(function(res,rej){
if(checkFn&&checkFn()){res();return}
function poll(n){if(checkFn&&checkFn()){res();return}if(n<=0){rej(new Error('انتهت مهلة تحميل المكتبة'));return}setTimeout(function(){poll(n-1)},100)}
var exist=document.querySelector('script[src="'+src+'"]');
if(exist){poll(30);return}
var s=document.createElement('script');s.src=src;s.async=true;
s.onload=function(){poll(10)};
s.onerror=function(){rej(new Error('تعذر تحميل المكتبة: '+src))};
document.head.appendChild(s);});}

async function ensureLib(checkFn,urls){
if(checkFn())return true;
for(var i=0;i<urls.length;i++){try{await loadScriptOnce(urls[i],checkFn);if(checkFn())return true}catch(e){console.warn('lib load failed:',urls[i],e)}}
return checkFn();}

const IC={
home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
chat:'<path d="M21 12a8 8 0 0 1-8 8H4l1.5-3.5A8 8 0 1 1 21 12z"/>',
bot:'<rect x="5" y="8" width="14" height="10" rx="3"/><path d="M12 8V5M9 5h6"/><circle cx="9.5" cy="12.5" r="1"/><circle cx="14.5" cy="12.5" r="1"/>',
widget:'<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18M8 21h8"/>',
users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17.5" cy="9.5" r="2.8"/><path d="M15.5 14.6a5.5 5.5 0 0 1 6 5.4"/>',
book:'<path d="M4 5a2 2 0 0 1 2-2h14v18H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M9 7h7"/>',
chart:'<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-5M12 16V8M16 16v-3"/>',
gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2"/>',
card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h5"/>',
send:'<path d="m5 12 14-7-4 7 4 7z"/>',
copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
x:'<path d="M6 6l12 12M18 6L6 18"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
edit:'<path d="M4 20h4L20 8l-4-4L4 16z"/>',
code:'<path d="m8 8-5 4 5 4M16 8l5 4-5 4M13 5l-2 14"/>',
shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
bolt:'<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
spark:'<path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18-3-4-3-14.5 0-18z"/>',
check:'<path d="m5 13 4 4L19 7"/>',
menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
out:'<path d="M15 12H4m0 0 3-3m-3 3 3 3"/><path d="M9 4h10v16H9"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
doc:'<path d="M6 2h8l5 5v15H6z"/><path d="M14 2v5h5M9 13h6M9 17h6"/>',
db:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
refresh:'<path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"/>'};

const icon=(n,c)=>'<svg class="'+(c||'w-5 h-5')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC[n]+'</svg>';

function modal(html){document.getElementById('modal-root').innerHTML='<div class="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center p-4" data-action="modal-close"><div class="glass rounded-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto p-6 fadeUp shadow-soft" onclick="event.stopPropagation()">'+html+'</div></div>'}

function closeModal(){document.getElementById('modal-root').innerHTML=''}
