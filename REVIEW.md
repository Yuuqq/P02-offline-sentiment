# Code Review: P02-offline-sentiment

This review categorizes findings by severity: CRITICAL, HIGH, MEDIUM, and LOW. Note that PR #1 already addresses several of these core algorithmic issues (such as neutral score calculation and bilingual issues), so it is highly recommended to review and merge PR #1 in conjunction with these fixes.

## CRITICAL

### 1. English Word Boundaries and Stem Double-Counting
- **Location:** `app.js`, `scoreText` and `highlightText`
- **Impact:** The tool does not use word boundaries for English text. For instance, the word `safe` is matched within `unsafe`, falsely attributing a positive sentiment score to a negative or warning context. Additionally, stems like `fail` and `failed` are double-counted because `fail` matches a substring of `failed`, skewing the score. For Chinese words, phrases like `不安全` might be wrongly counted as `安全`.
- **Fix Suggestion:** In `scoreText` and `highlightText`, use regex word boundaries `\b` for English words. For Chinese words, apply a negative lookbehind `(?<![不未无非])` to avoid matching negated contexts. Also, when highlighting, sort the dictionary by word length descending so that longer words (e.g. `improved`) match before their stems (`improve`).

### 2. Broken English Sentence Splitting
- **Location:** `app.js`, `analyzeSentences`
- **Impact:** The sentence splitting regex `/[。！？!?\n]+/` lacks the English period `.`. Consequently, bilingual or English texts are not split into sentences correctly, causing the sentence-level analysis feature to fail entirely on English inputs.
- **Fix Suggestion:** Add the period `.` (and optionally semicolon `;`) to the split regex: `/[。！？!?\.;\n]+/`.

### 3. Misleading Neutral Sentiment Calculation
- **Location:** `app.js`, `analyze`
- **Impact:** The neutral percentage is calculated simply as the remainder `100 - posP - negP`. Because scores are calculated on a word-match basis rather than a normalized sentence basis, any text with sentiment words will have a neutral percentage of near 0%, which is highly misleading.
- **Fix Suggestion:** As addressed in PR #1, neutrality should be calculated based on the net scores of individual sentences. Count the number of neutral sentences (where the net score is close to 0) and use that ratio for the neutral bar.

### 4. Misleading Documentation (Models)
- **Location:** `QA.md` and `SPEC.md`
- **Impact:** The documentation repeatedly mentions "loading models" and checking if the "model ID" is present. This repository is a purely offline, dictionary-based static site and does not load any machine learning models. This causes confusion for QA and future developers.
- **Fix Suggestion:** Remove all references to "models" in `QA.md` and `SPEC.md`, replacing them with "dictionary-based analysis" or similar terminology.

## MEDIUM

### 1. Cross-Site Scripting (XSS) Vulnerability in UI Injection
- **Location:** `app.js`, line 117-121 (`sentenceListEl.innerHTML`)
- **Impact:** User input (`text`) is split into sentences and injected into the DOM using `innerHTML` without HTML encoding. If a user pastes text containing HTML tags, they might be rendered as DOM nodes. Since the user pastes this text themselves, this is a DOM XSS. While not a stored XSS, it still poses a medium risk if the input comes from an untrusted copy-paste source.
- **Fix Suggestion:** Escape HTML entities (e.g., `<`, `>`, `&`) from the `s.sentence` string before inserting it into the UI.

### 2. Missing Input Length Limit Enforcement on UI
- **Location:** `index.html`, `textarea#textInput` and `app.js` line 88
- **Impact:** While `app.js` checks `if (text.length > MAX_LENGTH)`, the `textarea` in HTML does not have a `maxlength="3000"` attribute.
- **Fix Suggestion:** Add `maxlength="3000"` to `<textarea id="textInput">` in `index.html`.

### 3. Clear Button State Inconsistency
- **Location:** `app.js`, clear logic
- **Impact:** While clicking "Clear" resets the bars and text values, it does not disable the "Export Report" button. Users can click "Clear" and then export a report of an empty/cleared state, which is a logic flaw.
- **Fix Suggestion:** Add `if (exportBtn) exportBtn.disabled = true;` to the clear button event listener.

## LOW

### 1. Broken Regex Escaping Function
- **Location:** `app.js`, line 46 (`escapeRegex`)
- **Impact:** The regular expression used for escaping regex characters is missing an escape for the closing bracket `\]` and backslash `\\`. `[-/\^$*+?.()|[]{}]` actually evaluates differently than intended. Currently, the dictionary does not contain regex meta-characters, so the impact is low, but it remains a bug.
- **Fix Suggestion:** Change the escapeRegex function to: `return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');`.
