klondike:	klondike.c klondike.h
	cc -std=c11 -g -O0 -DDEBUG -D_BSD_SOURCE $< -o klondike -lbsd

dist/klondike:	klondike.c klondike.h
	mkdir -p dist
	cc -std=c11 -D_BSD_SOURCE $< -o dist/klondike -lbsd
