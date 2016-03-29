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

enum debug_level
{
	DBG_OFF = 0,
	DBG_PRINT_CLIENT,
	DBG_PRINT_SHADOW,
	DBG_NO_SHUFFLE
};

enum game_mode
{
	CASINO = 1,	// Turn one card at a time from deck to waste.
	CLASSIC = 3	// Turn three cards at a time from deck to waste.
};

enum face
{
	FACE_DOWN = 0,
	FACE_UP
};

enum color
{
	NO_COLOR = 0,
	HEARTS,
	SPADES,
	DIAMONDS,
	CLUBS,
	UNKNOWN_COLOR
};

enum rank
{
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

enum action_result
{
	INVALID_ACTION = 0,

	DECK_PULLED_ONE,
	DECK_PULLED_TWO,
	DECK_PULLED_THREE,
	DECK_RECYCLED
};

union card
{
	uint8_t value;
	struct
	{
		unsigned int rank : 4;
		unsigned int color : 3;
		unsigned int face_up : 1;
	} fields;
};

struct so_cards // Stack of cards
{
	union card cards[24];
	int num_cards;
};

struct game_state
{
	int t; // "time" measured in number of valid moves.

	bool is_shadow;
	enum game_mode gm;
	enum debug_level dbglvl;

	struct so_cards deck;
	struct so_cards waste;

	// Foundations hold only their topmost card. NULLCARD value when empty.
	union card foundation[4];

	struct so_cards tableau[7];
};

// XXX: NULLCARD and UNKNOWNCARD both FACE_DOWN
static const uint8_t NULLCARD = (NO_COLOR << 4) + NO_RANK;
static const uint8_t UNKNOWNCARD = (UNKNOWN_COLOR << 4) + UNKNOWN_RANK;
