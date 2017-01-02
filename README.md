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
* [Security](#security)
* [External Issues Reported During Project](#external-issues-reported-during-project)
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
sudo apt install libbsd-dev binutils gcc chicken-bin make
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

* Python 3.4 or greater

  - Falcon 1.0.0

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
Debian apt official and default repositories, I would use those.

### Install Server Run-Time Dependencies on FreeBSD

Currently, FreeBSD does not provide a separate package with
just the runtime library of CHICKEN Scheme, so the whole package
with all of CHICKEN Scheme will need to be installed.

```bash
sudo pkg install chicken python3
sudo pip3 install -r requirements.txt
```

### Install Server Run-Time Dependencies on Fedora and Derivatives

```bash
sudo dnf install libbsd chicken-libs python3
sudo pip3 install -r requirements.txt
```

### Install Server Run-Time Dependencies on Debian and Derivatives

```bash
sudo apt install libbsd libchicken7 python3
sudo pip3 install -r requirements.txt
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
./build/$( cc -dumpmachine )/debug/klondike
```

## Security

TODO: Describe.

## External Issues Reported During Project

* Mozilla bug tracker: [Issue #1275421](https://bugzilla.mozilla.org/show_bug.cgi?id=1275421)
* WebKit bug tracker: [Issue #158106](https://bugs.webkit.org/show_bug.cgi?id=158106)
* Chromium bug tracker: [Issue #615638](https://bugs.chromium.org/p/chromium/issues/detail?id=615638)

## Copyright and License

Copyright (c) 2016, 2017 Erik Nordstrøm &lt;erik@nordstroem.no&gt;

Klondike is released under the terms of the ISC license.
See `LICENSE` for details.
