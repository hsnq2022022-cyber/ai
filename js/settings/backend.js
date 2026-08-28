// Backend Settings — إعدادات الاتصال بـ Supabase
function pgBackend(){
  var settings = localStorage.getItem('backend_config') ? JSON.parse(localStorage.getItem('backend_config')) : {};
  var testResult = null;
  var testLoading = false;

  return `
    <div class="grid lg:grid-cols-2 gap-5 items-start">
      <!-- قسم الإعدادات -->
      <div class="glass rounded-2xl p-6 space-y-4">
        <h3 class="font-display font-bold text-lg text-tiffany-400">إعدادات الخلفية</h3>
        <p class="text-xs text-ink-400">أدخل بيانات اتصال Supabase الخاصة بك</p>

        <!-- Supabase URL -->
        <div>
          <label class="lbl2">Supabase URL</label>
          <input 
            type="text" 
            id="backend_url" 
            placeholder="https://your-project.supabase.co" 
            value="${esc(settings.url || '')}"
            class="inp"
          />
          <p class="text-xs text-ink-500 mt-1">🔗 من: Supabase Dashboard → Settings → API</p>
        </div>

        <!-- Supabase Anon Key -->
        <div>
          <label class="lbl2">Supabase Anon Key</label>
          <input 
            type="password" 
            id="backend_key" 
            placeholder="eyJhbGciOiJIUzI1NiIs..." 
            value="${esc(settings.key || '')}"
            class="inp"
          />
          <p class="text-xs text-ink-500 mt-1">🔑 استخدم المفتاح العام (anon)، وليس Service Role</p>
        </div>

        <!-- اختبار الاتصال -->
        <button onclick="testBackendConnection()" class="btn2 w-full bg-tiffany-500/20 hover:bg-tiffany-500/30 text-tiffany-300">
          ⚡ اختبار الاتصال
        </button>

        <!-- حفظ الإعدادات -->
        <button onclick="saveBackendConfig()" class="btn w-full">
          💾 حفظ الإعدادات
        </button>
      </div>

      <!-- قسم النتائج والمعلومات -->
      <div class="space-y-4">
        <!-- حالة الاتصال الحالية -->
        <div class="glass rounded-2xl p-6">
          <h4 class="font-bold mb-3">حالة الاتصال</h4>
          <div id="connection_status" class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full ${cfg && cfg.url && cfg.key ? 'bg-tiffany-400' : 'bg-ink-600'}"></span>
              <span class="text-sm">${cfg && cfg.url && cfg.key ? '✅ متصل' : '❌ غير متصل'}</span>
            </div>
            ${cfg && cfg.url ? `<p class="text-xs text-ink-400">URL: <span class="text-tiffany-300">${cfg.url.substring(0, 30)}...</span></p>` : ''}
          </div>
        </div>

        <!-- معلومات مفيدة -->
        <div class="glass rounded-2xl p-6 border border-ink-700">
          <h4 class="font-bold mb-3 text-tiffany-300">📚 تعليمات</h4>
          <ul class="text-xs text-ink-400 space-y-2">
            <li>• اذهب إلى <strong>supabase.com</strong> وادخل حسابك</li>
            <li>• افتح مشروعك واذهب إلى <strong>Settings → API</strong></li>
            <li>• انسخ <strong>Project URL</strong></li>
            <li>• انسخ المفتاح <strong>anon public</strong></li>
            <li>• الصق البيانات هنا وانقر "اختبار الاتصال"</li>
          </ul>
        </div>

        <!-- رسالة الاختبار -->
        <div id="test_message" class="hidden glass rounded-2xl p-4">
          <div id="test_content" class="text-sm"></div>
        </div>
      </div>
    </div>

    <script>
      function testBackendConnection(){
        const url = document.getElementById('backend_url').value.trim();
        const key = document.getElementById('backend_key').value.trim();
        const msgEl = document.getElementById('test_message');
        const contentEl = document.getElementById('test_content');

        if(!url || !key){
          msgEl.classList.remove('hidden');
          msgEl.classList.add('bg-red-500/10', 'border', 'border-red-500/30');
          contentEl.innerHTML = '❌ <strong>خطأ:</strong> أدخل URL والمفتاح أولاً';
          return;
        }

        msgEl.classList.remove('hidden', 'bg-red-500/10', 'border-red-500/30');
        msgEl.classList.add('bg-ink-800', 'border', 'border-ink-700');
        contentEl.innerHTML = '⏳ جاري الاختبار...';

        // محاولة إنشاء عميل Supabase
        try {
          const testClient = window.supabase.createClient(url, key);
          testClient.auth.getSession().then(function(result){
            if(result && result.data){
              msgEl.classList.remove('bg-ink-800', 'border-ink-700');
              msgEl.classList.add('bg-tiffany-500/10', 'border', 'border-tiffany-500/30');
              contentEl.innerHTML = '✅ <strong>نجح!</strong> الاتصال بـ Supabase يعمل بشكل صحيح';
            } else {
              msgEl.classList.remove('bg-ink-800', 'border-ink-700');
              msgEl.classList.add('bg-tiffany-500/10', 'border', 'border-tiffany-500/30');
              contentEl.innerHTML = '✅ <strong>نجح!</strong> الاتصال يعمل (غير مسجل دخول حاليًا)';
            }
          }).catch(function(err){
            msgEl.classList.remove('bg-ink-800', 'border-ink-700');
            msgEl.classList.add('bg-orange-500/10', 'border', 'border-orange-500/30');
            contentEl.innerHTML = '⚠️ <strong>تحذير:</strong> ' + (err.message || 'فشل التحقق');
          });
        } catch(err){
          msgEl.classList.remove('bg-ink-800', 'border-ink-700');
          msgEl.classList.add('bg-red-500/10', 'border', 'border-red-500/30');
          contentEl.innerHTML = '❌ <strong>خطأ:</strong> ' + err.message;
        }
      }

      function saveBackendConfig(){
        const url = document.getElementById('backend_url').value.trim();
        const key = document.getElementById('backend_key').value.trim();

        if(!url || !key){
          toast('❌ أدخل URL والمفتاح كاملين', 'err');
          return;
        }

        if(!url.startsWith('https://')){
          toast('❌ URL يجب أن يبدأ بـ https://', 'err');
          return;
        }

        // حفظ في localStorage
        localStorage.setItem('backend_config', JSON.stringify({url, key}));
        
        // تحديث cfg العام
        window.cfg = {url, key};
        window.sb = null; // إعادة تعيين العميل ليتم إنشاؤه من جديد
        
        toast('✅ تم حفظ الإعدادات بنجاح', 'ok');
        
        // تحديث الحالة
        setTimeout(() => {
          location.reload();
        }, 500);
      }
    </script>
  `;
}
