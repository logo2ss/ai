import io
import json
import os
import re
import sqlite3
import tempfile
import uuid
import zipfile
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import FileResponse, Response, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from . import db, jobs, ai, analysis
from .documents import MAX_FILE, normalize
from .exporting import export

worker=jobs.Worker()
@asynccontextmanager
async def lifespan(app):
    db.init()
    if os.getenv('FOLIO_DISABLE_WORKER')!='1':worker.start()
    yield
    worker.close()

app=FastAPI(title='Folio · Local Story Studio',lifespan=lifespan)

@app.middleware('http')
async def local_security(request: Request,call_next):
    host=request.headers.get('host','').split(':')[0]
    if host not in ('127.0.0.1','localhost','[','testserver'):
        return JSONResponse({'detail':'Folio accepts localhost requests only.'},400)
    if request.method not in ('GET','HEAD','OPTIONS'):
        origin=request.headers.get('origin')
        if origin and origin not in ('http://127.0.0.1:8000','http://localhost:8000','http://127.0.0.1:5173','http://localhost:5173'):
            return JSONResponse({'detail':'Cross-origin changes are blocked.'},403)
    response=await call_next(request)
    response.headers['X-Content-Type-Options']='nosniff'
    response.headers['Referrer-Policy']='no-referrer'
    response.headers['X-Frame-Options']='DENY'
    return response

@app.exception_handler(ValueError)
async def value_error(request,exc):return JSONResponse({'detail':str(exc)},422)
@app.exception_handler(sqlite3.IntegrityError)
async def integrity_error(request,exc):return JSONResponse({'detail':'This item conflicts with existing data or a collection no longer exists.'},409)

def require(table,id):
    if table not in ('stories','collections','generated','jobs'):raise ValueError('Invalid record type')
    r=db.one(f'SELECT * FROM {table} WHERE id=?',(id,))
    if not r:raise HTTPException(404,'Item not found')
    return r

def decoded(r,fields):
    for f in fields:
        if r.get(f):r[f]=json.loads(r[f])
    return r

class Collection(BaseModel):
    name:str=Field(min_length=1,max_length=120)
    description:str=Field(default='',max_length=2000)
    color:str='#e7eadb'

@app.get('/api/dashboard')
def dashboard():
    return {'stats':db.one('''SELECT (SELECT COUNT(*) FROM stories) source_stories, (SELECT COUNT(*) FROM collections) collections,
    (SELECT COALESCE(SUM(words),0) FROM stories) source_words,(SELECT COUNT(*) FROM generated) generated_stories,
    (SELECT COUNT(*) FROM stories WHERE analysis IS NOT NULL) analyzed,(SELECT COUNT(*) FROM jobs WHERE status IN ('queued','running')) active_jobs'''),
    'generated_words':sum(len(analysis.words(s['content'])) for s in db.rows('SELECT content FROM generated')),
    'genres':db.rows('SELECT genre,COUNT(*) count FROM stories GROUP BY genre ORDER BY count DESC'),
    'recent':db.rows('SELECT id,title,genre,words,created,collection_id,analysis IS NOT NULL analyzed FROM stories ORDER BY id DESC LIMIT 5'),
    'activity':db.rows('SELECT id,kind,status,message,created FROM jobs ORDER BY id DESC LIMIT 6')}

@app.get('/api/collections')
def collections():
    return [decoded(r,['profile']) for r in db.rows('SELECT c.*, COUNT(s.id) story_count,COALESCE(SUM(s.words),0) words FROM collections c LEFT JOIN stories s ON c.id=s.collection_id GROUP BY c.id ORDER BY c.id DESC')]
@app.post('/api/collections')
def new_collection(c:Collection):
    return {'id':db.execute('INSERT INTO collections(name,description,color,updated) VALUES (?,?,?,?)',(c.name.strip(),c.description,c.color,db.now()))}
@app.put('/api/collections/{id}')
def edit_collection(id:int,c:Collection):
    require('collections',id);db.execute('UPDATE collections SET name=?,description=?,color=?,updated=? WHERE id=?',(c.name,c.description,c.color,db.now(),id));return {'ok':True}
@app.delete('/api/collections/{id}')
def delete_collection(id:int):
    require('collections',id);db.execute('DELETE FROM collections WHERE id=?',(id,));return {'ok':True}
@app.post('/api/collections/{id}/profile')
def refresh_profile(id:int):
    require('collections',id);return analysis.profile(id)

class Source(BaseModel):
    title:str=Field(min_length=1,max_length=250)
    content:str=Field(min_length=3,max_length=15_000_000)
    collection_id:int|None=None
    genre:str='Uncategorized'
    tags:str=''

@app.get('/api/stories')
def stories(q:str='',collection_id:int|None=None,sort:str='newest',page:int=1,genre:str=''):
    where=['1=1'];params=[]
    if q:where.append('(title LIKE ? OR content LIKE ? OR tags LIKE ?)');params.extend(['%'+q+'%']*3)
    if collection_id:where.append('collection_id=?');params.append(collection_id)
    if genre:where.append('genre=?');params.append(genre)
    order={'newest':'id DESC','oldest':'id ASC','length':'words DESC','title':'title COLLATE NOCASE','genre':'genre','collection':'collection_id'}.get(sort,'id DESC')
    clause=' AND '.join(where);total=db.one('SELECT COUNT(*) n FROM stories WHERE '+clause,params)['n']
    result=db.rows('SELECT id,title,collection_id,genre,tags,words,created,analysis IS NOT NULL analyzed FROM stories WHERE '+clause+' ORDER BY '+order+' LIMIT 40 OFFSET ?',[*params,(max(1,page)-1)*40])
    return {'items':result,'total':total,'page':max(1,page)}
@app.post('/api/stories')
def paste_story(s:Source):
    text=normalize(s.content)
    if len(analysis.words(text))<3:raise ValueError('Enter at least three words of story text.')
    return jobs.import_story(s.title,text,s.collection_id,s.genre,s.tags)
@app.get('/api/stories/{id}')
def story(id:int):return decoded(require('stories',id),['analysis'])
@app.put('/api/stories/{id}')
def edit_source(id:int,s:Source):
    old=require('stories',id);text=normalize(s.content)
    db.execute('UPDATE stories SET title=?,content=?,hash=?,collection_id=?,genre=?,tags=?,words=?,analysis=? WHERE id=?',(s.title,text,analysis.digest(text),s.collection_id,s.genre,s.tags,len(analysis.words(text)),None if old['content']!=text else old['analysis'],id))
    db.invalidate(old['collection_id']);db.invalidate(s.collection_id);return {'ok':True}
@app.delete('/api/stories/{id}')
def delete_source(id:int):
    old=require('stories',id);db.execute('DELETE FROM stories WHERE id=?',(id,));db.invalidate(old['collection_id']);return {'ok':True}
@app.post('/api/import')
async def upload(files:list[UploadFile]=File(...),collection_id:int|None=Form(None),genre:str=Form('Uncategorized')):
    if collection_id:require('collections',collection_id)
    staged=[];directory=db.DATA/'uploads';directory.mkdir(exist_ok=True)
    try:
        for file in files:
            path=directory/uuid.uuid4().hex;size=0
            with path.open('wb') as out:
                staged.append({'name':file.filename or 'unnamed.txt','path':str(path)})
                while chunk:=await file.read(1024*1024):
                    size+=len(chunk)
                    if size>MAX_FILE:raise HTTPException(413,'Each file or ZIP may be at most 30 MB.')
                    out.write(chunk)
        return {'job_id':jobs.enqueue('import',{'files':staged,'collection_id':collection_id,'genre':genre})}
    except Exception:
        for f in staged:Path(f['path']).unlink(missing_ok=True)
        raise

class Analyze(BaseModel):
    ids:list[int]=[]
    collection_id:int|None=None
    use_ai:bool=False
@app.post('/api/analyze')
def analyze(body:Analyze):
    ids=body.ids or [s['id'] for s in db.rows('SELECT id,analysis FROM stories'+(' WHERE collection_id=?' if body.collection_id else ''),(body.collection_id,) if body.collection_id else ()) if not s['analysis'] or (body.use_ai and not json.loads(s['analysis']).get('interpretation'))]
    if not ids:raise ValueError('No stories need this analysis. Add stories or enable model-assisted interpretation. Existing results were preserved.')
    return {'job_id':jobs.enqueue('analysis',{'ids':ids,'use_ai':body.use_ai})}

class MixItem(BaseModel):
    id:int
    weight:float=Field(default=1,ge=0,le=100)
class Mix(BaseModel):
    collections:list[MixItem]=Field(default_factory=list,max_length=20)
@app.post('/api/mix')
def mix(body:Mix):return analysis.blend([x.model_dump() for x in body.collections])
class Generate(BaseModel):
    idea:str=Field(min_length=5,max_length=6000)
    title:str=Field(default='',max_length=250)
    genre:str='Literary fiction'
    word_count:int=Field(default=1500,ge=100,le=100000)
    chapters:int=Field(default=1,ge=1,le=100)
    language:str='English'
    audience:str='Adults'
    reading_age:str='Adult'
    pov:str='Third person'
    tense:str='Past'
    characters:str=Field(default='',max_length=4000)
    character_count:int=Field(default=2,ge=1,le=30)
    relationships:str=''
    protagonist_goals:str=''
    pacing:str='Balanced'
    emotion:int=Field(default=50,ge=0,le=100)
    dialogue:int=Field(default=40,ge=0,le=100)
    description:int=Field(default=50,ge=0,le=100)
    suspense:int=Field(default=50,ge=0,le=100)
    humor:int=Field(default=20,ge=0,le=100)
    complexity:str='Moderate'
    ending:str='Hopeful'
    creativity:int=Field(default=70,ge=0,le=100)
    twists:int=Field(default=1,ge=0,le=20)
    influence:int=Field(default=60,ge=0,le=100)
    collections:list[MixItem]=Field(default_factory=list,max_length=20)
    emphasize_ids:list[int]=[]
    exclude_ids:list[int]=[]
@app.post('/api/generate')
def generate(body:Generate):
    if body.word_count/body.chapters>3000:raise ValueError('Use more chapters to keep each chapter at or below 3,000 target words.')
    if not ai.config().get('model'):raise ValueError('Choose a local language model in Settings before generating.')
    return {'job_id':jobs.enqueue('generate',{'config':body.model_dump()})}

@app.get('/api/jobs')
def get_jobs():
    return [decoded(r,['result']) for r in db.rows('SELECT id,kind,status,progress,message,error,result,created,updated FROM jobs ORDER BY id DESC LIMIT 60')]
@app.post('/api/jobs/{id}/cancel')
def cancel_job(id:int):
    r=require('jobs',id)
    if r['status'] in ('queued','running'):
        db.execute("UPDATE jobs SET cancel=1,status='cancelled',message='Cancellation requested. In-flight model output will be discarded.' WHERE id=?",(id,))
        if r['kind']=='import' and r['status']=='queued':
            for file in json.loads(r['payload']).get('files',[]):Path(file['path']).unlink(missing_ok=True)
    return {'ok':True}
@app.post('/api/jobs/{id}/retry')
def retry_job(id:int):
    r=require('jobs',id)
    if r['status'] not in ('failed','cancelled'):raise ValueError('Only failed or cancelled jobs can be retried.')
    if r['kind']=='import':raise ValueError('Re-upload the batch. Already imported files will be deduplicated.')
    db.execute("UPDATE jobs SET status='queued',cancel=0,error=NULL WHERE id=?",(id,));return {'ok':True}

@app.get('/api/generated')
def generated(q:str='',genre:str='',sort:str='newest',favorite:bool=False,folder:str=''):
    condition=' WHERE (title LIKE ? OR content LIKE ?)';params=['%'+q+'%']*2
    if genre:condition+=' AND genre=?';params.append(genre)
    if favorite:condition+=' AND favorite=1'
    if folder:condition+=' AND folder=?';params.append(folder)
    order='id ASC' if sort=='oldest' else 'id DESC'
    return db.rows('SELECT id,title,genre,folder,favorite,created,updated,substr(content,1,250) preview FROM generated'+condition+' ORDER BY '+order,params)
@app.get('/api/generated/{id}')
def get_generated(id:int):
    r=decoded(require('generated',id),['config','outline','originality','review'])
    r['versions']=db.rows('SELECT id,label,created FROM versions WHERE story_id=? ORDER BY id DESC',(id,));return r
class Edit(BaseModel):
    title:str=Field(min_length=1,max_length=250)
    content:str=Field(max_length=10_000_000)
    label:str='Manual edit'
    favorite:bool=False
    folder:str=''
@app.put('/api/generated/{id}')
def save_generated(id:int,body:Edit):
    old=require('generated',id)
    with db.connect() as conn:
        if old['content']!=body.content:conn.execute('INSERT INTO versions(story_id,content,label,created) VALUES (?,?,?,?)',(id,body.content,body.label,db.now()))
        # The old originality report is explicitly invalidated by edits.
        conn.execute('UPDATE generated SET title=?,content=?,folder=?,favorite=?,updated=?,originality=? WHERE id=?',(body.title,body.content,body.folder,body.favorite,db.now(),None if old['content']!=body.content else old['originality'],id))
    return {'saved':db.now()}
@app.delete('/api/generated/{id}')
def delete_generated(id:int):
    require('generated',id);db.execute('DELETE FROM generated WHERE id=?',(id,));return {'ok':True}
@app.post('/api/generated/{id}/duplicate')
def duplicate(id:int):
    s=require('generated',id)
    with db.connect() as conn:
        cur=conn.execute('INSERT INTO generated(title,content,genre,folder,config,outline,originality,review,created,updated) VALUES (?,?,?,?,?,?,?,?,?,?)',(s['title']+' (copy)',s['content'],s['genre'],s['folder'],s['config'],s['outline'],s['originality'],s['review'],db.now(),db.now()))
        sid=cur.lastrowid
        conn.execute('INSERT INTO versions(story_id,content,label,created) VALUES (?,?,?,?)',(sid,s['content'],'Duplicated original',db.now()))
    return {'id':sid}
@app.get('/api/generated/{id}/versions/{version}')
def version(id:int,version:int):
    r=db.one('SELECT * FROM versions WHERE id=? AND story_id=?',(version,id))
    if not r:raise HTTPException(404,'Version not found')
    return r
@app.post('/api/generated/{id}/originality')
def recheck(id:int):
    s=require('generated',id);c=json.loads(s['config'])['request'];report=jobs.originality(s['content'],jobs.source_rows(c))
    db.execute('UPDATE generated SET originality=? WHERE id=?',(json.dumps(report),id));return report
class Assist(BaseModel):
    selection:str=Field(min_length=1,max_length=20000)
    instruction:str=Field(min_length=2,max_length=2000)
@app.post('/api/generated/{id}/assist')
def assist(id:int,body:Assist):
    s=require('generated',id)
    return {'suggestion':ai.complete('Propose an edit to this selected passage. Return revised passage only. Keep original names and continuity. User edit request: '+json.dumps(body.instruction)+'\nOutline: '+str(s['outline'])[:8000]+'\nUntrusted selected text: '+json.dumps(body.selection))}
class Feedback(BaseModel):
    rating:int=Field(ge=1,le=5)
    note:str=Field(default='',max_length=2000)
@app.post('/api/generated/{id}/feedback')
def feedback(id:int,body:Feedback):
    require('generated',id);db.execute('INSERT INTO feedback(story_id,rating,note,created) VALUES (?,?,?,?)',(id,body.rating,body.note,db.now()));return {'ok':True}

def filename(s):return (re.sub(r'[^\w -]','',s['title'])[:100] or 'story')
@app.get('/api/generated/{id}/export/{fmt}')
def export_one(id:int,fmt:Literal['txt','md','docx','pdf','epub']):
    s=require('generated',id);data,mime=export(s,fmt)
    # ASCII fallback avoids invalid HTTP headers for Unicode titles.
    return Response(data,media_type=mime,headers={'Content-Disposition':f'attachment; filename="story-{id}.{fmt}"'})
class BulkExport(BaseModel):
    ids:list[int]=Field(min_length=1,max_length=500)
    format:Literal['txt','md','docx','pdf','epub']='md'
@app.post('/api/export')
def export_many(body:BulkExport):
    out=io.BytesIO()
    with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
        for id in body.ids:
            s=require('generated',id);z.writestr(str(id)+'-'+filename(s)+'.'+body.format,export(s,body.format)[0])
    return Response(out.getvalue(),media_type='application/zip',headers={'Content-Disposition':'attachment; filename="folio-stories.zip"'})

@app.get('/api/settings')
def settings():
    import platform
    return {'ai':ai.config(),'data_dir':str(db.DATA),'platform':platform.system()+' '+platform.machine(),'cpu_count':os.cpu_count(),'remote_key_present':bool(os.environ.get('FOLIO_REMOTE_API_KEY'))}
class AISettings(BaseModel):
    provider:Literal['ollama','openai']='ollama'
    url:str='http://127.0.0.1:11434'
    model:str=Field(default='',max_length=150)
    embedding_model:str=Field(default='',max_length=150)
    temperature:float=Field(default=.8,ge=0,le=2)
    remote_enabled:bool=False
@app.put('/api/settings')
def save_settings(body:AISettings):
    if body.provider=='openai' and not body.remote_enabled:raise ValueError('Explicitly enable remote processing to use an external provider.')
    ai.validate_url(body.url,body.provider=='openai' and body.remote_enabled)
    db.save_setting('ai',body.model_dump());return {'ok':True}
@app.get('/api/models')
def models():return ai.status()
class Pull(BaseModel):
    model:str=Field(min_length=1,max_length=150,pattern=r'^[A-Za-z0-9._:/-]+$')
    approved:bool=False
@app.post('/api/models/pull')
def pull(body:Pull):
    if not body.approved:raise ValueError('Model download requires explicit user approval.')
    return {'job_id':jobs.enqueue('pull',{'model':body.model})}
@app.get('/api/backup')
def backup():
    handle,path=tempfile.mkstemp(suffix='.sqlite3');os.close(handle)
    try:
        with db.connect() as source,sqlite3.connect(path) as dest:source.backup(dest)
        return Response(Path(path).read_bytes(),media_type='application/octet-stream',headers={'Content-Disposition':'attachment; filename="folio-backup.sqlite3"'})
    finally:Path(path).unlink(missing_ok=True)
@app.post('/api/restore')
async def restore(file:UploadFile=File(...)):
    if db.one("SELECT id FROM jobs WHERE status IN ('running','queued') LIMIT 1"):raise ValueError('Finish or cancel active jobs before restoring a backup.')
    directory=db.DATA/'backups';directory.mkdir(exist_ok=True)
    path=directory/(uuid.uuid4().hex+'.sqlite3')
    try:
        size=0
        with path.open('wb') as out:
            while chunk:=await file.read(1024*1024):
                size+=len(chunk)
                if size>500*1024*1024:raise ValueError('Backup exceeds 500 MB upload safeguard. Restore it manually while the app is closed.')
                out.write(chunk)
        with sqlite3.connect(path) as source:
            tables={r[0] for r in source.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            required={'stories','collections','generated','versions','feedback','jobs','settings','embeddings'}
            if not required<=tables or source.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise ValueError('Not a valid Folio backup.')
            # A database is never trusted to supply executable schema, trigger code, job paths, or network configuration.
            with db.connect() as target:
                backup_path=directory/('before-restore-'+uuid.uuid4().hex+'.sqlite3')
                with sqlite3.connect(backup_path) as old:target.backup(old)
                target.execute('PRAGMA foreign_keys=OFF')
                for table in ('feedback','versions','stories','generated','collections','jobs','embeddings'):target.execute('DELETE FROM '+table)
                for table in ('collections','stories','generated','versions','feedback','embeddings'):
                    columns=[r[1] for r in target.execute('PRAGMA table_info('+table+')')]
                    statement='INSERT INTO '+table+' ('+','.join(columns)+') VALUES ('+','.join('?' for _ in columns)+')'
                    for row in source.execute('SELECT '+','.join(columns)+' FROM '+table):target.execute(statement,row)
                if target.execute('PRAGMA foreign_key_check').fetchone():raise ValueError('Backup contains invalid references.')
        return {'ok':True,'message':'Restored library and writing. Current AI settings were preserved. Previous data was backed up locally.'}
    except sqlite3.DatabaseError as e:raise ValueError('Invalid or incompatible backup.') from e
    finally:path.unlink(missing_ok=True)

DIST=Path(__file__).resolve().parents[1]/'frontend'/'dist'
if DIST.exists():
    app.mount('/assets',StaticFiles(directory=DIST/'assets'),name='assets')
    @app.get('/{path:path}')
    def frontend(path:str):
        if path.startswith('api/'):raise HTTPException(404,'API route not found')
        return FileResponse(DIST/'index.html')
