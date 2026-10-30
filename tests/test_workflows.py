import io
import json
import zipfile
from pathlib import Path
from unittest.mock import patch
import pytest
from backend import db, jobs, ai, analysis
from backend.documents import extract
from backend.main import app

TEXT='Mara watched the lantern swing above the shore. “Will you stay?” she asked.\n\nThe tide carried an old key into her hand. She opened the gate and walked toward the dawn.'

def collection(client,name='Coastal mysteries'):
    return client.post('/api/collections',json={'name':name,'description':'Stories from the coast'}).json()['id']
def source(client,cid=None,text=TEXT,title='The lantern'):
    return client.post('/api/stories',json={'title':title,'content':text,'collection_id':cid,'genre':'Mystery'})
def run_job(id):
    job=db.one('SELECT * FROM jobs WHERE id=?',(id,))
    db.execute("UPDATE jobs SET status='running' WHERE id=?",(id,))
    try:
        result=jobs.run(job)
        db.execute("UPDATE jobs SET status='completed',progress=100,result=? WHERE id=?",(json.dumps(result),id))
        return result
    except jobs.Cancelled:
        db.execute("UPDATE jobs SET status='cancelled' WHERE id=?",(id,));return None

def fake_complete(prompt,json_mode=False,temperature=None):
    if 'Analyze this fiction' in prompt:return {'narrative_structure':'Quiet opening to hopeful resolution','pacing':'Measured','point_of_view':'Third person','confidence':'Moderate','uncertainties':['Limited sample']}
    if 'Create a fresh premise' in prompt:return {'characters':['Ivo, a clockmaker'],'setting':'An orbital greenhouse','conflict':'A vanishing constellation'}
    if 'Return JSON with title' in prompt:return {'title':'The Clockmaker’s Constellation','characters':['Ivo'],'chapters':[{'title':'The first star','beats':['Discovery','Conflict','Resolution'],'continuity_notes':'Ivo repairs a star map'}]}
    if 'Write only the fiction prose' in prompt:return 'Ivo adjusted the brass telescope until a blue star appeared in the empty sky. He carried its coordinates to the greenhouse, where seedlings turned toward the new light. By morning, the missing constellation had found a new home.'
    if 'Summarize continuity' in prompt:return 'Ivo discovers a star and brings its light to an orbital greenhouse.'
    if 'Review this story' in prompt:return {'issues':[],'needs_revision':False,'summary':'Complete arc within the fixture.'}
    if 'Build a collection storytelling profile' in prompt or 'Summarize recurring GENERAL' in prompt:return {'recurring_patterns':['Measured pacing','Quiet openings'],'confidence':'Moderate','uncertainties':['Small fixture sample']}
    if 'Propose an edit' in prompt:return 'The constellations bloomed above the greenhouse.'
    return 'A revised original passage.'

def generated(client,cid):
    ai.db.save_setting('ai',{'provider':'ollama','url':'http://127.0.0.1:11434','model':'fixture','embedding_model':''})
    with patch('backend.ai.complete',side_effect=fake_complete):
        r=client.post('/api/generate',json={'idea':'A clockmaker finds a missing constellation','word_count':200,'collections':[{'id':cid,'weight':1}]} )
        assert r.status_code==200,r.text
        result=run_job(r.json()['job_id'])
    return result['story_id']

def test_single_text_upload_and_exact_duplicates(client):
    cid=collection(client)
    r=client.post('/api/import',files={'files':('one.txt',TEXT.encode(),'text/plain')},data={'collection_id':str(cid)})
    results=run_job(r.json()['job_id'])['files']
    assert not results[0]['duplicate']
    r=source(client,cid)
    assert r.json()['duplicate']
    assert client.get('/api/dashboard').json()['stats']['source_stories']==1

def test_twenty_story_batch_search_sort_and_persistence(client):
    cid=collection(client)
    files=[('files',(f'story-{i}.md',f'{TEXT}\n\nA distinct chapter number {i}.'.encode(),'text/markdown')) for i in range(20)]
    r=client.post('/api/import',files=files,data={'collection_id':str(cid)})
    result=run_job(r.json()['job_id'])
    assert len(result['files'])==20
    assert all(not s.get('error') for s in result['files'])
    assert client.get('/api/stories').json()['total']==20
    assert client.get('/api/stories?q=story-19').json()['total']==1
    db.init()
    assert client.get('/api/dashboard').json()['stats']['source_stories']==20

@pytest.mark.parametrize('fmt',['pdf','docx','epub'])
def test_document_formats(client,fmt):
    from backend.exporting import export
    data,mime=export({'id':1,'title':'A lantern','content':TEXT},fmt)
    r=client.post('/api/import',files={'files':('story.'+fmt,data,mime)})
    result=run_job(r.json()['job_id'])['files'][0]
    assert not result.get('error'),result
    text=client.get('/api/stories/'+str(result['id'])).json()['content']
    assert 'lantern' in text and 'dawn' in text

def test_zip_continues_after_bad_file(client):
    data=io.BytesIO()
    with zipfile.ZipFile(data,'w') as z:
        z.writestr('folder/story.txt',TEXT)
        z.writestr('bad.exe','bad')
    r=client.post('/api/import',files={'files':('batch.zip',data.getvalue(),'application/zip')})
    results=run_job(r.json()['job_id'])['files']
    assert len(results)==2
    assert sum(bool(x.get('error')) for x in results)==1
    assert client.get('/api/stories').json()['total']==1

@pytest.mark.parametrize('name',['../escape.txt','/absolute.txt','C:\\bad.txt'])
def test_zip_traversal_rejected(client,name):
    data=io.BytesIO()
    with zipfile.ZipFile(data,'w') as z:z.writestr(name,TEXT)
    r=client.post('/api/import',files={'files':('unsafe.zip',data.getvalue(),'application/zip')})
    result=run_job(r.json()['job_id'])
    assert 'Unsafe archive' in result['files'][0]['error']
    assert not client.get('/api/stories').json()['items']

def test_invalid_utf8_and_binary_rejected(client):
    for name,data in [('bad.txt',b'\xff\xfe\x00'),('bad.exe',b'abc'),('empty.pdf',b'bad')]:
        r=client.post('/api/import',files={'files':(name,data,'application/octet-stream')})
        assert run_job(r.json()['job_id'])['files'][0].get('error')

def test_analysis_profile_incremental_and_invalidation(client):
    cid=collection(client)
    sid=source(client,cid).json()['id']
    r=client.post('/api/analyze',json={'collection_id':cid,'use_ai':False})
    run_job(r.json()['job_id'])
    s=client.get('/api/stories/'+str(sid)).json()
    assert s['analysis']['measurements']['words']>20
    assert s['analysis']['interpretation'] is None
    p=client.get('/api/collections').json()[0]['profile']
    assert p['analyzed']==1 and p['version']==1
    source(client,cid,TEXT+'\n\nThis is a distinct second story.','A new shore')
    assert client.get('/api/collections').json()[0]['profile'] is None
    r=client.post('/api/analyze',json={'collection_id':cid,'use_ai':True})
    with patch('backend.ai.complete',side_effect=fake_complete):run_job(r.json()['job_id'])
    p=client.get('/api/collections').json()[0]['profile']
    assert p['analyzed']==2 and p['patterns'] and p['version']>1 and p['synthesis']['recurring_patterns']
    original_analysis=client.get('/api/stories/'+str(sid)).json()['analysis']
    source(client,cid,TEXT+'\nAn extra paragraph is added.','Third shore')
    assert client.get('/api/stories/'+str(sid)).json()['analysis']==original_analysis

def test_profile_mixing_normalizes(client):
    a,b=collection(client,'Mystery'),collection(client,'Drama')
    source(client,a);source(client,b,TEXT+'\nAnother entirely new line.')
    for cid in (a,b):run_job(client.post('/api/analyze',json={'collection_id':cid}).json()['job_id'])
    result=client.post('/api/mix',json={'collections':[{'id':a,'weight':50},{'id':b,'weight':25}]}).json()
    assert sum(s['weight'] for s in result['sources'])==1
    assert result['metrics']['avg_sentence']>0

def test_generation_edit_versions_restore_export_feedback(client):
    cid=collection(client);source(client,cid)
    run_job(client.post('/api/analyze',json={'collection_id':cid}).json()['job_id'])
    sid=generated(client,cid);story=client.get('/api/generated/'+str(sid)).json()
    assert 'Ivo' in story['content'] and story['outline']['chapters']
    assert story['config']['profile']['sources'][0]['version']>0
    assert story['originality']['checked_sources']==1
    assert story['versions']
    r=client.put('/api/generated/'+str(sid),json={'title':story['title'],'content':story['content']+'\n\nA fresh ending.','folder':'Drafts','favorite':True})
    assert r.status_code==200
    edited=client.get('/api/generated/'+str(sid)).json()
    assert len(edited['versions'])==2 and not edited['originality']
    assert client.get('/api/generated?favorite=true&folder=Drafts').json()[0]['id']==sid
    old=client.get(f'/api/generated/{sid}/versions/{story["versions"][0]["id"]}').json()
    assert old['content']==story['content']
    for fmt in ('txt','md','docx','pdf','epub'):
        r=client.get(f'/api/generated/{sid}/export/{fmt}')
        assert r.status_code==200 and len(r.content)>50
    r=client.post('/api/export',json={'ids':[sid],'format':'md'})
    assert zipfile.is_zipfile(io.BytesIO(r.content))
    assert client.post(f'/api/generated/{sid}/feedback',json={'rating':4,'note':'More suspense'}).status_code==200
    assert db.one('SELECT note FROM feedback')['note']=='More suspense'
    with patch('backend.ai.complete',side_effect=fake_complete):
        r=client.post(f'/api/generated/{sid}/assist',json={'selection':'A star fell.','instruction':'Add tension'})
        assert r.json()['suggestion'] and client.get(f'/api/generated/{sid}').json()['content']==edited['content']
    assert client.post(f'/api/generated/{sid}/originality').json()['checked_sources']==1
    copy=client.post(f'/api/generated/{sid}/duplicate').json()['id']
    assert copy!=sid

def test_model_unavailable_and_disabled_remote(client):
    r=client.post('/api/generate',json={'idea':'A new story about a missing island'})
    assert r.status_code==422 and 'model' in r.json()['detail']
    with patch('httpx.Client.get',side_effect=__import__('httpx').ConnectError('unavailable')):
        assert ai.status()['connected'] is False
    r=client.put('/api/settings',json={'provider':'openai','url':'https://example.com','model':'test'})
    assert r.status_code==422
    assert client.put('/api/settings',json={'url':'http://evil.example:11434'}).status_code==422
    assert client.post('/api/models/pull',json={'model':'x','approved':False}).status_code==422

def test_cancellation_checkpoint_and_restart_recovery(client):
    cid=collection(client);source(client,cid)
    id=client.post('/api/analyze',json={'collection_id':cid}).json()['job_id']
    assert client.post(f'/api/jobs/{id}/cancel').status_code==200
    assert run_job(id) is None
    assert client.get('/api/stories/1').json()['analysis'] is None
    g=jobs.enqueue('generate',{'config':{'idea':'An island'}})
    i=jobs.enqueue('import',{'files':[]})
    db.execute("UPDATE jobs SET status='running' WHERE id IN (?,?)",(g,i));db.init()
    assert db.one('SELECT status FROM jobs WHERE id=?',(g,))['status']=='queued'
    assert db.one('SELECT status,error FROM jobs WHERE id=?',(i,))['status']=='failed'
    assert 'Re-upload' in db.one('SELECT error FROM jobs WHERE id=?',(i,))['error']

def test_originality_exact_long_phrase_signal():
    text='One unusual sentence containing several distinct words stood alone beside the river.'
    report=analysis.similarity(text,[{'id':1,'title':'Source','content':text}])
    assert report['flags'][0]['overlap_pct']==100
    assert not analysis.similarity('An entirely different tale unfolded among the distant stars.',[{'id':1,'title':'Source','content':text}])['flags']

def test_backup_restore_and_csrf(client):
    cid=collection(client);source(client,cid)
    backup=client.get('/api/backup').content
    source(client,cid,TEXT+'\nA second story.')
    r=client.post('/api/restore',files={'file':('backup.sqlite3',backup,'application/octet-stream')})
    assert r.status_code==200,r.text
    assert client.get('/api/stories').json()['total']==1
    assert list((db.DATA/'backups').glob('before-restore-*.sqlite3'))
    assert client.post('/api/collections',json={'name':'Untrusted'},headers={'origin':'https://evil.example'}).status_code==403
    assert client.get('/api/dashboard',headers={'host':'evil.example'}).status_code==400

@pytest.mark.skipif(not __import__('os').getenv('FOLIO_REAL_MODEL'),reason='Set FOLIO_REAL_MODEL to an installed Ollama model for an optional real integration test.')
def test_real_ollama_integration(client):
    import os
    db.save_setting('ai',{'provider':'ollama','url':'http://127.0.0.1:11434','model':os.environ['FOLIO_REAL_MODEL'],'embedding_model':''})
    assert ai.status()['connected']
    result=ai.complete('Return JSON with a new original science fiction premise in the premise field.',True)
    assert isinstance(result,dict) and result.get('premise')

def test_generation_resumes_saved_outline_and_chapters(client):
    cid=collection(client);source(client,cid)
    db.save_setting('ai',{'provider':'ollama','url':'http://127.0.0.1:11434','model':'fixture','embedding_model':''})
    jid=client.post('/api/generate',json={'idea':'A clockmaker finds the hidden stars','word_count':200,'collections':[{'id':cid,'weight':1}]}).json()['job_id']
    calls=[]
    def interrupt_review(prompt,json_mode=False,temperature=None):
        calls.append(prompt)
        if 'Review this story' in prompt:raise ai.ModelUnavailable('Simulated process interruption')
        return fake_complete(prompt,json_mode,temperature)
    with patch('backend.ai.complete',side_effect=interrupt_review):
        with pytest.raises(ai.ModelUnavailable):run_job(jid)
    p=json.loads(db.one('SELECT payload FROM jobs WHERE id=?',(jid,))['payload'])
    assert p['state']['outline'] and len(p['state']['chapters'])==1
    db.init()
    assert db.one('SELECT status FROM jobs WHERE id=?',(jid,))['status']=='queued'
    calls.clear()
    with patch('backend.ai.complete',side_effect=lambda prompt,*args: (calls.append(prompt) or fake_complete(prompt,*args))):
        result=run_job(jid)
    assert result['story_id']
    assert not any('Write only the fiction prose' in p or 'Return JSON with title' in p for p in calls)
    assert client.get('/api/dashboard').json()['stats']['generated_stories']==1

def test_worker_records_model_failure_and_retry(client):
    import time
    cid=collection(client);source(client,cid)
    jid=client.post('/api/analyze',json={'collection_id':cid,'use_ai':True}).json()['job_id']
    worker=jobs.Worker()
    with patch('backend.ai.complete',side_effect=ai.ModelUnavailable('Select a model in Settings')):
        worker.start()
        for _ in range(100):
            record=db.one('SELECT * FROM jobs WHERE id=?',(jid,))
            if record['status']=='failed':break
            time.sleep(.01)
        worker.close();worker.thread.join(timeout=2)
    assert record['status']=='failed' and 'Settings' in record['error']
    assert client.post(f'/api/jobs/{jid}/retry').status_code==200
    with patch('backend.ai.complete',side_effect=fake_complete):run_job(jid)
    assert client.get('/api/collections').json()[0]['profile']['patterns']

def test_dedup_preserves_punctuation_distinctions(client):
    assert not source(client,text='Let us eat, grandmother.').json()['duplicate']
    assert not source(client,text='Let us eat grandmother.').json()['duplicate']
    assert source(client,text='Let us eat, grandmother.').json()['duplicate']

def test_incremental_analysis_does_not_downgrade_model_results(client):
    cid=collection(client);sid=source(client,cid).json()['id']
    jid=client.post('/api/analyze',json={'collection_id':cid,'use_ai':True}).json()['job_id']
    with patch('backend.ai.complete',side_effect=fake_complete):run_job(jid)
    old=client.get('/api/stories/'+str(sid)).json()['analysis']
    assert client.post('/api/analyze',json={'collection_id':cid}).status_code==422
    assert client.get('/api/stories/'+str(sid)).json()['analysis']==old
    source(client,cid,TEXT+'\nA new chapter follows.')
    jid=client.post('/api/analyze',json={'collection_id':cid}).json()['job_id']
    payload=json.loads(db.one('SELECT payload FROM jobs WHERE id=?',(jid,))['payload'])
    assert sid not in payload['ids'] and len(payload['ids'])==1

def test_excluded_references_do_not_influence_profile_metrics(client):
    cid=collection(client)
    a=source(client,cid,'A clock rang. Stars flickered.','Short').json()['id']
    b=source(client,cid,TEXT,'Long').json()['id']
    run_job(client.post('/api/analyze',json={'collection_id':cid}).json()['job_id'])
    blended=analysis.blend([{'id':cid,'weight':1}],{b})
    assert blended['metrics']['words']==len(analysis.words('A clock rang. Stars flickered.'))
