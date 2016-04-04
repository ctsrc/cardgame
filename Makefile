TRIPLET != cc -dumpmachine

.PHONY: all

all: debug release

build/${TRIPLET}/debug/klondike:	src/server/klondike.c src/server/klondike.h
	mkdir -p build/${TRIPLET}/debug
	cc -std=c99 -g -O0 -Wall -DDEBUG -D_BSD_SOURCE src/server/klondike.c -o build/${TRIPLET}/debug/klondike -lm

build/${TRIPLET}/release/klondike:	src/server/klondike.c src/server/klondike.h
	mkdir -p build/${TRIPLET}/release
	cc -std=c99 -O3 -D_BSD_SOURCE src/server/klondike.c -o build/${TRIPLET}/release/klondike -lm
	strip build/${TRIPLET}/release/klondike

.PHONY: debug release clean distclean

debug: build/${TRIPLET}/debug/klondike

release: build/${TRIPLET}/release/klondike

clean:
	-rm build/${TRIPLET}/debug/klondike
	-rmdir build/${TRIPLET}/debug

distclean: clean
	-rm -r build
