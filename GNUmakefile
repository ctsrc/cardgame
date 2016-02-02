.PHONY: all

all: debug

debug/klondike:	src/klondike.c src/klondike.h
	mkdir -p debug
	cc -std=c11 -g -O0 -DDEBUG -D_BSD_SOURCE src/klondike.c -o debug/klondike -lbsd

release/klondike:	src/klondike.c src/klondike.h
	mkdir -p release
	cc -std=c11 -D_BSD_SOURCE src/klondike.c -o release/klondike -lbsd

.PHONY: release debug clean distclean

release: release/klondike

debug: debug/klondike

clean:
	-rm debug/klondike
	-rmdir debug

distclean: clean
	-rm release/klondike
	-rmdir release
