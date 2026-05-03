// P02 离线情感分析仪 v2.0
  // 新增：双语词库扩展、逐句分析、情感词高亮、导出HTML报告

  const analyzeBtn = document.getElementById("analyzeBtn");
  const clearBtn = document.getElementById("clearBtn");
  const exportBtn = document.getElementById("exportBtn");
  const statusEl = document.getElementById("status");
  const textInput = document.getElementById("textInput");
  const summaryEl = document.getElementById("summary");
  const posBar = document.getElementById("posBar");
  const negBar = document.getElementById("negBar");
  const neutralBar = document.getElementById("neutralBar");
  const posVal = document.getElementById("posVal");
  const negVal = document.getElementById("negVal");
  const neutralVal = document.getElementById("neutralVal");
  const highlightEl = document.getElementById("highlightOutput");
  const sentenceListEl = document.getElementById("sentenceList");

  const MAX_LENGTH = 3000;

  const POSITIVE_WORDS = [
    ["improve",1.0],["improved",1.2],["improving",1.1],["safe",0.8],
    ["praise",1.2],["effective",1.0],["efficient",0.9],["transparent",1.1],
    ["success",1.1],["successful",1.2],["progress",0.9],["benefit",0.8],
    ["解决",1.0],["改善",1.1],["积极",1.0],["成功",1.2],["进步",0.9],
    ["透明",1.1],["安全",0.8],["保障",0.9],["发展",0.7],["落实",0.8],
    ["优化",0.9],["完善",0.9],["支持",0.8],["表彰",1.2],["肯定",1.0],
    ["赞扬",1.2],["振兴",0.9],["繁荣",1.1],["有效",1.0],["便民",0.9],
    ["惠民",1.0],["规范",0.8],["及时",0.8],["获得",0.6],["推进",0.7],
  ];

  const NEGATIVE_WORDS = [
    ["fail",1.1],["failed",1.2],["failure",1.1],["crisis",1.3],["corrupt",1.4],
    ["fraud",1.4],["scandal",1.3],["violation",1.2],["protest",0.8],
    ["delay",0.8],["risk",0.8],["threat",1.1],["neglect",1.0],["decline",1.0],
    ["问题",0.9],["失败",1.2],["腐败",1.4],["丑闻",1.3],["危机",1.3],
    ["违规",1.2],["抗议",0.8],["不满",1.0],["延误",0.8],["缺失",0.9],
    ["受害",1.2],["受损",1.1],["强制",1.0],["追责",1.0],["欺骗",1.3],
    ["虚假",1.3],["操控",1.2],["伤亡",1.4],["死亡",1.4],["污染",1.2],
    ["不公",1.1],["歧视",1.2],["泄露",1.2],["崩溃",1.3],["腐烂",1.3],
  ];

  function setStatus(t) { if (statusEl) statusEl.textContent = "状态: " + t; }

  function escapeRegex(s) {
    return s.replace(/[-/\^$*+?.()|[]{}]/g, '\\$&');
  }

  function scoreText(text, wordList) {
    let total = 0;
    const found = [];
    wordList.forEach(function(pair) {
      const word = pair[0];
      const score = pair[1];
      const re = new RegExp(escapeRegex(word), 'gi');
      const m = text.match(re);
      if (m) { total += score * m.length; found.push({ word: word, count: m.length }); }
    });
    return { score: total, found: found };
  }

  function highlightText(text) {
    let result = text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    POSITIVE_WORDS.forEach(function(pair) {
      const re = new RegExp(escapeRegex(pair[0]), 'gi');
      result = result.replace(re, function(m) { return '<mark class="pos-mark">' + m + '</mark>'; });
    });
    NEGATIVE_WORDS.forEach(function(pair) {
      const re = new RegExp(escapeRegex(pair[0]), 'gi');
      result = result.replace(re, function(m) { return '<mark class="neg-mark">' + m + '</mark>'; });
    });
    return result;
  }

  function analyzeSentences(text) {
    const sents = text.split(/[。！？!?\n]+/).map(s => s.trim()).filter(s => s.length > 5);
    return sents.map(function(s) {
      const pos = scoreText(s, POSITIVE_WORDS);
      const neg = scoreText(s, NEGATIVE_WORDS);
      const net = pos.score - neg.score;
      return { sentence: s, net: net, label: net > 0.5 ? "positive" : net < -0.5 ? "negative" : "neutral" };
    });
  }

  function analyze() {
    const text = textInput.value.trim();
    if (!text) { setStatus("请输入文本"); return; }
    if (text.length > MAX_LENGTH) { setStatus("文本过长（最多 " + MAX_LENGTH + " 字）"); return; }

    const pos = scoreText(text, POSITIVE_WORDS);
    const neg = scoreText(text, NEGATIVE_WORDS);
    const total = pos.score + neg.score || 1;

    const posP = Math.round((pos.score / total) * 100);
    const negP = Math.round((neg.score / total) * 100);
    const neuP = Math.max(0, 100 - posP - negP);

    if (posBar) posBar.style.width = posP + "%";
    if (negBar) negBar.style.width = negP + "%";
    if (neutralBar) neutralBar.style.width = neuP + "%";
    if (posVal) posVal.textContent = posP + "%";
    if (negVal) negVal.textContent = negP + "%";
    if (neutralVal) neutralVal.textContent = neuP + "%";

    const tone = posP > negP + 15 ? "🟢 整体偏正面" : negP > posP + 15 ? "🔴 整体偏负面" : "⚪ 中性/均衡";

    if (summaryEl) {
      summaryEl.innerHTML =
        "<strong>" + tone + "</strong><br>" +
        "正面词: " + (pos.found.slice(0,6).map(f => f.word + "(" + f.count + ")").join("、") || "无") + "<br>" +
        "负面词: " + (neg.found.slice(0,6).map(f => f.word + "(" + f.count + ")").join("、") || "无") + "<br>" +
        "字数: " + text.length;
    }

    const sents = analyzeSentences(text);
    if (sentenceListEl) {
      sentenceListEl.innerHTML = sents.slice(0, 12).map(function(s) {
        const icon = s.label === "positive" ? "🟢" : s.label === "negative" ? "🔴" : "⚪";
        const preview = s.sentence.length > 80 ? s.sentence.substring(0, 80) + "…" : s.sentence;
        return '<li class="sent-item sent-' + s.label + '"><span class="sent-label">' + icon + '</span> <span>' + preview + '</span></li>';
      }).join("") || '<li style="opacity:.5">未能拆分句子</li>';
    }

    if (highlightEl) highlightEl.innerHTML = highlightText(text);

    setStatus("分析完成 · 正面: " + posP + "% / 负面: " + negP + "%");
    if (exportBtn) exportBtn.disabled = false;
  }

  function exportReport() {
    const text = textInput.value.trim();
    const hl = highlightEl ? highlightEl.innerHTML : highlightText(text);
    const html = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"/><title>情感分析报告</title><style>body{font-family:system-ui;max-width:800px;margin:0 auto;padding:20px}.pos-mark{background:#dcfce7;color:#14532d;padding:1px 3px;border-radius:3px}.neg-mark{background:#fee2e2;color:#7f1d1d;padding:1px 3px;border-radius:3px}</style></head><body><h1>情感分析报告</h1><p>' + new Date().toLocaleString("zh-CN") + '</p><div style="background:#f5f5f5;padding:12px;border-radius:8px">' + hl + '</div><p style="font-size:11px;color:#aaa">P02 离线情感分析仪生成</p></body></html>';
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "sentiment-report.html"; a.click();
    URL.revokeObjectURL(url);
    setStatus("已导出");
  }

  analyzeBtn.addEventListener("click", analyze);
  clearBtn.addEventListener("click", function() {
    textInput.value = "";
    if (summaryEl) summaryEl.innerHTML = "";
    if (highlightEl) highlightEl.innerHTML = "";
    if (sentenceListEl) sentenceListEl.innerHTML = "";
    [posBar,negBar,neutralBar].forEach(b => { if(b) b.style.width = "0%"; });
    [posVal,negVal,neutralVal].forEach(v => { if(v) v.textContent = "0%"; });
    setStatus("已清空");
  });
  if (exportBtn) exportBtn.addEventListener("click", exportReport);

  (function(){
    try {
      if (!window.pmMetrics) return;
      let started = false;
      document.addEventListener("click", e => {
        if (started) return;
        if (e.target.closest("button")) { started = true; window.pmMetrics.markTaskStart("sentiment_task"); }
      }, { once: false });
    } catch(_) {}
  })();
  