klondike:	klondike.c klondike.h
	cc -std=c99 -DDEBUG -D_BSD_SOURCE $< -o klondike
