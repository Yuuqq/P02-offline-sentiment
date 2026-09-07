# Code Review: P02-offline-sentiment

This review categorizes findings by severity: CRITICAL, HIGH, MEDIUM, and LOW.

## CRITICAL

### 1. Cross-Site Scripting (XSS) Vulnerability in UI Injection
- **Location:** `app.js`, lines 117-121 (`sentenceListEl.innerHTML`), line 108 (`summaryEl.innerHTML`)
- **Impact:** User input (`text`) is split into sentences and partially injected directly into the DOM using `innerHTML` without HTML encoding. If a user pastes text containing HTML tags (e.g., `<img src=x onerror=alert(1)>`), it will be executed in the browser.
- **Fix Suggestion:** Escape the text content before inserting it into the UI, or use `textContent` where applicable. In `analyzeSentences` or when rendering, use a helper function to escape HTML entities, or use `document.createElement` and `textContent`.

### 2. Regex Denial of Service (ReDoS) / Broken Regex Escaping
- **Location:** `app.js`, line 46 (`return s.replace(/[-/\^$*+?.()|[]{}]/g, '\\$&');`)
- **Impact:** The regular expression used for escaping regex characters is missing an escape for the closing bracket `\]` and backslash `\\`. `[-/\^$*+?.()|[]{}]` actually evaluates differently than intended (it treats `[]{}` as literal characters in the character class or causes parsing issues). More importantly, injecting untrusted text into `new RegExp` requires bulletproof escaping. If a user types a word from the dictionary with a malicious regex, it could cause ReDoS or logic failure, though words are hardcoded here. However, the `highlightText` function's regex replacement might fail if dictionary words had special characters (they don't currently, but it's a latent bug).
- **Fix Suggestion:** Change the escapeRegex function to: `return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');`.

## HIGH

### 1. Insecure HTML Export
- **Location:** `app.js`, lines 131-134 (`exportReport` function)
- **Impact:** The `exportReport` function generates an HTML string and puts the `highlightEl.innerHTML` (or `highlightText(text)`) into it. While `highlightText` attempts to escape `<`, `>`, and `&`, it does not escape quotes (`"` or `'`). If the output is saved as an HTML file and opened, it could lead to script execution if someone clicks the exported file and shares it.
- **Fix Suggestion:** Ensure full HTML entity encoding is applied to user input before putting it into the exported HTML template, or ideally, generate a plain text or PDF report instead of raw HTML if interactive features aren't needed. At minimum, add escaping for quotes (`"` and `'`).

## MEDIUM

### 1. Missing Input Length Limit Enforcement on UI
- **Location:** `index.html`, `textarea#textInput` and `app.js` line 88
- **Impact:** While `app.js` checks `if (text.length > MAX_LENGTH)`, the `textarea` in HTML does not have a `maxlength="3000"` attribute. Users can paste a 10MB text file, freezing the browser momentarily before the JS rejects it.
- **Fix Suggestion:** Add `maxlength="3000"` to `<textarea id="textInput">` in `index.html`.

### 2. State Confusion on Clear
- **Location:** `app.js`, line 147-148
- **Impact:** The clear logic resets bars to `0%` and values to `0%`, but does not reset the `status` text to a true initial state (it sets it to `"已清空"`). Next time the user interacts, it might show lingering states.
- **Fix Suggestion:** Instead of manually clearing each DOM element's inner HTML and style, it would be more maintainable to wrap the app in a `form` and use a native `reset` event, or consolidate state into a single render function.

## LOW

### 1. Dictionary Scaling and Maintainability
- **Location:** `app.js`, lines 21-41
- **Impact:** The sentiment dictionary is hardcoded as arrays of arrays. Finding words requires iterating over the entire array for every word in the text. For a large text and a large dictionary, this is computationally expensive ($O(N \times M)$ where N is text length and M is dictionary size).
- **Fix Suggestion:** Use an Aho-Corasick automaton or a `Map`/`Set` based approach with a tokenized text array, rather than sequential RegEx matching over the entire string for every dictionary entry.

### 2. Lack of Module Bundler / ES Modules
- **Location:** `app.js` and `index.html`
- **Impact:** The application variables (`MAX_LENGTH`, `POSITIVE_WORDS`, etc.) are in the global scope. This could cause conflicts if other scripts are added.
- **Fix Suggestion:** Wrap the entire `app.js` in an IIFE (Immediately Invoked Function Expression) or use `<script type="module">` to scope variables to the module.

### 3. Missing Unit Tests
- **Location:** Entire codebase
- **Impact:** There are no automated unit tests for `scoreText`, `analyzeSentences`, or `highlightText`. UI changes or dictionary updates might silently break logic.
- **Fix Suggestion:** Introduce a lightweight testing framework (like Jest or Mocha) to verify the correctness of the core logic functions in `app.js` independently of the UI.
