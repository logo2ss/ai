# Validation and practical limits

## Observed validation

- Python workflow suite: **22 passed, 1 skipped**. The skipped test is an optional live Ollama integration. One third-party Starlette/AnyIO deprecation warning does not affect the tested workflows.
- TypeScript check and optimized Vite production build: passed.
- The saved one-command setup script was executed from the dependency locks, including `npm ci` and the frontend build.
- Chromium smoke checks: all nine pages navigated; collection creation, pasted source import, real queued numeric analysis, settings connectivity failure, light/dark switching and a 390px mobile viewport exercised. No page JavaScript errors, external browser requests or horizontal mobile overflow observed.
- Deterministic backend tests exercise a 20-story import, TXT/MD/PDF/DOCX/EPUB and ZIP ingestion, invalid files and archive paths, normalized-text duplicate detection, collection creation, incremental measured/model-assisted analysis, collection profile synthesis, weighted mixing, reference exclusion, staged original generation, outline/profile-version persistence, unavailable models, worker failure and retry, cancellation, interrupted imports, chapter-checkpoint restart recovery, editing/version history, separate AI suggestions, all five export formats, batch export, feedback, backups/restoration, persistence and cross-origin/host checks.
- Model calls in deterministic tests are mocked **only inside tests**. They verify pipeline behavior and state, not fiction quality or factual interpretation. The real Ollama/model/embedding integration has not been run in this environment because Ollama and model weights are not installed.
- No real model was downloaded or represented as connected. No neural model training or fine-tuning took place.

## Re-run checks

From the project directory:

```sh
.venv/bin/python -m pytest -q
cd frontend
npm run build
```

For the browser smoke test, start the app first. Install Playwright's test browser once with `cd frontend && npx playwright install chromium`. Then run `node tests/browser_smoke.cjs` from the project root. Alternatively set `CHROMIUM_PATH` to an existing Chromium binary. The script creates explicitly named test records, removes them on success, and stores screenshots in the OS temporary directory. Use a disposable workspace for browser tests because a failed run may leave its named records and activity history. It makes no remote-provider/model calls.

Optional live Ollama connectivity/output test:

```sh
FOLIO_REAL_MODEL=qwen2.5:7b .venv/bin/python -m pytest -q -k real_ollama
```

This is a short structured-output integration check. Manually validate a real twenty-source analysis/generation/edit/export workflow on your target hardware before relying on model output. That full live-model acceptance scenario remains unverified.

## Implemented core

React/TypeScript dashboard; responsive light/dark UI; local SQLite persistence; multi-file, folder, ZIP and pasted-story imports; safe document extraction; library search/sort/collections/tags/genre/edit/delete; exact normalized-text deduplication; numeric writing measurements; chunked AI interpretations; compact collection-level qualitative synthesis; independent versioned profiles; weighted profile mixing; simple/advanced generation; premise/outline/chapter/continuity/review/one-pass revision pipeline; cached optional local embedding retrieval and semantic signals; phrase-overlap reports; feedback-guided prompts; generated-story search/favorites/folders/duplication; autosave; preserved versions and restore; separate AI-edit suggestions; TXT/MD/DOCX/PDF/EPUB and batch ZIP exports; model settings/list/connectivity/approved downloads; optional explicitly enabled OpenAI-compatible adapter; persistent jobs/cancel/retry/checkpoints; backups/restore; localhost and origin protections; cross-platform setup/start scripts.

## Incomplete or deliberately limited capabilities

- **Live model quality is unverified.** Narrative interpretation, originality, grammatical quality and exact requested length depend on the installed model. The app cannot guarantee originality or copyright clearance.
- **No fine-tuning subsystem.** The inference adapter is separate from analysis and generation, but there is no training UI, training dataset pipeline or weight update implementation.
- **No ANN engine such as FAISS/Chroma.** Local embedding vectors are cached in SQLite and compared with cosine similarity. Retrieval scans compact analyses and keeps only the best bounded set. Source texts are streamed individually for overlap checks, but large collections and semantic checks can still take substantial time. Million-word performance has not been benchmarked.
- **No fuzzy near-duplicate importer.** Exact extracted text, with whitespace normalized, is hashed. Similar-but-different stories are retained. Distinct punctuation remains distinct.
- **No plot-sequence plagiarism detector.** Normalized eight-word overlap and optional embedding cosine signals are implemented. Semantic similarity is not proof of copying; a fresh plot can be semantically close to a source. At most 25 source flags are shown, with up to 12 phrase examples per source. Checks cover the selected reference collections, not the internet or all published fiction.
- **Some analysis is approximate.** Dialogue, syllables, readability and sentence-boundary pacing proxies are heuristic and primarily suited to English. Numeric metrics and assigned-genre charts are implemented; dedicated POV, ending-distribution and tension-curve charts are not. Model-assisted profiles report those characteristics as qualitative interpretations instead.
- **Basic document handling.** No OCR for scanned PDFs, password decryption or advanced document-layout reconstruction. DOCX imports use paragraph text. EPUB follows the spine but may not preserve complex formatting. PDF exports use a bundled font with limited script coverage; prefer DOCX/EPUB for unsupported characters.
- **Local single-user operation.** No accounts, multiuser collaboration or public hosting support. Modal dialogs do not implement a full keyboard focus trap. Autosave runs after a pause and attempts to flush on navigation; wait for “Saved locally” before closing. Browser storage preserves theme/generator preferences; story data lives in SQLite.
- **Long form has bounded context.** Chapters target at most 3,000 words each. Continuity summaries are retained, with the most recent twelve used in chapter prompts. The review pass examines a bounded excerpt (30,000 characters) rather than guaranteeing a full manuscript-level audit. Manual outline approval before generation and live token-by-token prose streaming are not implemented; the outline is selected automatically and available afterwards.
- **Recovery uses checkpoints and explicit retries.** Completed chapter/analysis checkpoints survive restarts; partial in-flight model output is not checkpointed. Imports interrupted while running require re-upload, with completed files deduplicated. Cancellation discards in-flight model output but cannot instantly terminate an Ollama request. There is one worker and no automatic retry loop.
- **Resource safeguards apply to files, not total library size.** Uploads are capped at 30 MB each, archives at 150 MB expanded and 5,000 entries. Very large folder selections may need multiple batches due to multipart parser limits. Backup restore uploads are capped at 500 MB; larger backups can be restored manually with the app stopped.
- **Offline begins after installation.** Dependency installation, model downloads and optional remote processing require connectivity. No hosted dependency is needed during normal local use. Python and Node platform availability were tested on Linux; the Windows/macOS launch scripts were provided but not executed on those operating systems.
