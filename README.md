# klondike

Klondike solitaire card game.

## Supported platforms

  * FreeBSD 10.2
  * Lubuntu 14.04 LTS
  * Raspbian GNU/Linux 8

## Dependencies

Install [libbsd](http://libbsd.freedesktop.org/wiki/) if `arc4random_uniform(3)`
is not in the libc on your system. E.g., on Debian and derivatives:

```bash
sudo apt-get install libbsd-dev
```

## Build

```bash
make
```

## Run

```bash
./debug/klondike
```
