/*!
 * youtube-live.js
 * Owncast 主题 youtube-live.css 的配套脚本
 *
 * 作用:
 *   1. emoji-mart 的 em-emoji-picker 在 Shadow DOM 内, 页面 CSS 无法命中.
 *      本脚本在 picker 的 shadowRoot 出现后注入样式, 修正:
 *        - .scroll 的滚动条占位与右侧 padding
 *        - #preview 预览区: emoji 缩小居中, 文字右移且不压到 emoji
 *        - 网格 cell (button.flex) 里 emoji 的 line-height 偏移
 *        - 自定义 emoji 的 <img> 尺寸
 *   2. 顶栏用户菜单左侧注入 Auto / Dark / Light 主题切换按钮.
 *        - Auto: 移除 <html data-theme>, 跟随系统 prefers-color-scheme.
 *        - Dark / Light: 写入 <html data-theme="dark|light">.
 *        - 选择保存在 localStorage (yt-theme-mode), 刷新后保持.
 *        - 没有 .global-header 时回退到左下角浮动按钮.
 *
 * 目录:
 *   01 Shadow DOM 样式表
 *   02 注入单个 / 批量注入
 *   03 等待 shadowRoot 的重试
 *   04 监听新增 picker
 *   05 启动
 *   06 主题切换
 *
 * 顶栏、用户菜单、聊天栏由 CSS 负责; 本脚本处理 emoji picker 和主题切换.
 *
 * 版本: 5.3 (2026-10)
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

/* 06. 主题切换 --------------------------------------------------------------- */
(() => {
  if (window.__ytThemeToggleInstalled) {
    return;
  }
  window.__ytThemeToggleInstalled = true;

  const STORAGE_KEY = 'yt-theme-mode';
  const MODES = ['auto', 'dark', 'light'];
  const LABELS = { auto: 'Auto', dark: 'Dark', light: 'Light' };
  const ICONS = {
    auto: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
    dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 15.3A8.7 8.7 0 0 1 8.7 3.6a9 9 0 1 0 11.7 11.7z" fill="currentColor"/></svg>',
    light:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/></g></svg>',
  };

  const readSavedMode = () => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return MODES.includes(saved) ? saved : null;
    } catch (e) {
      return null;
    }
  };

  const saveMode = (mode) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {
      /* localStorage 不可用时只在当前页面生效 */
    }
  };

  const applyMode = (mode) => {
    const root = document.documentElement;

    if (mode === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', mode);
    }
  };

  const init = () => {
    /* 只有带第 21 节按钮样式的主题 CSS (v5.2+) 才创建按钮 */
    const themeReady = getComputedStyle(document.documentElement)
      .getPropertyValue('--yt-theme-toggle-ready')
      .trim();

    if (themeReady !== '1' || document.getElementById('yt-theme-toggle')) {
      return;
    }

    const saved = readSavedMode();
    const attr = document.documentElement.getAttribute('data-theme');
    const initial = saved || (attr === 'dark' || attr === 'light' ? attr : 'auto');

    let mode = initial;

    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'yt-theme-toggle';
    button.className = 'yt-theme-toggle';

    const icon = document.createElement('span');
    icon.className = 'yt-theme-toggle__icon';

    const label = document.createElement('span');
    label.className = 'yt-theme-toggle__label';

    button.appendChild(icon);
    button.appendChild(label);

    const render = () => {
      icon.innerHTML = ICONS[mode];
      label.textContent = LABELS[mode];

      const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      const text = `Theme: ${LABELS[mode]}. Click for ${LABELS[next]}.`;
      button.setAttribute('aria-label', text);
      button.title = text;
    };

    const setMode = (nextMode, persist) => {
      mode = MODES.includes(nextMode) ? nextMode : 'auto';
      applyMode(mode);

      if (persist) {
        saveMode(mode);
      }

      render();
    };

    button.addEventListener('click', () => {
      const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      setMode(next, true);
    });

    /* 先把已保存的模式应用到 <html>, 再插入按钮 */
    setMode(initial, false);

    const header = document.querySelector('.global-header');

    if (!header) {
      /* 兜底: 没有顶栏的页面仍用左下角浮动按钮 */
      button.classList.add('yt-theme-toggle--floating');
      document.body.appendChild(button);
      return;
    }

    const directChildOfHeader = (el) => {
      let item = el;

      while (item && item.parentElement && item.parentElement !== header) {
        item = item.parentElement;
      }

      return item && item.parentElement === header ? item : null;
    };

    const getRightItem = () => {
      const offline = header.querySelector('#owncast-chat-offline-text');
      if (offline) {
        const item = directChildOfHeader(offline);
        if (item && item !== button) {
          return item;
        }
      }

      const menu = header.querySelector('#user-menu');
      if (menu) {
        const item = directChildOfHeader(menu);
        if (item && item !== button) {
          return item;
        }
      }

      return null;
    };

    const place = () => {
      const rightItem = getRightItem();

      if (rightItem) {
        if (button.parentElement !== header || button.nextElementSibling !== rightItem) {
          header.insertBefore(button, rightItem);
        }
      } else if (button.parentElement !== header) {
        header.appendChild(button);
      }

      /* 和用户信息按钮保持同高 */
      const menu = header.querySelector('#user-menu');
      if (menu) {
        const height = Math.round(menu.getBoundingClientRect().height);
        if (height > 0) {
          button.style.height = `${height}px`;
        }
      }
    };

    place();

    /* React 重新渲染 Header 时把按钮补回去, 并跟随用户菜单/离线文字移动 */
    const headerObserver = new MutationObserver(() => place());
    headerObserver.observe(header, { childList: true });
    window.addEventListener('resize', place);
  };

  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  }
})();

