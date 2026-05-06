from pathlib import Path
import sys


# Allow importing `app` from the backend root.
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app import app  # noqa: E402


# Vercel Python runtime looks for a WSGI-compatible callable.
application = app
