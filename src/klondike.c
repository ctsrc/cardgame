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
void print_cards_h (struct stack_of_cards *s)
{
	fprintf(stderr, "(%d): ", s->count);
	for (int i = 0 ; !IS_NULLCARD(&(s->cs[i])) ; i++)
	{
		fprintf(stderr, "%02d %02d %d  ",
			s->cs[i].c, s->cs[i].r, s->cs[i].face_up);
	}
	fprintf(stderr, "\n");
}
#endif

void init_game (struct game_state *gs)
{
	struct card cs_tmp_deck[53];
	memset(cs_tmp_deck, 0, 53 * sizeof(struct card));

	struct card *card_curr = cs_tmp_deck;
	for (int c = HEARTS ; c <= CLUBS ; c++)
	{
		for (int r = ACE ; r <= KING ; r++)
		{
			card_curr->c = c;
			card_curr->r = r;
			card_curr->face_up = false;
			card_curr++;
		}
	}

	// Fisher-Yates shuffle the deck.
	for (int i = 51 ; i > 0 ; i--)
	{
		int j = arc4random_uniform(i + 1);

		struct card tmp = cs_tmp_deck[i];
		cs_tmp_deck[i] = cs_tmp_deck[j];
		cs_tmp_deck[j] = tmp;
	}

	memset(gs->deck.cs, 0, 25 * sizeof(struct card));
	for (int i = 0 ; i < 7 ; i++)
	{
		memset(gs->tableau[i].cs, 0, 20 * sizeof(struct card));
	}
	for (int i = 0 ; i < 4 ; i++)
	{
		memset(gs->foundation[i].cs, 0, 14 * sizeof(struct card));
	}
	memset(gs->waste.cs, 0, 25 * sizeof(struct card));

	// Move cards to tableau and turn top-most card in each column.
	for (int i = 1 ; i <= 7 ; i++)
	{
		memcpy(gs->tableau[i - 1].cs, card_curr - i,
			i * sizeof(struct card));
		gs->tableau[i - 1].count += i;
		gs->tableau[i - 1].cs[i - 1].face_up = true;
		card_curr -= i;
	}

	// Move remainder of cards to deck
	int nc_rem = (card_curr - cs_tmp_deck);
	memcpy(gs->deck.cs, cs_tmp_deck, nc_rem * sizeof(struct card));
	gs->deck.count = nc_rem;

#ifdef DEBUG
	print_cards_h(&(gs->deck));

	for (int i = 1 ; i <= 7 ; i++)
	{
		print_cards_h(&(gs->tableau[i - 1]));
	}
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

	struct card cs_shadow_deck[25];
	struct card cs_redacted_deck[25];
	struct card cs_shadow_tableau[7][20];
	struct card cs_redacted_tableau[7][20];
	struct card cs_foundation[4][14];
	struct card cs_waste[25];

	struct stack_of_cards redacted_deck = { cs_redacted_deck, 0 };
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

	struct game_state shadow =
	{
		{ cs_shadow_deck, 0 },
		{
			{ cs_redacted_tableau[0], 0 },
			{ cs_redacted_tableau[1], 0 },
			{ cs_redacted_tableau[2], 0 },
			{ cs_redacted_tableau[3], 0 },
			{ cs_redacted_tableau[4], 0 },
			{ cs_redacted_tableau[5], 0 },
			{ cs_redacted_tableau[6], 0 }
		},
		{
			{ cs_foundation[0], 0 },
			{ cs_foundation[1], 0 },
			{ cs_foundation[2], 0 },
			{ cs_foundation[3], 0 }
		},
		{ cs_waste, 0 }
	};

	init_game(&shadow);

	//struct client_game_state cgs = { 0 };

		/*
#ifdef DEBUG
	print_cards_v(&(gs.shadow_deck));
#endif

#ifdef DEBUG
	fprintf(stderr, "\n\nTEST: Move cards from deck to waste.\n");
	do
	{
		redacted_copy(&redacted_deck, &shadow_deck,
			53 * sizeof(*(redacted_deck.cs)));

		//print(&client_game_state);

		fprintf(stderr, "Deck (%d): ", redacted_deck.count);
		print_cards_h(&redacted_deck);
		fprintf(stderr, "Waste (%d): ", waste.count);
		print_cards_h(&waste);

		for (int i = 0 ; i < 7 ; i++)
		{
			redacted_copy(&(redacted_tableau[i]),
				&(shadow_tableau[i]),
				20 * sizeof(*(redacted_tableau[i].cs)));
			fprintf(stderr, "Tableau #%d (%d): ",
				i, redacted_tableau[i].count);
			print_cards_h(&(redacted_tableau[i]));
		}

		fprintf(stderr, "---\n");
	} while (pull_from_deck(&(gs.shadow_deck), &(gs.waste), game_mode)
		!= 0);

	// TODO: Implement remainder of game.
#endif
		*/
	return EXIT_SUCCESS;
}
