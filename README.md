# klondike

Klondike solitaire card game.

## Supported platforms

  * FreeBSD 10.2
  * Fedora 23
  * Raspbian GNU/Linux 8

## Dependencies

Install [libbsd](http://libbsd.freedesktop.org/wiki/) if `arc4random_uniform(3)`
is not in the libc on your system. E.g., on Debian and derivatives:

```bash
sudo apt-get install libbsd-dev
```

Similarily, on Fedora, do:

```bash
sudo dnf install libbsd-devel
```

## Build

```bash
make
```

## Run

```bash
./debug/klondike
```

## Debug

```bash
./debug/klondike -d 4
```
