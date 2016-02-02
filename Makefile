.PHONY: all

all: debug

debug/klondike:	src/klondike.c src/klondike.h
	mkdir -p debug
	cc -std=c99 -g -O0 -DDEBUG -D_BSD_SOURCE src/klondike.c -o debug/klondike

release/klondike:	src/klondike.c src/klondike.h
	mkdir -p release
	cc -std=c99 -D_BSD_SOURCE src/klondike.c -o release/klondike

.PHONY: release debug clean distclean

release: release/klondike

debug: debug/klondike

clean:
	-rm debug/klondike
	-rmdir debug

distclean: clean
	-rm release/klondike
	-rmdir release
