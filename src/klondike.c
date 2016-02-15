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
void print_cards_v (struct stack_of_cards *s)
{
	for (int i = 0 ; !IS_NULLCARD(&(s->cs[i])) ; i++)
	{
		fprintf(stderr, "%02d %02d %d\n",
			s->cs[i].c, s->cs[i].r, s->cs[i].face_up);
	}
}

void print_cards_h (struct stack_of_cards *s)
{
	for (int i = 0 ; !IS_NULLCARD(&(s->cs[i])) ; i++)
	{
		fprintf(stderr, "%02d %02d %d  ",
			s->cs[i].c, s->cs[i].r, s->cs[i].face_up);
	}
	fprintf(stderr, "\n");
}
#endif

void init_game (
	struct stack_of_cards *deck,
	struct stack_of_cards *tableau,
	struct stack_of_cards *foundation,
	struct stack_of_cards *waste)
{
	memset(deck->cs, 0, 53 * sizeof(struct card));
	memset(tableau->cs, 0, 20 * 7 * sizeof(struct card));
	memset(foundation->cs, 0, 14 * 4 * sizeof(struct card));
	memset(waste->cs, 0, 25 * sizeof(struct card));

	struct card *deck_curr = deck->cs;

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
	deck->count = deck_curr - deck->cs;

	// Fisher-Yates shuffle the deck.
	for (int i = 51 ; i > 0 ; i--)
	{
		int j = arc4random_uniform(i + 1);

		struct card tmp = deck->cs[i];
		deck->cs[i] = deck->cs[j];
		deck->cs[j] = tmp;
	}

	// Move cards to tableau and turn top-most card in each column.
	for (int i = 1 ; i <= 7 ; i++)
	{
		memcpy(tableau[i - 1].cs, deck_curr - i,
			i * sizeof(struct card));
		tableau[i - 1].count += i;
		memset(deck_curr - i, 0,
			i * sizeof(struct card));
		deck->count -= i;
		deck_curr -= i;

		tableau[i - 1].cs[i - 1].face_up = true;
	}

#ifdef DEBUG
	for (int i = 1 ; i <= 7 ; i++)
	{
		print_cards_v(&(tableau[i - 1]));
		fprintf(stderr, "--- %d\n", tableau[i - 1].count);
	}

	print_cards_v(deck);
	fprintf(stderr, "=== %d\n", deck->count);
#endif
}

/*
 * XXX: It is up to caller to use a dstsz corresponding to the size of
 *	the destination. In other words, we don't check that it's valid.
 */
void redacted_copy (
	struct stack_of_cards *dst,
	struct stack_of_cards *src,
	size_t dstsz)
{
	memcpy(dst->cs, src->cs, dstsz);
	dst->count = src->count;

	for (int i = 0 ; !IS_NULLCARD(&(dst->cs[i])) ; i++)
	{
		if (!(dst->cs[i].face_up))
		{
			dst->cs[i] = UNKNOWNCARD;
		}
	}
}

bool move_card (struct stack_of_cards *dst, struct stack_of_cards *src)
{
	if (src->count >= 1)
	{
		memcpy(&(dst->cs[dst->count]), &(src->cs[src->count - 1]),
			sizeof(struct card));
		dst->count++;
		memset(&(src->cs[src->count - 1]), 0, sizeof(struct card));
		src->count--;

		return true;
	}

	return false;
}

int pull_from_deck (
	struct stack_of_cards *deck,
	struct stack_of_cards *waste,
	enum mode game_mode)
{
	int i;

	for (i = 0 ; i < 1 + 2 * game_mode; i++)
	{
		if (!move_card(waste, deck))
		{
			break;
		}
	}

	return i;
}

int main ()
{
	enum mode game_mode = CLASSIC;

	struct card cs_deck[53];
	struct card cs_redacted_deck[53];
	struct card cs_tableau[7][20];
	struct card cs_redacted_tableau[7][20];
	struct card cs_foundation[4][14];
	struct card cs_waste[25];

	struct stack_of_cards deck = { cs_deck, 0 };
	struct stack_of_cards redacted_deck = { cs_redacted_deck, 0 };
	struct stack_of_cards tableau[7] =
	{
		{ cs_tableau[0], 0 },
		{ cs_tableau[1], 0 },
		{ cs_tableau[2], 0 },
		{ cs_tableau[3], 0 },
		{ cs_tableau[4], 0 },
		{ cs_tableau[5], 0 },
		{ cs_tableau[6], 0 }
	};
	struct stack_of_cards redacted_tableau[7] =
	{
		{ cs_redacted_tableau[0], 0 },
		{ cs_redacted_tableau[1], 0 },
		{ cs_redacted_tableau[2], 0 },
		{ cs_redacted_tableau[3], 0 },
		{ cs_redacted_tableau[4], 0 },
		{ cs_redacted_tableau[5], 0 },
		{ cs_redacted_tableau[6], 0 }
	};
	struct stack_of_cards foundation[4] =
	{
		{ cs_foundation[0], 0 },
		{ cs_foundation[1], 0 },
		{ cs_foundation[2], 0 },
		{ cs_foundation[3], 0 }
	};
	struct stack_of_cards waste = { cs_waste, 0 };

	init_game(&deck, tableau, foundation, &waste);

#ifdef DEBUG
	print_cards_v(&deck);
#endif

#ifdef DEBUG
	fprintf(stderr, "\n\nTEST: Move cards from deck to waste.\n");
	do
	{
		redacted_copy(&redacted_deck, &deck,
			53 * sizeof(*(redacted_deck.cs)));

		fprintf(stderr, "Deck (%d): ", deck.count);
		print_cards_h(&redacted_deck);
		fprintf(stderr, "Waste (%d): ", waste.count);
		print_cards_h(&waste);

		for (int i = 0 ; i < 7 ; i++)
		{
			fprintf(stderr, "Tableau #%d (%d): ",
				i, tableau[i].count);
			redacted_copy(&(redacted_tableau[i]), &(tableau[i]),
				20 * sizeof(*(redacted_tableau[i].cs)));
			print_cards_h(&(redacted_tableau[i]));
		}

		fprintf(stderr, "---\n");
	} while (pull_from_deck(&deck, &waste, game_mode) != 0);

	// TODO: Implement remainder of game.
#endif
	return EXIT_SUCCESS;
}
