# P02 QA

## Environment

- **Browser**: Chrome 110+ / Firefox / Safari
- **OS**: Windows / macOS
- **Date**: 2026-09-07

## Functional Test Cases

1. **空文本拦截**
   - Steps: 不输入，点「分析情感」
   - Expected: 状态提示「请输入文本」，不改百分比
   - Pass/Fail: 待测

2. **政策通稿 vs 调查稿反差**
   - Steps: 点「政策通稿」分析，再点「调查稿」分析
   - Expected: 通稿偏正面框架，调查稿偏负面；中性条不是永远为 0
   - Pass/Fail: 待测

3. **中性算法**
   - Steps: 分析「灾害现场」样稿
   - Expected: 正/负/中三条都可能有宽度；摘要写明中性来自句子净分
   - Pass/Fail: 待测

4. **转义与长词优先**
   - Steps: 输入 `successful progress` 并分析
   - Expected: 高亮 successful 不被 success 切开；页面不抛正则语法错
   - Pass/Fail: 待测

5. **中文不断字**
   - Steps: 分析通稿后看右侧高亮区
   - Expected: 中文按词/句阅读，不被逐字切开
   - Pass/Fail: 待测

6. **导出**
   - Steps: 分析后点导出
   - Expected: 下载 HTML，含高亮 mark
   - Pass/Fail: 待测

7. **共享资源回退**
   - Steps: 独立 GitHub Pages 打开
   - Expected: shared CSS/JS 从 yuuqq.github.io/shared 回退加载
   - Pass/Fail: 待测

## Accessibility Checks

- [ ] 键盘导航可达所有交互元素
- [ ] 输入控件绑定可见 label
- [ ] 状态区 aria-live
- [ ] 样稿按钮可键盘激活

## Privacy Checks

- [ ] 分析纯本地，无上传
- [ ] 无密钥字段

## Known Issues

- **Issue**: 词袋模型处理不了讽刺、反语、双重否定。
- **Severity**: minor（教学卡片已声明）
- **Workaround**: 结论仅作课堂参照。
