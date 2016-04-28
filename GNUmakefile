TRIPLET=$(shell ${CC} -dumpmachine)

.PHONY: all

all: debug release

build/${TRIPLET}/debug/klondike:	src/server/klondike.scm
	mkdir -p build/${TRIPLET}/debug
	DEBUG= csc -lbsd -o build/${TRIPLET}/debug/klondike $<

build/${TRIPLET}/release/klondike:	src/server/klondike.scm
	mkdir -p build/${TRIPLET}/release
	csc -lbsd -o build/${TRIPLET}/release/klondike $<
	strip build/${TRIPLET}/release/klondike

.PHONY: debug release clean distclean

debug: build/${TRIPLET}/debug/klondike

release: build/${TRIPLET}/release/klondike

clean:
	-rm build/${TRIPLET}/debug/klondike
	-rmdir build/${TRIPLET}/debug

distclean: clean
	-rm -r build
