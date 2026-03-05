import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";

const modelInput = document.getElementById("modelId");
const loadBtn = document.getElementById("loadBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const statusEl = document.getElementById("status");
const textInput = document.getElementById("textInput");
const summaryEl = document.getElementById("summary");
const posBar = document.getElementById("posBar");
const negBar = document.getElementById("negBar");
const posVal = document.getElementById("posVal");
const negVal = document.getElementById("negVal");

let classifier = null;

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

loadBtn.addEventListener("click", async () => {
  const modelId = modelInput.value.trim();
  if (!modelId) {
    setStatus("模型 ID 不能为空");
    return;
  }

  loadBtn.disabled = true;
  analyzeBtn.disabled = true;
  setStatus("正在加载模型（首次可能较慢）...");

  try {
    classifier = await pipeline("sentiment-analysis", modelId);
    setStatus("模型已加载，可离线复用缓存");
    analyzeBtn.disabled = false;
  } catch (err) {
    setStatus(`模型加载失败: ${err.message}`);
  } finally {
    loadBtn.disabled = false;
  }
});

analyzeBtn.addEventListener("click", async () => {
  const text = textInput.value.trim();
  if (!text) {
    summaryEl.textContent = "请先输入要分析的文本。";
    return;
  }
  if (!classifier) {
    summaryEl.textContent = "请先加载模型。";
    return;
  }

  analyzeBtn.disabled = true;
  setStatus("分析中...");

  try {
    const sample = text.slice(0, 1500);
    const out = await classifier(sample, { topk: 2 });

    let pos = 0;
    let neg = 0;

    for (const item of out) {
      const label = (item.label || "").toUpperCase();
      if (label.includes("POS")) pos = item.score * 100;
      if (label.includes("NEG")) neg = item.score * 100;
    }

    // 对二分类结果做归一化兜底。
    if (pos === 0 && neg > 0) pos = 100 - neg;
    if (neg === 0 && pos > 0) neg = 100 - pos;

    setBars(pos, neg);

    const tendency = pos >= neg ? "整体偏正向" : "整体偏负向";
    summaryEl.textContent = `${tendency}。Positive ${pos.toFixed(1)}%，Negative ${neg.toFixed(1)}%。`;
    setStatus("分析完成");
  } catch (err) {
    summaryEl.textContent = `分析失败: ${err.message}`;
    setStatus("分析失败");
  } finally {
    analyzeBtn.disabled = false;
  }
});

// === PM Metrics Integration ===
(function() {
  try {
    if (!window.pmMetrics) return;
    // Auto mark task start on first meaningful interaction
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
