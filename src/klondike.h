/*
 * Copyright (c) 2016 Erik Nordstrøm <erik@nordstroem.no>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

enum mode {
	CASINO = 0,	// Turn one card at a time.
	CLASSIC		// Turn three cards at a time.
};

enum color {
	NO_COLOR = 0,
	HEARTS,
	SPADES,
	DIAMONDS,
	CLUBS,
	UNKNOWN_COLOR
};

enum rank {
	NO_RANK = 0,
	ACE,
	TWO,
	THREE,
	FOUR,
	FIVE,
	SIX,
	SEVEN,
	EIGHT,
	NINE,
	TEN,
	JACK,
	QUEEN,
	KING,
	UNKNOWN_RANK
};

struct card {
	enum color c;
	enum rank r;
	bool face_up;
};

struct stack_of_cards {
	struct card * const cs;
	int count;
};

struct server_game_state {
	struct stack_of_cards shadow_deck;
	struct stack_of_cards shadow_tableau[7];
	struct stack_of_cards foundation[4];
	struct stack_of_cards waste;
};

extern const struct card NULLCARD;
extern const struct card UNKNOWNCARD;
