# klondike

Klondike solitaire card game server and offline-capable, touch-friendly client.

You can check out the current state of the client at
https://www.nordstroem.no/en-US/games/klondike/

## Table of Contents

* [Supported Server Platforms](#supported-server-platforms)
* [Security](#security)
* [Build](#build)
  - [Install Server Build Dependencies](#install-server-build-dependencies)
  - [Perform Build](#perform-build)
* [Run](#run)
  - [Install Server Run-Time Dependencies](#install-server-run-time-dependencies)
  - [Run to the Hills](#run-to-the-hills)
* [Debug](#debug)
* [External Issues Reported During Project](#external-issues-reported-during-project)
* [Copyright and License](#copyright-and-license)

## Supported Server Platforms

* FreeBSD 11.0
* Fedora 23
* Debian GNU/Linux 8

## Security

TODO: Describe.

## Build

### Install Server Build Dependencies

```bash
# FreeBSD
doas pkg install chicken
doas chicken-install bind
```

```bash
# Fedora and derivatives
sudo dnf install libbsd-devel binutils gcc chicken make
sudo chicken-install bind
```

```bash
# Debian and Derivatives
sudo apt install libbsd-dev binutils gcc chicken-bin make
sudo chicken-install bind
```

### Perform Build

```bash
make
```

## Run

### Install Server Run-Time Dependencies

For klondike, I have decided to let the system package manager manage
the CHICKEN Scheme runtime library and, where applicable, libbsd,
but to bundle the CHICKEN Scheme extensions (eggs) in the build.

```bash
# FreeBSD
doas pkg install chicken python3
doas pip3 install -r requirements.txt
```

```bash
# Fedora and derivatives
sudo dnf install libbsd chicken-libs python3
sudo pip3 install -r requirements.txt
```

```bash
# Debian and derivatives
sudo apt install libbsd libchicken7 python3
sudo pip3 install -r requirements.txt
```

### Run to the Hills

```bash
./build/$( cc -dumpmachine )/debug/klondike
```

## Debug

```bash
./build/$( cc -dumpmachine )/debug/klondike
```

## External Issues Reported During Project

* Mozilla bug tracker: [Issue #1275421](https://bugzilla.mozilla.org/show_bug.cgi?id=1275421)
* WebKit bug tracker: [Issue #158106](https://bugs.webkit.org/show_bug.cgi?id=158106)
* Chromium bug tracker: [Issue #615638](https://bugs.chromium.org/p/chromium/issues/detail?id=615638)

## Copyright and License

Copyright (c) 2016, 2017 Erik Nordstrøm &lt;erik@nordstroem.no&gt;

Klondike is released under the terms of the ISC license.
See `LICENSE` for details.
