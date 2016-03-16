#!/usr/bin/env bash

# Automatically rebuild and run klondike when source files change.
# Depends on inotifywait, which is part of inotify-tools on
# FreeBSD 10.2, Fedora 23 and Debian GNU/Linux 8.
# Depends on valgrind.

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

while true; do
  inotifywait -r -e modify,attrib,close_write,move,create,delete \
    "$DIR/src" 2>/dev/null 1>&2 && reset && make \
    && time valgrind -v ./build/$( cc -dumpmachine )/debug/klondike -d 3
done
