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

enum mode
{
	CASINO = 0,	// Turn one card at a time.
	CLASSIC		// Turn three cards at a time.
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

#define DW_DECK_BASE 0
#define DW_BOTTOM 1
#define DW_TOP 24
#define DW_WASTE_BASE 25

#define T_BASE 0
#define T_BOTTOM 1
#define T_TOP 19
#define T_END 20

struct so_cards // Stack of cards
{
	uint8_t cards[25]; // Bottom-most card is a NULLCARD.
	int num_cards;     // Current number of cards held.
};

struct game_state
{
	int t; // "time" measured in number of valid moves.

	bool is_shadow;
	enum mode gm; // game mode
	enum debug_level dbglvl;

	struct so_cards deck;
	struct so_cards waste;

	// Foundations hold only their topmost card. NULLCARD when empty.
	uint8_t foundation[4];

	struct so_cards tableau[7];
};

static const uint8_t FACE_UP = 1 << 7;
static const uint8_t FACE_DOWN = 0;

static const uint8_t MASK_COLOR = 7 << 4;
static const uint8_t MASK_RANK = 15;

// XXX: NULLCARD and UNKNOWNCARD both FACE_DOWN
static const uint8_t NULLCARD = (NO_COLOR << 4) + NO_RANK;
static const uint8_t UNKNOWNCARD = (UNKNOWN_COLOR << 4) + UNKNOWN_RANK;

static inline uint8_t encode (uint8_t face_up, uint8_t color, uint8_t rank)
{
	return face_up | (color << 4) | rank;
}
