# P02 Spec - 本地离线情感倾向分析仪

## 1. Summary

- **Project ID**: P02
- **Project Name**: 本地离线情感倾向分析仪
- **Goal**: 基于本地词典 + 规则引擎对中文新闻文本进行情感极性评分，完全离线运行
- **User Persona**: 数据记者 / 新传研究者

## 2. Scope

- **In scope**:
  - 基于本地词典 + 规则引擎对中文新闻文本进行情感极性评分
  - 完全离线运行
- **Out of scope**:
  - 后端代理或服务端逻辑
  - API Key 持久化存储

## 3. UX

- **Core workflow**: 用户输入 → 前端处理 → 结果展示
- **Inputs**: 新闻文本（粘贴或上传）
- **Outputs**: 情感极性评分 + 关键词高亮
- **States**: empty (初始) / loading (处理中) / error (失败) / success (完成)

## 4. Functional Requirements

1. FR-1: 基于本地词典 + 规则引擎对中文新闻文本进行情感极性评分
2. FR-2: 结果可视化展示
3. FR-3: 错误状态可见提示

## 5. Non-Functional Requirements

- **Performance**: 核心任务 3 分钟内完成
- **Accessibility**: 键盘导航、aria-label、焦点可见、WCAG AA 对比度
- **Privacy**: 本地处理优先，不默认上传数据
- **Browser support**: 现代 Chromium (Chrome 110+)

## 6. Dependencies

- **Libraries/CDNs**: 内置情感词典 JSON
- **Local data**: 无

## 7. Risks & Mitigations

- **Risk**: 词典覆盖不全导致误判
- **Mitigation**: 支持用户自定义补充词典

## 8. Acceptance Criteria

- [ ] 本地可加载模型并分析文本
- [ ] 输出正负分值和结论
- [ ] 文本不上传到自建后端
- [ ] 纯静态页面可部署 GitHub Pages
- [ ] 移动端可用
- [ ] 隐私提示清晰可见
