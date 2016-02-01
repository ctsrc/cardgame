# klondike

Klondike solitaire.

## Supported platforms

  * FreeBSD 10.2
  * Lubuntu 14.04

## Dependencies

Needs `arc4random_uniform(3)`. Install [libbsd](http://libbsd.freedesktop.org/wiki/)
if not using a BSD system. E.g., on Ubuntu:

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
