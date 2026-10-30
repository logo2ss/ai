# Folio — local story studio

This app was built from the supplied Story Learning & Generation Studio brief. The existing repository README was not read or changed.

## Install and launch

Requirements: Python 3.10 or newer, Node.js 20.19+ (22.12+ also supported), and a modern browser. Dependency installation needs internet access once. No API key or cloud account is needed.

From this project directory:

```sh
python3 scripts/setup.py
python3 scripts/start.py
```

On Windows use `python` instead of `python3`, or double-click `setup.bat` once and `start.bat` afterwards. On macOS/Linux, `./setup.sh` and `./start.sh` are equivalent. Open **http://127.0.0.1:8000**. Stop with Ctrl+C. Subsequent starts require neither npm nor an internet connection. The frontend is served by the same local backend.

The setup script creates `.venv`, installs the fully pinned Python dependency lock, runs `npm ci` against the committed frontend lockfile, and builds the frontend. It does not modify application source files. An empty workspace is intentional: no fabricated stories or statistics are installed.

## Local AI

1. Install Ollama from https://ollama.com on the computer running Folio.
2. Launch Ollama, or run `ollama serve`.
3. Download a model once: `ollama pull qwen2.5:7b`. A smaller alternative is `qwen2.5:3b`; quality and speed depend on hardware. Allow several GB of disk space and enough RAM for your chosen model.
4. In Settings, keep the local URL `http://127.0.0.1:11434`, test the connection, select the installed language model, and save.
5. Optional: run `ollama pull nomic-embed-text`, then enter `nomic-embed-text` as the embedding model. This enables cached local embedding retrieval and semantic overlap signals. Leaving it empty uses lexical retrieval and exact phrase checks.

The Settings download action requires a checked approval box and reports Ollama's actual progress. The app never downloads models automatically. Once dependencies and models are present, library management, analysis, generation, editing and exports operate offline. No external fonts, scripts, images, analytics or account services are used.

Without a model, imports, search, editing, exports, backups, numeric writing measurements and collection profiles work. Narrative interpretation and story generation require a working model. Missing or unavailable models produce actionable errors; no substitute prose is fabricated.

## First workflow

1. Create a collection under Collections.
2. Import stories under Story Library. Select multiple files, choose a folder, drop files, upload a ZIP, or paste text.
3. Visit Analysis Studio, choose the collection, and analyze it. Measured-only analysis needs no model. Enable model-assisted interpretation for narrative structure, pacing, characters, plot, language, perspective, tense and ending observations.
4. Model-assisted runs also synthesize recurring collection characteristics from compact analysis batches. Check progress through the activity button in the top bar. Operations run in one persistent background queue. Cancel or retry non-import jobs there. Each import has a per-file report; bad files do not stop other files.
5. In Story Generator, select the collection and enter an idea. Simple mode exposes the basics; Advanced mode offers characters, audience, language, tense, pacing, chapters, tone, ending, reference influence and more. Word count is a target, not a guaranteed output length. Targets above 3,000 words must use multiple chapters.
6. Generation retrieves compact characteristics, creates a fresh premise and chapter outline, writes chapters with continuity summaries, checks source overlap, reviews, performs at most one revision pass, then saves. You can leave the page while the task runs. Open the completed story from activity.
7. In the editor, inspect outline, review notes, originality report and version history. Select a passage for AI-assisted changes; accept or discard the separate suggestion. Continue/add-chapter actions append to the selected passage. Manual edits autosave and invalidate stale originality reports. Recheck when finished.
8. Export TXT, Markdown, DOCX, PDF or EPUB. Generated Stories also provides batch ZIP export, favorites, search, sorting, folders, duplication and deletion.
9. Add feedback to influence later prompts. This is preference guidance, not neural training. Mix collections with normalized weights in Story Mixer, preview the metrics, then send the blend to generation.

## Data and recovery

By default, everything is in `data/folio.sqlite3`, relative to this project. Set `FOLIO_DATA_DIR` to choose another directory **before starting**. The example environment file documents optional variables; `.env` is not loaded automatically. No credentials are stored in exported setup instructions.

SQLite WAL transactions protect persistent records. Generated chapters, outlines and analysis segments are checkpointed in job payloads. Interrupted analysis and generation jobs resume from saved stages. Interrupted imports are marked failed with instructions to re-upload; completed stories are deduplicated. Queued uploads are staged locally. Cancelled in-flight model calls are allowed to finish, but their outputs are discarded; a single worker may remain occupied until the call returns or times out.

Back up through Settings for a consistent SQLite snapshot. Restore through Settings while no jobs are active. Restoration replaces library/draft data, preserves current AI settings, and first writes a safety copy in `data/backups/`. It imports data into the known schema instead of executing arbitrary backup schema or replaying stored jobs. Keep backups private; they contain story text. To move an entire workspace manually, stop Folio first and copy the entire data directory.

The app binds only to `127.0.0.1`; request host and browser-origin checks prevent cross-site changes. It is a single-user local app, not a public multiuser server. Archive names, symlinks, expansion sizes and compression ratios are validated. Individual uploads have a 30 MB safety ceiling, archives a 150 MB expanded ceiling and 5,000 entry ceiling. These are file-resource safeguards; there is no total library count limit. Split large batches when needed. Scanned PDFs need external OCR. UTF-8 text is required.

## Optional remote provider

Local inference is the default. OpenAI-compatible inference can be explicitly enabled in Settings with a provider URL, model name and consent checkbox. Set `FOLIO_REMOTE_API_KEY` in the process environment if the provider requires a key. A remote request can transmit source segments, compact analysis, user preferences and generated text; provider costs and policies then apply. Remote processing never activates automatically. Switch back to Ollama to return to local-only processing. Remote embedding APIs are not implemented.

## Development and tests

Backend development: `.venv/bin/python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000` (Windows: `.venv\Scripts\python.exe`).

Frontend development: `cd frontend && npm run dev`. Vite serves `http://127.0.0.1:5173` and proxies `/api` to the backend. Run `npm run build` after changing the frontend for normal single-server startup.

Automated tests: `.venv/bin/python -m pytest -q`.

Optional real-model integration: set `FOLIO_REAL_MODEL` to an installed Ollama model, then run the tests. Without it, the integration test is skipped. Deterministic tests use a mock adapter only in the test suite; production has no mock or fallback model. Tests do not establish real fiction quality.

See `VALIDATION.md` for observed validation and remaining limitations. Each cloud task is isolated; use the existing checkout and do not create a Git worktree unless explicitly requested.

## Troubleshooting

- **No model connection:** start Ollama on the same computer, verify `ollama list`, then check the local address in Settings. In containers, localhost refers to the container; run the app and Ollama together or use a supported local port forward. Public binding is intentionally disabled.
- **Model request failed:** select a downloaded chat-capable model, check available RAM, try a smaller model or fewer words per chapter. Invalid structured output is reported as failure; retry from activity after correcting the cause.
- **Embedding failure:** install the selected embedding model or clear the optional setting. Model-specific embeddings are cached by content and model name in SQLite.
- **Import errors:** expand per-file results in activity. Convert corrupt/encrypted documents, run OCR for scans, use UTF-8 for text, and split oversized archives. Re-upload interrupted batches; duplicate text is skipped.
- **Port 8000 occupied:** stop the other process, or run uvicorn directly with another localhost port. The built-in browser-origin policy permits the documented ports; changing ports requires updating that policy.
- **Node/Python missing:** install the requirements and rerun setup. Runtime startup uses the built assets and Python environment without invoking package registries.
- **Changes do not appear:** rebuild the frontend, stop and restart the backend, then refresh your browser.
