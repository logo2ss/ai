import hashlib
import json
import math
import re
from collections import Counter
from . import db

STOP=set('the a an and to of in on it was is he she they his her their that with for as had i you at not but be from this were by said have'.split())

def words(text): return re.findall(r"\b[\w’'-]+\b", text.lower())
def digest(text): return hashlib.sha256(re.sub(r'\s+', ' ', text).strip().encode('utf-8')).hexdigest()
def chunks(text, size=2200):
    tokens=text.split()
    return [' '.join(tokens[i:i+size]) for i in range(0,len(tokens),size)]

def measurements(text):
    w=words(text); sentences=[s for s in re.split(r'[.!?]+\s*',text) if s.strip()]
    paragraphs=[p for p in re.split(r'\n\s*\n',text) if p.strip()]
    dialogue=re.findall(r'[“"]([^”"\n]+)[”"]',text)
    count=max(1,len(w)); syllables=sum(max(1,len(re.findall(r'[aeiouy]+',x))) for x in w)
    frequencies=Counter(x for x in w if x not in STOP and len(x)>2)
    sections=chunks(text, max(1,math.ceil(count/8)))
    return {'words':len(w),'sentences':len(sentences),'paragraphs':len(paragraphs),'avg_sentence':round(count/max(1,len(sentences)),1),
        'avg_paragraph':round(count/max(1,len(paragraphs)),1),'dialogue_pct':round(sum(len(words(x)) for x in dialogue)/count*100,1),
        'vocabulary_pct':round(len(set(w))/count*100,1),'readability':round(206.835-1.015*count/max(1,len(sentences))-84.6*syllables/count,1),
        'top_words':frequencies.most_common(14),'sections':len(sections),
        'chapter_headings':re.findall(r'(?im)^(?:#{1,3}\s+.+|chapter\s+[^\n]+)',text)[:100],
        'pacing_proxy':[round(len(re.findall(r'[.!?]',s))/max(1,len(words(s)))*100,2) for s in sections],
        'measurement_note':'Dialogue counts quoted spans. Vocabulary is type-token ratio and varies with length. Readability and sentence-boundary density are approximate English-language heuristics, not judgments of quality.'}

def profile(collection_id):
    stories=db.rows('SELECT id,title,genre,analysis FROM stories WHERE collection_id=?',(collection_id,))
    analyzed=[(s,json.loads(s['analysis'])) for s in stories if s['analysis']]
    metrics={key:round(sum(a['measurements'][key] for _,a in analyzed)/len(analyzed),1) for key in ['words','avg_sentence','avg_paragraph','dialogue_pct','vocabulary_pct','readability']} if analyzed else {}
    interpretations=[{'story_id':s['id'],'title':s['title'],'patterns':a.get('interpretation')} for s,a in analyzed if a.get('interpretation')]
    c=db.one('SELECT version,profile FROM collections WHERE id=?',(collection_id,))
    if not c: raise ValueError('Collection does not exist.')
    value={'collection_id':collection_id,'analyzed':len(analyzed),'total':len(stories),'metrics':metrics,'genres':dict(Counter(s['genre'] for s in stories)),
           'patterns':interpretations,'updated':db.now(),'version':c['version']+1}
    if c.get('profile') and json.loads(c['profile']).get('analyzed')==len(analyzed):
        value['synthesis']=json.loads(c['profile']).get('synthesis')
    db.execute('UPDATE collections SET profile=?,version=?,updated=? WHERE id=?',(json.dumps(value),value['version'],db.now(),collection_id))
    return value

def blend(selections, exclude_ids=None):
    active=[]
    for s in selections:
        c=db.one('SELECT * FROM collections WHERE id=?',(s['id'],))
        if c and float(s.get('weight',1))>0:
            p=json.loads(c['profile']) if c['profile'] else profile(c['id'])
            if exclude_ids:
                relevant=[json.loads(row['analysis']) for row in db.rows('SELECT id,analysis FROM stories WHERE collection_id=? AND analysis IS NOT NULL',(c['id'],)) if row['id'] not in exclude_ids]
                p={**p,'metrics':{key:round(sum(a['measurements'][key] for a in relevant)/len(relevant),1) for key in ['words','avg_sentence','avg_paragraph','dialogue_pct','vocabulary_pct','readability']} if relevant else {},'patterns':[a for a in p['patterns'] if a['story_id'] not in exclude_ids]}
            active.append((c,p,float(s.get('weight',1))))
    total=sum(w for _,_,w in active)
    metrics={}
    for key in ['words','avg_sentence','avg_paragraph','dialogue_pct','vocabulary_pct','readability']:
        usable=[(p['metrics'][key],w) for _,p,w in active if key in p['metrics']]
        if usable: metrics[key]=round(sum(v*w for v,w in usable)/sum(w for _,w in usable),1)
    return {'metrics':metrics,'sources':[{'id':c['id'],'name':c['name'],'weight':round(w/total,4),'version':p['version']} for c,p,w in active],
        'synthesis':[{'collection':c['name'],'weight':round(w/total,4),'characteristics':None if exclude_ids else p.get('synthesis')} for c,p,w in active],
        'patterns':[{'collection':c['name'],'influence':round(w/total,4),'patterns':p['patterns'][:30]} for c,p,w in active]}

def ngrams(text,n=8):
    w=words(text); return set(tuple(w[i:i+n]) for i in range(max(0,len(w)-n+1)))

def similarity(text, sources, semantic=None):
    candidates=ngrams(text); flags=[]
    for source in sources:
        overlap=candidates & ngrams(source['content'])
        if overlap:
            flags.append({'story_id':source['id'],'title':source['title'],'matched_phrases':[' '.join(x) for x in sorted(overlap)[:12]],'overlap_count':len(overlap),'overlap_pct':round(len(overlap)/max(1,len(candidates))*100,2)})
    return {'flags':sorted(flags,key=lambda x:-x['overlap_count'])[:25],'checked_sources':len(sources),'semantic':semantic or [],
        'method':'Normalized exact eight-word overlap; optional local embedding cosine similarity. Flags are review signals, not proof of plagiarism.',
        'notice':'Automated checks cannot guarantee originality or freedom from copyright issues.'}
