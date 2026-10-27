/*!
 * youtube-live.js
 * Owncast 主题 youtube-live.css 的配套脚本
 *
 * 作用:
 *   emoji-mart 的 em-emoji-picker 在 Shadow DOM 内, 页面 CSS 无法命中.
 *   本脚本在 picker 的 shadowRoot 出现后注入样式, 修正:
 *     1. .scroll 的滚动条占位与右侧 padding
 *     2. #preview 预览区: emoji 缩小居中, 文字右移且不压到 emoji
 *     3. 网格 cell (button.flex) 里 emoji 的 line-height 偏移
 *     4. 自定义 emoji 的 <img> 尺寸
 *
 * 目录:
 *   01 Shadow DOM 样式表
 *   02 注入单个 / 批量注入
 *   03 等待 shadowRoot 的重试
 *   04 监听新增 picker
 *   05 启动
 *
 * 顶栏、用户菜单、聊天栏由 CSS 负责; 本脚本只处理 emoji picker.
 *
 * 版本: 5.1 (2026-10)
 */
(() => {
  if (window.__ytEmojiFixInstalled) {
    return;
  }
  window.__ytEmojiFixInstalled = true;

  /* 01. Shadow DOM 样式表 --------------------------------------------------- */
  const STYLE_ID = 'oc-emoji-fix';

  const SHADOW_CSS = [
    /* 滚动条: 隐藏并把腾出的空间还给内容 */
    '.scroll{scrollbar-width:none!important;padding-right:12px!important}',
    '.scroll::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}',

    /* 预览条: 透明底, emoji 居中, 文字右移 */
    '#preview{display:flex!important;align-items:center!important;gap:10px!important;padding:0 6px!important}',
    '#preview>div{flex:1 1 auto!important;min-width:0!important}',
    '#preview .flex-auto.flex-middle.flex-center{flex:0 0 40px!important;width:40px!important;height:40px!important;display:flex!important;align-items:center!important;justify-content:center!important;background:transparent!important;border-radius:8px!important;overflow:hidden!important}',
    '#preview .emoji-mart-emoji{width:36px!important;height:36px!important;display:flex!important;align-items:center!important;justify-content:center!important;line-height:1!important;margin:0!important}',
    '#preview .emoji-mart-emoji>span{display:block!important;width:30px!important;height:30px!important;line-height:30px!important;font-size:30px!important;text-align:center!important}',
    '#preview .emoji-mart-emoji>img{width:30px!important;height:30px!important;max-width:30px!important;max-height:30px!important;object-fit:contain!important}',

    /* 文本块: emoji-mart 5.x LTR 下是 .margin-l + .padding-r */
    '#preview .margin-l,#preview .margin-r{flex:1 1 auto!important;min-width:0!important}',
    '#preview .margin-l{margin-left:10px!important}',
    '#preview .margin-r{margin-right:10px!important}',
    '#preview .padding-l,#preview .padding-r{padding:0!important}',
    '#preview .preview-title,#preview .preview-subtitle{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;line-height:1.4!important}',

    /* 网格 cell: 24px emoji 在 36px 按钮内居中 */
    'button.flex.flex-center.flex-middle{line-height:0!important;padding:0!important}',
    'button.flex.flex-center.flex-middle .emoji-mart-emoji{width:100%!important;height:100%!important;display:flex!important;align-items:center!important;justify-content:center!important;line-height:0!important}',
    'button.flex.flex-center.flex-middle .emoji-mart-emoji>span{display:block!important;line-height:1!important;font-size:24px!important}',
    'button.flex.flex-center.flex-middle .emoji-mart-emoji>img{max-width:24px!important;max-height:24px!important}',

    /* 兜底 */
    '.emoji-mart-emoji{line-height:1!important}',
    '.emoji-mart-emoji>span{display:block!important;line-height:1!important}',
  ].join('');

  /* 02. 注入单个 / 批量注入 ------------------------------------------------ */
  const injectPicker = (picker) => {
    const root = picker.shadowRoot;

    if (!root || root.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = SHADOW_CSS;
    root.appendChild(style);
  };

  const injectAll = () => {
    document.querySelectorAll('em-emoji-picker').forEach((picker) => {
      injectPicker(picker);
    });
  };

  const hasPendingPicker = () =>
    Array.prototype.some.call(
      document.querySelectorAll('em-emoji-picker'),
      (picker) => !picker.shadowRoot || !picker.shadowRoot.getElementById(STYLE_ID),
    );

  /* 03. 等待 shadowRoot 的重试 --------------------------------------------- */
  let retryTimer = null;
  let retryCount = 0;

  const retryPending = () => {
    if (retryTimer !== null) {
      return;
    }

    retryTimer = window.setTimeout(() => {
      retryTimer = null;
      injectAll();

      if (!hasPendingPicker()) {
        retryCount = 0;
        return;
      }

      if (retryCount < 30) {
        retryCount += 1;
        retryPending();
      } else {
        retryCount = 0;
      }
    }, 100);
  };

  /* 04. 监听新增 picker ----------------------------------------------------- */
  const observer = new MutationObserver((mutations) => {
    let pickerAdded = false;

    for (let i = 0; i < mutations.length; i += 1) {
      const added = mutations[i].addedNodes;

      for (let j = 0; j < added.length; j += 1) {
        const node = added[j];
        if (node.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }

        if (
          node.matches('em-emoji-picker') ||
          (node.querySelector && node.querySelector('em-emoji-picker'))
        ) {
          pickerAdded = true;
          break;
        }
      }

      if (pickerAdded) {
        break;
      }
    }

    if (!pickerAdded) {
      return;
    }

    retryCount = 0;
    injectAll();

    if (hasPendingPicker()) {
      retryPending();
    }
  });

  /* 05. 启动 --------------------------------------------------------------- */
  observer.observe(document.documentElement, { childList: true, subtree: true });

  /* 首次加载时可能已经有 picker (例如 DevTools 里重复执行) */
  injectAll();

  if (hasPendingPicker()) {
    retryPending();
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        injectAll();
      },
      { once: true },
    );
  }
})();
