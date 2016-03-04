TRIPLET != cc -dumpmachine

.PHONY: all

all: debug release

build/${TRIPLET}/debug/klondike:	src/klondike.c src/klondike.h
	mkdir -p build/${TRIPLET}/debug
	cc -std=c11 -g -O0 -Wall -DDEBUG -D_BSD_SOURCE src/klondike.c -o build/${TRIPLET}/debug/klondike -lm

build/${TRIPLET}/release/klondike:	src/klondike.c src/klondike.h
	mkdir -p build/${TRIPLET}/release
	cc -std=c11 -Ofast -D_BSD_SOURCE src/klondike.c -o build/${TRIPLET}/release/klondike -lm

.PHONY: debug release clean distclean

debug: build/${TRIPLET}/debug/klondike

release: build/${TRIPLET}/release/klondike

clean:
	-rm build/${TRIPLET}/debug/klondike
	-rmdir build/${TRIPLET}/debug

distclean: clean
	-rm -r build
