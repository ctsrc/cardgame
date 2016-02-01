# klondike

Klondike solitaire.

## Supported platforms

  * FreeBSD 10.2
  * Lubuntu 14.04

## Dependencies

Install [libbsd](http://libbsd.freedesktop.org/wiki/) if `arc4random_uniform(3)`
is not in the stdlib on your system. E.g., on Ubuntu:

```bash
sudo apt-get install libbsd-dev
```

## Build

```bash
make
```

## Run

```bash
./klondike
```
