(function () {
  "use strict";
  var DATA = window.CC;
  var ASSET_BASE = "claude-connect/assets/screens/";

  var state = {
    tabId: DATA.tabs[0].id,
    stepIndex: 0,
    applied: {}, // itemId -> true once a write item has been confirmed
  };

  var stageEl = document.getElementById("cc-stage");
  var tabsEl = document.getElementById("cc-tabs");

  function currentTab() {
    return DATA.tabs.filter(function (t) { return t.id === state.tabId; })[0];
  }
  function currentItem() {
    return currentTab().items[state.stepIndex];
  }

  /* ---------------- tabs ---------------- */
  function renderTabs() {
    tabsEl.innerHTML = "";
    DATA.tabs.forEach(function (tab) {
      var btn = document.createElement("button");
      btn.className = "cc-tab-btn" + (tab.id === state.tabId ? " active" : "");
      var icon =
        tab.device === "mobile"
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="13" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>';
      btn.innerHTML = icon + "<span>" + tab.label + "</span>";
      btn.addEventListener("click", function () {
        if (state.tabId === tab.id) return;
        state.tabId = tab.id;
        state.stepIndex = 0;
        renderTabs();
        renderStage();
      });
      tabsEl.appendChild(btn);
    });
  }

  /* ---------------- stage ---------------- */
  function renderStage() {
    var tab = currentTab();
    var item = currentItem();
    stageEl.innerHTML = "";

    var stage = document.createElement("div");
    stage.className = "cc-stage";

    // left column
    var leftCol = document.createElement("div");
    leftCol.innerHTML =
      '<div class="cc-col-label claude"><span class="dot"></span>Claude ' +
      (tab.device === "mobile" ? "Mobile" : "Desktop") +
      "</div>";
    var claudeShell =
      tab.device === "mobile" ? buildClaudePhone(item, tab) : buildClaudeDesktop(item, tab);
    leftCol.appendChild(claudeShell);

    // right column
    var rightCol = document.createElement("div");
    rightCol.innerHTML =
      '<div class="cc-col-label sf"><span class="dot"></span>Salesforce (this org, live)</div>';
    var sfShell = buildSfPane(item);
    rightCol.appendChild(sfShell);

    stage.appendChild(leftCol);
    stage.appendChild(rightCol);
    stageEl.appendChild(stage);

    // run entrance behaviors
    requestAnimationFrame(function () {
      if (item.artifact) animateBars(claudeShell);
      if (item.sf.highlights) animateHighlights(sfShell, item.sf.highlights);
      if (item.kind === "write" && state.applied[item.id]) {
        // already applied earlier in this session -> show after state immediately
        showAfterState(sfShell, true);
      }
    });
  }

  /* ---------------- step controls (shared) ---------------- */
  function buildStepControls(tab) {
    var wrap = document.createElement("div");
    wrap.className = "cc-step-controls";

    var back = document.createElement("button");
    back.className = "cc-nav-btn";
    back.innerHTML = "\u2190 Back";
    back.disabled = state.stepIndex === 0;
    back.addEventListener("click", function () {
      if (state.stepIndex > 0) {
        state.stepIndex--;
        renderStage();
      }
    });

    var dots = document.createElement("div");
    dots.className = "cc-dots";
    tab.items.forEach(function (it, i) {
      var d = document.createElement("span");
      d.className = "cc-step-dot" + (i === state.stepIndex ? " active" : "");
      d.addEventListener("click", function () {
        state.stepIndex = i;
        renderStage();
      });
      dots.appendChild(d);
    });

    var next = document.createElement("button");
    next.className = "cc-nav-btn primary";
    var isLast = state.stepIndex === tab.items.length - 1;
    next.innerHTML = isLast ? "Restart \u21bb" : "Next \u2192";
    next.addEventListener("click", function () {
      state.stepIndex = isLast ? 0 : state.stepIndex + 1;
      renderStage();
    });

    wrap.appendChild(back);
    wrap.appendChild(dots);
    wrap.appendChild(next);
    return wrap;
  }

  /* ---------------- claude message building blocks ---------------- */
  function buildUserMsg(item) {
    var div = document.createElement("div");
    div.className = "cc-msg user";
    var voiceTag = item.voice
      ? '<div class="cc-voice-tag">\u25CF Spoken</div>'
      : "";
    div.innerHTML =
      (item.voice
        ? '<div style="display:flex;flex-direction:column;align-items:flex-end;">' + voiceTag
        : "") +
      '<div class="bubble">' + escapeHtml(item.prompt) + "</div>" +
      (item.voice ? "</div>" : "");
    return div;
  }

  function buildAssistantText(text, delayMs) {
    var div = document.createElement("div");
    div.className = "cc-msg assistant";
    div.style.animationDelay = (delayMs || 0) + "ms";
    div.innerHTML =
      '<div class="text"><span class="cc-asterisk">\u2726</span>' + escapeHtml(text) + "</div>";
    return div;
  }

  function buildArtifact(artifact) {
    var box = document.createElement("div");
    box.className = "cc-artifact";
    var rows = artifact.bars
      .map(function (b) {
        return (
          '<div class="cc-bar-row">' +
          '<div class="cc-bar-label">' + escapeHtml(b.label) + "</div>" +
          '<div class="cc-bar-track"><div class="cc-bar-fill" data-pct="' +
          Math.round((b.value / b.max) * 100) +
          '"></div></div>' +
          '<div class="cc-bar-val">' + b.value + "d</div>" +
          "</div>"
        );
      })
      .join("");
    box.innerHTML = '<div class="cc-artifact-title">' + escapeHtml(artifact.title) + "</div>" + rows;
    return box;
  }

  function buildProposal(item, onApplied) {
    var p = item.proposal;
    var card = document.createElement("div");
    card.className = "cc-proposal";

    var changeRows = p.changes
      .map(function (c) {
        if (c.from) {
          return (
            '<div class="cc-change-row"><span class="cc-change-field">' +
            escapeHtml(c.field) +
            '</span><span class="cc-change-from">' +
            escapeHtml(c.from) +
            '</span><span class="cc-change-arrow">\u2192</span><span class="cc-change-to">' +
            escapeHtml(c.to) +
            "</span></div>"
          );
        }
        return (
          '<div class="cc-change-row"><span class="cc-change-field">' +
          escapeHtml(c.field) +
          '</span><span class="cc-change-to">' +
          escapeHtml(c.to) +
          "</span></div>"
        );
      })
      .join("");

    var alreadyApplied = !!state.applied[item.id];

    card.className = "cc-proposal" + (alreadyApplied ? " done" : "");
    card.innerHTML =
      '<div class="cc-proposal-head">Proposed update \u00b7 not yet saved</div>' +
      '<div class="cc-proposal-summary">' + escapeHtml(p.summary) + "</div>" +
      changeRows +
      '<div class="cc-proposal-q">' + escapeHtml(p.question) + "</div>" +
      '<div class="cc-proposal-actions">' +
      '<button class="cc-btn-yes">Yes, apply</button>' +
      '<button class="cc-btn-no">Not now</button>' +
      "</div>" +
      (alreadyApplied
        ? '<div class="cc-applied-pill">\u2713 Applied to Salesforce</div>'
        : "");

    if (!alreadyApplied) {
      card.querySelector(".cc-btn-yes").addEventListener("click", function () {
        state.applied[item.id] = true;
        card.classList.add("done");
        card.innerHTML += '<div class="cc-applied-pill">\u2713 Applied to Salesforce</div>';
        var followup = buildAssistantText(item.replyAfter, 150);
        card.parentNode.appendChild(followup);
        if (onApplied) onApplied();
      });
      card.querySelector(".cc-btn-no").addEventListener("click", function () {
        card.style.opacity = "0.5";
        card.querySelector(".cc-proposal-actions").innerHTML =
          '<span style="font-size:12px;color:var(--claude-text-soft);font-weight:700;">Dismissed \u2014 no changes made.</span>';
      });
    } else {
      // re-render: show the followup text immediately since already applied
      requestAnimationFrame(function () {
        var followup = buildAssistantText(item.replyAfter, 0);
        card.parentNode.appendChild(followup);
      });
    }

    return card;
  }

  /* ---------------- claude desktop pane ---------------- */
  function buildClaudeDesktop(item, tab) {
    var shell = document.createElement("div");
    shell.className = "cc-claude-shell";
    shell.innerHTML =
      '<div class="cc-win-bar">' +
      '<span class="cc-win-dot r"></span><span class="cc-win-dot y"></span><span class="cc-win-dot g"></span>' +
      '<div class="cc-win-title"><span class="spark">\u2726</span> Claude</div>' +
      "</div>";

    var body = document.createElement("div");
    body.className = "cc-claude-body";
    body.appendChild(
      htmlToEl(
        '<div class="cc-claude-logo-row">' +
          '<div class="cc-claude-logo">\u2726</div>' +
          '<div><div class="cc-claude-name">Claude</div><div class="cc-claude-sub">Connected to Salesforce \u00b7 USG Water</div></div>' +
          "</div>"
      )
    );
    body.appendChild(buildUserMsg(item));
    if (item.reply) body.appendChild(buildAssistantText(item.reply));
    if (item.artifact) body.appendChild(buildArtifact(item.artifact));
    if (item.kind === "write") body.appendChild(buildProposal(item, onProposalApplied(shell, item)));

    body.appendChild(buildStepControls(tab));
    shell.appendChild(body);
    return shell;
  }

  /* ---------------- claude mobile pane ---------------- */
  function buildClaudePhone(item, tab) {
    var shell = document.createElement("div");
    shell.className = "cc-claude-shell cc-phone-wrap";
    shell.innerHTML =
      '<div class="cc-phone"><div class="cc-phone-screen">' +
      '<div class="cc-notch"></div>' +
      '<div class="cc-status-bar"><span>9:41</span><span>\u25CF\u25CF\u25CF \u25CB 100%</span></div>' +
      '<div class="cc-phone-app-bar"><span style="color:var(--claude-accent);font-weight:900;">\u2726</span><span style="font-weight:800;font-size:13px;color:var(--claude-text);">Claude</span></div>' +
      "</div></div>";

    var screen = shell.querySelector(".cc-phone-screen");
    var body = document.createElement("div");
    body.className = "cc-phone-body";
    body.appendChild(buildUserMsg(item));
    if (item.reply) body.appendChild(buildAssistantText(item.reply));
    if (item.kind === "write") body.appendChild(buildProposal(item, onProposalApplied(shell, item)));
    body.appendChild(buildStepControls(tab));
    screen.appendChild(body);

    if (item.voice) {
      var voiceBar = htmlToEl(
        '<div class="cc-voice-bar">' +
          '<div class="cc-voice-mic"><svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M12 14a3 3 0 003-3V6a3 3 0 00-6 0v5a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 006 6.93V21h2v-3.07A7 7 0 0019 11h-2z"/></svg></div>' +
          '<div class="cc-voice-wave">' +
          [5, 9, 13, 8, 4, 10, 6].map(function (h, i) { return '<span style="height:' + h + 'px;animation-delay:' + i * 0.08 + 's;"></span>'; }).join("") +
          "</div>" +
          '<span style="font-size:10.5px;font-weight:700;color:var(--claude-text-soft);">Listening\u2026 tap to speak again</span>' +
          "</div>"
      );
      screen.insertBefore(voiceBar, body);
    }

    return shell;
  }

  function onProposalApplied(paneShell, item) {
    return function () {
      var sfShell = document.querySelector(".cc-sf-shell");
      if (sfShell) showAfterState(sfShell, false);
    };
  }

  /* ---------------- salesforce pane ---------------- */
  function buildSfPane(item) {
    var sf = item.sf;
    var shell = document.createElement("div");
    shell.className = "cc-sf-shell";

    var isWrite = item.kind === "write";
    var beforeSrc = ASSET_BASE + (isWrite ? sf.before : sf.image);

    shell.innerHTML =
      '<div class="cc-sf-bar">' +
      '<img src="https://wp.sfdcdigital.com/en-us/wp-content/uploads/sites/4/2024/11/logo-salesforce.svg" alt="Salesforce"/>' +
      '<div class="cc-sf-bar-title">USG Sales Console</div>' +
      '<span style="width:14px;"></span>' +
      "</div>";

    var frame = document.createElement("div");
    frame.className = "cc-sf-frame";

    var imgWrap = document.createElement("div");
    imgWrap.className = "cc-sf-img-wrap" + (sf.glow ? " glow" : "");

    if (isWrite) {
      imgWrap.innerHTML =
        '<img class="cc-sf-img layer-before" src="' + beforeSrc + '" alt=""/>' +
        '<img class="cc-sf-img layer-after" src="' + ASSET_BASE + sf.after + '" alt=""/>';
    } else {
      imgWrap.innerHTML = '<img class="cc-sf-img" src="' + beforeSrc + '" alt=""/>';
    }

    if (sf.toast) {
      imgWrap.appendChild(
        htmlToEl('<div class="cc-toast"><span class="tick">\u2713</span>' + escapeHtml(sf.toast) + "</div>")
      );
    }

    frame.appendChild(imgWrap);
    shell.appendChild(frame);
    shell.appendChild(htmlToEl('<div class="cc-sf-caption">' + escapeHtml(sf.caption) + "</div>"));
    return shell;
  }

  function showAfterState(sfShell, instant) {
    var after = sfShell.querySelector(".layer-after");
    var toast = sfShell.querySelector(".cc-toast");
    if (after) after.classList.add("show");
    if (toast) {
      if (instant) {
        toast.classList.add("show");
      } else {
        setTimeout(function () { toast.classList.add("show"); }, 500);
      }
    }
  }

  function animateBars(root) {
    var fills = root.querySelectorAll(".cc-bar-fill");
    fills.forEach(function (f, i) {
      setTimeout(function () {
        f.style.width = f.getAttribute("data-pct") + "%";
      }, 200 + i * 120);
    });
  }

  function animateHighlights(sfShell, highlights) {
    var wrap = sfShell.querySelector(".cc-sf-img-wrap");
    highlights.forEach(function (h) {
      var box = document.createElement("div");
      box.className = "cc-hl-box";
      box.style.left = h.x + "%";
      box.style.top = h.y + "%";
      box.style.width = h.w + "%";
      box.style.height = h.h + "%";
      box.style.animationDelay = (h.delay || 0) + "ms";
      wrap.appendChild(box);
    });
  }

  /* ---------------- utils ---------------- */
  function htmlToEl(html) {
    var d = document.createElement("div");
    d.innerHTML = html.trim();
    return d.firstChild;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  renderTabs();
  renderStage();
})();
