#!/usr/bin/env python3
"""Regenerate the README screenshots.

Serves the repository, loads each macro into the preview harness with a stubbed
Foundry API, and captures a full-height PNG of the rendered window.

    python3 tools/preview/capture.py            # all shots
    python3 tools/preview/capture.py downtime   # one shot, by name

Needs Chrome or Chromium on PATH, or Chrome installed as a Flatpak. Nothing
else — no Node, no Puppeteer, no package manager.
"""

import functools
import http.server
import re
import shutil
import socketserver
import subprocess
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "screenshots"
WIDTH = 1000

# Tallest window worth putting in a README. Past this the console keeps its own
# scrollbar, exactly as it does in Foundry.
MAX_HEIGHT = 1900

# The console clamps its scroll area to `100vh - 140px`; the rest is the window
# header and the page padding around it.
CHROME_HEIGHT = 79

# name -> (macro path under macros/, fixture from fixtures.js, output png)
SHOTS = {
    "downtime": (
        "season-of-ghosts/fall-downtime-tracker.js", "downtime",
        "season-of-ghosts/fall-downtime-tracker.png"),
    "festival": (
        "season-of-ghosts/first-long-night-console.js", "festival",
        "season-of-ghosts/first-long-night-console.png"),
    "games": (
        "season-of-ghosts/first-long-night-console.js", "games",
        "season-of-ghosts/first-long-night-games.png"),
    "path": (
        "season-of-ghosts/enlightened-path-console.js", "path",
        "season-of-ghosts/enlightened-path-console.png"),
}


def find_chrome():
    for exe in ("google-chrome", "chromium", "chromium-browser", "google-chrome-stable"):
        if shutil.which(exe):
            return [exe]
    if shutil.which("flatpak"):
        listed = subprocess.run(["flatpak", "list", "--app", "--columns=application"],
                                capture_output=True, text=True).stdout
        if "com.google.Chrome" in listed:
            return ["flatpak", "run", "com.google.Chrome"]
    sys.exit("No Chrome or Chromium found. Install one, or capture manually.")


def chrome(base, args):
    return subprocess.run(
        base + ["--headless=new", "--disable-gpu", "--hide-scrollbars",
                "--virtual-time-budget=5000"] + args,
        capture_output=True, text=True, timeout=120)


def serve():
    """Serve the repo on a free port, so a preview server already running on a
    fixed port doesn't collide with a capture run."""
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

    handler = functools.partial(Quiet, directory=str(ROOT))
    httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, httpd.server_address[1]


def capture(base, port, name):
    macro, seed, out = SHOTS[name]
    url = f"http://127.0.0.1:{port}/tools/preview/?macro={macro}&seed={seed}"
    dest = OUT / out
    dest.parent.mkdir(parents=True, exist_ok=True)

    # Pass one: unclamped, so the harness can report how tall the console wants
    # to be. Same width as the capture, since the layout is width-dependent.
    dom = chrome(base, [f"--window-size={WIDTH},800", "--dump-dom", url + "&fit=1"]).stdout
    match = re.search(r"<title>preview:(\d+)</title>", dom)
    if not match:
        sys.exit(f"{name}: harness never finished rendering — check the page in a browser")
    height = min(int(match.group(1)) + CHROME_HEIGHT, MAX_HEIGHT)

    # Pass two: capture at that size, with the console's own clamp back in
    # force so a long one ends flush instead of being cut off mid-panel.
    chrome(base, [f"--window-size={WIDTH},{height}", f"--screenshot={dest}", url])
    if not dest.exists():
        sys.exit(f"{name}: chrome wrote no file")
    print(f"  {out}  {WIDTH}x{height}  {dest.stat().st_size // 1024} KB")


def main():
    names = sys.argv[1:] or list(SHOTS)
    unknown = [n for n in names if n not in SHOTS]
    if unknown:
        sys.exit(f"Unknown shot(s): {', '.join(unknown)}. Known: {', '.join(SHOTS)}")

    base = find_chrome()
    httpd, port = serve()
    print(f"serving {ROOT} on :{port}")
    try:
        for name in names:
            capture(base, port, name)
    finally:
        httpd.shutdown()


if __name__ == "__main__":
    main()
