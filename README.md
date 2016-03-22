# klondike

Klondike solitaire card game.

You can check out the progress of the client at
https://www.nordstroem.no/en-US/games/klondike/

## Table of Contents

* [Supported platforms](#supported-platforms)
* [Dependencies](#dependencies)
  - [Debian and derivatives](#debian-and-derivatives)
  - [Fedora and RHEL derivatives](#fedora-and-rhel-derivatives)
* [Build](#build)
* [Run](#run)
* [Debug](#debug)
* [Develop](#develop)
  - [Development workspace](#development-workspace)
  - [`autothing.bash`](#autothingbash)
* [Copyright and license](#copyright-and-license)

## Supported platforms

  * FreeBSD 10.2
  * Fedora 23
  * Debian GNU/Linux 8

## Dependencies

Install [libbsd](http://libbsd.freedesktop.org/wiki/) if `arc4random_uniform(3)`
is not in the libc on your system.

### Debian and derivatives

```bash
sudo apt-get install libbsd-dev
```

### Fedora and RHEL derivatives

```bash
sudo dnf install libbsd-devel
```

## Build

```bash
make
```

## Run

```bash
./build/$( cc -dumpmachine )/debug/klondike
```

## Debug

```bash
./build/$( cc -dumpmachine )/debug/klondike -d 3
```

## Develop

### Development workspace

![Screenshot of klondike workspace](/../screenshots/workspace.png?raw=true)

Included in this repository are a few files relating to
my development workspace for klondike; `workspace.bash`, `workspace.desktop`
and `autothing.bash`. The first of those files is a bash script made for use
on Fedora 23, which when run will launch and arrange four terminals,
each with a task of its own. The second is a [desktop entry file](https://specifications.freedesktop.org/desktop-entry-spec/desktop-entry-spec-latest.html)
which will run the aforementioned script.

The tasks assigned to each of the four terminals are as follows:

* Top left terminal opens `src/server/klondike.c` in `$EDITOR`.
* Top right terminal opens `src/server/klondike.h` in `$EDITOR`.
* Bottom left terminal runs your shell in the root of the klondike repository.
* Bottom right terminal runs `autothing.bash` which we'll get back to.

Additionally, for the workspace script and desktop entry file to work,
the repository root must be at `$HOME/src/github.com/en90/klondike/`.
If you choose to put the repository elsewhere, you must remember to
edit those two files if you want to make use of them.

The development workspace script depends on the 256 color multi-language
version of rxvt-unicode known as `urxvt256c-ml`, because unlike `lxterminal`
which I had been using for a good while up until when I wrote this script,
`urxvt256c-ml` will set `_NET_WM_PID` correctly on Fedora 23 and so
I decided to switch to using `urxvt256c-ml` since I have previously been
a happy user of the 256 color version of rxvt-unicode and I figured that
if I was going to switch away from `lxterminal`, I wanted to see first
if 256 color rxvt-unicode would behave as I wanted with regards to
`_NET_WM_PID` and furthermore, if I was going to switch to that,
I might as well try the multi-language version of it.

So that's what I ended up with.

```bash
sudo dnf install rxvt-unicode-256color-ml
```

Shortly after having written `workspace.bash`, I switched from LXDE to LXQt
because I've been meaning to do so as LXQt appears to be the future of LXDE,
and also I like Qt and welcome LXQt. I tested to see if `qterminal` would
set `_NET_WM_PID` to the expected value and indeed it appeared to.
Now one might say so why not just use qterminal then, but well I won't
because I like rxvt-unicode and the only reason I stopped using rxvt-unicode
was that I didn't bother to install and configure it at some point
and then stopped using it but now that I have it installed and configured
I'll stick with it for the foreseeable future.

My configuration of rxvt-unicode, by the way, simply amounts to
https://github.com/altercation/solarized/blob/master/xresources/solarized
with the following two lines added:

```
URxvt.font: xft:Droid Sans Mono:size=14
URxvt.scrollBar_right: true
```

Subsequently, I did

```bash
sudo dnf install google-droid-sans-mono-fonts
xrdb -merge ~/.Xresources
```

With that in place then, I made the desktop entry file to run the script.
This desktop entry file I then added to the quicklaunch on the LXQt panel.
I did so by modifying `~/.config/lxqt/panel.conf` but one might as well
just drag and drop the desktop entry file onto the quicklaunch widget.

Furthermore after that, I used `lxqt-config` (LXQt Configuration Center)
and a couple of other means to make changes including turning on
focus follows mouse, switching icons theme to *Nimbus*,
LXQt theme to *Ambiance*, setting the desktop background picture
to `/usr/share/backgrounds/f23/extras/fog.jpg`, setting GUI font
to *Noto Sans* and picking a matching color for the panel;
`#88cf8a` with opacity set to about 0.5.
Being able to make these changes requires

```bash
sudo dnf install nimbus-icon-theme f23-backgrounds-extras-base \
                 google-noto-sans-fonts
```

And uh, that about covers everything I did, most of which might not be
very interesting. So there's that.

Sorry about how long this section of the README became.

### `autothing.bash`

The `autothing.bash` script rebuilds klondike and runs it under valgrind
each time a source file is modified. In contrast to the workspace script,
this script works fine on all of the supported platforms of klondike.

To install the dependecies for `autothing.bash`, I do

```bash
sudo pkg install inotify-tools valgrind # on FreeBSD 10.2
```

```bash
sudo dnf install inotify-tools make gcc valgrind # on Fedora 23
```

```bash
sudo apt-get install inotify-tools make gcc valgrind # on Debian GNU/Linux 8
```

## Copyright and license

Copyright (c) 2016 Erik Nordstrøm &lt;erik@nordstroem.no&gt;

Klondike is released under the terms of the ISC license.
See `LICENSE` for details.
