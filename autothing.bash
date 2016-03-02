#!/usr/bin/env bash

# Automatically rebuild and run klondike when source files change.
# Depends on inotifywait, which is part of inotify-tools on Fedora 23.

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

while true; do
  inotifywait -r -e modify,attrib,close_write,move,create,delete \
    "$DIR/src" 2>/dev/null 1>&2 && reset && make \
    && ./build/$( cc -dumpmachine )/debug/klondike -d 3
done
