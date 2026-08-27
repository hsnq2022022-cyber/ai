function pgHome(){
var w=ws();var u=me();var isDemo=!!(u&&u.demo);
var today=w.convos.reduce(function(s,c){return s+c.messages.filter(function(m){return now()-m.at<DAY}).length},0);
var month=w.convos.reduce(function(s,c){return s+c.messages.filter(function(m){return now()-m.at<30*DAY}).length},0);
var cap=PLANS[w.plan].msgs;
var cust=w.contacts||[];
var buyers=cust.filter(function(c){return c.class==='مشتري'}).length;
var prospects=cust.filter(function(c){return c.class==='عميل محتمل'}).length;
var interested=cust.filter(function(c){return c.class==='مهتم'}).length;
var avg=cust.length?Math.round(cust.reduce(function(s,c){return s+(c.leadScore||0)},0)/cust.length):0;
var conv=cust.length?Math.round(buyers/cust.length*100):0;
var days=[];for(var i=0;i<14;i++){var d0=new Date();d0.setHours(0,0,0,0);var from=d0.getTime()-(13-i)*DAY;
days.push(w.convos.reduce(function(s,c){return s+c.messages.filter(function(m){return m.at>=from&&m.at<from+DAY}).length},0))}
var max=Math.max.apply(null,days.concat([1]));
var recent=w.convos.slice(0,4).map(function(c){var ct=w.contacts.find(function(x){return x.id===c.contactId});
return '<button data-action="go" data-to="#/app/conversations?c='+c.id+'" class="w-full text-right flex items-center gap-3 hover:bg-ink-850 rounded-xl p-2 transition"><div class="w-9 h-9 rounded-full bg-ink-800 flex items-center justify-center text-xs font-bold text-tiffany-300 flex-none">'+esc(((ct&&ct.name)||'ز').charAt(0))+'</div><div class="flex-1 min-w-0"><div class="text-sm font-semibold truncate">'+esc((ct&&ct.name)||'زائر')+'</div><div class="text-[11px] text-ink-500 truncate">'+esc((c.messages[c.messages.length-1]||{}).text||'')+'</div></div>'+statusBadge(c.status)+'</button>'}).join('');
var banner='';
if(remoteBroken)banner='<div class="mb-4 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2 flex-wrap">'+icon('refresh','w-4 h-4')+' انقطع الاتصال بالخادم — التغييرات محفوظة محليًا. <button data-action="sync-now" class="underline font-bold">إعادة المزامنة الآن</button></div>';
else banner=isRemote()
?'<div class="mb-4 text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2">'+icon('db','w-4 h-4')+' البيانات محفوظة ومتزامنة مع Supabase — Workspace: <span class="ltr">'+esc((w.__wid||'').slice(0,8))+'…</span></div>'
:(isDemo?'<div class="mb-4 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2 flex-wrap">'+icon('eye','w-4 h-4')+' وضع تجريبي بدون حساب — بياناتك المحلية محفوظة وتبقى بعد إعادة الفتح. <a class="underline font-bold" href="#/signup">أنشئ حسابًا حقيقيًا</a></div>'
:'<div class="mb-4 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2 flex-wrap">'+icon('bolt','w-4 h-4')+' تعمل الآن على تخزين محلي آمن. <button data-action="go" data-to="#/setup" class="underline font-bold">اربط قاعدة بيانات Supabase →</button></div>');
return banner
+'<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">'+statCard('chat','المحادثات',w.convos.length,handoffCount()+' بانتظار تحويل بشري')+statCard('users','العملاء',cust.length,interested+' مهتم')+statCard('send','رسائل اليوم',today)+statCard('chart','رسائل الشهر',month)+statCard('bot','Agents',w.agents.length,'الحد في خطتك: '+PLANS[w.plan].agents)+statCard('widget','Widgets',w.widgets.length,w.widgets.filter(function(x){return x.enabled}).length+' نشط')+statCard('bolt','استخدام AI',Math.min(100,Math.round(w.usage.ai/cap*100))+'%',w.usage.ai+' من '+cap)+statCard('shield','الخطة',PLANS[w.plan].name)+'</div>'
+'<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">'+statCard('users','عملاء محتملون',prospects)+statCard('check','مشترون',buyers)+statCard('chart','معدل التحويل',conv+'%','مشترون ÷ إجمالي العملاء')+statCard('spark','متوسط Lead Score',avg,'من 0 إلى 100')+'</div>'
+'<div class="grid lg:grid-cols-3 gap-4 mt-4"><div class="lg:col-span-2 glass rounded-2xl p-6"><div class="flex items-center justify-between mb-5"><h3 class="font-display font-bold">نشاط الرسائل — 14 يومًا</h3><button data-action="go" data-to="#/app/analytics" class="text-xs text-tiffany-400 hover:underline">التحليلات الكاملة</button></div><div class="flex items-end gap-1.5 h-36">'+days.map(function(d){return '<div class="flex-1 rounded-t-md bar '+(d?'bg-tiffany-500/70':'bg-ink-800')+'" style="height:'+Math.max(d/max*100,4)+'%" title="'+d+'"></div>'}).join('')+'</div></div>'
+'<div class="glass rounded-2xl p-6"><h3 class="font-display font-bold mb-4">أحدث المحادثات</h3><div class="space-y-2">'+(recent||'<p class="text-sm text-ink-500">لا محادثات بعد — افتح «موقع تجريبي» وابدأ أول محادثة حقيقية.</p>')+'</div></div></div>';}
