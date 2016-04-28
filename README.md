# klondike

Klondike solitaire card game server and offline-capable, touch-friendly client.

You can check out the current state of the client at
https://www.nordstroem.no/en-US/games/klondike/

## Table of Contents

* [Supported Server Platforms](#supported-server-platforms)
* [Server Build Dependencies](#server-build-dependencies)
  - [Install Server Build Dependencies on FreeBSD](#install-server-build-dependencies-on-freebsd)
  - [Install Server Build Dependencies on Fedora and Derivatives](#install-server-build-dependencies-on-fedora-and-derivatives)
  - [Install Server Build Dependencies on Debian and Derivatives](#install-server-build-dependencies-on-debian-and-derivatives)
* [Server Run-Time Dependencies](#server-run-time-dependencies)
  - [Install Server Run-Time Dependencies on FreeBSD](#install-server-run-time-dependencies-on-freebsd)
  - [Install Server Run-Time Dependencies on Fedora and Derivatives](#install-server-run-time-dependencies-on-fedora-and-derivatives)
  - [Install Server Run-Time Dependencies on Debian and Derivatives](#install-server-run-time-dependencies-on-debian-and-derivatives)
* [Build](#build)
* [Run](#run)
* [Debug](#debug)
* [Hack](#hack)
  - [Development workspace](#development-workspace)
  - [`autothing.bash`](#autothingbash)
* [Security](#security)
* [Appendix](#appendix)
  - [Appendix A: Check Whether C Compiler Needs `as(1)` and `ld(1)`](#appendix-a-check-whether-c-compiler-needs-as1-and-ld1)
* [Copyright and License](#copyright-and-license)

## Supported Server Platforms

  * FreeBSD 10.2
  * Fedora 23
  * Debian GNU/Linux 8

## Server Build Dependencies

* `strip(1)`, e.g. provided by
  [GNU binutils](https://www.gnu.org/software/binutils/).

* `arc4random_uniform(3)` with development headers. Install
  [libbsd](http://libbsd.freedesktop.org/wiki/) if not in system libc.

* `as(1)` and `ld(1)` if needed, e.g. provided by GNU binutils.
  Your C compiler might have an integrated assembler, and it might
  also be able to work without `ld(1)`. See
  [Appendix A](#appendix-a-check-whether-c-compiler-needs-as1-and-ld1).

* A C compiler such as LLVM [Clang](http://clang.llvm.org/)
  or [the GNU C Compiler](https://gcc.gnu.org/).

* A C preprocessor.

* The [CHICKEN Scheme](https://www.call-cc.org/) compiler and runtime library.

* The following CHICKEN Scheme eggs:
  - [bind](http://wiki.call-cc.org/eggref/4/bind)

* An implementation of Make compatible with the makefiles of this project,
  such as FreeBSD Make or GNU Make.

### Install Server Build Dependencies on FreeBSD

```bash
sudo pkg install chicken
sudo chicken-install bind
```

### Install Server Build Dependencies on Fedora and Derivatives

```bash
sudo dnf install libbsd-devel binutils gcc chicken make
sudo chicken-install bind
```

### Install Server Build Dependencies on Debian and Derivatives

```bash
sudo apt-get install libbsd-dev binutils gcc chicken make
sudo chicken-install bind
```

## Server Run-Time Dependencies

If you've already installed the
[Server Build Dependencies](#server-build-dependencies),
all dependencies required at run-time will have been installed
and no further action is required so you may skip this section.

* `arc4random_uniform(3)`. Install
  [libbsd](http://libbsd.freedesktop.org/wiki/) if not in system libc.

* The [CHICKEN Scheme](https://www.call-cc.org/) runtime library.

On the topic of deployment, the CHICKEN Scheme manual
[says](http://wiki.call-cc.org/man/4/Deployment#self-contained-applications),
among other things:

> The solution to many [...] problems is creating an application directory
> that contains the executable, the runtime libraries, extensions
> and additional support files needed by the program.

There is a trade-off that needs to be considered when deciding
whether to ship a dependency along with a project or to require
separate installation of said dependency, especially so
for dependencies able to be handled by a package manager.

On one hand, providing as much as possible in a single bundle
can help make initial installation easier for users.

On the other hand, whenever bugs are fixed in any of the dependencies,
additional steps must be taken for each bundle in which the dependency
has been deployed.

However, there is of course also the possibility that a new version
of a dependency might break a dependent package and that it is therefore
desired to retain a specific version of a dependency, e.g.
if someone decides to 

For klondike, I have decided to let the system package manager manage
the CHICKEN Scheme runtime library and, where applicable, libbsd,
but to bundle the CHICKEN Scheme extensions (eggs).

In this way, every run-time dependency available via the system package manager
is provided by it and everything else is provided alongside of klondike.
This should make building packages for distribution as painless as possible.
If CHICKEN Scheme eggs were available in FreeBSD pkg, Fedora dnf and
Debian apt-get officiial and default repositories, I would use those.

### Install Server Run-Time Dependencies on FreeBSD

Currently, FreeBSD does not provide a separate package with
just the runtime library of CHICKEN Scheme, so the whole package
with all of CHICKEN Scheme will need to be installed.

```bash
sudo pkg install chicken
```

### Install Server Run-Time Dependencies on Fedora and Derivatives

```bash
sudo dnf install libbsd chicken-libs
```

### Install Server Run-Time Dependencies on Debian and Derivatives

```bash
sudo apt-get install libbsd libchicken7
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

## Hack

>u cant hack or nuthin, i got norton

Jokes aside, this section is not about [security](#security).

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

To install the additional dependencies for `autothing.bash`, I do

```bash
sudo pkg install inotify-tools valgrind # on FreeBSD 10.2
```

```bash
sudo dnf install inotify-tools valgrind # on Fedora 23
```

```bash
sudo apt-get install inotify-tools valgrind # on Debian GNU/Linux 8
```

## Security

TODO: Describe.

## Appendix

### Appendix A: Check Whether C Compiler Needs `as(1)` and `ld(1)`

Some C compilers have an integrated assembler. For example, LLVM Clang
[has it](http://clang.llvm.org/docs/CommandGuide/clang.html#cmdoption-integrated-as):

> [...] enable and disable, respectively, the use of the integrated assembler.
> Whether the integrated assembler is on by default is target dependent.

I wanted to provide a simple way to check whether or not
an arbitrary C compiler running on Unix needs `as(1)` and `ld(1)`,
so I wrote this little test.

If your C compiler has an integrated assembler, and also is able to work
without `ld(1)` in the `$PATH`, then the following set of commands
should results in the hello world program being built and run.

```bash
tee hello.c <<EOF
#include <stdio.h>

int main ()
{
	printf("Hello world!\n");
}
EOF

PATH= $( which cc ) -o hello hello.c && ( ./hello ; rm hello )
rm hello.c
```

If, on the other hand, your C compiler does *not*
have an integrated assembler, then you should
be seeing the build fail with a message like

```
cc: error trying to exec 'as': execvp: No such file or directory
```

I also made a second test, this time to check what happens
when `as(1)` is present but `ld(1)` is not:

```bash
bindir=$( mktemp -d )
ln -s $( which as ) $bindir

tee hello.c <<EOF
#include <stdio.h>

int main ()
{
	printf("Hello world!\n");
}
EOF

PATH=$bindir $( which cc ) -o hello hello.c && ( ./hello ; rm hello )
rm hello.c $bindir/as
rmdir $bindir
```

If `ld(1)` is required, the build should then fail with a message like

```
collect2: fatal error: cannot find 'ld'
```

as it did using gcc 5.3.1 on Fedora 23.

However, I could not find anything to suggest that clang should work
without `ld(1)` -- quite the contrary as seen in a few places
around the net, including the LLVM article on Wikipedia, which
[says](https://en.wikipedia.org/wiki/LLVM#Integrated_linker:_lld):

> Currently, Clang and LLVM must invoke the system or target linker
> to produce an executable.

and also this post to the llvm-dev mailing list from 2016-03-07,
which was quite recent as of this writing:
[Linking the FreeBSD base system with lld -- status update](http://lists.llvm.org/pipermail/llvm-dev/2016-March/096449.html)

Yet when I ran this second test of mine on FreeBSD 10.3-RELEASE,
it was able to build and run the hello world program.

So then I made a directory with just the things I needed to run the test,
which in the case of FreeBSD 10.3-RELEASE on x86\_64 turned out to be
those shown below. (I determined what files I needed by first copying
`/bin/sh` and `/usr/bin/cc`, and then copying whatever files were
complained about as I then chrooted into the directory and ran the test.)

```bash
mkdir -p /tmp/wut/{bin,lib,libexec,tmp,usr/{bin,include/{,sys,machine,x86}}}
cp /bin/{ln,sh} /tmp/wut/bin/
cp /lib/{libedit.so.7,libncurses.so.8,libc.so.7} /tmp/wut/lib/
cp /libexec/ld-elf.so.1 /tmp/wut/libexec/
cp /usr/bin/cc /tmp/wut/usr/bin/
cp /usr/include/stdio.h /tmp/wut/usr/include/
cp /usr/include/sys/{cdefs.h,_null.h,_types.h} /tmp/wut/usr/include/sys/
cp /usr/include/machine/_types.h /tmp/wut/usr/include/machine/
cp /usr/include/x86/_types.h /tmp/wut/usr/include/x86/

tee /tmp/wut/hello.c <<EOF
#include <stdio.h>

int main ()
{       
        printf("Hello world!\n");
}
EOF
```

And chrooted into that

```bash
sudo env -i /usr/sbin/chroot /tmp/wut/
```

And then attempted to build it there

```sh
/usr/bin/cc -o hello hello.c
```

And then finally, as it should, it too complained
about not finding `ld(1)`.

```
cc: error: unable to execute command: Executable "ld" doesn't exist!
```

So then I exited out of the chroot
and deleted the files.

```sh
exit
```

```bash
rm -rf /tmp/wut/
```

In conclusion, the test for `as(1)` worked well for the platforms
supported by the klondike project, but the test for `ld(1)` did not
work so well. Either way, in the end, we were able to find another
method of determining whether `ld(1)` was needed (using chroot).

One question might remain; how come LLVM Clang found `ld(1)`
without anything in `$PATH`? Well, the answer to that appears
to be quite simple:

```bash
strings $( which cc ) | grep '/bin'
```

```
/system/bin/linker
/usr/bin:/bin
/bin/sh
/usr/bin:/bin:/usr/sbin:/sbin
```

Hard-coded paths :)

## Copyright and License

Copyright (c) 2016 Erik Nordstrøm &lt;erik@nordstroem.no&gt;

Klondike is released under the terms of the ISC license.
See `LICENSE` for details.
