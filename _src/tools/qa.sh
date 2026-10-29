#!/bin/sh
# QA run: sh _src/tools/qa.sh <width> <height> <outname>   (site must be served on 127.0.0.1:5500)
# Writes _src/.shots/<outname>.json (one JSON array per line, one line per page) and prints console errors.
cd "$(dirname "$0")/../.." || exit 1
mkdir -p _src/.shots; : > "_src/.shots/$3.json"; : > "_src/.shots/$3.log"
for p in index about services solutions projects contact; do
  "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --user-data-dir="$(cygpath -w "$PWD/_src/.shots/prof")" --no-first-run --window-size=1400,1000 --enable-logging=stderr --v=0 --virtual-time-budget=30000 --dump-dom "http://127.0.0.1:5500/_src/tools/qa.html?w=$1&h=$2&pages=$p" 2>>"_src/.shots/$3.log" | sed -n 's/.*<pre id="out">\(.*\)<\/pre>.*/\1/p' >> "_src/.shots/$3.json"
done
grep -E "CONSOLE|Failed to load resource|net::ERR" "_src/.shots/$3.log" | head -20
