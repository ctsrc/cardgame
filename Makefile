.PHONY: all

all: debug

debug/klondike:	klondike.c klondike.h
	mkdir -p debug
	cc -std=c99 -g -O0 -DDEBUG -D_BSD_SOURCE klondike.c -o debug/klondike

release/klondike:	klondike.c klondike.h
	mkdir -p release
	cc -std=c99 -D_BSD_SOURCE klondike.c -o release/klondike

.PHONY: release debug clean distclean

release: release/klondike

debug: debug/klondike

clean:
	-rm debug/klondike
	-rmdir debug

distclean: clean
	-rm release/klondike
	-rmdir release
