"""Run the complete built app on localhost. No network or API key is required."""
import os
import subprocess
import sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
python=root/'.venv'/('Scripts/python.exe' if os.name=='nt' else 'bin/python')
if not python.exists() or not (root/'frontend/dist/index.html').exists():
    sys.exit('Run python scripts/setup.py once before starting Folio.')
print('Folio is opening at http://127.0.0.1:8000 · Ctrl+C to stop',flush=True)
try:subprocess.run([str(python),'-m','uvicorn','backend.main:app','--host','127.0.0.1','--port','8000'],cwd=root,check=True)
except KeyboardInterrupt:pass
