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
#include <stdio.h>

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
void print_cards (struct card cs[])
{
	for (int i = 0 ; !IS_NULLCARD(&(cs[i])) ; i++)
	{
		fprintf(stderr, "%d %d %d\n", cs[i].c, cs[i].r, cs[i].face_up);
	}
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
	memset(waste, 0, 29 * sizeof(*waste));

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
		print_cards(tableau[i - 1]);
		fprintf(stderr, "---\n");
	}

	print_cards(deck);
#endif

	return deck_curr;
}

int main ()
{
	struct card deck[53];
	struct card tableau[7][20];
	struct card foundation[4][14];
	struct card waste[29];

	struct card *deck_end = init_game(deck, tableau, foundation, waste);

#ifdef DEBUG
	fprintf(stderr, "===\n");
	print_cards(deck_end - 1);
#endif

	// TODO: Implement game.

	return EXIT_SUCCESS;
}
