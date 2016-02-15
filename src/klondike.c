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
	fprintf(stderr, "(%d, %d): ", s->last_modified, s->count);
	for (int i = 0 ; !IS_NULLCARD(&(s->cs[i])) ; i++)
	{
		fprintf(stderr, "%02d %02d %d  ",
			s->cs[i].c, s->cs[i].r, s->cs[i].face_up);
	}
	fprintf(stderr, "\n");
}

void print_state (struct game_state *gs)
{
	fprintf(stderr, "(%d) ---\n", gs->last_modified);

	fprintf(stderr, "deck ");
	print_cards_h(&(gs->deck));

	fprintf(stderr, "waste ");
	print_cards_h(&(gs->waste));

	for (int i = 0 ; i < 4 ; i++)
	{
		fprintf(stderr, "foundation #%d ", i);
		print_cards_h(&(gs->foundation[i]));
	}

	for (int i = 0 ; i < 7 ; i++)
	{
		fprintf(stderr, "tableau #%d ", i);
		print_cards_h(&(gs->tableau[i]));
	}
}
#endif

/*
 * XXX: It is up to caller to use a dstsz corresponding to the size of
 *	the destination. In other words, we don't check that it's valid.
 */
void redacted_copy (
	struct stack_of_cards *dst,
	struct stack_of_cards *src,
	size_t dstsz)
{
	if (dst->last_modified < src->last_modified)
	{
		memcpy(dst->cs, src->cs, dstsz);
		dst->count = src->count;
		dst->last_modified = src->last_modified;

		for (int i = 0 ; !IS_NULLCARD(&(dst->cs[i])) ; i++)
		{
			if (!(dst->cs[i].face_up))
			{
				dst->cs[i] = UNKNOWNCARD;
			}
		}
	}
}
void plain_copy (
	struct stack_of_cards *dst,
	struct stack_of_cards *src,
	size_t dstsz)
{
	if (dst->last_modified < src->last_modified)
	{
		memcpy(dst->cs, src->cs, dstsz);
		dst->count = src->count;
		dst->last_modified = src->last_modified;
	}
}

void update_client_data (struct game_state *client, struct game_state *shadow)
{
	if (client->last_modified < shadow->last_modified)
	{
		// Update last_modified
		client->last_modified = shadow->last_modified;

		// Update deck
		redacted_copy(&(client->deck), &(shadow->deck),
			25 * sizeof(*(client->deck.cs)));

		// Update waste
		plain_copy(&(client->waste), &(shadow->waste),
			25 * sizeof(*(client->waste.cs)));

		// Update foundations
		for (int i = 0 ; i < 4 ; i++)
		{
			plain_copy(&(client->foundation[i]),
				&(shadow->foundation[i]),
				14 * sizeof(*(client->foundation[i].cs)));
		}

		// Update tableaus
		for (int i = 0 ; i < 7 ; i++)
		{
			redacted_copy(&(client->tableau[i]),
				&(shadow->tableau[i]),
				20 * sizeof(*(client->tableau[i].cs)));
		}
	}
}

int init_game (struct game_state *shadow, struct game_state *client, int tick)
{
	tick++;

	// Create temporary deck
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

	// Fisher-Yates shuffle the temporary deck
	for (int i = 51 ; i > 0 ; i--)
	{
		int j = arc4random_uniform(i + 1);

		struct card tmp = cs_tmp_deck[i];
		cs_tmp_deck[i] = cs_tmp_deck[j];
		cs_tmp_deck[j] = tmp;
	}

	// Initialize tableaus
	for (int i = 1 ; i <= 7 ; i++)
	{
		memset(shadow->tableau[i - 1].cs, 0, 20 * sizeof(struct card));
		memcpy(shadow->tableau[i - 1].cs, card_curr - i,
			i * sizeof(struct card));
		shadow->tableau[i - 1].cs[i - 1].face_up = true;
		shadow->tableau[i - 1].count += i;
		shadow->tableau[i - 1].last_modified = tick;

		card_curr -= i;
	}

	// Initialize foundations
	for (int i = 0 ; i < 4 ; i++)
	{
		memset(shadow->foundation[i].cs, 0, 14 * sizeof(struct card));
		shadow->foundation[i].count = 0;
		shadow->foundation[i].last_modified = tick;
	}

	// Initialize waste
	memset(shadow->waste.cs, 0, 25 * sizeof(struct card));
	shadow->waste.count = 0;
	shadow->waste.last_modified = tick;

	// Initialize deck
	memset(shadow->deck.cs, 0, 25 * sizeof(struct card));
	int nc_rem = (card_curr - cs_tmp_deck);
	memcpy(shadow->deck.cs, cs_tmp_deck, nc_rem * sizeof(struct card));
	shadow->deck.count = nc_rem;
	shadow->deck.last_modified = tick;

	// Update last_modified
	shadow->last_modified = tick;

#ifdef DEBUG
	fprintf(stderr, "--- shadow ");
	print_state(shadow);
#endif

	update_client_data(client, shadow);

	return tick;
}

bool move_card (
	struct stack_of_cards *dst,
	struct stack_of_cards *src,
	int *tick)
{
	if (src->count >= 1)
	{
		(*tick)++;

		memcpy(&(dst->cs[dst->count]), &(src->cs[src->count - 1]),
			sizeof(struct card));
		dst->count++;
		dst->last_modified = *tick;
		memset(&(src->cs[src->count - 1]), 0, sizeof(struct card));
		src->count--;
		src->last_modified = *tick;

		return true;
	}

	return false;
}

int pull_from_deck (
	struct game_state *shadow,
	enum mode game_mode,
	int *tick)
{
	int i;

	for (i = 0 ; i < 1 + 2 * game_mode; i++)
	{
		if (!move_card(&(shadow->waste), &(shadow->deck), tick))
		{
			break;
		}
		shadow->last_modified = *tick;
	}

	return i;
}

int main ()
{
	int tick = 0;
	enum mode game_mode = CLASSIC;

	struct card cs_shadow_deck[25];
	struct card cs_redacted_deck[25];
	struct card cs_shadow_tableau[7][20];
	struct card cs_redacted_tableau[7][20];
	struct card cs_foundation[4][14];
	struct card cs_waste[25];

	struct game_state shadow =
	{
		tick,
		{ tick, cs_shadow_deck, 0 },
		{ tick, cs_waste, 0 },
		{
			{ tick, cs_foundation[0], 0 },
			{ tick, cs_foundation[1], 0 },
			{ tick, cs_foundation[2], 0 },
			{ tick, cs_foundation[3], 0 }
		},
		{
			{ tick, cs_shadow_tableau[0], 0 },
			{ tick, cs_shadow_tableau[1], 0 },
			{ tick, cs_shadow_tableau[2], 0 },
			{ tick, cs_shadow_tableau[3], 0 },
			{ tick, cs_shadow_tableau[4], 0 },
			{ tick, cs_shadow_tableau[5], 0 },
			{ tick, cs_shadow_tableau[6], 0 }
		}
	};

	struct game_state client =
	{
		tick,
		{ tick, cs_redacted_deck, 0 },
		{ tick, cs_waste, 0 },
		{
			{ tick, cs_foundation[0], 0 },
			{ tick, cs_foundation[1], 0 },
			{ tick, cs_foundation[2], 0 },
			{ tick, cs_foundation[3], 0 }
		},
		{
			{ tick, cs_redacted_tableau[0], 0 },
			{ tick, cs_redacted_tableau[1], 0 },
			{ tick, cs_redacted_tableau[2], 0 },
			{ tick, cs_redacted_tableau[3], 0 },
			{ tick, cs_redacted_tableau[4], 0 },
			{ tick, cs_redacted_tableau[5], 0 },
			{ tick, cs_redacted_tableau[6], 0 }
		}
	};

	tick = init_game(&shadow, &client, tick);

#ifdef DEBUG
	fprintf(stderr, "TEST: Move cards from deck to waste.\n");
	do
	{
		update_client_data(&client, &shadow);
		fprintf(stderr, "--- client ");
		print_state(&client);
	} while (pull_from_deck(&shadow, game_mode, &tick) != 0);

	// TODO: Implement remainder of game.
#endif

	return EXIT_SUCCESS;
}
