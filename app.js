// P02 离线情感分析仪 v2.1
// 修复 escapeRegex、按句计算中性占比、词长降序高亮、样稿一键填入。

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
  ["improved", 1.2], ["improving", 1.1], ["successful", 1.2], ["transparent", 1.1],
  ["effective", 1.0], ["efficient", 0.9], ["improve", 1.0], ["success", 1.1],
  ["progress", 0.9], ["benefit", 0.8], ["praise", 1.2], ["safe", 0.8],
  ["表彰", 1.2], ["赞扬", 1.2], ["成功", 1.2], ["繁荣", 1.1], ["改善", 1.1],
  ["透明", 1.1], ["突破", 1.1], ["积极", 1.0], ["解决", 1.0], ["肯定", 1.0],
  ["有效", 1.0], ["惠民", 1.0], ["成效", 1.0], ["复苏", 1.0], ["优化", 0.9],
  ["完善", 0.9], ["进步", 0.9], ["保障", 0.9], ["便民", 0.9], ["提升", 0.9],
  ["救助", 0.9], ["惠及", 0.9], ["支持", 0.8], ["规范", 0.8], ["及时", 0.8],
  ["安全", 0.8], ["落实", 0.8], ["稳定", 0.8], ["亮点", 0.8], ["恢复", 0.8],
  ["团结", 0.8], ["发展", 0.7], ["推进", 0.7], ["获得", 0.6],
];

const NEGATIVE_WORDS = [
  ["failure", 1.1], ["failed", 1.2], ["corrupt", 1.4], ["violation", 1.2],
  ["scandal", 1.3], ["crisis", 1.3], ["protest", 0.8], ["threat", 1.1],
  ["neglect", 1.0], ["decline", 1.0], ["fraud", 1.4], ["fail", 1.1],
  ["delay", 0.8], ["risk", 0.8],
  ["腐败", 1.4], ["伤亡", 1.4], ["死亡", 1.4], ["瞒报", 1.4], ["丑闻", 1.3],
  ["危机", 1.3], ["欺骗", 1.3], ["虚假", 1.3], ["崩溃", 1.3], ["腐烂", 1.3],
  ["违规", 1.2], ["受害", 1.2], ["操控", 1.2], ["污染", 1.2], ["歧视", 1.2],
  ["泄露", 1.2], ["失败", 1.2], ["恶化", 1.2], ["侵害", 1.2], ["受损", 1.1],
  ["不公", 1.1], ["推诿", 1.1], ["恐慌", 1.1], ["亏损", 1.1], ["强制", 1.0],
  ["追责", 1.0], ["不满", 1.0], ["隐患", 1.0], ["裁员", 1.0], ["敷衍", 1.0],
  ["问题", 0.7], ["抗议", 0.8], ["延误", 0.8], ["缺失", 0.9], ["风险", 0.8],
  ["焦虑", 0.9],
];

const SAMPLES = {
  official: "近日，当地持续推进民生工程，优化办事流程并落实惠民措施。相关部门表示，经过集中整治，服务效率明显提升，群众办事更加便民。一批试点项目已取得积极成效，安全生产形势总体稳定，后续将继续完善保障机制，支持社区服务扩面。",
  probe: "多名居民反映，水源异味问题已持续两个月，投诉却被反复延误。记者调查发现，监测数据存在缺失，企业曾试图瞒报污染记录。当地环保部门被指推诿，至今未公开完整检测报告。有受害者家中水管锈蚀，担心长期侵害健康，情绪从不满转为焦虑。",
  disaster: "暴雨导致沿河路段受损，部分商铺进水。救援队伍及时到场救助被困人员，无新增死亡报告。受灾群众被安置到临时点，物资发放总体有序。与此同时，排水管网的隐患仍待排查，重建若再延误，可能再度引发不满。",
};

function setStatus(t) {
  if (statusEl) statusEl.textContent = "状态: " + t;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scoreText(text, wordList) {
  let total = 0;
  const found = [];
  wordList.forEach(function (pair) {
    const word = pair[0];
    const score = pair[1];
    const re = new RegExp(escapeRegex(word), "gi");
    const m = text.match(re);
    if (m) {
      total += score * m.length;
      found.push({ word: word, count: m.length });
    }
  });
  return { score: total, found: found };
}

function highlightText(text) {
  let result = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const all = POSITIVE_WORDS.map(function (pair) {
    return { word: pair[0], cls: "pos-mark" };
  }).concat(NEGATIVE_WORDS.map(function (pair) {
    return { word: pair[0], cls: "neg-mark" };
  })).sort(function (a, b) {
    return b.word.length - a.word.length;
  });
  all.forEach(function (item) {
    const re = new RegExp(escapeRegex(item.word), "gi");
    result = result.replace(re, function (m) {
      if (/^<mark /.test(m) || /<\/mark>$/.test(m)) return m;
      return '<mark class="' + item.cls + '">' + m + "</mark>";
    });
  });
  return result;
}

function analyzeSentences(text) {
  const sents = text.split(/[。！？!?；;\n]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 4; });
  const list = sents.length ? sents : [text.trim()];
  return list.map(function (s) {
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
  const sents = analyzeSentences(text);
  const posSent = sents.filter(function (s) { return s.label === "positive"; }).length;
  const negSent = sents.filter(function (s) { return s.label === "negative"; }).length;
  const sentTotal = Math.max(1, sents.length);
  const posP = Math.round((posSent / sentTotal) * 100);
  const negP = Math.round((negSent / sentTotal) * 100);
  const neuP = Math.max(0, 100 - posP - negP);

  if (posBar) posBar.style.width = posP + "%";
  if (negBar) negBar.style.width = negP + "%";
  if (neutralBar) neutralBar.style.width = neuP + "%";
  if (posVal) posVal.textContent = posP + "%";
  if (negVal) negVal.textContent = negP + "%";
  if (neutralVal) neutralVal.textContent = neuP + "%";

  const tone = posP > negP + 12 ? "🟢 整体偏正面框架" : negP > posP + 12 ? "🔴 整体偏负面框架" : "⚪ 中性或混合框架";

  if (summaryEl) {
    summaryEl.innerHTML =
      "<strong>" + tone + "</strong><br>" +
      "正面词: " + (pos.found.slice(0, 6).map(function (f) { return f.word + "(" + f.count + ")"; }).join("、") || "无") + "<br>" +
      "负面词: " + (neg.found.slice(0, 6).map(function (f) { return f.word + "(" + f.count + ")"; }).join("、") || "无") + "<br>" +
      "句子: 正 " + posSent + " / 负 " + negSent + " / 中 " + (sents.length - posSent - negSent) + " · 字数: " + text.length +
      "<br><span style=\"opacity:.75\">中性占比来自净分接近 0 的句子，不是 100 减剩余。</span>";
  }

  if (sentenceListEl) {
    sentenceListEl.innerHTML = sents.slice(0, 12).map(function (s) {
      const icon = s.label === "positive" ? "🟢" : s.label === "negative" ? "🔴" : "⚪";
      const preview = s.sentence.length > 80 ? s.sentence.substring(0, 80) + "…" : s.sentence;
      return '<li class="sent-item sent-' + s.label + '"><span class="sent-label">' + icon + "</span> <span>" + preview + "</span></li>";
    }).join("") || '<li style="opacity:.5">未能拆分句子</li>';
  }

  if (highlightEl) highlightEl.innerHTML = highlightText(text);

  setStatus("分析完成 · 正面句 " + posP + "% / 负面句 " + negP + "% / 中性句 " + neuP + "%");
  if (exportBtn) exportBtn.disabled = false;
}

function exportReport() {
  const text = textInput.value.trim();
  const hl = highlightEl ? highlightEl.innerHTML : highlightText(text);
  const html = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"/><title>情感分析报告</title><style>body{font-family:system-ui;max-width:800px;margin:0 auto;padding:20px;line-height:1.7}.pos-mark{background:#dcfce7;color:#14532d;padding:1px 3px;border-radius:3px}.neg-mark{background:#fee2e2;color:#7f1d1d;padding:1px 3px;border-radius:3px}</style></head><body><h1>情感分析报告</h1><p>' + new Date().toLocaleString("zh-CN") + '</p><div style="background:#f5f5f5;padding:12px;border-radius:8px">' + hl + '</div><p style="font-size:11px;color:#aaa">P02 离线情感分析仪 · 词袋模型，不能处理讽刺</p></body></html>';
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "sentiment-report.html"; a.click();
  URL.revokeObjectURL(url);
  setStatus("已导出");
}

analyzeBtn.addEventListener("click", analyze);
clearBtn.addEventListener("click", function () {
  textInput.value = "";
  if (summaryEl) summaryEl.innerHTML = "";
  if (highlightEl) highlightEl.innerHTML = "";
  if (sentenceListEl) sentenceListEl.innerHTML = "";
  [posBar, negBar, neutralBar].forEach(function (b) { if (b) b.style.width = "0%"; });
  [posVal, negVal, neutralVal].forEach(function (v) { if (v) v.textContent = "0%"; });
  setStatus("已清空");
});
if (exportBtn) exportBtn.addEventListener("click", exportReport);

document.querySelectorAll("[data-sample]").forEach(function (btn) {
  btn.addEventListener("click", function () {
    const key = btn.getAttribute("data-sample");
    if (SAMPLES[key]) {
      textInput.value = SAMPLES[key];
      setStatus("已填入样稿「" + (btn.textContent || key) + "」");
    }
  });
});

(function () {
  try {
    if (!window.pmMetrics) return;
    let started = false;
    document.addEventListener("click", function (e) {
      if (started) return;
      if (e.target.closest("button")) {
        started = true;
        window.pmMetrics.markTaskStart("sentiment_task");
      }
    }, { once: false });
  } catch (_) {}
})();
