# klondike

Klondike solitaire card game.

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
