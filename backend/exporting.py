import io
import re
import zipfile
from html import escape

def export(story,fmt):
    title=story['title'];text=story['content']; output=io.BytesIO()
    if fmt in ('txt','md'):
        return ((title+'\n\n'+text) if fmt=='txt' else '# '+title+'\n\n'+text).encode('utf-8'), 'text/plain; charset=utf-8'
    if fmt=='docx':
        from docx import Document
        doc=Document();doc.add_heading(title,0)
        for p in text.split('\n\n'):
            if p.startswith('## '):doc.add_heading(p[3:],1)
            else:doc.add_paragraph(p)
        doc.save(output)
        return output.getvalue(),'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    if fmt=='pdf':
        from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        from pathlib import Path
        # Bundle ReportLab's Unicode-capable Vera font; PDF has limited CJK coverage.
        import reportlab
        font=Path(reportlab.__file__).parent/'fonts'/'Vera.ttf'
        pdfmetrics.registerFont(TTFont('FolioVera',str(font)))
        styles=getSampleStyleSheet()
        for style in styles.byName.values():style.fontName='FolioVera'
        items=[Paragraph(escape(title),styles['Title']),Spacer(1,20)]
        for p in text.split('\n\n'):
            items.append(Paragraph(escape(p.removeprefix('## ')).replace('\n','<br/>'),styles['Heading2'] if p.startswith('## ') else styles['BodyText']));items.append(Spacer(1,10))
        SimpleDocTemplate(output).build(items)
        return output.getvalue(),'application/pdf'
    if fmt=='epub':
        body=''.join('<h2>'+escape(p[3:])+'</h2>' if p.startswith('## ') else '<p>'+escape(p)+'</p>' for p in text.split('\n\n'))
        with zipfile.ZipFile(output,'w') as z:
            z.writestr('mimetype','application/epub+zip',compress_type=zipfile.ZIP_STORED)
            z.writestr('META-INF/container.xml','<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>')
            z.writestr('OEBPS/content.opf','<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">folio-'+str(story['id'])+'</dc:identifier><dc:title>'+escape(title)+'</dc:title><dc:language>en</dc:language><meta property="dcterms:modified">2026-01-01T00:00:00Z</meta></metadata><manifest><item id="story" href="story.xhtml" media-type="application/xhtml+xml"/><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/></manifest><spine><itemref idref="story"/></spine></package>')
            z.writestr('OEBPS/story.xhtml','<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>'+escape(title)+'</title></head><body><h1>'+escape(title)+'</h1>'+body+'</body></html>')
            z.writestr('OEBPS/nav.xhtml','<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Contents</title></head><body><nav epub:type="toc"><ol><li><a href="story.xhtml">'+escape(title)+'</a></li></ol></nav></body></html>')
        return output.getvalue(),'application/epub+zip'
    raise ValueError('Unsupported export format.')
