from pathlib import Path
import sys

# Deployment keeps third-party libraries outside both runtime and application.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "lib"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from luma_api import main

if __name__ == "__main__":
    main()
