import io
import re
import zipfile
from html.parser import HTMLParser
from pathlib import PurePosixPath
from xml.etree import ElementTree as ET

MAX_FILE = 30 * 1024 * 1024
MAX_ARCHIVE = 150 * 1024 * 1024
SUPPORTED = {'.txt', '.md', '.pdf', '.docx', '.epub'}

class TextHTML(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts=[]; self.skip=0
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style'): self.skip+=1
        if tag in ('p','div','br','h1','h2','h3','li'): self.parts.append('\n')
    def handle_endtag(self,tag):
        if tag in ('script','style'): self.skip=max(0,self.skip-1)
        if tag in ('p','div','h1','h2','h3'): self.parts.append('\n')
    def handle_data(self,data):
        if not self.skip: self.parts.append(data)

def normalize(text):
    text=text.replace('\r\n','\n').replace('\r','\n').replace('\x00','')
    return re.sub(r'\n{3,}', '\n\n', text).strip()

def safe_entries(z):
    entries=z.infolist()
    if len(entries)>5000 or sum(e.file_size for e in entries)>MAX_ARCHIVE:
        raise ValueError('Archive expands beyond the 150 MB / 5,000 entry safety limit. Split the archive.')
    for e in entries:
        path=PurePosixPath(e.filename.replace('\\','/'))
        if path.is_absolute() or '..' in path.parts or ':' in e.filename or ((e.external_attr>>16)&0o170000)==0o120000:
            raise ValueError('Unsafe archive path or symbolic link rejected.')
        if e.file_size>MAX_FILE or (e.file_size>1_000_000 and e.file_size/max(1,e.compress_size)>300):
            raise ValueError('Archive entry exceeds safe decompression limits.')
    return entries

def extract(name, data):
    if len(data)>MAX_FILE: raise ValueError('File exceeds the 30 MB safety limit.')
    ext=PurePosixPath(name.lower()).suffix
    if ext not in SUPPORTED: raise ValueError('Unsupported file type. Use TXT, MD, PDF, DOCX, or EPUB.')
    if ext in ('.txt','.md'):
        try: text=data.decode('utf-8-sig')
        except UnicodeDecodeError: raise ValueError('Text files must use UTF-8 encoding.')
    elif ext=='.pdf':
        from pypdf import PdfReader
        reader=PdfReader(io.BytesIO(data))
        if reader.is_encrypted: raise ValueError('Password-protected PDFs are not supported.')
        text='\n\n'.join(p.extract_text() or '' for p in reader.pages)
    else:
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            safe_entries(z)
            if ext=='.docx':
                from docx import Document
                doc=Document(io.BytesIO(data)); text='\n\n'.join(p.text for p in doc.paragraphs)
            else:
                # EPUB spine defines reading order; filesystem ordering does not.
                container=ET.fromstring(z.read('META-INF/container.xml'))
                opf=container.find('.//{*}rootfile').attrib['full-path']
                root=ET.fromstring(z.read(opf)); base=PurePosixPath(opf).parent
                manifest={i.attrib['id']:i.attrib['href'] for i in root.findall('.//{*}manifest/{*}item')}
                parts=[]
                for item in root.findall('.//{*}spine/{*}itemref'):
                    path=str(base / manifest[item.attrib['idref']]).split('#')[0]
                    parser=TextHTML(); parser.feed(z.read(path).decode('utf-8')); parts.append(''.join(parser.parts))
                text='\n\n'.join(parts)
    text=normalize(text)
    if not text or len(re.findall(r'\w+',text))<3: raise ValueError('No readable story text found. Scanned PDFs require OCR first.')
    return text

def unpack(name,data):
    if not name.lower().endswith('.zip'):
        yield name,data; return
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        for e in safe_entries(z):
            if not e.is_dir() and not PurePosixPath(e.filename).name.startswith('.'):
                yield e.filename,z.read(e)
