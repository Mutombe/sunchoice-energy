#!/bin/sh
# QA: full-page screenshot of a built page, sliced for review.
# usage: sh _src/tools/shot.sh <page.html> <width> <height> <name>
cd "$(dirname "$0")/../.." || exit 1
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --user-data-dir="$(cygpath -w "$PWD/_src/.shots/prof")" --no-first-run --hide-scrollbars --window-size="$2,$3" --virtual-time-budget=8000 --screenshot="$(cygpath -w "$PWD/_src/.shots/$4.png")" "file:///$(cygpath -m "$PWD")/$1#shot" >/dev/null 2>&1
python _src/tools/slice.py "_src/.shots/$4.png" 2250 $([ "$2" -lt 800 ] && echo "$2" || echo 720)
