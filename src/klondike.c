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

#ifdef DEBUG
#include <assert.h>
#include <stdio.h>
#endif

#include <stdint.h>
#include <string.h>

#if defined(__FreeBSD__) || defined(__OpenBSD__) || \
	defined(__SunOS_5_11) || defined(__APPLE__)
#include <stdlib.h>
#else
#include <bsd/stdlib.h>
#endif

#include <stdbool.h>

#include "klondike.h"

void print_card (uint8_t);
void print_card_verbose (uint8_t);
void print_game_state (struct game_state *);

void redacted_copy_so_cards (struct so_cards *dst, struct so_cards const *src)
{
	memset(&(dst->cards[1]), UNKNOWNCARD,
		src->num_cards * sizeof(dst->cards[0]));
	dst->num_cards = src->num_cards;
}

void plain_copy_so_cards (struct so_cards *dst, struct so_cards const *src)
{
	for (int i = 1 ; i <= src->num_cards ; i++)
	{
		dst->cards[i] = src->cards[i];
	}
	dst->num_cards = src->num_cards;
}

void redacted_copy_df_so_cards (
	struct so_cards *dst,
	struct so_cards const *src)
{
	for (int i = 1 ; i <= src->num_cards ; i++)
	{
		if (src->cards[i] & FACE_UP)
		{
			dst->cards[i] = src->cards[i];
		}
		else
		{
			dst->cards[i] = UNKNOWNCARD;
		}
	}
	dst->num_cards = src->num_cards;
}

void redacted_copy (struct game_state *client, struct game_state const *shadow)
{
#ifdef DEBUG
	assert(client->t < shadow->t);
	fprintf(stderr, "Updating client game state to t=%d.\n", shadow->t);
#endif

	memset(client, 0, sizeof(*client));

	client->t = shadow->t;
	client->is_shadow = false;
	client->gm = shadow->gm;
	client->dbglvl = shadow->dbglvl;

	// Redacted copy, deck.
	redacted_copy_so_cards(&(client->deck), &(shadow->deck));
	// Plain copy, waste.
	plain_copy_so_cards(&(client->waste), &(shadow->waste));

	// Plain copy, foundations.
	client->foundation[0] = shadow->foundation[0];
	client->foundation[1] = shadow->foundation[1];
	client->foundation[2] = shadow->foundation[2];
	client->foundation[3] = shadow->foundation[3];

	// Copy tableau cards with redaction of those down-facing.
	for (int i = 0 ; i < 7 ; i++)
	{
		redacted_copy_df_so_cards(&(client->tableau[i]),
			&(shadow->tableau[i]));
	}
}

void init_game (
	struct game_state *shadow,
	struct game_state *client,
	enum debug_level dbglvl)
{
#ifdef DEBUG
	fprintf(stderr, "Initializing game.\n");
#endif

	uint8_t tmp_deck[52];

	{ // XXX: Constrain i to this scope.
	int i = 0;
	for (int color = HEARTS ; color <= CLUBS ; color++)
	{
		for (int rank = ACE ; rank <= KING ; rank++)
		{
			tmp_deck[i++] = encode(FACE_DOWN, color, rank);
		}
	}
	}

	print_card_verbose(NULLCARD);
	for (int i = 0 ; i < 52 ; i++)
	{
		print_card_verbose(tmp_deck[i]);
	}
	print_card_verbose(UNKNOWNCARD);

#ifdef DEBUG
	if (dbglvl < DBG_NO_SHUFFLE)
	{
	fprintf(stderr, "Shuffeling temporary deck.\n");
#endif
	// Fisher-Yates shuffle the temporary deck
	for (int i = 51 ; i > 0 ; i--)
	{
		int j = arc4random_uniform(i + 1);

		uint8_t tmp_card = tmp_deck[i];
		tmp_deck[i] = tmp_deck[j];
		tmp_deck[j] = tmp_card;
	}
#ifdef DEBUG
	}
#endif

	// First four members of our struct.
	shadow->t = 0;
	shadow->is_shadow = true;
	shadow->gm = CLASSIC;
	shadow->dbglvl = dbglvl;

	int k = 52; // Cards remaining

	/*
	 * Initialize tableaus and their offsets.
	 *
	 * XXX: We assign one card to each tableau at a time
	 * 	in order like shown in the figure below, flipping
	 * 	the topmost card in each tableau as we go.
	 *
	 * 	 1  2  3  4  5  6  7
	 * 	    8  9 10 11 12 13
	 * 	      14 15 16 17 18
	 * 	         19 20 21 22
	 * 	            23 24 25
	 * 	               26 27
	 * 	                  28
	 *
	 * 	This is similar to the way I do it by hand as well,
	 * 	except I usually flip all the topmost cards at the end.
	 *
	 */
	for (int i = 0 ; i < 7 ; i++)
	{
		for (int j = i ; j < 7 ; j++)
		{
			shadow->tableau[j].cards[i + 1] = tmp_deck[--k];
		}
		shadow->tableau[i].cards[i + 1] |= FACE_UP;
		shadow->tableau[i].num_cards = i + 1;
	}

	// Initialize foundation with NULLCARDs.
	shadow->foundation[0] = NULLCARD;
	shadow->foundation[1] = NULLCARD;
	shadow->foundation[2] = NULLCARD;
	shadow->foundation[3] = NULLCARD;

	// Initialize deck
	for (int i = k ; i > 0 ; i--)
	{
		shadow->deck.cards[i] = tmp_deck[--k];
		shadow->deck.num_cards++;
	}

	print_game_state(shadow);
	redacted_copy(client, shadow);
	print_game_state(client);
}

enum action_result pull_from_deck (struct game_state *);

// XXX: Takes care of common work associated with all actions, keepin' it DRY.
enum action_result action (
	enum action_result (*f)(struct game_state *),
	struct game_state *shadow,
	struct game_state *client)
{
	enum action_result r;

	struct game_state tmp = *shadow;

	if ((r = (*f)(&tmp)) != INVALID_ACTION)
	{
		*shadow = tmp;
		(shadow->t)++;
		print_game_state(shadow);
		redacted_copy(client, shadow);
		print_game_state(client);
	}

	return r;
}

int main (int argc, char *argv[])
{
	struct game_state
		shadow = {-1},
		client = {-1};

	{ // XXX: Constrain dbglvl to this scope.
#ifdef DEBUG
	enum debug_level dbglvl = DBG_PRINT_CLIENT;
	if (argc == 3 && strcmp(argv[1], "-d") == 0)
	{
		dbglvl = atoi(argv[2]);
		if (dbglvl < DBG_PRINT_CLIENT || dbglvl > DBG_NO_SHUFFLE)
		{
			fprintf(stderr, "Invalid debug level `%d'.\n", dbglvl);
			return EXIT_FAILURE;
		}
	}
#else
	enum debug_level dbglvl = DBG_OFF;
#endif
	init_game(&shadow, &client, dbglvl);
	}

#ifdef DEBUG

	/*
	 * TEST #1: Cycle deck.
	 */

	struct game_state cmp_client = client;

	int t_prev = shadow.t;
	while (action(&pull_from_deck, &shadow, &client) != DECK_RECYCLED)
	{
		assert(shadow.t == ++t_prev);
		assert(memcmp(&cmp_client, &client, sizeof(client)) != 0);
	}
	assert(shadow.t == ++t_prev);

	cmp_client.t = client.t;
	assert(memcmp(&cmp_client, &client, sizeof(client)) == 0);

	/*
	 * TEST #2: TODO
	 */

#endif

	return EXIT_SUCCESS;
}

/*
 * ACTIONS
 */
enum action_result pull_from_deck (struct game_state *shadow)
{
	if (shadow->deck.num_cards > 0)
	{
		int n = 0;
		while ((n < 1 + 2 * shadow->gm)
			&& shadow->deck.num_cards > 0)
		{
			n++;
			shadow->waste.cards[++(shadow->waste.num_cards)] =
				shadow->deck.cards[(shadow->deck.num_cards)--]
				| FACE_UP;
		}

		return 1 + n;
	}
	else
	{
		if (shadow->waste.num_cards == 0)
		{
			return DECK_NO_ACTION;
		}

		while (shadow->waste.num_cards > 0)
		{
			shadow->deck.cards[++(shadow->deck.num_cards)] =
				shadow->waste.cards[(shadow->waste.num_cards)--]
				& ~FACE_UP;
		}

		return DECK_RECYCLED;
	}
}

/*
 * Debugging helper functions.
 *
 * XXX: These functions as well as the calls to them
 *      and also the loops from which they are called
 *      should be automatically removed in release builds
 *      by all compilers worth their salt, thanks to
 *      the ifdefs which make all of these empty functions
 *      except when making a debug build.
 */

void print_card (uint8_t card)
{
#ifdef DEBUG
	if (card != 0)
	{
		fprintf(stderr, " %d,%d", card & ~FACE_UP, card >> 7);
	}
	else
	{
		fprintf(stderr, " X");
	}
#endif
}

void print_card_verbose (uint8_t card)
{
#ifdef DEBUG
	fprintf(stderr, "%3d\t", card);

	for (int j = 7 ; j >= 0 ; j--)
	{
		fprintf(stderr, "%d", (card >> j) & 1);
	}
	fprintf(stderr, "\t");

	if ((card & FACE_UP) == FACE_UP)
	{
		fprintf(stderr, "FACE_UP\t");
	}
	else
	{
		fprintf(stderr, "       \t");
	}

	switch ((card & MASK_COLOR) >> 4)
	{
		case NO_COLOR:
			fprintf(stderr, "NO_COLOR     ");
			break;
		case HEARTS:
			fprintf(stderr, "HEARTS       ");
			break;
		case SPADES:
			fprintf(stderr, "SPADES       ");
			break;
		case DIAMONDS:
			fprintf(stderr, "DIAMONDS     ");
			break;
		case CLUBS:
			fprintf(stderr, "CLUBS        ");
			break;
		case UNKNOWN_COLOR:
			fprintf(stderr, "UNKNOWN_COLOR");
			break;
		default:
			abort();
	}
	fprintf(stderr, "\t");

	switch (card & MASK_RANK)
	{
		case NO_RANK:
			fprintf(stderr, "NO_RANK     ");
			break;
		case ACE:
			fprintf(stderr, "ACE         ");
			break;
		case TWO:
			fprintf(stderr, "TWO         ");
			break;
		case THREE:
			fprintf(stderr, "THREE       ");
			break;
		case FOUR:
			fprintf(stderr, "FOUR        ");
			break;
		case FIVE:
			fprintf(stderr, "FIVE        ");
			break;
		case SIX:
			fprintf(stderr, "SIX         ");
			break;
		case SEVEN:
			fprintf(stderr, "SEVEN       ");
			break;
		case EIGHT:
			fprintf(stderr, "EIGHT       ");
			break;
		case NINE:
			fprintf(stderr, "NINE        ");
			break;
		case TEN:
			fprintf(stderr, "TEN         ");
			break;
		case JACK:
			fprintf(stderr, "JACK        ");
			break;
		case QUEEN:
			fprintf(stderr, "QUEEN       ");
			break;
		case KING:
			fprintf(stderr, "KING        ");
			break;
		case UNKNOWN_RANK:
			fprintf(stderr, "UNKNOWN_RANK");
			break;
		default:
			abort();
	}
	fprintf(stderr, "\n");
#endif
}

void print_so_cards (struct so_cards const *cs)
{
#ifdef DEBUG
	for (int i = 1 ; i <= cs->num_cards ; i++)
	{
		print_card(cs->cards[i]);
	}
	fprintf(stderr, "\n");
#endif
}

void print_game_state (struct game_state *gs)
{
#ifdef DEBUG
	if (gs->is_shadow && gs->dbglvl < DBG_PRINT_SHADOW)
	{
		return;
	}

	fprintf(stderr, "Printing %s game state with t=%d.\n",
		(gs->is_shadow) ? "shadow" : "client", gs->t);

	// Print deck.
	fprintf(stderr, "deck (%d):", gs->deck.num_cards);
	print_so_cards(&(gs->deck));

	// Print waste.
	fprintf(stderr, "waste (%d):", gs->waste.num_cards);
	print_so_cards(&(gs->waste));

	// Print foundations.
	fprintf(stderr, "foudt (%d):",
		(gs->foundation[0] & MASK_RANK)
		+ (gs->foundation[1] & MASK_RANK)
		+ (gs->foundation[2] & MASK_RANK)
		+ (gs->foundation[3] & MASK_RANK));
	print_card(gs->foundation[0]);
	print_card(gs->foundation[1]);
	print_card(gs->foundation[2]);
	print_card(gs->foundation[3]);
	fprintf(stderr, "\n");

	// Print tableaus.
	for (int i = 0 ; i < 7 ; i++)
	{
		fprintf(stderr, "tableau #%d (%d):",
			i, gs->tableau[i].num_cards);
		print_so_cards(&(gs->tableau[i]));
	}
#endif
}
