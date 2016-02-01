klondike:	klondike.c klondike.h
	cc -std=c99 -g -O0 -DDEBUG -D_BSD_SOURCE $< -o klondike

dist/klondike:	klondike.c klondike.h
	mkdir -p dist
	cc -std=c99 -D_BSD_SOURCE klondike.c -o dist/klondike
