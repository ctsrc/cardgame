TRIPLET != cc -dumpmachine

.PHONY: all

all: debug release

build/${TRIPLET}/debug/klondike:	src/klondike.c src/klondike.h
	mkdir -p build/${TRIPLET}/debug
	cc -std=c99 -g -O0 -DDEBUG -D_BSD_SOURCE src/klondike.c -o build/${TRIPLET}/debug/klondike -lm

build/${TRIPLET}/release/klondike:	src/klondike.c src/klondike.h
	mkdir -p build/${TRIPLET}/release
	cc -std=c99 -D_BSD_SOURCE src/klondike.c -o build/${TRIPLET}/release/klondike -lm

.PHONY: debug release clean distclean

debug: build/${TRIPLET}/debug/klondike

release: build/${TRIPLET}/release/klondike

clean:
	-rm build/${TRIPLET}/debug/klondike
	-rmdir build/${TRIPLET}/debug

distclean: clean
	-rm build/${TRIPLET}/release/klondike
	-rmdir build/${TRIPLET}/release build/${TRIPLET} build
