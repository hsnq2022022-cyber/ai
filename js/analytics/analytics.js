function pgAnalytics(){
var w=ws();var total=w.convos.length||1;
var closed=w.convos.filter(function(c){return c.status==='closed'}).length;
var hand=w.convos.filter(function(c){return c.status==='handoff'}).length;
var act=Math.max(total-closed-hand,0);
var days=[];for(var i=0;i<14;i++){var d0=new Date();d0.setHours(0,0,0,0);var from=d0.getTime()-(13-i)*DAY;
days.push({d:from,v:w.convos.reduce(function(s,c){return s+c.messages.filter(function(m){return m.at>=from&&m.at<from+DAY}).length},0)})}
var max=Math.max.apply(null,days.map(function(x){return x.v}).concat([1]));
var firsts={};w.convos.forEach(function(c){var t=(c.messages[0]||{}).text||'';tokens(t).slice(0,3).forEach(function(tk){firsts[tk]=(firsts[tk]||0)+1})});
var top=Object.entries(firsts).sort(function(a,b){return b[1]-a[1]}).slice(0,5);
var C=2*Math.PI*40,off=0;
var segs=[['#0ABAB5',act],['#f59e0b',hand],['#414a56',closed]].map(function(p){var len=p[1]/total*C;var s='<circle cx="50" cy="50" r="40" fill="none" stroke="'+p[0]+'" stroke-width="14" stroke-dasharray="'+len+' '+(C-len)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 50 50)"/>';off+=len;return s}).join('');
var cust=w.contacts||[];
var clsCounts=CLASSES.map(function(cl){return {cl:cl,n:cust.filter(function(c){return c.class===cl}).length}}).filter(function(x){return x.n>0});
var clsMax=Math.max.apply(null,clsCounts.map(function(x){return x.n}).concat([1]));
return '<div class="grid lg:grid-cols-3 gap-4"><div class="lg:col-span-2 glass rounded-2xl p-6"><h3 class="font-display font-bold mb-5">الرسائل يوميًا</h3><div class="flex items-end gap-1.5 h-44">'+days.map(function(x){return '<div class="flex-1 flex flex-col items-center gap-1.5"><div class="w-full rounded-t-md bar bg-tiffany-500/70" style="height:'+Math.max(x.v/max*100,3)+'%"></div><span class="text-[9px] text-ink-600">'+fmtDate(x.d)+'</span></div>'}).join('')+'</div></div>'
+'<div class="glass rounded-2xl p-6"><h3 class="font-display font-bold mb-4">حالات المحادثات</h3><div class="flex items-center gap-5"><svg viewBox="0 0 100 100" class="w-28 h-28 flex-none">'+segs+'</svg><div class="space-y-2 text-xs"><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-tiffany-500"></span>نشطة: <b>'+act+'</b></div><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-amber-500"></span>تحويل بشري: <b>'+hand+'</b></div><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-ink-700"></span>مغلقة: <b>'+closed+'</b></div></div></div></div>'
+'<div class="lg:col-span-2 glass rounded-2xl p-6"><h3 class="font-display font-bold mb-4">توزيع تصنيفات العملاء</h3><div class="space-y-2">'+(clsCounts.map(function(x){return '<div class="flex items-center gap-3"><span class="text-xs text-ink-400 w-24 flex-none">'+esc(x.cl)+'</span><div class="flex-1 h-6 bg-ink-850 rounded-lg overflow-hidden"><div class="h-full bg-tiffany-500/25 border-l border-tiffany-500/50 flex items-center px-3 text-xs" style="width:'+Math.max(x.n/clsMax*100,10)+'%">'+x.n+'</div></div></div>'}).join('')||'<p class="text-sm text-ink-500">لا بيانات بعد — ستظهر التصنيفات تلقائيًا مع أول محادثات حقيقية.</p>')+'</div></div>'
+'<div class="glass rounded-2xl p-6"><h3 class="font-display font-bold mb-4">أكثر المواضيع ورودًا</h3><div class="space-y-2">'+(top.map(function(t,i){return '<div class="flex items-center gap-3"><span class="text-xs text-ink-500 w-4">'+(i+1)+'</span><div class="flex-1 h-7 bg-ink-850 rounded-lg overflow-hidden"><div class="h-full bg-tiffany-500/25 border-l border-tiffany-500/50 rounded-lg flex items-center px-3 text-xs" style="width:'+Math.max(t[1]/top[0][1]*100,15)+'%">'+esc(t[0])+' — '+t[1]+'</div></div></div>'}).join('')||'<p class="text-sm text-ink-500">لا بيانات كافية.</p>')+'</div></div></div>';}
