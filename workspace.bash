#!/usr/bin/env bash

#
# Copyright (c) 2016 Erik Nordstrøm <erik@nordstroem.no>
#
# Permission to use, copy, modify, and/or distribute this software for any
# purpose with or without fee is hereby granted, provided that the above
# copyright notice and this permission notice appear in all copies.
#
# THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
# WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
# MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
# ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
# WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
# ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
# OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
#

#
# Creates workspace for klondike development consisting of four terminals.
# One for main source, one for main header, one for general tasks (git etc.)
# and one terminal to run the autothing.bash script.
#
# XXX: _NET_WM_PID in general is unreliable but appears to be
#      set correctly for urxvt256c-ml on my Fedora 23 desktop
#      so I choose to rely on it in this script.
#

# Given a process id (pid) as $1, try to find window id (wid).
function get_wid_by_pid ()
{
  xwininfo -root -tree 2>/dev/null \
    | sed 's/^\s\+//' | cut -d' ' -f1 | egrep ^0x \
    | { while read wid ; do
        echo -n "$wid "
        xprop -id $wid _NET_WM_PID
        done | grep -v not | cut -d' ' -f1,4
      } \
    | egrep " $1$" | cut -d' ' -f1
}

cd ~/src/github.com/en90/klondike/ || exit 1

# Launch terminals
urxvt256c-ml -e $EDITOR "src/klondike.c" 2>/dev/null &
pid_term[0]=$!
urxvt256c-ml -e $EDITOR "src/klondike.h" 2>/dev/null &
pid_term[1]=$!
urxvt256c-ml 2>/dev/null &
pid_term[2]=$!
urxvt256c-ml -e ./autothing.bash 2>/dev/null &
pid_term[3]=$!

# Find wids of terminals or die tryin'
search=("${pid_term[@]}") # copy array
until [ -z "${search[*]}" ] ; do # there are pids without wids
  for i in ${!search[@]} ; do # indexes of remaining pids
    pid_cur=${search[i]}
    wid_cur=$(get_wid_by_pid $pid_cur) # empty or wid
    if [ ! -z "$wid_cur" ] ; then # got non-empty wid
      wid_term[i]=$wid_cur
      unset search[i] # remove pid from search list
    else
      kill -0 $pid_cur 2>/dev/null
      if [ "$?" -ne "0" ] ; then # process not running
        kill ${pid_term[*]} 2>/dev/null # kill 'em all
        exit 2
      fi
    fi
  done
done

ox=$(( $( xwininfo -root | egrep '^  Width:' | cut -d' ' -f4 ) / 2 ))
oy=$(( $( xwininfo -root | egrep '^  Height:' | cut -d' ' -f4 ) / 2 ))

tw=$( xwininfo -id ${wid_term[0]} | egrep '^  Width:' | cut -d' ' -f4 )
th=$( xwininfo -id ${wid_term[0]} | egrep '^  Height:' | cut -d' ' -f4 )

lx=$(( $ox - $tw - 6 ))
ly=$(( $oy + $th + 16 ))

for i in ${!wid_term[@]} ; do
  cx=$(( $lx + ($i % 2) * ($tw + 12) ))
  cy=$(( $ly + ((-1) ^ ($i <= 1)) * ($th + 32) ))
  echo ${pid_term[i]} ${wid_term[i]} $cx $cy
  xdotool windowmove ${wid_term[i]} $cx $cy
done

# trigger build
touch src/klondike.c
