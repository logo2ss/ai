import json
import os
import sqlite3
from pathlib import Path
from datetime import datetime, timezone
from contextlib import contextmanager

DATA = Path(os.environ.get('FOLIO_DATA_DIR', str(Path(__file__).resolve().parents[1] / 'data'))).resolve()
DATA.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA / 'folio.sqlite3'

def now():
    return datetime.now(timezone.utc).isoformat()

@contextmanager
def connect():
    db = sqlite3.connect(DB_PATH, timeout=30)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    try:
        with db: yield db
    finally:
        db.close()

def init():
    with connect() as db:
        db.executescript('''
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS collections(id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '', color TEXT DEFAULT '#e7eadb', profile TEXT, version INTEGER DEFAULT 0, updated TEXT);
        CREATE TABLE IF NOT EXISTS stories(id INTEGER PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, hash TEXT UNIQUE NOT NULL, collection_id INTEGER REFERENCES collections ON DELETE SET NULL, genre TEXT DEFAULT 'Uncategorized', tags TEXT DEFAULT '', words INTEGER, created TEXT, analysis TEXT);
        CREATE TABLE IF NOT EXISTS generated(id INTEGER PRIMARY KEY, title TEXT, content TEXT DEFAULT '', genre TEXT, folder TEXT DEFAULT '', favorite INTEGER DEFAULT 0, config TEXT, outline TEXT, originality TEXT, review TEXT, created TEXT, updated TEXT);
        CREATE TABLE IF NOT EXISTS versions(id INTEGER PRIMARY KEY, story_id INTEGER REFERENCES generated ON DELETE CASCADE, content TEXT, label TEXT, created TEXT);
        CREATE TABLE IF NOT EXISTS feedback(id INTEGER PRIMARY KEY, story_id INTEGER REFERENCES generated ON DELETE CASCADE, rating INTEGER, note TEXT, created TEXT);
        CREATE TABLE IF NOT EXISTS jobs(id INTEGER PRIMARY KEY, kind TEXT, status TEXT, progress REAL DEFAULT 0, message TEXT DEFAULT '', payload TEXT, result TEXT, error TEXT, created TEXT, updated TEXT, cancel INTEGER DEFAULT 0);
        CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
        CREATE TABLE IF NOT EXISTS embeddings(hash TEXT PRIMARY KEY, model TEXT, vector TEXT);
        ''')
        # Checkpointed stages can resume. A half-imported batch cannot replay missing upload bytes.
        db.execute("UPDATE jobs SET status=CASE WHEN kind='import' THEN 'failed' ELSE 'queued' END, message='Recovered after restart', error=CASE WHEN kind='import' THEN 'Import interrupted. Re-upload the batch; completed files are deduplicated.' ELSE NULL END WHERE status='running'")

def rows(sql, params=()):
    with connect() as db:
        return [dict(r) for r in db.execute(sql, params).fetchall()]

def one(sql, params=()):
    result = rows(sql, params)
    return result[0] if result else None

def execute(sql, params=()):
    with connect() as db:
        cur = db.execute(sql, params)
        return cur.lastrowid

def setting(key, default=None):
    r = one('SELECT value FROM settings WHERE key=?', (key,))
    return json.loads(r['value']) if r else default

def save_setting(key, value):
    execute('INSERT OR REPLACE INTO settings VALUES (?,?)', (key,json.dumps(value)))

def invalidate(collection_id):
    if collection_id:
        execute('UPDATE collections SET profile=NULL WHERE id=?', (collection_id,))


def iterate(sql, params=()):
    """Stream one record at a time; never load the whole text library into memory."""
    with connect() as conn:
        for row in conn.execute(sql, params):
            yield dict(row)
