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
/* ============================================================
   PakePlus 移动端界面优化补丁  (injected by custom.js)
   —— 目标：把桌面论坛页面变成顺手好用的手机 App 界面
   ============================================================ */
(function () {
  if (window.__ppMobileUI) return;
  window.__ppMobileUI = true;

  var CSS = [
    /* 1. 基础：禁止自动缩放 / 横向溢出 / 触控高亮 */
    'html{-webkit-text-size-adjust:100%!important;text-size-adjust:100%!important;scroll-behavior:smooth}',
    'body{overflow-x:hidden!important;-webkit-font-smoothing:antialiased;background:#f5f6f8}',
    '*{-webkit-tap-highlight-color:transparent}',

    /* 2. 媒体自适应：图片不撑破屏幕，正文图带圆角 */
    'img,video,canvas,iframe{max-width:100%!important}',
    '.t_f img,.postmessage img,.post_content img,.message img,.plc img,.pl img,.entry-content img{height:auto!important;border-radius:10px;display:block;margin:8px auto}',
    /* 头像/表情之类的小图保持原样 */
    '.avatar img,.avt img,.smiley img,.emoji img,.face img,.icon img,em img,.e img{border-radius:50%;display:inline-block!important;margin:0!important}',

    /* 3. 表格/代码：可横向滚动，不破版 */
    'table{max-width:100%!important}',
    'pre,code{white-space:pre-wrap!important;word-break:break-word!important}',
    'pre{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:10px}',

    /* 4. 排版：字号/行高更耐看，段落留白 */
    'body,.t_f,.postmessage,.post_content,.plc,.message{font-size:16px;line-height:1.7}',
    '.t_f p,.postmessage p,.post_content p{margin:0 0 0.85em}',
    '.t_f h1,.t_f h2,.t_f h3,.postmessage h1,.postmessage h2,.postmessage h3{line-height:1.4;margin:1em 0 .5em}',
    'blockquote{border-left:3px solid #d8dbe0;padding:.4em .8em;margin:.8em 0;color:#666;background:#fafbfc;border-radius:0 8px 8px 0}',

    /* 5. 列表：卡片化 + 触摸友好 */
    '#threadlist li,.threadlist li,.trow,.tl li,.bm_c li{border-radius:12px}',
    '.threadlist a,.trow a{min-height:44px}',
    'a,button,input,select,textarea{touch-action:manipulation}',

    /* 6. 顶部导航：吸顶 + 投影 */
    '#hd,#top,.header{position:sticky!important;top:0;z-index:9999;backdrop-filter:saturate(180%) blur(12px)}',
    '#hd,#top,.header{box-shadow:0 1px 0 rgba(0,0,0,.06),0 2px 12px rgba(0,0,0,.04)}',

    /* 7. 底部固定条避开 Home 指示条 */
    '.fixed-bottom,.bottom-bar,.tabbar,.footer-fixed{padding-bottom:env(safe-area-inset-bottom)!important}',

    /* 8. 去掉桌面版固定宽度容器 */
    '#wp,.wp,#wrap,.wrap,.container,.ct2_a{max-width:100%!important;width:auto!important}',

    /* 9. 广告 / 浮动挡屏元素 */
    '[id^="ad_"],[id*="_ad_"],[class^="ad-"],[class*=" ad-"],.adsbygoogle,ins.adsbygoogle,' +
    'iframe[src*="ads"],iframe[src*="cpro"],.ad-float,.float-ad,.pull-ad,.gg,.ggtop,.advert{display:none!important}',

    /* 10. 回到顶部按钮 */
    '#__pp_top{position:fixed;right:16px;bottom:calc(24px + env(safe-area-inset-bottom));width:44px;height:44px;border-radius:22px;' +
    'background:rgba(22,22,24,.72);color:#fff;display:none;align-items:center;justify-content:center;font-size:20px;' +
    'z-index:99999;backdrop-filter:blur(8px);box-shadow:0 4px 16px rgba(0,0,0,.22);opacity:0;transition:opacity .2s}',
    '#__pp_top.show{display:flex;opacity:1}'
  ].join('');

  function inject() {
    try {
      // viewport 修正：保证 1:1 显示且不出现横向滚动
      var vp = document.querySelector('meta[name="viewport"]');
      if (!vp) {
        vp = document.createElement('meta');
        vp.name = 'viewport';
        document.head.appendChild(vp);
      }
      vp.setAttribute('content',
        'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover');

      var style = document.createElement('style');
      style.id = '__pp_mobile_ui';
      style.textContent = CSS;
      document.head.appendChild(style);

      // 图片懒加载
      var imgs = document.querySelectorAll('img:not([loading])');
      for (var i = 0; i < imgs.length; i++) {
        var im = imgs[i];
        im.setAttribute('decoding', 'async');
        if (i > 3) im.setAttribute('loading', 'lazy');
      }

      // target=_blank 在 WebView 里会开新窗口导致点不动 → 改为当前页跳转
      document.addEventListener('click', function (e) {
        var a = e.target;
        while (a && a.tagName !== 'A') a = a.parentElement;
        if (!a) return;
        var href = a.getAttribute('href');
        if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0) return;
        if (a.target === '_blank' || a.getAttribute('target') === '_blank') {
          e.preventDefault();
          location.href = a.href;
        }
      }, true);
      // 回到顶部
      var btn = document.createElement('div');
      btn.id = '__pp_top';
      btn.innerHTML = '&#8593;';
      btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      document.body.appendChild(btn);
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var y = window.pageYOffset || document.documentElement.scrollTop;
          btn.classList.toggle('show', y > 600);
          ticking = false;
        });
      }, { passive: true });
    } catch (err) {
      console.warn('[pp-ui]', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
