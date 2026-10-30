"""One-time dependency install and offline frontend build. Python 3.10+, Node 20.19+."""
import os
import subprocess
import sys
import venv
from pathlib import Path
root=Path(__file__).resolve().parents[1]
os.chdir(root)
python=root/'.venv'/('Scripts/python.exe' if os.name=='nt' else 'bin/python')
if not python.exists():venv.create(root/'.venv',with_pip=True)
subprocess.run([str(python),'-m','pip','install','-r','requirements.lock'],check=True)
npm='npm.cmd' if os.name=='nt' else 'npm'
subprocess.run([npm,'ci','--no-audit','--no-fund'],cwd=root/'frontend',check=True)
subprocess.run([npm,'run','build'],cwd=root/'frontend',check=True)
print('\nReady. Run: python scripts/start.py\nOpen http://127.0.0.1:8000')
