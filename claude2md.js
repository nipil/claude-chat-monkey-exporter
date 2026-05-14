// ==UserScript==
// @name         Claude Export to Markdown
// @namespace    local
// @version      0.2.18
// @description  Export current Claude conversation to a Markdown file by intercepting Claude's own Copy buttons.
// @match        https://claude.ai/*
// @grant        GM_registerMenuCommand
// @grant        GM_download
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  /********************************************************************
   * Helpers
   ********************************************************************/

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function sanitizeFilename(s) {
    return s
      .replace(/[<>:"/\\|?*]+/g, '_')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getConversationTitle() {
    const h1 = document.querySelector('h1');
    if (h1 && h1.textContent.trim()) {
      return h1.textContent.trim();
    }

    const title = document.title
      .replace(/\s*\|\s*Claude\s*$/i, '')
      .trim();

    return title || 'Claude Conversation';
  }

  function getDateStamp() {
    const d = new Date();

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  }

  function downloadMarkdown(filename, content) {
    const blob = new Blob([content], {
      type: 'text/markdown;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);

    GM_download({
      url,
      name: filename,
      saveAs: true,
      onload: () => {
        URL.revokeObjectURL(url);
      }
    });
  }

  /********************************************************************
   * Preload all messages by scrolling bottom to top
   ********************************************************************/

  async function preloadAllMessages() {
    console.log('[Claude Export] Preloading messages...');

    const scrollContainer = document.querySelector('[data-autoscroll-container="true"]');

    if (!scrollContainer) {
      console.warn('[Claude Export] Could not find scroll container');
      return;
    }

    // Start at the bottom
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
    await sleep(300);

    let lastHeight = scrollContainer.scrollHeight;
    let attempts = 0;
    const maxAttempts = 1000;

    while (attempts < maxAttempts) {
      // Scroll up
      scrollContainer.scrollTop -= 100;
      await sleep(500);

      const currentHeight = scrollContainer.scrollHeight;

      console.log(`[Claude Export] Preload attempt ${attempts + 1}: height = ${currentHeight}`);

      // If we've reached the top or height hasn't changed, we're done
      if (scrollContainer.scrollTop === 0 || currentHeight === lastHeight) {
        console.log('[Claude Export] Preload complete');
        break;
      }

      lastHeight = currentHeight;
      attempts++;
    }

    // Return to bottom after preload
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
    await sleep(300);
  }

  /********************************************************************
   * Expand collapsed user messages ("Show more")
   ********************************************************************/

  async function expandAllShowMore() {
    const buttons = [...document.querySelectorAll('button')]
      .filter(b => b.textContent.trim() === 'Show more');

    for (const b of buttons) {
      b.click();
      await sleep(150);
    }
  }

  /********************************************************************
   * Find Claude copy buttons
   ********************************************************************/

  function getCopyButtons() {
    return [...document.querySelectorAll(
      'button[data-testid="action-bar-copy"]'
    )];
  }

  /********************************************************************
   * Intercept Claude's own navigator.clipboard.writeText()
   ********************************************************************/

  async function captureClaudeCopy(button) {
    return new Promise((resolve, reject) => {
      const clipboard = navigator.clipboard;
      const original = clipboard.writeText;

      let captured = null;

      function restore() {
        try {
          clipboard.writeText = original;
        } catch (_) { }
      }

      try {
        clipboard.writeText = async function (text) {
          captured = text;
          return Promise.resolve();
        };
      } catch (err) {
        reject(
          new Error(
            'Could not patch navigator.clipboard.writeText'
          )
        );
        return;
      }

      button.click();

      setTimeout(() => {
        restore();

        if (captured) {
          resolve(captured);
        } else {
          // DUMMY marker that it timed-out (i do not seem to be handle the error upstream)
          resolve(null);
        }
      }, 400);
    });
  }

  /********************************************************************
   * Main export
   ********************************************************************/

  async function exportConversation() {
    try {
      console.log('[Claude Export] Starting...');

      await preloadAllMessages();

      await expandAllShowMore();

      const buttons = getCopyButtons();

      if (!buttons.length) {
        alert('No Claude copy buttons found.');
        return;
      }

      console.log(
        `[Claude Export] Found ${buttons.length} copy buttons`
      );

      const parts = [];

      for (let i = 0; i < buttons.length; i++) {
        console.log(
          `[Claude Export] Capturing ${i + 1}/${buttons.length}`
        );

        const md = await captureClaudeCopy(buttons[i]);

        if (!md) {
          console.warn(
            `[Claude Export] Skipping ${i + 1}/${buttons.length}`
          );
          continue;
        }

        parts.push(md.trim());
        await sleep(250);
      }

      const title = getConversationTitle();

      const finalMd =
        `# ${title}

> Exported from Claude.ai on ${new Date().toISOString()}

---

${parts.join('\n\n---\n\n')}
`;

      const filename =
        sanitizeFilename(
          `${getDateStamp()} - ${title}.md`
        );

      downloadMarkdown(filename, finalMd);

      console.log('[Claude Export] Done.');
    } catch (err) {
      console.error(err);
      alert('Export failed: ' + err.message);
    }
  }

  /********************************************************************
   * Tampermonkey menu
   ********************************************************************/

  if (typeof GM_registerMenuCommand !== 'undefined') {
    GM_registerMenuCommand(
      'Export conversation to Markdown',
      exportConversation
    );
  }

})();