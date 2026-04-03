const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");
const textInput = document.getElementById("textInput");
const summaryEl = document.getElementById("summary");
const posBar = document.getElementById("posBar");
const negBar = document.getElementById("negBar");
const posVal = document.getElementById("posVal");
const negVal = document.getElementById("negVal");

const MAX_ANALYZE_LENGTH = 2500;

const POSITIVE_TERMS = compileTerms([
  ["improve", 1.0], ["improved", 1.2], ["improving", 1.1], ["improvement", 1.0],
  ["reduced", 0.8], ["reduce", 0.7], ["recovery", 0.9], ["recover", 0.9],
  ["praise", 1.2], ["praised", 1.2], ["effective", 1.0], ["efficient", 0.9],
  ["safe", 0.8], ["safer", 0.9], ["stabilized", 0.8], ["stable", 0.8],
  ["progress", 0.9], ["success", 1.1], ["successful", 1.1], ["support", 0.8],
  ["transparent", 0.9], ["resilient", 0.8], ["growth", 0.7], ["expand", 0.6],
  ["expanded", 0.7], ["maintain", 0.4], ["maintaining", 0.4], ["hope", 0.8],
  ["改善", 1.2], ["恢复", 0.9], ["支持", 0.8], ["透明", 0.9], ["稳定", 0.8],
  ["合作", 0.8], ["发展", 0.7], ["创新", 0.9], ["成功", 1.1], ["公正", 0.9],
  ["真实", 0.8], ["进步", 0.9], ["团结", 0.9], ["保障", 0.8], ["繁荣", 1.0],
  ["友好", 0.7], ["积极", 0.8], ["健康", 0.7], ["和谐", 0.7], ["美好", 0.8],
  ["优秀", 0.9], ["幸福", 0.8], ["开放", 0.7], ["包容", 0.7], ["尊重", 0.7]
]);

const NEGATIVE_TERMS = compileTerms([
  ["explosion", 1.4], ["killed", 1.5], ["kill", 1.5], ["injured", 1.3], ["injury", 1.2],
  ["ignored", 1.1], ["ignore", 1.0], ["warning", 0.9], ["warnings", 0.9],
  ["crisis", 1.1], ["conflict", 1.0], ["risk", 0.9], ["danger", 1.0],
  ["failure", 1.1], ["failed", 1.1], ["fraud", 1.2], ["scandal", 1.2],
  ["leak", 1.0], ["violence", 1.2], ["corruption", 1.2], ["panic", 1.0],
  ["fear", 0.8], ["threat", 1.0], ["pollution", 0.9], ["flat", 0.3],
  ["layoff", 1.0], ["loss", 0.8], ["decline", 0.9], ["low", 0.4],
  ["危机", 1.1], ["质疑", 0.9], ["冲突", 1.0], ["造假", 1.2], ["愤怒", 1.0],
  ["失控", 1.1], ["恐慌", 1.0], ["谣言", 0.8], ["欺骗", 1.1], ["风险", 0.9],
  ["腐败", 1.2], ["暴力", 1.2], ["污染", 0.9], ["争议", 0.7], ["抵制", 0.7],
  ["泄露", 1.0], ["操纵", 1.1], ["偏见", 0.8], ["威胁", 1.0], ["崩溃", 1.2],
  ["混乱", 1.0], ["丑闻", 1.2], ["虚假", 1.0], ["焦虑", 0.8], ["压迫", 1.0]
]);

const NEGATION_CUES = [
  "not", "no", "never", "without", "hardly", "barely", "未", "无", "没有", "并非", "不", "难以"
];

const BOOSTER_CUES = [
  "very", "highly", "strongly", "significantly", "extremely", "greatly",
  "非常", "极其", "明显", "显著", "大幅", "高度"
];

function setStatus(text) {
  statusEl.textContent = `状态: ${text}`;
}

function setBars(pos, neg) {
  const p = Math.max(0, Math.min(100, pos));
  const n = Math.max(0, Math.min(100, neg));
  posBar.style.width = `${p.toFixed(1)}%`;
  negBar.style.width = `${n.toFixed(1)}%`;
  posVal.textContent = `${p.toFixed(1)}%`;
  negVal.textContent = `${n.toFixed(1)}%`;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildTermRegex(term) {
  const safe = escapeRegExp(term.toLowerCase());
  if (/^[a-z][a-z\s'-]*$/i.test(term)) {
    return new RegExp(`\\b${safe}\\b`, "gi");
  }
  return new RegExp(safe, "g");
}

function compileTerms(entries) {
  return entries.map(([term, weight]) => ({
    term,
    weight,
    regex: buildTermRegex(term)
  }));
}

function hasCue(context, cues) {
  return cues.some((cue) => {
    if (/^[a-z][a-z\s'-]*$/i.test(cue)) {
      return new RegExp(`\\b${escapeRegExp(cue)}\\b`, "i").test(context);
    }
    return context.includes(cue);
  });
}

function intensityLabel(score) {
  if (score >= 8) return "高";
  if (score >= 4) return "中";
  if (score > 0) return "低";
  return "很低";
}

function analyzeText(rawText) {
  const sample = String(rawText || "").slice(0, MAX_ANALYZE_LENGTH);
  const normalized = sample.toLowerCase();
  const segments = normalized.split(/[\n。！？!?；;]+/).map((part) => part.trim()).filter(Boolean);

  const result = {
    positiveScore: 0,
    negativeScore: 0,
    positiveHits: [],
    negativeHits: [],
    sampleLength: sample.length
  };

  const applyTable = (table, baseType, segment) => {
    table.forEach((entry) => {
      entry.regex.lastIndex = 0;
      let match;
      while ((match = entry.regex.exec(segment)) !== null) {
        const context = segment.slice(Math.max(0, match.index - 18), match.index);
        const multiplier = hasCue(context, BOOSTER_CUES) ? 1.35 : 1;
        const inverted = hasCue(context, NEGATION_CUES);
        const effectiveType = inverted ? (baseType === "positive" ? "negative" : "positive") : baseType;
        const score = entry.weight * multiplier;
        if (effectiveType === "positive") {
          result.positiveScore += score;
          result.positiveHits.push(entry.term);
        } else {
          result.negativeScore += score;
          result.negativeHits.push(entry.term);
        }
        if (match[0].length === 0) {
          entry.regex.lastIndex += 1;
        }
      }
    });
  };

  segments.forEach((segment) => {
    applyTable(POSITIVE_TERMS, "positive", segment);
    applyTable(NEGATIVE_TERMS, "negative", segment);
  });

  const total = result.positiveScore + result.negativeScore;
  if (!total) {
    return {
      ...result,
      posPct: 50,
      negPct: 50,
      tendency: "整体接近中性"
    };
  }

  const posPct = (result.positiveScore / total) * 100;
  const negPct = (result.negativeScore / total) * 100;
  const delta = Math.abs(posPct - negPct);
  const tendency = delta < 12 ? "整体接近中性" : posPct > negPct ? "整体偏正向" : "整体偏负向";

  return {
    ...result,
    posPct,
    negPct,
    tendency
  };
}

function updateSummary(result) {
  const positiveKeywords = [...new Set(result.positiveHits)].slice(0, 4);
  const negativeKeywords = [...new Set(result.negativeHits)].slice(0, 4);
  const parts = [];
  if (positiveKeywords.length) parts.push(`正向命中：${positiveKeywords.join("、")}`);
  if (negativeKeywords.length) parts.push(`负向命中：${negativeKeywords.join("、")}`);

  if (!result.positiveHits.length && !result.negativeHits.length) {
    summaryEl.textContent = "未识别到明显情绪词，整体更接近中性表述。";
    return;
  }

  summaryEl.textContent =
    `${result.tendency}。正向线索 ${result.positiveHits.length} 次，负向线索 ${result.negativeHits.length} 次，情绪强度 ${intensityLabel(result.positiveScore + result.negativeScore)}。` +
    (parts.length ? ` ${parts.join("；")}。` : "");
}

function runAnalysis() {
  const text = textInput.value.trim();
  if (!text) {
    summaryEl.textContent = "请先输入要分析的文本。";
    setBars(0, 0);
    setStatus("等待输入");
    return;
  }

  setStatus("分析中...");
  const result = analyzeText(text);
  setBars(result.posPct, result.negPct);
  updateSummary(result);
  setStatus(`分析完成（本地词典，样本 ${result.sampleLength} 字符）`);
}

function resetView() {
  textInput.value = "";
  summaryEl.textContent = "等待分析...";
  setBars(0, 0);
  setStatus("已清空");
}

analyzeBtn.addEventListener("click", runAnalysis);
clearBtn.addEventListener("click", resetView);

textInput.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    runAnalysis();
  }
});

document.querySelectorAll(".example-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    setTimeout(() => runAnalysis(), 0);
  });
});

// === PM Metrics Integration ===
(function() {
  try {
    if (!window.pmMetrics) return;
    let taskStarted = false;
    document.addEventListener('click', function(e) {
      if (taskStarted) return;
      const btn = e.target.closest('button');
      if (btn) {
        taskStarted = true;
        window.pmMetrics.markTaskStart('sentiment_analysis_task');
      }
    }, { once: false });
  } catch (_e) {}
})();


// === Auto-load demo text ===
(function() {
  const ta = document.getElementById('inputText') || document.querySelector('textarea');
  if (ta && !ta.value.trim()) {
    ta.value = '今天天气真好，阳光明媚，心情非常愉快！但是昨天的新闻让人非常担忧，经济数据持续下滑，失业率创新高。不过政府已经出台了一系列刺激措施，专家认为下半年有望恢复增长。总体来说，虽然面临挑战，但前景可期。';
    ta.dispatchEvent(new Event('input', {bubbles:true}));
  }
})();
