(function(){
var sc=document.currentScript||(function(){var all=document.querySelectorAll('script[data-widget-id]');return all[all.length-1];})();
if(!sc)return;
var WIDGET_ID=sc.getAttribute('data-widget-id');
var TOKEN=sc.getAttribute('data-token');
var API=(sc.getAttribute('data-api')||'').replace(/\/+$/,'');
if(!WIDGET_ID||!TOKEN||!API)return;
fetch(API+'/verify-widget',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({widget_id:WIDGET_ID,token:TOKEN})})
.then(function(r){return r.json();})
.then(function(cfg){/* بناء الواجهة من cfg.settings داخل Shadow DOM */})
.catch(function(){});
})();
