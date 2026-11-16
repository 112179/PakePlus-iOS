// very important, if you don't know what it is, don't touch it
// 非常重要，不懂代码不要动，这里可以解决80%的问题，也可以生产1000+的bug
const __pp_isBlobUrl = (url) =>
    typeof url === 'string' && url.startsWith('blob:')

const __pp_guessExtFromMime = (mime) => {
    const m = (mime || '').toLowerCase()
    const map = {
        'application/pdf': 'pdf',
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'text/plain': 'txt',
        'application/json': 'json',
        'application/zip': 'zip',
        'application/octet-stream': 'bin',
    }
    return map[m] || ''
}

const __pp_readBlobAsBase64 = (blob) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result || ''
            const comma = result.indexOf(',')
            resolve(comma >= 0 ? result.slice(comma + 1) : result)
        }
        reader.onerror = () =>
            reject(reader.error || new Error('read blob failed'))
        reader.readAsDataURL(blob)
    })

const __pp_downloadBlobViaBridge = async (href, filename) => {
    const handler = window?.webkit?.messageHandlers?.blobDownload
    if (!handler) return false

    const id = `pp_${Date.now()}_${Math.random().toString(16).slice(2)}`
    try {
        // blob: 只能在页面上下文读取
        const res = await fetch(href)
        const blob = await res.blob()

        let name = filename || 'download'
        const ext = __pp_guessExtFromMime(blob.type)
        if (ext && !name.toLowerCase().endsWith(`.${ext}`)) {
            name = `${name}.${ext}`
        }

        // 2MB 分片，避免单次 postMessage 过大
        const chunkSize = 2 * 1024 * 1024
        const total = Math.max(1, Math.ceil(blob.size / chunkSize))

        handler.postMessage({
            action: 'start',
            id,
            filename: name,
            mimeType: blob.type || '',
            size: blob.size || 0,
            totalChunks: total,
        })

        for (let i = 0; i < total; i++) {
            const part = blob.slice(
                i * chunkSize,
                Math.min(blob.size, (i + 1) * chunkSize)
            )
            const base64 = await __pp_readBlobAsBase64(part)
            handler.postMessage({
                action: 'chunk',
                id,
                index: i,
                totalChunks: total,
                data: base64,
            })
        }

        handler.postMessage({ action: 'finish', id })
        return true
    } catch (err) {
        try {
            handler.postMessage({
                action: 'error',
                id,
                message: String(err && err.message ? err.message : err),
            })
        } catch (_) {}
        return false
    }
}

const hookClick = (e) => {
    const origin = e.target.closest('a')
    const isBaseTargetBlank = document.querySelector(
        'head base[target="_blank"]'
    )
    if (!origin || !origin.href) return

    // 1) 支持 blob: 下载：交给 iOS 侧保存，避免 Web 侧弹二次授权/下载失败
    if (__pp_isBlobUrl(origin.href)) {
        e.preventDefault()
        __pp_downloadBlobViaBridge(
            origin.href,
            origin.getAttribute('download') || origin.download
        ).then((ok) => {
            // bridge 不可用或失败：降级为原始行为
            if (!ok) location.href = origin.href
        })
        return
    }

    // 2) 原有逻辑：拦截 _blank / base[target=_blank]
    if (origin.target === '_blank' || isBaseTargetBlank) {
        e.preventDefault()
        location.href = origin.href
    }
}

window.open = function (url, target, features) {
    console.log('open', url, target, features)
    location.href = url
}

document.addEventListener('click', hookClick, { capture: true })
/* ============================================================
   98堂 App · 手机端界面改造
   1) 强制走手机版模板  2) 整套卡片化皮肤  3) 广告清除
   4) 底部悬浮工具栏（返回/刷新/回顶）
   ============================================================ */
(function () {
  'use strict';

  var CSS_TEXT = `/* ============================================================
   98堂 App · 手机端界面重设计
   ============================================================ */

/* ---------- 全局：广告清除（桌面/手机模板都杀） ---------- */
.show-text, .show-text3, .show-text4, [class*="show-text"],
.n5_tbxj,
iframe[src*="ad"], ins.adsbygoogle, [id^="ad_"] {
  display: none !important;
  height: 0 !important;
  width: 0 !important;
  overflow: hidden !important;
}

/* 广告容器内的外链一律不占位 */
.show-text a, .show-text3 a, .show-text4 a,
[class*="show-text"] a, [class*="show-text"] .item {
  display: none !important;
}

/* ---------- 底部悬浮工具栏 ---------- */
html.__pp_has_bar body { padding-bottom: calc(76px + env(safe-area-inset-bottom)) !important; }
#__pp_bar {
  position: fixed !important;
  z-index: 2147483000;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(10px + env(safe-area-inset-bottom));
  display: flex;
  gap: 2px;
  padding: 6px;
  border-radius: 26px;
  background: rgba(28, 30, 34, .84);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  backdrop-filter: blur(18px) saturate(180%);
  box-shadow: 0 10px 30px rgba(0, 0, 0, .28);
  font-family: -apple-system, "PingFang SC", sans-serif;
}
#__pp_bar .__pp_btn {
  width: 62px; height: 44px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  color: #fff; border-radius: 20px;
  transition: background .15s;
}
#__pp_bar .__pp_btn:active { background: rgba(255, 255, 255, .16); }
#__pp_bar .__pp_ic { font-size: 17px; line-height: 1; }
#__pp_bar .__pp_lb { font-size: 9px; opacity: .72; margin-top: 2px; }


/* ---------- 快捷按钮组 ---------- */
#__pp_qa {
  position: fixed; right: 14px;
  bottom: calc(88px + env(safe-area-inset-bottom));
  z-index: 2147482500;
  display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
  font-family: -apple-system, "PingFang SC", sans-serif;
}
#__pp_qa .pp_qa_list { display: none; flex-direction: column; gap: 8px; align-items: flex-end; }
#__pp_qa.open .pp_qa_list { display: flex; }
#__pp_qa .pp_qa_item {
  display: flex; align-items: center; gap: 6px;
  height: 36px; padding: 0 14px; border-radius: 18px;
  background: rgba(255, 255, 255, .96);
  box-shadow: 0 4px 14px rgba(16, 24, 40, .16);
  font-size: 13px; font-weight: 600; color: #2b2f36;
  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
}
#__pp_qa .pp_qa_item:active { transform: scale(.96); }
#__pp_qa .pp_qa_item.on { background: #c2185b; color: #fff; }
#__pp_qa .pp_qa_item i { font-style: normal; font-size: 15px; }
#__pp_qa .pp_qa_fab {
  width: 44px; height: 44px; border-radius: 22px;
  background: rgba(28, 30, 34, .86); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, .25);
  -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
}
#__pp_qa.open .pp_qa_fab { background: #c2185b; }

/* ---------- toast ---------- */
#__pp_toast {
  position: fixed; left: 50%;
  bottom: calc(150px + env(safe-area-inset-bottom));
  transform: translate(-50%, 10px);
  background: rgba(24, 26, 30, .9);
  color: #fff; font-size: 13px; padding: 9px 16px; border-radius: 18px;
  opacity: 0; pointer-events: none; transition: .22s;
  z-index: 2147483000; max-width: 78vw; text-align: center;
  font-family: -apple-system, "PingFang SC", sans-serif;
}
#__pp_toast.show { opacity: 1; transform: translate(-50%, 0); }

/* ---------- 屏蔽用户 ---------- */
.pp-blockbtn { display: inline-block; margin-left: 10px; font-size: 12px; color: #9aa0a8; }
.pp-blockbtn.on { color: #c2185b; }
.pp-blocked > * { display: none !important; }
.pp-blocked > .pp-unblock {
  display: block !important;
  padding: 16px; text-align: center; font-size: 13px; color: #8b909a;
}

@media (max-width: 820px) {

  :root {
    --pp-bg: #f2f3f5;
    --pp-card: #ffffff;
    --pp-text: #16181d;
    --pp-sub: #8b909a;
    --pp-brand: #c2185b;
    --pp-line: rgba(16, 24, 40, .07);
    --pp-radius: 14px;
  }

  /* ---------- 1. 基础 ---------- */
  html, body { background: var(--pp-bg) !important; }
  body {
    font-family: -apple-system, "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif !important;
    color: var(--pp-text);
    -webkit-font-smoothing: antialiased;
    -webkit-text-size-adjust: 100%;
    overflow-x: hidden;
  }
  * { -webkit-tap-highlight-color: transparent; }
  a { text-decoration: none; }
  img { max-width: 100%; }

  /* ---------- 2. 顶部栏 ---------- */
  .n5_tbys {
    position: sticky !important; top: 0; z-index: 999;
    display: flex !important; align-items: center; gap: 10px;
    padding: 8px 14px !important;
    margin: 0 !important;
    background: rgba(255, 255, 255, .94) !important;
    -webkit-backdrop-filter: saturate(180%) blur(14px);
    backdrop-filter: saturate(180%) blur(14px);
    border: 0 !important;
    border-bottom: 1px solid var(--pp-line) !important;
    box-shadow: 0 1px 12px rgba(16, 24, 40, .04);
  }
  .n5_tbys .back_btn {
    width: 34px; height: 34px; flex: 0 0 34px;
    display: flex !important; align-items: center; justify-content: center;
    border-radius: 50%;
    background: #f1f2f4;
    color: #333 !important;
  }
  .n5_tbys .back_btn .iconfont { font-size: 17px !important; }
  .n5_tbys .dqym {
    flex: 1 1 auto; min-width: 0;
    font-size: 16px !important; font-weight: 600; color: var(--pp-text) !important;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    line-height: 34px;
  }
  .n5_tbys .lbsx, .n5_tbys .txbz {
    flex: 0 0 auto; font-size: 13px; color: var(--pp-sub) !important;
    padding: 6px 10px; border-radius: 16px; background: #f1f2f4;
  }

  /* ---------- 3. 排序 / 筛选条 ---------- */
  .n5_ztflsx, .n5_zdtys {
    position: sticky !important; top: 51px; z-index: 98;
    background: rgba(255, 255, 255, .96) !important;
    -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
    border: 0 !important; border-bottom: 1px solid var(--pp-line) !important;
    margin: 0 !important; padding: 6px 12px !important;
  }
  .n5_zdtys .orderby { display: flex !important; gap: 8px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .n5_zdtys .orderby::-webkit-scrollbar { display: none; }
  .n5_zdtys .orderby a {
    flex: 0 0 auto; font-size: 13px !important; line-height: 1;
    padding: 8px 14px; border-radius: 999px;
    background: #f1f2f4; color: #4b5563 !important;
    border: 0 !important;
  }
  .n5_zdtys .orderby a.xw1, .n5_zdtys .orderby a.on {
    background: var(--pp-brand) !important; color: #fff !important; font-weight: 600;
  }
  .n5_ztflsx ul, .n5_zdtys ul { display: flex !important; flex-wrap: nowrap; gap: 8px; overflow-x: auto; padding: 4px 0; }
  .n5_ztflsx li, .n5_zdtys li { flex: 0 0 auto; font-size: 13px; }

  /* ---------- 4. 帖子列表卡片 ---------- */
  .threadlist { background: transparent !important; padding: 8px 12px 16px !important; }
  .n5_htmk {
    background: var(--pp-card) !important;
    border: 0 !important;
    border-radius: var(--pp-radius) !important;
    margin: 10px 0 !important;
    padding: 12px 14px 10px !important;
    box-shadow: 0 1px 2px rgba(16, 24, 40, .04), 0 6px 18px rgba(16, 24, 40, .05);
    overflow: hidden;
  }

  /* 作者行 */
  .n5_htmktb { display: flex !important; align-items: center; border: 0 !important; padding: 0 0 8px !important; }
  .n5_mktbys { display: flex !important; align-items: center; gap: 8px; width: 100%; }
  .n5_mktbtx img, .n5_mktbtx img.user_avatar {
    width: 28px !important; height: 28px !important;
    border-radius: 50% !important; object-fit: cover;
    display: block !important;
  }
  .n5_mktbmc { display: flex !important; align-items: center; gap: 6px; font-size: 13px !important; color: #5b6270 !important; }
  .n5_mktbmc a { color: #5b6270 !important; font-weight: 500; }
  .n5_mktbsj { margin-left: auto !important; font-size: 12px !important; color: #a0a5ae !important; }

  /* 标题 */
  .n5_htnrwz { padding: 0 !important; border: 0 !important; }
  .n5_htnrjj, p.n5_htnrjj {
    margin: 0 !important; padding: 0 !important; border: 0 !important;
    line-height: 1.45 !important;
  }
  .n5_htnrjj a {
    font-size: 16px !important; line-height: 1.45 !important;
    font-weight: 600 !important; color: var(--pp-text) !important;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; word-break: break-word;
  }
  .n5_htnrjj a span, .n5_htnrjj em {
    font-size: 11px !important; font-weight: 500;
    padding: 1px 6px; margin-right: 4px; border-radius: 5px;
    background: #fdecef; color: var(--pp-brand) !important;
    vertical-align: 1px;
  }

  /* 缩略图 */
  .n5_htnrtp { margin: 10px 0 0 !important; border: 0 !important; padding: 0 !important; }
  .n5_htnrtp a { display: block !important; }
  .n5_htnrtp img {
    width: 100% !important; max-height: 220px !important;
    object-fit: cover; border-radius: 10px !important; display: block;
  }
  .n5_htnrtp .ztyzjj { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .n5_htnrtp .ztyzjj img { height: 100px !important; }

  /* 底部动作条 */
  .n5_htnrxx {
    display: flex !important; align-items: center; gap: 18px;
    margin-top: 10px !important; padding-top: 9px !important;
    border: 0 !important; border-top: 1px solid var(--pp-line) !important;
    font-size: 12px !important;
  }
  .n5_htnrxx > div { display: flex !important; align-items: center; gap: 5px; color: #9aa0a8 !important; }
  .n5_htnrxx a { color: #9aa0a8 !important; font-size: 12px !important; }
  .n5_htnrxx .iconfont, .n5_htnrxx em { font-size: 14px !important; color: #9aa0a8 !important; }

  /* ---------- 5. 帖子详情 ---------- */
  .plc {
    background: var(--pp-card) !important;
    border: 0 !important;
    border-radius: var(--pp-radius) !important;
    margin: 10px 12px !important;
    padding: 12px 14px !important;
    box-shadow: 0 1px 2px rgba(16, 24, 40, .04), 0 6px 18px rgba(16, 24, 40, .05);
  }
  .n5_nrytb { border: 0 !important; padding: 0 !important; }
  .n5_nrhytx img {
    width: 34px !important; height: 34px !important;
    border-radius: 50% !important; object-fit: cover;
  }
  .n5_nrhyxx { font-size: 13px !important; color: #6b7280 !important; }
  .n5_nrhyxx a { color: #303540 !important; font-weight: 600; }
  .n5_nrlcbz, .n5_nrylc { font-size: 11px !important; color: #a0a5ae !important; }

  .message, .message * {
    font-size: 16px !important;
    line-height: 1.75 !important;
    color: #1f2329;
    word-break: break-word;
  }
  .message p { margin: 0 0 .85em !important; }
  .message a { color: var(--pp-brand) !important; text-decoration: underline; text-underline-offset: 2px; }
  .message h1, .message h2, .message h3 { line-height: 1.4 !important; margin: 1em 0 .5em !important; }
  .message img {
    height: auto !important; max-width: 100% !important;
    border-radius: 10px !important; display: block; margin: 10px auto;
  }
  .message blockquote {
    margin: .8em 0 !important; padding: .5em .9em !important;
    background: #f7f8fa !important; border-left: 3px solid #dfe3e8 !important;
    border-radius: 0 8px 8px 0; color: #5b6270 !important;
  }
  .message pre, .message code {
    white-space: pre-wrap !important; word-break: break-word !important;
    font-size: 13px !important; border-radius: 8px;
  }

  /* 楼层操作 */
  .n5_zthfcz, .n5_hfczgd, .hm { border: 0 !important; }
  .n5_zthfcz a, .hm a, .pi a { color: #9aa0a8 !important; font-size: 12px !important; }

  /* ---------- 6. 分页 ---------- */
  .page, .pg {
    display: flex !important; flex-wrap: wrap; gap: 8px;
    justify-content: center; padding: 14px 12px 20px !important;
    background: transparent !important; border: 0 !important;
  }
  .page a, .page strong, .pg a, .pg strong {
    min-width: 36px; height: 36px; line-height: 36px !important;
    padding: 0 12px !important; border-radius: 10px !important;
    background: #fff !important; border: 0 !important;
    font-size: 13px !important; text-align: center;
    box-shadow: 0 1px 3px rgba(16, 24, 40, .06);
    color: #4b5563 !important;
  }
  .page strong, .pg strong, .page .curpage, .pg .curpage {
    background: var(--pp-brand) !important; color: #fff !important;
  }
  .page label, .pg label { display: none !important; }

  /* ---------- 7. 回到顶部交给工具栏，隐藏站点自带 ---------- */
  a.scrolltop, .scrolltop { display: none !important; }

  /* ---------- 8. 收尾 ---------- */
  .h10, .h15 { height: 8px !important; }
  hr { border: 0; border-top: 1px solid var(--pp-line); }
}
`;

  /* ---------- A. 尽早执行：把页面拉回手机版 ---------- */
  function forceMobileTemplate() {
    // Discuz 用 mobile=2 参数或 mobile cookie 切换触屏模板
    if (!/(^|;\s*)mobile=/.test(document.cookie)) {
      document.cookie = 'mobile=2; path=/; max-age=2592000';
    }
    var html = document.documentElement;
    // 桌面模板特征：#wp + #nv + 没有 .n5_tbys
    var isDesktop = document.querySelector('#wp') && document.querySelector('#nv') &&
                    !document.querySelector('.n5_tbys');
    if (!isDesktop) return;
    if (sessionStorage.getItem('__pp_m')) return;
    sessionStorage.setItem('__pp_m', '1');
    try {
      var u = new URL(location.href);
      if (u.searchParams.get('mobile') !== '2') {
        u.searchParams.set('mobile', '2');
        location.replace(u.toString());
      }
    } catch (e) {}
  }

  /* ---------- B. 注入皮肤 ---------- */
  function injectCss() {
    var style = document.createElement('style');
    style.id = '__pp_ui';
    style.textContent = CSS_TEXT;
    (document.head || document.documentElement).appendChild(style);

    var vp = document.querySelector('meta[name="viewport"]');
    if (!vp) {
      vp = document.createElement('meta');
      vp.name = 'viewport';
      (document.head || document.documentElement).appendChild(vp);
    }
    vp.setAttribute('content',
      'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover');
  }

  /* ---------- C. 底部工具栏 ---------- */
  function addToolbar() {
    if (document.getElementById('__pp_bar')) return;
    if (document.querySelector('.n5_tbys') === null && document.querySelector('#wp') === null) return;

    var bar = document.createElement('div');
    bar.id = '__pp_bar';

    var items = [
      { k: 'back', icon: '‹', label: '返回' },
      { k: 'reload', icon: '⟳', label: '刷新' },
      { k: 'top', icon: '↑', label: '顶部' }
    ];
    items.forEach(function (it) {
      var b = document.createElement('div');
      b.className = '__pp_btn';
      b.innerHTML = '<span class="__pp_ic">' + it.icon + '</span><span class="__pp_lb">' + it.label + '</span>';
      b.addEventListener('click', function () {
        if (it.k === 'back') {
          if (history.length > 1) history.back();
          else location.href = location.pathname;
        } else if (it.k === 'reload') {
          location.reload();
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, { passive: true });
      bar.appendChild(b);
    });

    (document.body || document.documentElement).appendChild(bar);
    document.documentElement.classList.add('__pp_has_bar');
  }

  /* ---------- D. 细节修复 ---------- */
  function fixes() {
    // 图片懒加载 + 异步解码
    var imgs = document.querySelectorAll('img:not([loading])');
    for (var i = 0; i < imgs.length; i++) {
      imgs[i].setAttribute('decoding', 'async');
      if (i > 2) imgs[i].setAttribute('loading', 'lazy');
    }

    // WebView 里 target=_blank 打不开 → 改成当前窗口跳转
    document.addEventListener('click', function (e) {
      var a = e.target;
      while (a && a.tagName !== 'A') a = a.parentElement;
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0) return;
      if (a.target === '_blank') {
        e.preventDefault();
        location.href = a.href;
      }
    }, true);
  }

  /* ---------- 启动 ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      try { forceMobileTemplate(); } catch (e) {}
      try { injectCss(); } catch (e) {}
      try { addToolbar(); } catch (e) {}
      try { fixes(); } catch (e) {}
    });
  } else {
    try { forceMobileTemplate(); } catch (e) {}
    try { injectCss(); } catch (e) {}
    try { addToolbar(); } catch (e) {}
    try { fixes(); } catch (e) {}
  }
})();



/* 98 强化 0.2.4：内置运行环境，无需油猴。设置保存在当前网站域名的 localStorage。 */
(function (global) {
  'use strict';
  if (global.__SHT_GM__) return;
  var prefix = 'sht98.v1:';
  function value(key, fallback) {
    try {
      var text = localStorage.getItem(prefix + key);
      return text === null ? fallback : JSON.parse(text);
    } catch (_) { return fallback; }
  }
  function save(key, val) {
    return new Promise(function (resolve, reject) {
      try { localStorage.setItem(prefix + key, JSON.stringify(val)); resolve(true); }
      catch (e) { reject(e); }
    });
  }
  function addStyle(css) {
    var el = document.createElement('style');
    el.setAttribute('data-sht98', 'style'); el.textContent = css;
    (document.head || document.documentElement).appendChild(el); return el;
  }
  function toast(text, title) {
    var old = document.getElementById('__sht_toast'); if (old) old.remove();
    var el = document.createElement('div'); el.id = '__sht_toast';
    el.textContent = (title ? title + '\n' : '') + text;
    el.style.cssText = 'position:fixed;z-index:2147483600;left:50%;bottom:calc(160px + env(safe-area-inset-bottom));transform:translateX(-50%);max-width:85vw;padding:10px 16px;border-radius:12px;background:rgba(25,27,32,.92);color:#fff;font:13px/1.5 -apple-system,"PingFang SC",sans-serif;white-space:pre-line;text-align:center;pointer-events:none;box-shadow:0 4px 20px #0003';
    (document.body || document.documentElement).appendChild(el);
    setTimeout(function () { el.remove(); }, 3800);
  }
  function openInTab(url) { location.href = url; }
  function registerMenuCommand() { /* App 内使用底部“设置”入口 */ }
  var sync = {
    getValue: function (key, fallback) { return value(key, fallback); },
    setValue: function (key, val) { try { localStorage.setItem(prefix + key, JSON.stringify(val)); return true; } catch (_) { return false; } },
    deleteValue: function (key) { localStorage.removeItem(prefix + key); },
    listValues: function () { var a = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf(prefix) === 0) a.push(k.slice(prefix.length)); } return a; },
    addStyle: addStyle, openInTab: openInTab, registerMenuCommand: registerMenuCommand, notification: toast
  };
  var asyncApi = {
    getValue: function (k, d) { return Promise.resolve(value(k, d)); },
    setValue: save,
    deleteValue: function (k) { localStorage.removeItem(prefix + k); return Promise.resolve(); },
    listValues: function () { return Promise.resolve(sync.listValues()); },
    addStyle: addStyle, openInTab: openInTab, registerMenuCommand: registerMenuCommand, notification: toast
  };
  Object.assign(global, {
    GM: asyncApi, GM_getValue: sync.getValue, GM_setValue: sync.setValue,
    GM_deleteValue: sync.deleteValue, GM_listValues: sync.listValues,
    GM_addStyle: addStyle, GM_openInTab: openInTab,
    GM_registerMenuCommand: registerMenuCommand, GM_notification: toast,
    unsafeWindow: global, __SHT_GM__: true
  });
})(window);


// ==UserScript==
// @name         色花堂 98堂 强化脚本 (加固版)
// @namespace    http://tampermonkey.net/
// @version      0.2.4
// @description  加强论坛功能（X3.5 修复：common.js 路径变更导致的全脚本静默停摆 / verifyhash 失效 / 单模块异常隔离）
// @license      MIT
// @author       98_ethan (patched)
// @match        *://*.sehuatang.net/*
// @match        *://*.sehuatang.org/*
// @match        *://*.sehuatang.*/*
// @match        *://*.jq2t4.com/*
// @match        *://*.0krgb.com/*
// @match        *://*.xxjsnc.co/*
// @match        *://*.o4vag.com/*
// @match        *://*.weterytrtrr.*/*
// @match        *://*.qweqwtret.*/*
// @match        *://*.retreytryuyt.*/*
// @match        *://*.qwerwrrt.*/*
// @match        *://*.ds5hk.app/*
// @match        *://*.30fjp.com/*
// @match        *://*.18stm.cn/*
// @match        *://*.xo6c5.com/*
// @match        *://*.mzjvl.com/*
// @match        *://*.9xr2.app/*
// @match        *://*.kzs1w.com/*
// @match        *://*.nwurc.com/*
// @match        *://*.zbkz6.app/*
// @match        *://*.ql75t.cn/*
// @match        *://*.0uzb0.app/*
// @match        *://*.d2wpb.com/*
// @match        *://*.5aylp.com/*
// @match        *://*.8otvk.app/*
// @match        *://*.05kx.cc/*
// @match        *://*.1yxg2.com/*
// @match        *://*.6r5gy.co/*
// @match        *://*.mmpbg.co/*
// @match        *://*.kofqo.com/*
// @match        *://*.kofqo.net/*
// @match        *://*.9zi2n.com/*
// @match        *://*.pky0s.com/*
// @match        *://*.r88d8.com/*
// @match        *://*.z0gfi.com/*
// @match        *://*.xj4sds.com/*
// @match        *://*.5rmt2.net/*
// @match        *://*.n8cv.net/*
// @match        *://*.wbx0x.com/*
// @match        *://*.6yddw.com/*
// @match        *://*.1b0d2.com/*
// @match        *://*/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.listValues
// @grant        GM.addStyle
// @grant        GM.openInTab
// @grant        GM.registerMenuCommand
// @grant        GM.notification
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM.registerMenuCommand
// @grant        GM_notification
// @run-at       document-idle
// @icon         data:image/gif;base64,UklGRgABAABXRUJQVlA4WAoAAAAQAAAADwAADwAAQUxQSKYAAAANgJtt27Hn+v3HtitbrY0BnMrJBJnAWCCt2dk2Ktu2zTcrRMQEgMRWa/XZLCH8bqTqGCAqS3F5ZPmClmdXH6CRDn42AFpJdZfwIeFvn5sVUMsF9gHcHgX0jLdfgpMRtCq+KStAVGIZERAgBATy3+cNB7HX1pZ42V/P68vN2gXPeYZ/zOer4bhy1tEmTfWjn58vA6NXZkkm70fD578A1xVT1uoFLX4CVlA4IDQAAABQAQCdASoQABAAB0CWJbAABe9AAP7msGXYtkQ9eTZz0OaTWMpBhwn6oJ35ZoLVEQcVAAAA
// @downloadURL https://update.sleazyfork.org/scripts/503560/%E8%89%B2%E8%8A%B1%E5%A0%82%2098%E5%A0%82%20%E5%BC%BA%E5%8C%96%E8%84%9A%E6%9C%AC.user.js
// @updateURL https://update.sleazyfork.org/scripts/503560/%E8%89%B2%E8%8A%B1%E5%A0%82%2098%E5%A0%82%20%E5%BC%BA%E5%8C%96%E8%84%9A%E6%9C%AC.meta.js
// ==/UserScript==

const VERSION_MAJOR = 0.2;
const VERSION_TEXT = '0.2.4';

/* ------------------------------------------------------------------
 * 加固说明（相对 0.2.1）
 *  1. isCommonJsLoaded 加超时 + 放宽选择器 + 观察 documentElement，绝不无限挂起
 *  2. 主流程外层 try/catch + 每个功能模块独立 safe() 包裹，单点失败不再拖垮全脚本
 *  3. unsafeWindow 统一走 W 变量（沙箱拿不到时退回 window，不再 undefined 崩）
 *  4. fetchGetPage / extractUidFromURL / findErrorMessage 判空
 *  5. 帖子列表、搜索页、用户页选择器全部改成可选链，模板变动只降级不报错
 *  6. @match 追加通配全部域名的规则，运行时用 Discuz 特征判定，换域名不用改脚本
 *  7. 增加启动诊断日志，F12 一看就知道哪一步断了
 *  8. [X3.5] common.js 实际地址变为 /static/js/common.js?g69，原 ^= 前缀匹配失效 -> 用功能探测 + src*=
 *  9. [X3.5] 搜索 URL 不再含 searchmd5 -> 改用 searchid / #threadlist 判定，筛选与自动翻页恢复
 * 10. [X3.5] 全局 verifyhash 为 null -> 四级取值（全局/formhash域/meta/内联脚本）
 * ------------------------------------------------------------------ */

const W = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;

const LOG = (...args) => console.log('%c[98强化]', 'color:#c30a0a;font-weight:bold', ...args);
const ERR = (...args) => console.error('%c[98强化]', 'color:#fff;background:#c30a0a;padding:1px 4px', ...args);

function initGM() {
    let gmExists = false;
    try {
        if (typeof GM !== 'undefined' && typeof GM.getValue == 'function') {
            gmExists = true;
        }
    } catch (ignore) { }

    if (gmExists) {
        return {
            getValue: GM.getValue,
            setValue: GM.setValue,
            deleteValue: GM.deleteValue,
            listValues: GM.listValues,
            addStyle: GM.addStyle,
            openInTab: GM.openInTab,
            registerMenuCommand: GM.registerMenuCommand,
            notification: GM.notification,
        };
    } else {
        return {
            getValue: GM_getValue,
            setValue: GM_setValue,
            deleteValue: GM_deleteValue,
            listValues: GM_listValues,
            addStyle: GM_addStyle,
            openInTab: GM_openInTab,
            registerMenuCommand: GM_registerMenuCommand,
            notification: GM_notification,
        };
    }
}

const GM_API = initGM();

const MAIN_CONFIG_KEY = '98_main_config';

const DEFAULT_MAIN_CONFIG = {
    initFavorRecords: true,
    migrateFrom0d0d13: true,
    openIntroAfterUpdate: true,
    enableQuickBtn: true,
    quickBtnPosition: 'right', // left, right
    enableSortByDateline: false,

    enableAutoPaginationSearch: true,
    enableAutoPaginationSection: true,
    enableAutoPaginationUserProfile: true,
    enableSectionFilterSearch: true,
    enableSectionFilterUserProfile: true,
}

const LOAD_TIME_LIMIT = 3000;

const SEARCH_CONFIG_KEY = '98_search_config';
const DEFAULT_SEARCH_CONFIG = {};

const FAVOR_THREADS_CACHE_CONFIG_KEY = '98_favor_threads';
const DEFAULT_FAVOR_THREADS_CACHE_CONFIG = { time: 0, data: {} }; // [tid]: [favid]

const RATED_THREADS_CACHE_CONFIG_KEY = '98_rated_threads';
const DEFAULT_RATED_THREADS_CACHE_CONFIG = { time: 0, data: {} }; // [tid]: boolean

const USERS_CONFIG_CACHE_KEY = '98_users_config';
const DEFAULT_USERS_CONFIG_CACHE = {}; // { [uid]: { username: string, subscribed?: boolean, favored?: boolean, blocked?: boolean } }

const SEARCH_HIDDEN_SECTIONS = '98_search_hidden_sections';
const DEFAULT_SEARCH_HIDDEN_SECTIONS_CONFIG = {}; // { [sid]: boolean }

function initConfigAccess(myUserId, configKey, defaultValue) {
    return {
        async read() {
            return readMainConfig(myUserId, configKey, defaultValue);
        },
        async write(newValue) {
            await GM_API.setValue(configKey + '#' + myUserId, JSON.stringify(newValue));
        },
        async update(updater) {
            return updateMainConfig(myUserId, updater, configKey, defaultValue);
        }
    };
}

async function readMainConfig(myUserId, configKey, defaultValue) {
    try {
        let savedData = await GM_API.getValue(configKey + '#' + myUserId);
        return Object.assign({}, defaultValue, JSON.parse(savedData));
    } catch (e) { }
    return Object.assign({}, defaultValue);
}

async function updateMainConfig(myUserId, updater, configKey, defaultValue) {
    let oldConfig = await readMainConfig(myUserId, configKey, defaultValue);
    let newConfig = await updater(oldConfig);
    if (newConfig != null) {
        await GM_API.setValue(configKey + '#' + myUserId, JSON.stringify(newConfig));
    }
    return newConfig;
}

function readFavorThreadsList(doc) {
    const items = {};
    doc.querySelectorAll('#favorite_ul li[id^="fav_"], ul#favorite_ul li[id^="fav_"], .favorite_list li[id^="fav_"]').forEach(a => {
        const source = a.querySelector('input[name="favorite[]"]');
        if (!source) return;
        const favid = source.value * 1;
        const tid = source.getAttribute('vid') * 1;
        if (!tid) return;
        items[tid] = favid;
    });
    return items;
}

/**
 * 初始化收藏数据
 * @param {*} favorThreadsCacheAccess
 * @param {*} fresh
 * @param {*} callback 仅在 fresh 为 true 时可用
 * @returns { [tid]: favid }}
 */
async function readFavorRecords(favorThreadsCacheAccess, fresh, callback) {
    let userId = findMyUserId();

    let isLoading = false;
    const loadNextPage = async (doc) => {
        let cached = await favorThreadsCacheAccess.read();
        const favors = readFavorThreadsList(doc);
        const data = { ...(cached && cached.data), ...favors }
        await favorThreadsCacheAccess.write({ data, time: Date.now() });

        if (isLoading) return data;
        const nextPageLink = doc.querySelector('.pg a.nxt');

        if (!nextPageLink) {
            if (typeof callback === 'function') await callback();
            return data;
        };
        isLoading = true;

        try {
            const nextDoc = await fetchGetPage(nextPageLink.href);
            setTimeout(() => loadNextPage(nextDoc).catch(e => ERR('收藏翻页失败', e)), 1000);
        } catch (e) {
            ERR('收藏翻页请求失败', e);
            if (typeof callback === 'function') await callback();
        } finally {
            isLoading = false;
        }

        return data
    }

    if (fresh) {
        await favorThreadsCacheAccess.write(DEFAULT_FAVOR_THREADS_CACHE_CONFIG);
        if (userId < 0) {
            ERR('未登录或取不到 uid，跳过收藏记录初始化');
            if (typeof callback === 'function') await callback();
            return {};
        }
        const doc = await fetchGetPage(`home.php?mod=space&uid=${userId}&do=favorite&type=all`);
        const favors = await loadNextPage(doc);
        return favors;
    } else {
        let cached = await favorThreadsCacheAccess.read();
        return (cached && cached.data) || {};
    }
}

async function readRatedRecords(ratedThreadsCacheAccess) {
    let cached = await ratedThreadsCacheAccess.read();
    return (cached && cached.data) || {};
}

const createLoadingIndicator = (message) => {
    const indicator = addElem(document.body, 'div', 'ese-loading-indicator');
    indicator.textContent = message;
    return indicator;
};

function findMyUserId() {
    const userIdSource = [
        ['#um .vwmy > a', /uid=(\d+)/, 'href'], // 论坛内
        ['#um .vwmy a', /uid=(\d+)/, 'href'],
        ['head script:not([src]):not([id])', /discuz_uid\ =\ \'(\d+)\'/, 'textContent'], // 搜索页
        ['head script:not([src]):not([id])', /discuz_uid\s*=\s*['"](\d+)['"]/, 'textContent'],
    ]
    for (let [selector, reg, key] of userIdSource) {
        const userWrap = document.querySelector(selector);
        if (userWrap != null) {
            const userMatch = (userWrap[key] || '').match(reg);
            if (userMatch != null) return userMatch[1] * 1;
        }
    }
    return -1; // 未登录情况下，后续添加账号迁移功能
}

const COMMON_JS_FILENAME = 'static/js/common.js';
/**
 * X3.5 修复核心：
 *   原版用 script[src^="static/js/common.js"]，而实际 src 是 "/static/js/common.js?g69"
 *   （前导斜杠 + 版本串）→ 匹配不到 → 无超时死等 → 整个脚本静默不执行。
 * 现在：优先做“功能探测”（站点原生函数是否已挂载），其次用 src*= 包含匹配，
 *   最后 4s 超时兜底，任何情况都不阻塞主流程。
 */
function isCommonJsLoaded(timeout = 4000) {
    return new Promise((resolve) => {
        const featureReady = () => {
            try {
                return typeof W.showDialog === 'function' || typeof W.showloading === 'function';
            } catch (e) { return false }
        };
        const found = () => featureReady() || !!document.querySelector(`script[src*="${COMMON_JS_FILENAME}"]`);
        if (found()) return resolve(true);

        const observer = new MutationObserver(() => {
            if (found()) {
                observer.disconnect();
                clearTimeout(timer);
                resolve(true);
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });

        const timer = setTimeout(() => {
            observer.disconnect();
            ERR(`等待 ${COMMON_JS_FILENAME} 超时（4s），已跳过继续执行`);
            resolve(false);
        }, timeout);
    });
}

(async function () {
    'use strict';

    /* 换域名保险：只有 Discuz 论坛页面才继续（配合通配全部域名的 match） */
    const pathAndQuery = location.pathname + location.search;
    const isForumLikePage = /(?:forum|home|search|member|spacecp)\.php|thread-\d+|forum-\d+-\d+/.test(pathAndQuery);
    if (!isForumLikePage) return;

    /* 单模块保险：任何一个模块抛错只记日志，不影响其他模块 */
    const safe = async (name, fn) => {
        try {
            return await fn();
        } catch (e) {
            ERR(`模块「${name}」异常，已跳过：`, e);
        }
    };

    try {
        await main(isForumLikePage);
    } catch (e) {
        ERR('主流程异常（下方堆栈即断点）：', e);
    }

    async function main() {
        const GM = initGM();

        const INTRO_POST = document.location.origin + '/forum.php?mod=viewthread&tid=2251912';
        const UPDATE_NOTE = document.location.origin + '/forum.php?mod=redirect&goto=findpost&ptid=2251912&pid=28300683';

        const CONFIG_PAGE = document.location.origin + '/home.php?mod=spacecp&ac=enhancer';

        try {
            GM.registerMenuCommand('打开功能简介帖', () => GM.openInTab(INTRO_POST, false));
            GM.registerMenuCommand('查看更新说明', () => GM.openInTab(UPDATE_NOTE, false));
            GM.registerMenuCommand('打开插件设置页', () => GM.openInTab(CONFIG_PAGE, false));
        } catch (e) { ERR('注册菜单命令失败', e) }

        GM.addStyle(`
.ese-quick-button-container {
    position: fixed;
    left: calc(50vw + 510px);
    top: 205px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    font-size: 1.1em;
    margin-top: 0;
    padding: 0.2em;
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    background: rgba(254, 242, 232, 0.95);
}
.ese-quick-button-container.ese-quick-button-container-left {
    left: unset;
    right: calc(50vw + 510px);
}
.ese-quick-button {
    margin: 5px;
    border: none;
    cursor: pointer;
    color: #787878;
    font-weight: bold;
    font-family: monospace;
    margin-right: 0.3em;
    min-width: 6em;
    display: inline-block;
    background: none;
}
.ese-quick-button:hover { text-decoration: underline; }
.ese-thread-bottom-button, .ese-thread-userinfo-button {
    cursor: pointer;
}
.authi .ese-thread-userinfo-button {
    opactity: 0.8;
    visibility: hidden;
}
.authi:hover .ese-thread-userinfo-button {
    opactity: 1;
    visibility: visible;
}
.ese-favorite-button, .ese-block-button {
    border: 1px solid;
    cursor: pointer;
}
.ese-favorite-button {
    background: #FEAE10;
}
.ese-quick-button.ese-active {
    background-color: #ffffe9;
    outline: 3px solid lightgray;
    color: #565656;
}
.ese-quick-button.ese-active:hover {
    outline: 3px solid #777;
}
.ese-quick-button.ese-active:after {
    content: '✔';
    position: relative;
    left: 4px;
    overflow: hidden;
    color: goldenrod;
}

/* ========== search page ========== */
.ese-filter-container {
    position: fixed;
    left: calc(50vw + 200px);
    top: 105px;
    display: flex;
    flex-direction: column;
    z-index: 9999;
    width: 140px;
    padding: 0 2px;
    max-height: 750px;
    overflow-y: scroll;
    overflow-x: hidden;
    scrollbar-width: none;
}
.ese-filter-button {
    color: #333;
    border: none;
    padding: 1px 2px;
    box-shadow: 2px 2px 1px 0 #0009;
    white-space: pre;
    font-size: 14px;
    line-height: 18px;
    margin: 8px 0;
    cursor: pointer;
    outline: 2px solid lightblue;
    font-weight: bold;
    background: #EEEE;
    position: relative;
    padding-left: 32px;
}
.ese-filter-button.ese-hidden {
    color: #CCC;
    background: #999C;
    text-decoration: line-through;
    outline-color: #999;
}
.ese-filter-button:hover {
    outline-color: deepskyblue;
}
.ese-filter-button-count {
    color: royalblue;
    padding-right: 10px;
    position: absolute;
    left: 4px;
}
.ese-filter-button.ese-hidden .ese-filter-button-count {
    color: #CCC;
}
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
.ese-fade-in {
    opacity: 0;
    animation: fadeIn 1s forwards;
}
.ese-loading-indicator {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 12px 18px;
    border-radius: 5px;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.4);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 8px;
}
.ese-loading-indicator::before {
    content: '';
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 3px solid #fff;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 1s linear infinite;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

@media only screen and (max-width: 1280px) {
    .ese-quick-button-container, .ese-filter-container {
        left: unset;
        right: 3px;
        max-height: 550px;
    }
    .ese-quick-button-container.ese-quick-button-container-left {
        right: unset;
        left: 90px;
    }
}

/* ====== config ====== */
.ese-intro-link {
    margin-left: 7px;
    color: cornflowerblue;
    font-weight: bold;
}
.ese-config-panel-container {
    margin: 8px;
}
.ese-dialog-modal-mask {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: #FFF8;
    z-index: 100;
}
.ese-config-panel.ese-config-saving {
    cursor: wait;
}
.ese-config-panel.ese-config-saving .ese-config-list {
    opacity: 0.5;
    pointer-events: none;
}
.ese-config-list {
    margin: 0 5px;
}
.ese-config-list > dt {
    margin-top: 5px;
}
.ese-config-list > dt > a {
    margin-left: 3px;
    color: #0060df;
    cursor: pointer;
}
.ese-config-list > dt > a:hover {
    text-decoration: underline;
}
.ese-config-item-sep {
    margin-top: 0.5em;
    padding-top: 0.5em;
    border-top: 1px dotted #AAA;
}
.ese-config-item-tip {
    color: #105884;
    padding-left: 4px;
}
.ese-config-item-lv1 > span {
    margin-left: 3px;
}
.ese-config-item-lv2 {
    margin-left: 20px;
}
.ese-config-item-lv3 {
    margin-left: 40px;
}
.ese-config-item-lv1:not(.ese-config-item-checked) + .ese-config-item-lv2:not(.ese-config-item-tip),
.ese-config-item-lv1:not(.ese-config-item-checked) + .ese-config-item-lv2 + .ese-config-item-lv2:not(.ese-config-item-tip),
.ese-config-item-lv1:not(.ese-config-item-checked) + .ese-config-item-lv2 + .ese-config-item-lv2 + .ese-config-item-lv2:not(.ese-config-item-tip) {
    opacity: 0.2;
    pointer-events: none;
}
.ese-config-item-lv2:not(.ese-config-item-checked) + .ese-config-item-lv3:not(.ese-config-item-tip),
.ese-config-item-lv2:not(.ese-config-item-checked) + .ese-config-item-lv3 + .ese-config-item-lv3:not(.ese-config-item-tip),
.ese-config-item-lv2:not(.ese-config-item-checked) + .ese-config-item-lv3 + .ese-config-item-lv3 + .ese-config-item-lv3:not(.ese-config-item-tip) {
    opacity: 0.2;
    pointer-events: none;
}
.ese-user-map-icon {
    margin-left: 5px;
    cursor: pointer;
}
.ese-user-map-icon.ese-config-saving {
    opacity: 0.5;
    pointer-events: none;
}

.ese-user-map-icon::after {
    content: "➕收藏";
    font-weight: normal;
    font-size: 12px;
}
.ese-user-map-icon.ese-user-mapped::after {
    content: "🔖 " attr(ese-nickname);
    font-weight: normal;
    font-size: 12px;
    color: #c30a0a;
}
.ese-user-tag {
    margin-right: 6px;
    white-space: nowrap;
    min-width: 9em;
    display: inline-block;
    max-width: 9em;
    overflow: hidden;
    text-overflow: ellipsis;
}
.ese-user-tag-icon::before {
    content: "🔖 ";
    font-size: 14px;
    display: inline-block;
    cursor: pointer;
}
.ese-user-blacklist .ese-user-tag-icon::before {
    content: "🚫 ";
}
    `)

        const commonJsReady = await isCommonJsLoaded(1200);
        const myUserId = findMyUserId();

        LOG('启动', {
            url: location.href,
            uid: myUserId,
            commonJs: commonJsReady,
            version: VERSION_TEXT
        });

        const mainConfigAccess = initConfigAccess(myUserId, MAIN_CONFIG_KEY, DEFAULT_MAIN_CONFIG);
        const favorThreadsCacheAccess = initConfigAccess(myUserId, FAVOR_THREADS_CACHE_CONFIG_KEY, DEFAULT_FAVOR_THREADS_CACHE_CONFIG);
        const ratedThreadsCacheAccess = initConfigAccess(myUserId, RATED_THREADS_CACHE_CONFIG_KEY, DEFAULT_RATED_THREADS_CACHE_CONFIG);
        const usersConfigCacheAccess = initConfigAccess(myUserId, USERS_CONFIG_CACHE_KEY, DEFAULT_USERS_CONFIG_CACHE);
        const searchHiddenSectionsAccess = initConfigAccess(myUserId, SEARCH_HIDDEN_SECTIONS, DEFAULT_SEARCH_HIDDEN_SECTIONS_CONFIG);

        let mainConfig = await mainConfigAccess.read();

        if (mainConfig.migrateFrom0d0d13) {
            await safe('旧数据迁移', async () => {
                const favoriteUsers = await GM.getValue('favoriteUsers', {});
                const blockedUsers = await GM.getValue('blockedUsers', {});
                const hiddenSections = await GM.getValue('hiddenSections', {});

                const userConfig = {};
                Object.keys(blockedUsers || {}).forEach(item => userConfig[item] = { username: item, blocked: true })
                Object.keys(favoriteUsers || {}).forEach(item => userConfig[item] = { username: item, favored: true })
                await usersConfigCacheAccess.update(data => ({ ...(data || {}), ...userConfig }))

                await searchHiddenSectionsAccess.update(data => ({ ...(data || {}), ...hiddenSections }))

                await GM.deleteValue('favoriteUsers');
                await GM.deleteValue('blockedUsers');
                await GM.deleteValue('hiddenSections');

                await mainConfigAccess.update(async function (mainCfg) {
                    mainCfg.migrateFrom0d0d13 = false;
                    return mainCfg
                })
            });
        }

        if (mainConfig.openIntroAfterUpdate) {
            await safe('版本提示', async () => {
                const lastVersion = (await GM.getValue('last_version')) * 1 || 0;
                if (VERSION_MAJOR > lastVersion) {
                    await GM.setValue('last_version', String(VERSION_MAJOR));
                    try {
                        GM.notification({
                            title: `色花堂强化脚本 已更新 ver.${VERSION_TEXT}`,
                            text: "请参阅功能简介帖"
                        });
                    } catch (ignore) { }
                    if (confirm(`色花堂强化脚本 已更新 ${VERSION_TEXT}，打开功能简介帖？(新页面)`)) {
                        GM.openInTab(UPDATE_NOTE, false);
                    }
                }
            });
        }

        const getUserConfig = async (userId, username, store) => {
            const userConfigStore = typeof store === 'object' && store !== null ? store : await usersConfigCacheAccess.read();
            let userConfig = userConfigStore[userId];
            // 迁移 0.0.13 数据。将在 2025年3月移除。
            if (typeof username === 'string') {
                const legacyUserConfig = userConfigStore[username];
                if (!userConfig && legacyUserConfig) {
                    await usersConfigCacheAccess.update(async data => {
                        data[userId] = data[username]
                        delete data[username];
                        return data;
                    })
                    userConfig = legacyUserConfig;
                }
            }
            return userConfig;
        }

        /**
         * 取当前帖子 tid（原版 init 里引用的 tid 不在作用域内，导致状态永远点不亮）
         */
        const getCurrentTid = () => {
            const m1 = location.search.match(/[?&]tid=(\d+)/);
            if (m1) return m1[1];
            const m2 = location.pathname.match(/thread-(\d+)-/);
            return m2 ? m2[1] : null;
        };

        /**
         * quick jump to important contents
         */
        const elementsToCheck = [
            { // 一键收藏、 取消收藏
                selector: '#k_favorite', text: '⭐️ 收藏',
                init: (btn) => {
                    btn.loading = false;
                    const tid = getCurrentTid();
                    readFavorRecords(favorThreadsCacheAccess)
                        .then(data => {
                            const favid = data && tid && Object_hasOwn(data, tid) ? data[tid] : null;
                            btn.dataset.favid = favid;
                            if (favid) btn.classList.add('ese-active');
                        })
                        .catch(e => ERR('读取收藏缓存失败', e));
                },
                onClick: async (element, tid, btn) => {
                    let favid = btn.dataset.favid * 1;

                    if (btn.loading) return

                    showNativeSpinner();
                    btn.loading = true;

                    if (favid) {
                        let data = await readFavorRecords(favorThreadsCacheAccess);
                        const postData = new FormData();
                        postData.set('formhash', getVerifyHash());
                        postData.set('handlekey', `a_delete_${favid}`);
                        postData.set('deletesubmit', true);
                        await fetch(`home.php?mod=spacecp&ac=favorite&op=delete&favid=${favid}&type=all&inajax=1`, { method: 'POST', body: postData })
                            .then(async () => {
                                btn.dataset.favid = 0;
                                btn.classList.remove('ese-active');
                                delete data[tid];
                                await favorThreadsCacheAccess.write({ data, time: Date.now() });
                                showNativeInfoPopup('删除收藏成功')
                            })
                            .catch(ex => {
                                showNativeWarningPopup('操作出错');
                            })
                            .finally(() => {
                                closeNativeSpinner()
                                btn.loading = false;
                            });
                    } else {
                        fetchGetPage(`home.php?mod=spacecp&ac=favorite&type=thread&id=${tid}&formhash=${encodeURIComponent(getVerifyHash())}&infloat=yes&handlekey=k_favorite&inajax=1&ajaxtarget=fwin_content_k_favorite`, "text/xml")
                            .then(async doc => {
                                const scriptContent = doc.querySelector('root')?.textContent || '';
                                const FAV_SUCCESS_TEXT = '信息收藏成功'
                                const FAV_ALREADY_EXIST_TEXT = '抱歉，您已收藏，请勿重复收藏'
                                if (scriptContent.includes(FAV_ALREADY_EXIST_TEXT)) {
                                    await mainConfigAccess.update(async function (updateUserConfig) {
                                        updateUserConfig.initFavorRecords = true;
                                        return updateUserConfig
                                    })
                                    throw Error("收藏信息过期，正在后台更新数据...")
                                }
                                if (scriptContent.includes(FAV_SUCCESS_TEXT)) {
                                    const match = scriptContent.match(/'id':'(\d+)'[^]*'favid':'(\d+)'/);
                                    if (match) {
                                        showNativeInfoPopup(FAV_SUCCESS_TEXT)
                                        const tid = match[1] * 1;
                                        const favid = match[2] * 1;
                                        await favorThreadsCacheAccess.update(cache => {
                                            if (cache && cache.data) {
                                                cache.data[tid] = favid;
                                                return cache;
                                            }
                                        });

                                        btn.dataset.favid = favid;
                                        btn.classList.add('ese-active');
                                    }
                                } else if (!scriptContent.includes(FAV_ALREADY_EXIST_TEXT)) {
                                    // X3.5 若强化了 formhash 校验，这里会拿到「来路不正确」等提示
                                    ERR('收藏接口返回未知结果（可能是 formhash 失效或被站点拦截）：',
                                        scriptContent.replace(/<[^>]+>/g, ' ').slice(0, 200));
                                    showNativeWarningPopup('收藏失败，请确认已登录后重试');
                                }
                            })
                            .catch(msg => {
                                showNativeWarningPopup(msg && msg.message ? msg.message : msg);
                            })
                            .finally(() => {
                                closeNativeSpinner()
                                btn.loading = false;
                            });
                    }
                }
            },
            { // 快捷评分
                selector: '#ak_rate', text: '👍 评分',
                init: (btn) => {
                    const tid = getCurrentTid();
                    readRatedRecords(ratedThreadsCacheAccess)
                        .then(data => {
                            const rated = data && tid && Object_hasOwn(data, tid) ? data[tid] : null;
                            btn.dataset.rated = rated;
                            if (rated) btn.classList.add('ese-active');
                        })
                        .catch(e => ERR('读取评分缓存失败', e));
                },
                onClick: async (element, tid) => {
                    element.click();
                    observeAlreadyRateForm(async () => {
                        await ratedThreadsCacheAccess.update(cache => {
                            if (cache && cache.data) {
                                cache.data[tid] = true;
                                return cache;
                            }
                        });
                    });
                    observeRateForm();
                    observeLoadingElement(async () => {
                        await ratedThreadsCacheAccess.update(cache => {
                            if (cache && cache.data) {
                                cache.data[tid] = true;
                                return cache;
                            }
                        });
                    });
                }
            },
            { selector: '.locked a[href*="action=pay"]', text: '💰 购买', onClick: (element) => {
                element.click();
                observeLoadingElement()
            }},
            { selector: '.locked a[href*="action=reply"]', text: '🔒 回复', onClick: (element) => element.click() }, // 回复解锁
            { selector: '.blockcode', text: '🧲 链接' },
        ];

        const createQuickButton = (parent, { text, onClick, title, ariaLabel }) => {
            const button = addElem(parent, 'button', 'ese-quick-button', { 'aria-label': ariaLabel })
            button.innerText = text;
            button.title = title;
            if (onClick) button.addEventListener('click', onClick);
            return button;
        };

        const scrollToElement = (element) => {
            const observer = new MutationObserver((mutations, obs) => {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    obs.disconnect();
                }, 800);
            });

            observer.observe(document.body, { childList: true, subtree: true });

            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };

        const buttonContainer = document.createElement('div');
        buttonContainer.className = mainConfig.quickBtnPosition === 'left' ? 'ese-quick-button-container ese-quick-button-container-left' : 'ese-quick-button-container'

        const updateButtonStates = () => {
            if (mainConfig.enableQuickBtn === false) return;
            buttonContainer.innerHTML = ''; // 清空现有按钮，防止重复添加

            const tid = getCurrentTid();

            elementsToCheck.forEach(({ selector, text, onClick, init }) => {
                const element = document.querySelector(selector);
                if (element) {
                    const quickBtn = createQuickButton(buttonContainer, { text, title: element.textContent.trim(), ariaLabel: element.textContent.trim() });

                    quickBtn.addEventListener('click', () => {
                        if (typeof onClick === 'function') {
                            onClick(element, tid, quickBtn)
                        } else {
                            scrollToElement(element);
                        }
                    })

                    if (typeof init === 'function') {
                        init(quickBtn)
                    }
                }
            });

            // 更新附件按钮
            const updateAttachmentButtons = () => {
                const createAndAppendButton = (element) => {
                    createQuickButton(buttonContainer, {
                        text: '📎 附件',
                        title: element.textContent.trim(),
                        ariaLabel: element.textContent.trim(),
                        onClick: () => scrollToElement(element)
                    });
                };

                // 更新常规附件按钮
                document.querySelectorAll('span[id^="attach_"]').forEach(createAndAppendButton);

                // 更新免费附件按钮
                document.querySelectorAll('dl.tattl .tip').forEach(tipElement => {
                    if (tipElement.textContent.includes('点击文件名下载附件')) {
                        createAndAppendButton(tipElement.closest('dl.tattl'));
                    }
                });
            };

            updateAttachmentButtons();
        };

        if (mainConfig.initFavorRecords && myUserId > 0) {
            await safe('初始化收藏记录', () => readFavorRecords(favorThreadsCacheAccess, true, async () => {
                await mainConfigAccess.update(async function (updateUserConfig) {
                    updateUserConfig.initFavorRecords = false;
                    return updateUserConfig
                })
                updateButtonStates()
            }));
        }

        const observeLoadingElement = async (cb) => {
            let loadingElementVisible = false;

            const loadingObserver = new MutationObserver(async (mutations, observer) => {
                const loadingElement = document.querySelector('div[id^="post_"] img[src*="loading.gif"]');

                if (loadingElement && !loadingElementVisible) {
                    loadingElementVisible = true;
                }

                if (!loadingElement && loadingElementVisible) {
                    loadingElementVisible = false;
                    if (typeof cb === 'function') await cb()
                    updateButtonStates();
                    loadingObserver.disconnect();
                }
            });

            loadingObserver.observe(document.body, { childList: true, subtree: true });
        };

        const observeAlreadyRateForm = async (cb) => {
            let clicked = false;
            const rateObserver = new MutationObserver(async (mutations, obs) => {
                const rateForm = document.querySelector('#fwin_content_rate .alert_error');
                if (rateForm?.textContent.includes("您不能对同一个帖子重复评分") && !clicked) {
                    clicked = true;
                    cb && await cb()
                    updateButtonStates();
                    obs.disconnect(); // 停止观察表单
                }
            });
            rateObserver.observe(document.body, { childList: true, subtree: true });
        };

        const observeRateForm = () => {
            const rateObserver = new MutationObserver((mutations, obs) => {
                const rateForm = document.querySelector('#rateform');
                if (rateForm) {
                    const scoreElement = document.querySelector('#scoreoption8 li:first-child');
                    if (scoreElement) {
                        const scoreValue = scoreElement.textContent.trim();
                        const scoreInput = document.querySelector('#score8');
                        if (scoreInput) scoreInput.value = scoreValue;
                    }
                    obs.disconnect(); // 停止观察表单
                }
            });
            rateObserver.observe(document.body, { childList: true, subtree: true });
        };

        // 初次更新按钮状态
        await safe('快捷按钮', async () => {
            updateButtonStates();
            if (buttonContainer.children.length > 0) {
                document.body.appendChild(buttonContainer);
            }
        });

        /**
         * Highlighting favorite users and today's new posts
         */
        const currentUrl = window.location.href;
        const isUserProfilePage = /mod=space&uid=\d+|space-uid-\d+/.test(currentUrl);
        const isPostListPage = /fid=\d+/.test(currentUrl) || /forum-(\d+)-\d+\.html/.test(currentUrl) || !!document.querySelector('.threadlist .n5_htmk');
        const isFavoriteListPage = /&do=favorite.*/.test(currentUrl);

        if (isFavoriteListPage) {
            await safe('收藏列表同步', async () => {
                const rateObserver = new MutationObserver((mutations, obs) => {
                    const confirmDelForm = document.querySelector('form[id^="favoriteform_"]');
                    if (confirmDelForm) {
                        confirmDelForm.addEventListener('submit', () => {
                            favorThreadsCacheAccess.update(cache => {
                                let favId = confirmDelForm.id.match(/favoriteform_(\d+)/)
                                if (favId) {
                                    favId = favId[1]
                                    Object.entries(cache.data || {}).forEach(([key, value]) => {
                                        if (Number(favId) === value) delete cache.data[key]
                                    })
                                }
                                return cache
                            })
                        })
                    }

                    const confirmBatchDelForm = document.querySelector("#delform")
                    if (confirmBatchDelForm) {
                        confirmBatchDelForm.addEventListener('submit', () => {
                            favorThreadsCacheAccess.update(cache => {
                                const favIds = []
                                confirmBatchDelForm.querySelectorAll("li input").forEach(o => { if (o.checked) favIds.push(o.getAttribute('vid')) })
                                favIds.forEach(id => delete cache.data[id])
                                return cache
                            })
                        })
                    }
                });

                rateObserver.observe(document.body, { childList: true, subtree: true });
            });
        }

        const blockUser = async (userId, username, { blockedBtn, favorBtn } = {}) => {
            let toggled = false;
            const userConfig = await getUserConfig(userId);
            if (userConfig?.blocked) {
                if (confirm(`确定取消屏蔽用户 ${username} 吗？`)) {
                    await usersConfigCacheAccess.update(async data => {
                        delete data[userId];
                        return data;
                    })
                    toggled = true;
                    blockedBtn?.toggle(false);
                }
            } else {
                if (confirm(`确定屏蔽用户 ${username} 吗？`)) {
                    await usersConfigCacheAccess.update(async data => {
                        delete data[username]; // 兼容 0.0.13 旧数据
                        data[userId] = { username, blocked: true }
                        return data;
                    })
                    toggled = true;
                    favorBtn?.toggle(false);
                    blockedBtn?.toggle(true);
                }
            }
            return toggled;
        }

        const favorUser = async (userId, username, { blockedBtn, favorBtn } = {}) => {
            let toggled = false;
            const userConfig = await getUserConfig(userId);
            if (userConfig?.favored) {
                if (confirm(`确定取消收藏用户 ${username} 吗？`)) {
                    await usersConfigCacheAccess.update(async data => {
                        delete data[userId];
                        return data;
                    })
                    toggled = true;
                    favorBtn?.toggle(false);
                }
            } else {
                if (confirm(`确定收藏用户 ${username} 吗？`)) {
                    await usersConfigCacheAccess.update(async data => {
                        delete data[username]; // 兼容 0.0.13 旧数据
                        data[userId] = { username, favored: true }
                        return data;
                    })
                    toggled = true;
                    favorBtn?.toggle(true);
                    blockedBtn?.toggle(false);
                }
            }
            return toggled;
        }

        if (isUserProfilePage) {
            await safe('用户资料页按钮', async () => {
                const userProfileElement = document.querySelector('#uhd .mt') || document.querySelector('#uhd h2') || document.querySelector('.hm .mt');
                const userId = extractUidFromURL(currentUrl)

                if (userProfileElement && userId) {
                    const username = userProfileElement.textContent.trim();

                    function createUpdateUserButton(value, cls, textA, textB) {
                        const btn = addElem(userProfileElement, 'button', `ese-quick-button ${cls}`)
                        btn.innerText = value ? textA : textB;
                        btn.style.marginLeft = '10px';
                        btn.toggle = (value) => {
                            btn.innerText = value ? textA : textB;
                        }
                        return btn
                    }

                    const userConfig = await getUserConfig(userId, username);
                    const favorBtn = createUpdateUserButton(userConfig?.favored, 'ese-favorite-button', '取消收藏', '收藏用户');
                    const blockedBtn = createUpdateUserButton(userConfig?.blocked, 'ese-block-button', '取消屏蔽', '屏蔽用户');

                    favorBtn.addEventListener('click', () => favorUser(userId, username, { blockedBtn, favorBtn }));
                    blockedBtn.addEventListener('click', () => blockUser(userId, username, { blockedBtn, favorBtn }));
                }
            });
        }

        const highlightOrHidePost = (postItem, citeEle, userConfig) => {
            if (!citeEle) return;

            if (userConfig?.favored) {
                citeEle.style.fontWeight = 'bold';
                citeEle.style.color = 'dodgerblue'; // Change color to dodgerblue
            }

            if (userConfig?.blocked) {
                postItem.style.display = 'none';
            }
        }

        const highOrHidePostLists = async (scope) => {
            const usersConfigStore = await usersConfigCacheAccess.read();
            const postsList = (scope || document).querySelectorAll('tbody[id^="normalthread_"]')
            postsList.forEach(async postItem => {
                const postElement = postItem.querySelector('tr td.by:nth-child(3)') || postItem.querySelector('td.by');
                if (!postElement) return;
                const citeElement = postElement.querySelector('cite a');
                const topicTimeSpan = postElement.querySelector('span.xi1 span');
                if (!citeElement) return;
                const userId = extractUidFromURL(citeElement.href);
                const userConfig = await getUserConfig(userId, citeElement.textContent.trim(), usersConfigStore);
                highlightOrHidePost(postItem, citeElement, userConfig)
                // Highlight today's new posts
                const today = new Date().toISOString().split('T')[0];
                if (topicTimeSpan && topicTimeSpan.title === today) {
                    topicTimeSpan.style.fontWeight = 'bold';
                }
            })
        };

        const isHomepage = window.location.pathname === '/';

        if (isHomepage) {
            await safe('首页用户高亮', async () => {
                const usersConfigStore = await usersConfigCacheAccess.read();
                const posts = document.querySelectorAll('.dxb_bc li')

                posts.forEach(async post => {
                    const usernameEle = post.querySelector('em a');
                    if (!usernameEle) return;
                    const userId = extractUidFromURL(usernameEle.href);
                    const userConfig = await getUserConfig(userId, usernameEle.textContent.trim(), usersConfigStore);

                    if (userConfig?.favored) {
                        usernameEle.style.fontWeight = 'bold';
                        usernameEle.style.color = 'dodgerblue'; // Change color to dodgerblue
                    }

                    if (userConfig?.blocked) {
                        post.style.display = 'none';
                    }
                })
            });
        }

        if (isPostListPage) {
            await safe('版块列表高亮', async () => {
                // Initial call to highlight already loaded content
                highOrHidePostLists();

                // Use a MutationObserver to handle dynamically loaded content
                const observer = new MutationObserver(throttle(() => {
                    highOrHidePostLists();
                }, 300));

                observer.observe(document.body, { childList: true, subtree: true });
            });
        }

        // X3.5 搜索 URL 已不含 searchmd5（实测：search.php?mod=forum&searchid=...&kw=...&page=4）
        // 改为「路径 + searchid/searchmd5 或 #threadlist 存在」三重判定
        const isSearchPage = /\/search\.php/.test(currentUrl) && (
            /searchmd5=|searchid=/.test(currentUrl) || !!document.querySelector('#threadlist')
        );
        if (isSearchPage) {
            await safe('搜索结果页', async () => {
                const getThreads = (root) => Array.from(root.querySelectorAll('#threadlist .pbw, #threadlist .n5_htmk, .threadlist .n5_htmk'));
                const threadList = getThreads(document);
                if (!threadList.length) return;
                const highOrHideSearchList = async (nodes) => {
                    const usersConfigStore = await usersConfigCacheAccess.read();
                    for (const postItem of nodes) {
                        const citeElement = postItem.querySelector('p:nth-child(4) span a') || postItem.querySelector('.n5_mktbmc a[href*="uid="], span a[href*="uid="]');
                        if (!citeElement) continue;
                        const userId = extractUidFromURL(citeElement.href);
                        const userConfig = await getUserConfig(userId, citeElement.textContent.trim(), usersConfigStore);
                        highlightOrHidePost(postItem, citeElement, userConfig);
                    }
                };
                const sectionMap = new Map();
                const querySectionLink = (thread, fid) => {
                    const link = thread.querySelector(fid ? `a[href*="fid=${fid}"], a[href^="forum-${fid}"]` : 'a[href*="fid="], a[href^="forum-"]');
                    if (!link) return null;
                    const url = new URL(link.href);
                    const fidValue = fid || url.searchParams.get('fid') || url.pathname.match(/forum-(\d+)-\d+\.html/)?.[1];
                    return fidValue ? { sectionLink: link, fid: fidValue, sectionName: link.textContent.trim() } : null;
                };
                const processThread = (thread) => {
                    const link = querySectionLink(thread);
                    if (link) {
                        if (!sectionMap.has(link.fid)) sectionMap.set(link.fid, { name: link.sectionName, elements: [] });
                        sectionMap.get(link.fid).elements.push(thread);
                    }
                };
                const applyFilterToNewThreads = async (newThreads) => {
                    const hidden = await searchHiddenSectionsAccess.read();
                    for (const thread of newThreads) {
                        const link = querySectionLink(thread);
                        if (link && hidden[link.fid]) thread.style.display = 'none';
                    }
                };
                const updateFilterButtons = async () => {
                    const hidden = await searchHiddenSectionsAccess.read();
                    for (const [fid, section] of sectionMap) {
                        const existing = filterContainer.querySelector(`.ese-filter-button[data-fid="${fid}"]`);
                        if (existing) {
                            existing.querySelector('.ese-filter-button-count').textContent = section.elements.length <= 99 ? section.elements.length : '99+';
                            existing.classList.toggle('ese-hidden', !!hidden[fid]);
                        } else await addFilterSectionButton(section, fid);
                    }
                };
                const addFilterSectionButton = async (section, fid) => {
                    const hidden = await searchHiddenSectionsAccess.read();
                    const button = addElem(filterContainer, 'a', 'ese-filter-button');
                    button.textContent = section.name; button.dataset.fid = fid;
                    button.classList.toggle('ese-hidden', !!hidden[fid]);
                    button.addEventListener('click', throttle(async () => {
                        await searchHiddenSectionsAccess.update(async data => {
                            data[fid] = !data[fid]; button.classList.toggle('ese-hidden', data[fid]);
                            section.elements.forEach(thread => { thread.style.display = data[fid] ? 'none' : ''; }); return data;
                        });
                    }, 300, { trailing: false }));
                    insertBeforeElem(button, 'span', 'ese-filter-button-count').textContent = section.elements.length;
                };
                let isLoading = false, lastLoadedTime = Date.now(), finished = false;
                const nextLink = () => document.querySelector('.pg a.nxt, .page a.nxt, a.nxt');
                const sentinel = addElem(document.body, 'div'); sentinel.style.height = '1px';
                const filterContainer = addElem(document.body, 'div', 'ese-filter-container');
                const loadNextPage = async () => {
                    if (isLoading || finished) return;
                    const next = nextLink();
                    if (!next) { finished = true; loadNextPageObserver.disconnect(); sentinel.remove(); return; }
                    isLoading = true;
                    const indicator = createLoadingIndicator('加载中...');
                    const waitTime = Math.max(0, LOAD_TIME_LIMIT - (Date.now() - lastLoadedTime));
                    try {
                        await sleep(waitTime);
                        const doc = await fetchGetPage(next.href);
                        const errorMessage = doc.querySelector('#messagetext.alert_error')?.textContent || '';
                        if (errorMessage.includes('刷新过于频繁')) { showNativeWarningPopup('翻页过快，请稍后下拉重试'); return; }
                        const newThreads = getThreads(doc);
                        if (!newThreads.length) { finished = true; loadNextPageObserver.disconnect(); sentinel.remove(); return; }
                        const listWrap = document.querySelector('#threadlist ul') || document.querySelector('#threadlist') || document.querySelector('.threadlist');
                        for (const thread of newThreads) { thread.classList.add('ese-fade-in'); listWrap?.appendChild(thread); processThread(thread); }
                        const newPagination = doc.querySelector('.pgs.cl.mbm, .pg, .page');
                        const pagination = document.querySelector('.pgs.cl.mbm, .pg, .page');
                        if (pagination && newPagination) pagination.replaceWith(newPagination);
                        await highOrHideSearchList(newThreads);
                        if (mainConfig.enableSectionFilterSearch) { await applyFilterToNewThreads(newThreads); await updateFilterButtons(); }
                        document.body.appendChild(sentinel);
                    } catch (e) { ERR('搜索自动翻页失败', e); }
                    finally { isLoading = false; lastLoadedTime = Date.now(); indicator.remove(); }
                };
                const loadNextPageObserver = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) loadNextPage(); }, { root: null, rootMargin: '50% 0px', threshold: 0 });
                await highOrHideSearchList(threadList);
                if (mainConfig.enableSectionFilterSearch) { threadList.forEach(processThread); await applyFilterToNewThreads(threadList); await updateFilterButtons(); }
                if (mainConfig.enableAutoPaginationSearch) loadNextPageObserver.observe(sentinel);
            });
        }

        if (mainConfig.enableSortByDateline === true) {
            await safe('按时间排序', async () => {
                /** section links default sort by datetime */
                const setCustomSectionLink = () => {
                    document.body.addEventListener('click', event => {
                        const link = event.target.closest('a[href*="forum.php?mod=forumdisplay"], a[href*="forum-"]');
                        if (!link) return;

                        event.preventDefault();
                        let url = new URL(link.href, window.location.origin);
                        let target = link.getAttribute('target') || '_self';

                        if (url.pathname.includes('forum.php')) {
                            if (!url.searchParams.get("orderby")) {
                                url.searchParams.set('filter', 'author')
                                url.searchParams.set('orderby', 'dateline')
                            }
                        } else if (url.pathname.match(/forum-\d+-\d+\.html/)) {
                            const fid = url.pathname.split('-')[1];
                            url = new URL(`/forum.php?mod=forumdisplay&fid=${fid}&filter=author&orderby=dateline`, window.location.origin);
                        }

                        window.open(url, target);
                    });
                    document.querySelectorAll('a[rel*="forum.php?mod=forumdisplay"]').forEach(nxt => { // next page
                        let url = new URL(nxt.rel, window.location.origin);
                        if (!url.searchParams.get("orderby")) url.searchParams.set('orderby', 'dateline');
                        nxt.setAttribute('rel', url)
                    })
                }
                setCustomSectionLink()
            });
        }

        const isThreadPage = /(?:[?&]tid=\d+|\/thread-\d+-)/.test(currentUrl);
        if (isThreadPage) {
            await safe('帖子页用户按钮', async () => {
                const seen = new Set();
                const posts = Array.from(document.querySelectorAll('table[id^=pid], .plc'));
                for (const thread of posts) {
                    const userInfoEle = thread.querySelector('div[id^=favatar] .authi a') || thread.querySelector('.n5_nrhyxx a[href*="uid="], .n5_nrytb a[href*="uid="], .authi a[href*="uid="]');
                    if (!userInfoEle || thread.querySelector('.ese-thread-userinfo-button')) continue;
                    const userId = extractUidFromURL(userInfoEle.href);
                    const username = userInfoEle.textContent.trim();
                    if (!userId || seen.has(thread)) continue;
                    seen.add(thread);
                    const userConfig = await getUserConfig(userId, username);
                    if (userConfig?.favored) { userInfoEle.style.fontWeight = 'bold'; userInfoEle.style.color = 'dodgerblue'; }
                    if (userConfig?.blocked) { thread.style.display = 'none'; }
                    const userInfoContainer = thread.querySelector('div[id^=favatar] .authi') || thread.querySelector('.n5_nrhyxx, .n5_nrytb, .authi');
                    if (userInfoContainer) {
                        const favorUserBtn = addElem(userInfoContainer, 'a', 'ese-thread-userinfo-button');
                        favorUserBtn.textContent = userConfig?.favored ? ' 🔖' : ' ➕'; favorUserBtn.title = '收藏用户';
                        favorUserBtn.addEventListener('click', async () => { if (await favorUser(userId, username)) location.reload(); });
                        const blockUserBtn = addElem(userInfoContainer, 'a', 'ese-thread-userinfo-button');
                        blockUserBtn.textContent = userConfig?.blocked ? ' ↩️' : ' 🚫'; blockUserBtn.title = '屏蔽用户';
                        blockUserBtn.addEventListener('click', async () => { if (await blockUser(userId, username)) location.reload(); });
                    }
                }
            });
        }

        const initConfigPanel = () => {
            /** 插件配置页 */
            const isEnhancerPanel = /&ac=enhancer/.test(currentUrl);
            const enhancerUrl = 'home.php?mod=spacecp&ac=enhancer';
            const CONFIG_PANEL_NAME = "增强插件"

            const renderConfigForm = () => {
                const uselessElements = document.querySelectorAll("#ct #frame_profile, #ct form[target='frame_profile']")
                uselessElements.forEach(ele => ele.remove())
                const configPanel = document.querySelector("#ct .bm.bw0") || document.querySelector("#ct .bm") || document.querySelector("#ct")
                if (!configPanel) return;
                const configList = addElem(configPanel, 'div', "ese-config-panel-container")
                const introItem = addElem(configList, 'dt', 'ese-config-item-lv1 ese-config-item-checked');
                addElem(introItem, 'a', 'ese-intro-link', { href: INTRO_POST, target: '_blank' }).textContent = '🔗 捷径: 功能简介帖';
                putCheckBoxItem('新功能更新后 自动打开更新说明', 'openIntroAfterUpdate', 2);
                addElem(configList, 'dt', 'ese-config-item-sep ese-config-item-lv1').textContent = '论坛设置';

                const quickBtnItem = putCheckBoxItem('在读帖时添加快捷按钮', 'enableQuickBtn');
                addElem(configList, 'dt', 'ese-config-item-tip ese-config-item-lv2').textContent = '💡 阅读帖子时的快捷按钮（一键收藏、快捷评分、滚动到附件等）';
                addElem(quickBtnItem, 'span').textContent = '🔹位置 ';

                const quickBtnPosSelect = addElem(quickBtnItem, 'select');
                addElem(quickBtnPosSelect, 'option', null, { value: 'left' }).textContent = '页面左侧';
                addElem(quickBtnPosSelect, 'option', null, { value: 'right' }).textContent = '页面右侧';
                quickBtnPosSelect.value = mainConfig.quickBtnPosition;
                quickBtnPosSelect.value = quickBtnPosSelect.value || 'right';
                quickBtnPosSelect.addEventListener('change', () => {
                    configPanel.classList.add('ese-config-saving');
                    mainConfigAccess.update(function(updatingUserConfig) {
                        updatingUserConfig.quickBtnPosition = quickBtnPosSelect.value;
                        return updatingUserConfig;
                    })
                    .finally(function() {
                        configPanel.classList.remove('ese-config-saving');
                        window.location.reload();
                    });
                });

                putCheckBoxItem('帖子按时间排序', 'enableSortByDateline');
                addElem(configList, 'dt', 'ese-config-item-tip ese-config-item-lv2').textContent = '💡 板块内帖子按时间排序（默认关闭。目前仅支持全部开启或全部关闭，后续将支持按常用分区配置）';

                addElem(configList, 'dt', 'ese-config-item-sep ese-config-item-lv1').textContent = '搜索设置';
                putCheckBoxItem('板块筛选', 'enableSectionFilterSearch');
                addElem(configList, 'dt', 'ese-config-item-tip ese-config-item-lv2').textContent = '💡 按板块隐藏不想看的帖子';
                putCheckBoxItem('自动翻页', 'enableAutoPaginationSearch');

                async function renderUserList(heading, listClass, filterKey, clickIconText, confirmMessage) {
                    const listHeading = addElem(configList, 'h5', null, { style: 'line-height:32px;' });
                    addElem(listHeading, 'span').textContent = heading;
                    addElem(listHeading, 'span', null, { style: 'font-weight:normal' }).textContent = ` 点击${clickIconText}移除`;

                    const userListBlock = addElem(configList, 'dt', listClass);
                    const userItemComparator = comparator('username');
                    const usersConfigStore = await usersConfigCacheAccess.read();

                    Object.entries(usersConfigStore)
                        .filter(entry => entry[1] && entry[1][filterKey])
                        .sort((et1, et2) => userItemComparator(et1[1], et2[1]))
                        .forEach(entry => {
                            const userId = entry[0];
                            const { username: userNickName } = entry[1];
                            const userTag = addElem(userListBlock, 'span', 'ese-user-tag', { title: userNickName });
                            userListBlock.appendChild(document.createTextNode(' '));
                            const userTagIcon = addElem(userTag, 'span', 'ese-user-tag-icon');

                            const userLink = addElem(userTag, 'a', null, {
                                href: !isNaN(Number(userId)) ?
                                  `home.php?mod=space&uid=${userId}` :
                                  `home.php?mod=spacecp&ac=search&username=${userId}&searchsubmit=yes`, // 兼容 0.0.13 旧数据
                                target: '_blank'
                            });
                            userLink.textContent = userNickName;

                            userTagIcon.addEventListener('click', function() {
                                if (confirm(`${confirmMessage} (${userNickName})？`)) {
                                    configPanel.classList.add('ese-config-saving');
                                    usersConfigCacheAccess.update(data => {
                                        delete data[userId];
                                        userTag.remove();
                                        return data;
                                    });
                                }
                            });
                        });
                }

                addElem(configList, 'dt', 'ese-config-item-sep ese-config-item-lv1').textContent = '用户管理';
                renderUserList('收藏用户管理', 'ese-nickname-list', 'favored', '🔖', '取消收藏');
                renderUserList('屏蔽用户管理', 'ese-user-blacklist', 'blocked', '🚫', '取消屏蔽');

                function putCheckBoxItem(label, propertyNameOrAccessor, level, inverted) {
                    let propertyAccess;
                    if (typeof propertyNameOrAccessor === 'string') {
                        propertyAccess = {
                            get() {
                                return !!mainConfig[propertyNameOrAccessor];
                            },
                            update(newValue) {
                                return mainConfigAccess.update(function(updatingUserConfig) {
                                    updatingUserConfig[propertyNameOrAccessor] = newValue;
                                    return updatingUserConfig;
                                });
                            }
                        };
                    } else {
                        propertyAccess = propertyNameOrAccessor;
                    }
                    const configItem = addElem(configList, 'dt', `ese-config-item-lv${level||1}`);
                    const checkboxLabel = addElem(configItem, 'label');
                    const checkbox = addElem(checkboxLabel, 'input', null, { type: 'checkbox' });
                    checkboxLabel.appendChild(document.createTextNode(' ' + label));
                    checkbox.checked = propertyAccess.get();
                    updateStyle();
                    function updateStyle() {
                        const checkedValue = !inverted; // when inverted false is considered checked
                        if (checkbox.checked === checkedValue) {
                            configItem.classList.add('ese-config-item-checked');
                        } else {
                            configItem.classList.remove('ese-config-item-checked');
                        }
                    }
                    checkbox.addEventListener('change', async function() {
                        configPanel.classList.add('ese-config-saving');
                        const newValue = checkbox.checked;
                        propertyAccess.update(newValue)
                            .finally(function() {
                                configPanel.classList.remove('ese-config-saving');
                                updateStyle();
                            });
                    });
                    return configItem;
                }

            }

            const sideTab = document.querySelector("#ct .tbn ul") || document.querySelector("#ct .tbn")
            if (!sideTab) return
            const newLi = addElem(sideTab, "li")
            const newLink = addElem(newLi, "a", "", { href: enhancerUrl });
            newLink.textContent = CONFIG_PANEL_NAME

            if (isEnhancerPanel) {
                const panelTitleEle = document.querySelector("#ct .tb.cl a") || document.querySelector("#ct .tb a") || document.querySelector("#ct .tb h2")
                if (!panelTitleEle) return
                panelTitleEle.innerText = CONFIG_PANEL_NAME
                panelTitleEle.href = enhancerUrl

                const breadcrumbEle = document.querySelector("#pt .z");
                if (breadcrumbEle) {
                    breadcrumbEle.innerHTML = breadcrumbEle.innerHTML.replace(/个人资料/g, CONFIG_PANEL_NAME);
                }

                const sideTabLi = document.querySelectorAll("#ct .tbn ul li")
                sideTabLi.forEach(li => {
                    const a = li.querySelector('a');
                    if (!a) return;
                    if (a.href.includes(enhancerUrl)) {
                        li.classList.add('a')
                    } else {
                        li.classList.remove('a')
                    }
                })
                renderConfigForm()
            }
        }

        const isSpacePage = /\/home\.php\?mod=spacecp.*/.test(currentUrl);
        if (isSpacePage) {
            await safe('设置面板', async () => initConfigPanel());
        }
    }
})();

//============= utils =============//

let verifyhashCache = null;
/**
 * X3.5 修复：页面全局 verifyhash 为 null（探针实测），
 * 改为「全局变量 → formhash 隐藏域(属性/property 双查) → meta → 内联脚本正则」四级取值。
 */
function getVerifyHash() {
    if (verifyhashCache) return verifyhashCache;

    // 1) 页面全局变量（X3.4 常见，X3.5 可能为 null）
    try {
        if (W && W.verifyhash) return (verifyhashCache = String(W.verifyhash));
    } catch (ignore) { }

    // 2) formhash 隐藏域：属性与 property 都试（X3.5 可能由 JS 后赋值）
    const field = document.querySelector('input[name="formhash"]');
    if (field && field.value) return (verifyhashCache = field.value);

    // 3) meta 兜底
    const metaHash = document.querySelector('meta[name="formhash"]');
    if (metaHash && metaHash.content) return (verifyhashCache = metaHash.content);

    // 4) 内联脚本里挖
    const patterns = [
        /verifyhash\s*=\s*['"]([0-9a-zA-Z]{8})['"]/,
        /formhash\s*=\s*['"]([0-9a-zA-Z]{8})['"]/,
        /hash\s*=\s*['"]?([0-9a-zA-Z]{8})['"]?/,
    ];
    for (const scriptElement of document.querySelectorAll('script:not([src])')) {
        const text = scriptElement.textContent || '';
        for (const re of patterns) {
            const m = text.match(re);
            if (m) return (verifyhashCache = m[1]);
        }
    }

    ERR('取不到 formhash / verifyhash，收藏与评分请求可能被站点拒绝');
    return '';
}

function comparator(prop, reversed) {
    const reverser = reversed ? -1 : 1;
    return (x, y) => {
        const xv = typeof prop === 'function' ? prop(x) : prop ? x[prop] : x;
        const yv = typeof prop === 'function' ? prop(y) : prop ? y[prop] : y;
        return xv > yv ? reverser : xv < yv ? -reverser : 0;
    };
}

function extractUidFromURL(url) {
    const pattern = /uid=(\d+)|space-uid-(\d+)\.html/;
    const match = String(url || '').match(pattern);
    if (match) {
        const uid = match[1] || match[2];
        return Number(uid);
    }
    return null;
}

// polyfill replacement
function Object_hasOwn(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

function showNativeSpinner(anchor) {
    try {
        W.showloading();
    } catch (ignore) { }
}
function closeNativeSpinner() {
    try {
        W.showloading('none');
    } catch (ignore) { }
}
function showNativeWarningPopup(msg) {
    try {
        W.errorhandle_k_favorite(msg, {})
    } catch (ignore) {
        alert(msg);
    }
}
function showNativeInfoPopup(msg) {
    try {
        W.showDialog(msg, 'right', null, null, 0, null, null, null, null, 2, null)
    } catch (ignore) {
        console.log('[98强化]', msg);
    }
}

async function fetchGetPage(url, docType, autoRetry) {
    const resp = await fetch(url, {
        method: 'GET',
        mode: 'same-origin',
        credentials: 'same-origin',
        cache: 'no-cache'
    });

    if (!resp.ok) {
        throw new Error('网络或登入错误');
    }
    const content = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, docType || 'text/html');
    if (autoRetry) {
        if ((findErrorMessage(doc) || '').includes('刷新过于频繁')) {
            await sleep(LOAD_TIME_LIMIT);
            return await fetchGetPage(url, docType, false);
        }
    }
    return doc;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function findErrorMessage(doc) {
    let err = doc.querySelector('#messagetext.alert_error');
    return err ? err.textContent.trim() || '不明错误' : null;
}

function addElem(parent, tag, styleClass, attrs) {
    const elem = newElem(tag, styleClass, attrs);
    parent.appendChild(elem);
    return elem;
}

function insertBeforeElem(parent, tag, styleClass, attrs) {
    const elem = newElem(tag, styleClass, attrs);
    parent.insertBefore(elem, parent?.firstChild);
    return elem;
}

function newElem(tag, styleClass, attrs) {
    const elem = document.createElement(tag);
    if (styleClass) {
        styleClass.split(' ').forEach(function(cls) {
            elem.classList.add(cls);
        });
    }
    if (attrs) {
        for (let name of Object.keys(attrs)) {
            elem.setAttribute(name, attrs[name]);
        }
    }
    return elem;
}

function addModalMask() {
    return addElem(document.body, 'div', 'ese-dialog-modal-mask');
}

function createPopupMenu(popupId, anchor, rightAligned, verticallyInverted) {
    function computeStyle(hShift) {
        if (anchor) {
            const bounds = anchor.getClientRects()[0];
            const left = bounds.x + hShift;
            if (verticallyInverted) {
                return 'opacity: 0.95; left: ' + left.toFixed(0) + 'px; z-index: 3000; visibility: visible; top: ' + (bounds.top + document.documentElement.scrollTop).toFixed(0) + 'px; transform: translateY(-100%);';
            } else {
                return 'opacity: 0.95; left: ' + left.toFixed(0) + 'px; z-index: 3000; visibility: visible; top: ' + (bounds.height + bounds.top + document.documentElement.scrollTop).toFixed(0) + 'px;';
            }
        } else {
            return 'position: fixed; opacity: 0.95; left: calc(50vw - 400px); z-index: 3000; visibility: visible; top: 10vh';
        }

    }
    const menuElem = addElem(document.body, 'div', 'menu ese-common-popup-menu', {
        id: popupId,
        style: computeStyle(0)
    });

    // just copy-n-paste from site, lol
    menuElem.innerHTML = `<div class="bor" style="padding:13px 30px"><img src="images/loading.gif" align="absbottom"> 正在加载数据...</div>`;

    return {
        renderContent(renderer) {
            menuElem.innerHTML = '';
            const borElem = addElem(menuElem, 'div', 'bor');
            renderer(borElem);
            if (rightAligned) {
                menuElem.setAttribute('style', computeStyle(-menuElem.getClientRects()[0].width));
            }
        }
    };
}

async function setupPopupMenu(config) {
    const menuConfig = {
        title: '',
        width: 120,
        popupMenuId: '',
        anchor: null,
        rightAligned: false,
        verticallyInverted: false,
        onClose: () => {},
        items: [] // [ { label, class, action } ]
    };
    Object.assign(menuConfig, config);

    const modelMask = addModalMask();
    const popupMenu = createPopupMenu(menuConfig.popupMenuId, menuConfig.anchor, menuConfig.rightAligned, menuConfig.verticallyInverted);
    function close() {
        modelMask.remove();
        closePopupMenu(menuConfig.popupMenuId);
        menuConfig.onClose();
    }
    modelMask.addEventListener('click', () => close());

    popupMenu.renderContent(async function(borElem) {
        const tableElem = addElem(borElem, 'table', null, {
            width: `${menuConfig.width}`,
            cellspacing: '0',
            cellpadding: '0'
        });

        const tbodyElem = addElem(tableElem, 'tbody');
        const trElem1 = addElem(tbodyElem, 'tr');
        const thElem1_1 = addElem(trElem1, 'th', 'h');
        const frElem1 = addElem(thElem1_1, 'span', 'fr', {
            style: 'margin-top:2px;cursor:pointer'
        });
        frElem1.addEventListener('click', () => close());
        addElem(frElem1, 'img', null, {
            src: 'images/close.gif'
        });
        thElem1_1.appendChild(document.createTextNode(menuConfig.title));

        function addButton(item) {
            const trElem = addElem(tbodyElem, 'tr');
            const tdElem = addElem(trElem, 'td', item.cellClass||null);
            const button = addElem(tdElem, 'a', item.class||null);
            button.textContent = item.label;
            if (item.action == null) {
                // nothing
            } else if (typeof item.action === 'string') {
                button.setAttribute('href', item.action);
                if (item.target) {
                    button.setAttribute('target', item.target);
                }
            } else {
                button.setAttribute('href', 'javascript:');
                button.addEventListener('click', () => {
                    close();
                    setTimeout(() => item.action());
                    return false;
                });
            }
            return button;
        }
        menuConfig.items.forEach(item => {
            addButton(item);
        });
    });
}

function closePopupMenu(popupId) {
    const menu = document.getElementById(popupId);
    if (menu) {
        menu.remove();
    }
}

/**
 * Minified by jsDelivr using Terser v5.19.2.
 * Original file: /npm/lodash.throttle@4.1.1/index.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
var FUNC_ERROR_TEXT="Expected a function",NAN=NaN,symbolTag="[object Symbol]",reTrim=/^\s+|\s+$/g,reIsBadHex=/^[-+]0x[0-9a-f]+$/i,reIsBinary=/^0b[01]+$/i,reIsOctal=/^0o[0-7]+$/i,freeParseInt=parseInt,freeGlobal="object"==typeof global&&global&&global.Object===Object&&global,freeSelf="object"==typeof self&&self&&self.Object===Object&&self,root=freeGlobal||freeSelf||Function("return this")(),objectProto=Object.prototype,objectToString=objectProto.toString,nativeMax=Math.max,nativeMin=Math.min,now=function(){return root.Date.now()};function debounce(t,e,n){var r,i,o,a,u,f,c=0,l=!1,b=!1,s=!0;if("function"!=typeof t)throw new TypeError(FUNC_ERROR_TEXT);function v(e){var n=r,o=i;return r=i=void 0,c=e,a=t.apply(o,n)}function m(t){var n=t-f;return void 0===f||n>=e||n<0||b&&t-c>=o}function y(){var t=now();if(m(t))return j(t);u=setTimeout(y,function(t){var n=e-(t-f);return b?nativeMin(n,o-(t-c)):n}(t))}function j(t){return u=void 0,s&&r?v(t):(r=i=void 0,a)}function g(){var t=now(),n=m(t);if(r=arguments,i=this,f=t,n){if(void 0===u)return function(t){return c=t,u=setTimeout(y,e),l?v(t):a}(f);if(b)return u=setTimeout(y,e),v(f)}return void 0===u&&(u=setTimeout(y,e)),a}return e=toNumber(e)||0,isObject(n)&&(l=!!n.leading,o=(b="maxWait"in n)?nativeMax(toNumber(n.maxWait)||0,e):o,s="trailing"in n?!!n.trailing:s),g.cancel=function(){void 0!==u&&clearTimeout(u),c=0,r=f=i=u=void 0},g.flush=function(){return void 0===u?a:j(now())},g}function throttle(t,e,n){var r=!0,i=!0;if("function"!=typeof t)throw new TypeError(FUNC_ERROR_TEXT);return isObject(n)&&(r="leading"in n?!!n.leading:r,i="trailing"in n?!!n.trailing:i),debounce(t,e,{leading:r,maxWait:e,trailing:i})}function isObject(t){var e=typeof t;return!!t&&("object"==e||"function"==e)}function isObjectLike(t){return!!t&&"object"==typeof t}function isSymbol(t){return"symbol"==typeof t||isObjectLike(t)&&objectToString.call(t)==symbolTag}function toNumber(t){if("number"==typeof t)return t;if(isSymbol(t))return NAN;if(isObject(t)){var e="function"==typeof t.valueOf?t.valueOf():t;t=isObject(e)?e+"":e}if("string"!=typeof t)return 0===t?t:+t;t=t.replace(reTrim,"");var n=reIsBinary.test(t);return n||reIsOctal.test(t)?freeParseInt(t.slice(2),n?2:8):reIsBadHex.test(t)?NAN:+t};


/* 98 强化 · iOS 触屏适配（不覆盖原脚本设置） */
(function () {
  'use strict';
  function isAd(a) {
    return a && (a.closest('.show-text,.show-text3,.show-text4,[class*="show-text"],.n5_tbxj') ||
      a.matches('.js-appJump,.js-randomBg'));
  }
  function clearAds() {
    document.querySelectorAll('.show-text,.show-text3,.show-text4,[class*="show-text"],.n5_tbxj').forEach(function (e) {
      if (!e.closest('.ese-config-panel')) e.style.setProperty('display', 'none', 'important');
    });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!isAd(a)) return;
    e.preventDefault(); e.stopImmediatePropagation();
  }, true);
  document.addEventListener('submit', function (e) {
    if (e.target.closest('.show-text,.show-text3,.show-text4,[class*="show-text"],.n5_tbxj')) {
      e.preventDefault(); e.stopImmediatePropagation();
    }
  }, true);
  window.open = function (url) {
    if (url && String(url).indexOf('javascript:') !== 0) location.href = url;
  };
  var style = document.createElement('style');
  style.textContent = `
/* 原脚本桌面布局不改；仅适配 App 的 iPhone 视口 */
@media only screen and (max-width: 820px) {
  .ese-quick-button-container, .ese-quick-button-container.ese-quick-button-container-left {
    position: fixed !important; left: 12px !important; right: 12px !important; top: auto !important;
    bottom: calc(78px + env(safe-area-inset-bottom)) !important;
    z-index: 2147482000; display: flex; flex-direction: row; flex-wrap: nowrap;
    gap: 7px; max-width: none; max-height: 48px; padding: 5px; margin: 0;
    overflow-x: auto; overflow-y: hidden; border: 1px solid rgba(0,0,0,.06);
    border-radius: 15px; background: rgba(255,255,255,.95);
    box-shadow: 0 5px 20px rgba(0,0,0,.13); -webkit-backdrop-filter: blur(15px);
  }
  .ese-quick-button-container::-webkit-scrollbar { display:none; }
  .ese-quick-button-container > .ese-quick-button {
    flex: 0 0 auto; min-width: 62px !important; min-height: 36px; margin: 0 !important;
    padding: 5px 9px; border-radius: 10px; font: 600 13px/1.2 -apple-system,"PingFang SC",sans-serif;
    text-align: center; background: #f4f5f7; color: #353a45;
  }
  .ese-quick-button.ese-active { outline: none !important; background: #fff1cf !important; color: #a46900; }
  .ese-quick-button.ese-active:after { display: none; }
  .ese-filter-container {
    left: 12px !important; right: 12px !important; top: auto !important;
    bottom: calc(80px + env(safe-area-inset-bottom)); z-index: 2147482000;
    width: auto !important; max-height: 52px; padding: 5px; overflow-x: auto; overflow-y: hidden;
    flex-direction: row; flex-wrap: nowrap; border-radius: 14px; background: rgba(255,255,255,.96);
    box-shadow: 0 4px 20px #0002; scrollbar-width: none;
  }
  .ese-filter-button { flex: 0 0 auto; margin: 2px !important; padding: 8px 9px 8px 30px !important; border-radius: 8px; }
  .ese-loading-indicator { bottom: calc(142px + env(safe-area-inset-bottom)); right: 16px; }
  .ese-config-panel-container { padding: 4px 4px 26px; font-size: 16px; line-height: 1.65; }
  .ese-config-list { margin: 0; }
  .ese-config-list > dt { margin-top: 13px; }
  .ese-config-list input[type=checkbox] { width: 20px; height: 20px; vertical-align: -4px; margin-right: 5px; }
  .ese-config-list select { font-size: 15px; min-height: 34px; }
  .ese-user-tag { min-width: 8em; max-width: 11em; line-height: 38px; }
  .ese-thread-userinfo-button { visibility: visible !important; opacity: .9 !important; display: inline-block; padding: 5px; font-size: 15px; }
  .ese-config-panel .ese-intro-link { display: inline-block; line-height: 34px; }
}
#__pp_bar .__pp_btn { -webkit-user-select: none; user-select: none; cursor: pointer; }
html.__sht_settings #__pp_bar { display: none !important; }
`;
  (document.head || document.documentElement).appendChild(style);

  var settingsOpen = false;
  function toggleSettings() {
    var old = document.getElementById('__sht_settings'); if (old) { old.remove(); settingsOpen = false; return; }
    settingsOpen = true;
    var uid = -1;
    try { var m = Array.from(document.scripts).map(function (s) { return s.textContent; }).join('\n').match(/discuz_uid\s*=\s*['"](\d+)['"]/); if (m) uid = m[1]; } catch (_) {}
    function load(k, d) { try { var v = localStorage.getItem('sht98.v1:' + k + '#' + uid); return v ? Object.assign({}, d, JSON.parse(v)) : Object.assign({}, d); } catch (_) { return Object.assign({}, d); } }
    var cfg = load('98_main_config', { openIntroAfterUpdate: true, enableQuickBtn: true, quickBtnPosition: 'right', enableSortByDateline: false, enableAutoPaginationSearch: true, enableSectionFilterSearch: true });
    var users = load('98_users_config', {});
    var panel = document.createElement('div'); panel.id = '__sht_settings';
    panel.style.cssText = 'position:fixed;inset:0;z-index:2147483500;background:#f4f5f7;color:#20242b;overflow-y:auto;font:16px/1.55 -apple-system,"PingFang SC",sans-serif;padding:0 16px calc(36px + env(safe-area-inset-bottom));box-sizing:border-box';
    var head = document.createElement('div'); head.style.cssText = 'position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;background:rgba(244,245,247,.96);padding:16px 0 12px;font-weight:600;z-index:1';
    head.innerHTML = '<span>98 强化设置 <small style="font-weight:400;color:#9297a1">0.2.4</small></span>';
    var close = document.createElement('button'); close.textContent = '完成'; close.style.cssText = 'border:0;background:#292d35;color:#fff;border-radius:18px;padding:8px 17px;font-size:14px';
    close.onclick = function () { panel.remove(); settingsOpen = false; }; head.appendChild(close); panel.appendChild(head);
    function card(title) { var c = document.createElement('section'); c.style.cssText = 'background:#fff;padding:6px 16px;border-radius:15px;margin:12px 0'; if (title) { var h = document.createElement('h3'); h.textContent = title; h.style.cssText = 'font-size:13px;color:#9095a0;margin:10px 0 5px'; c.appendChild(h); } panel.appendChild(c); return c; }
    function toggle(parent, label, key, help) {
      var row = document.createElement('label'); row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:51px;border-bottom:1px solid #f0f1f3';
      var text = document.createElement('span'); text.textContent = label; row.appendChild(text);
      var input = document.createElement('input'); input.type = 'checkbox'; input.checked = !!cfg[key]; input.style.cssText = 'width:22px;height:22px;accent-color:#c2185b;flex:0 0 auto'; row.appendChild(input); parent.appendChild(row);
      if (help) { var tip = document.createElement('div'); tip.textContent = help; tip.style.cssText = 'font-size:12px;color:#9a9fa9;padding:8px 0 12px'; parent.appendChild(tip); }
      input.onchange = function () { cfg[key] = input.checked; try { localStorage.setItem('sht98.v1:98_main_config#' + uid, JSON.stringify(cfg)); } catch (_) {} };
    }
    var reading = card('帖子与浏览');
    toggle(reading, '在读帖时添加快捷按钮', 'enableQuickBtn', '收藏、评分、购买、回复、磁力和附件。修改后刷新生效。');
    toggle(reading, '帖子按时间排序', 'enableSortByDateline');
    toggle(reading, '自动打开功能更新说明', 'openIntroAfterUpdate');
    var search = card('搜索');
    toggle(search, '板块筛选', 'enableSectionFilterSearch', '点击筛选按钮，可隐藏指定板块的搜索结果。');
    toggle(search, '搜索自动翻页', 'enableAutoPaginationSearch');
    function userCard(kind, title) {
      var c = card(title), keys = Object.keys(users).filter(function (k) { return users[k] && users[k][kind]; });
      if (!keys.length) { var empty = document.createElement('p'); empty.textContent = '暂无记录'; empty.style.color = '#9297a1'; c.appendChild(empty); }
      keys.forEach(function (k) { var row = document.createElement('div'); row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;min-height:48px;border-bottom:1px solid #f0f1f3';
        var name = document.createElement('span'); name.textContent = users[k].username || k; row.appendChild(name);
        var del = document.createElement('button'); del.textContent = '移除'; del.style.cssText = 'border:0;background:#f3f4f6;color:#c2185b;padding:6px 12px;border-radius:9px';
        del.onclick = function () { delete users[k]; try { localStorage.setItem('sht98.v1:98_users_config#' + uid, JSON.stringify(users)); } catch (_) {} row.remove(); };
        row.appendChild(del); c.appendChild(row);
      });
    }
    userCard('favored', '收藏用户管理'); userCard('blocked', '屏蔽用户管理');
    var about = card(''); about.style.cssText += ';text-align:center;color:#9297a1;font-size:13px;padding:16px'; about.textContent = '功能基于附件的 98 强化 0.2.4。设置仅保存在本机当前网站域名。';
    document.body.appendChild(panel);
  }
  function boot() {
    clearAds();
    var bar = document.getElementById('__pp_bar');
    if (bar && !bar.querySelector('[data-k="settings"]')) {
      var b = document.createElement('div'); b.className = '__pp_btn'; b.dataset.k = 'settings';
      b.innerHTML = '<span class="__pp_ic">⚙</span><span class="__pp_lb">设置</span>';
      b.addEventListener('click', toggleSettings);
      bar.appendChild(b);
    }
  }
  function dynamic() {
    try { clearAds(); } catch (_) {}
    try {
      var old = document.getElementById('__sht_mobile_dynamic');
      if (old) return;
      var script = document.createElement('script'); script.id = '__sht_mobile_dynamic';
      (document.body || document.documentElement).appendChild(script);
      /* 原脚本对桌面 table 做一次性处理；此处只补处理新出现的手机楼层 */
      var seen = new WeakSet();
      var run = async function () {
        if (!/(?:[?&]tid=\d+|\/thread-\d+-)/.test(location.href)) return;
        var prefix = 'sht98.v1:', uid = -1;
        try {
          var text = Array.from(document.scripts).map(function(s) { return s.textContent; }).join('\n');
          var m = text.match(/discuz_uid\s*=\s*['"](\d+)['"]/); if (m) uid = m[1];
        } catch (_) {}
        var store = {};
        try { store = JSON.parse(localStorage.getItem(prefix + '98_users_config#' + uid) || '{}'); } catch (_) {}
        document.querySelectorAll('.plc').forEach(function (post) {
          if (seen.has(post)) return; seen.add(post);
          var author = post.querySelector('.n5_nrhyxx a[href*="uid="], .n5_nrytb a[href*="uid="], .authi a[href*="uid="]');
          if (!author || author.closest('.ese-thread-userinfo-button')) return;
          var m = author.href.match(/uid=(\d+)|space-uid-(\d+)/); if (!m) return;
          var id = m[1] || m[2], cfg = store[id];
          if (cfg && cfg.favored) { author.style.fontWeight = 'bold'; author.style.color = 'dodgerblue'; }
          if (cfg && cfg.blocked) post.style.display = 'none';
          var host = post.querySelector('.n5_nrhyxx, .n5_nrytb, .authi');
          if (!host || host.querySelector('.ese-thread-userinfo-button')) return;
          [['➕','收藏', 'favored'], ['🚫','屏蔽', 'blocked']].forEach(function (item) {
            var a = document.createElement('a'); a.className = 'ese-thread-userinfo-button';
            a.textContent = ' ' + item[0]; a.title = item[1] + '用户';
            a.addEventListener('click', function () {
              cfg = store[id] || {};
              var active = !!cfg[item[2]];
              if (!confirm('确定' + (active ? '取消' : '') + item[1] + '用户 ' + (cfg.username || author.textContent.trim()) + ' 吗？')) return;
              if (active) delete cfg[item[2]]; else { cfg.username = author.textContent.trim(); cfg[item[2]] = true; }
              if (!cfg.favored && !cfg.blocked) delete store[id]; else store[id] = cfg;
              try { localStorage.setItem(prefix + '98_users_config#' + uid, JSON.stringify(store)); } catch (_) {}
              location.reload();
            }); host.appendChild(a);
          });
        });
      };
      var timer;
      new MutationObserver(function () { clearTimeout(timer); timer = setTimeout(run, 700); })
        .observe(document.body, { childList: true, subtree: true });
    } catch (_) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { boot(); dynamic(); });
  else { boot(); dynamic(); }
})();
