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
