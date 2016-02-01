klondike:	klondike.c klondike.h
	cc -std=c99 -g -O0 -DDEBUG -D_BSD_SOURCE $< -o klondike
