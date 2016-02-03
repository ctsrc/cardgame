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

#include <stdbool.h>
#include <string.h>
#include <math.h>

#ifdef DEBUG
#include <stdio.h>
#endif

#if defined(__FreeBSD__) || defined(__OpenBSD__) || \
	defined(__SunOS_5_11) || defined(__APPLE__)
#include <stdlib.h>
#else
#include <bsd/stdlib.h>
#endif

#include "klondike.h"

const struct card NULLCARD = { NO_COLOR, NO_RANK, false };
const struct card UNKNOWNCARD = { UNKNOWN_COLOR, UNKNOWN_RANK, false };

/*
 * XXX: Provided that any alignment space in card structs inserted
 *	by the compiler is set to zero either by us or by the compiler,
 *	and that we keep only directly comparable data in these structs,
 *	memcmp on the structs will work as intended.
 */
#define IS_NULLCARD(PTR) !memcmp(PTR, &NULLCARD, sizeof(struct card))
#define IS_UNKNOWNCARD(PTR) !memcmp(PTR, &UNKNOWNCARD, sizeof(struct card))

#ifdef DEBUG
void print_cards_v (struct card cs[])
{
	for (int i = 0 ; !IS_NULLCARD(&(cs[i])) ; i++)
	{
		fprintf(stderr, "%02d %02d %d\n",
			cs[i].c, cs[i].r, cs[i].face_up);
	}
}

void print_cards_h (struct card cs[])
{
	for (int i = 0 ; !IS_NULLCARD(&(cs[i])) ; i++)
	{
		fprintf(stderr, "%02d %02d %d  ",
			cs[i].c, cs[i].r, cs[i].face_up);
	}
	fprintf(stderr, "\n");
}
#endif

struct card *init_game (
	struct card deck[],
	struct card tableau[][20],
	struct card foundation[][14],
	struct card waste[])
{
	memset(deck, 0, 53 * sizeof(*deck));
	memset(tableau, 0, 20 * 7 * sizeof(**tableau));
	memset(foundation, 0, 14 * 4 * sizeof(**foundation));
	memset(waste, 0, 25 * sizeof(*waste));

	struct card *deck_curr = deck;

	for (int c = HEARTS ; c <= CLUBS ; c++)
	{
		for (int r = ACE ; r <= KING ; r++)
		{
			deck_curr->c = c;
			deck_curr->r = r;
			deck_curr->face_up = false;
			deck_curr++;
		}
	}

	// Fisher-Yates shuffle the deck.
	for (int i = 51 ; i > 0 ; i--)
	{
		int j = arc4random_uniform(i + 1);

		struct card tmp = deck[i];
		deck[i] = deck[j];
		deck[j] = tmp;
	}

	// Move cards to tableau and turn top-most card in each column.
	for (int i = 1 ; i <= 7 ; i++)
	{
		memcpy(tableau[i - 1], deck_curr - i, i * sizeof(*deck));
		memset(deck_curr - i, 0, i * sizeof(*deck));
		deck_curr -= i;

		tableau[i - 1][i - 1].face_up = true;
	}

#ifdef DEBUG
	for (int i = 1 ; i <= 7 ; i++)
	{
		print_cards_v(tableau[i - 1]);
		fprintf(stderr, "---\n");
	}

	print_cards_v(deck);
#endif

	return deck_curr;
}

/*
 * XXX: It is up to caller to use a dstsz corresponding to the size of
 *	the destination. In other words, we don't check that it's valid.
 */
void redacted_copy (struct card *dst, struct card *src, size_t dstsz) {
	memcpy(dst, src, dstsz);

	for (int i = 0 ; !IS_NULLCARD(&(dst[i])) ; i++)
	{
		if (!(dst[i].face_up))
		{
			dst[i] = UNKNOWNCARD;
		}
	}
}

void move_card (struct card *dst, struct card *src)
{
	memcpy(dst, src, sizeof(struct card));
	memset(src, 0, sizeof(struct card));
}

void pull_from_deck (
	struct card *deck_end,
	struct card *waste_end,
	enum mode game_mode)
{
	// TODO FIXME: Bad things will happen when we go out of cards in deck.
	for (int i = 0 ; i < 1 + 2 * game_mode ; i++)
	{
		move_card(waste_end + i, deck_end - (i + 1));
	}
}

int main ()
{
	enum mode game_mode = CLASSIC;

	// TODO: Encapsulated abstraction for stacks of cards.
	struct card deck[53];
	struct card redacted_deck[53];
	struct card tableau[7][20];
	struct card redacted_tableau[7][20];
	struct card foundation[4][14];
	struct card waste[25];

	struct card *deck_end = init_game(deck, tableau, foundation, waste);
	struct card *waste_end = waste;

#ifdef DEBUG
	fprintf(stderr, "===\n");
	print_cards_v(deck_end - 1);
#endif

	// THE GAME
#ifdef DEBUG
	for (;;)
	{
		fprintf(stderr, "\n\n");

		/*
		 * XXX: With future encapsulated abstraction
		 *	for stacks of cards, we won't have to
		 *	keep track of ends manually.
		 */
		pull_from_deck(deck_end, waste_end, game_mode);
		deck_end--;
		waste_end += 1 + 2 * game_mode;
		
		redacted_copy(redacted_deck, deck,
			53 * sizeof(*redacted_deck));
		fprintf(stderr, "Deck: ");
		print_cards_h(redacted_deck);
		fprintf(stderr, "Waste: ");
		print_cards_h(waste);
		for (int i = 0 ; i < 7 ; i++)
		{
			fprintf(stderr, "Tableau %d: ", i);
			redacted_copy(redacted_tableau[i], tableau[i],
				20 * sizeof(*(redacted_tableau[i])));
			print_cards_h(redacted_tableau[i]);
		}
	}
		
	// TODO: Implement remainder of game.
#endif

	return EXIT_SUCCESS;
}
