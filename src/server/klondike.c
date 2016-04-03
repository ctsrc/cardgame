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

void print_card_verbose (union card);
void print_shadow_state (shadow_state *);
void print_client_state (client_state *);

void redacted_copy_so_cards (struct so_cards *dst, struct so_cards const *src)
{
	memset(dst->cards, UNKNOWNCARD,
		src->num_cards * sizeof(dst->cards[0]));
	dst->num_cards = src->num_cards;
}

void plain_copy_so_cards (struct so_cards *dst, struct so_cards const *src)
{
	for (int i = 0 ; i < src->num_cards ; i++)
	{
		dst->cards[i] = src->cards[i];
	}
	dst->num_cards = src->num_cards;
}

void redacted_copy_df_so_cards (
	struct so_cards *dst,
	struct so_cards const *src)
{
	for (int i = 0 ; i < src->num_cards ; i++)
	{
		if (src->cards[i].fields.face_up)
		{
			dst->cards[i] = src->cards[i];
		}
		else
		{
			dst->cards[i].value = UNKNOWNCARD;
		}
	}
	dst->num_cards = src->num_cards;
}

void redacted_copy (client_state *c, shadow_state const *s)
{
#ifdef DEBUG
	assert(c->t < s->t);
	fprintf(stderr, "Updating client game state to t=%d.\n", s->t);
#endif

	memset(c, 0, sizeof(*c));

	c->t = s->t;
	c->gm = s->gm;
	c->dbglvl = s->dbglvl;

	// Redacted copy, deck.
	redacted_copy_so_cards(&(c->deck), &(s->deck));
	// Plain copy, waste.
	plain_copy_so_cards(&(c->waste), &(s->waste));

	// Plain copy, foundations.
	c->foundation[0] = s->foundation[0];
	c->foundation[1] = s->foundation[1];
	c->foundation[2] = s->foundation[2];
	c->foundation[3] = s->foundation[3];

	// Copy tableau cards with redaction of those down-facing.
	for (int i = 0 ; i < 7 ; i++)
	{
		redacted_copy_df_so_cards(&(c->tableau[i]),
			&(s->tableau[i]));
	}
}

void init_game (shadow_state *s, client_state *c, enum debug_level dbglvl)
{
#ifdef DEBUG
	fprintf(stderr, "Initializing game.\n");
#endif

	union card tmp_deck[52];

	{ // XXX: Constrain i to this scope.
	int i = 0;
	for (int color = HEARTS ; color <= CLUBS ; color++)
	{
		for (int rank = ACE ; rank <= KING ; rank++)
		{
			tmp_deck[i++] = (union card)
				{ .fields = { rank, color, FACE_DOWN } };
		}
	}
	}

	print_card_verbose((union card) { NULLCARD });
	for (int i = 0 ; i < 52 ; i++)
	{
		print_card_verbose(tmp_deck[i]);
	}
	print_card_verbose((union card) { UNKNOWNCARD });

#ifdef DEBUG
	if (dbglvl < DBG_NO_SHUFFLE)
	{
	fprintf(stderr, "Shuffeling temporary deck.\n");
#endif
	// Fisher-Yates shuffle the temporary deck
	for (int i = 51 ; i > 0 ; i--)
	{
		int j = arc4random_uniform(i + 1);

		union card tmp_card = tmp_deck[i];
		tmp_deck[i] = tmp_deck[j];
		tmp_deck[j] = tmp_card;
	}
#ifdef DEBUG
	}
#endif

	// First four members of our struct.
	s->t = 0;
	s->gm = CLASSIC;
	s->dbglvl = dbglvl;

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
			s->tableau[j].cards[i] = tmp_deck[--k];
		}
		s->tableau[i].cards[i].fields.face_up = FACE_UP;
		s->tableau[i].num_cards = i + 1;
	}

	// Initialize foundation with NULLCARD values.
	s->foundation[0] = (union card) { NULLCARD };
	s->foundation[1] = (union card) { NULLCARD };
	s->foundation[2] = (union card) { NULLCARD };
	s->foundation[3] = (union card) { NULLCARD };

	// Initialize deck
	for (int i = k ; i > 0 ; i--)
	{
		s->deck.cards[i - 1] = tmp_deck[--k];
		s->deck.num_cards++;
	}

	print_shadow_state(s);
	redacted_copy(c, s);
	print_client_state(c);
}

enum action_result pull_from_deck (shadow_state *);

// XXX: Takes care of common work associated with all actions, keepin' it DRY.
enum action_result action (
	enum action_result (*f)(shadow_state *),
	shadow_state *s,
	client_state *c)
{
	enum action_result r;

	struct game_state tmp = *s;

	if ((r = (*f)(&tmp)) != INVALID_ACTION)
	{
		*s = tmp;
		(s->t)++;
		print_shadow_state(s);
		redacted_copy(c, s);
		print_client_state(c);
	}

	return r;
}

int main (int argc, char *argv[])
{
	shadow_state s = {-1};
	client_state c = {-1};

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
	init_game(&s, &c, dbglvl);
	}

#ifdef DEBUG

	/*
	 * TEST #1: Cycle deck.
	 */

	client_state cmp_c = c;

	int t_prev = s.t;
	while (action(&pull_from_deck, &s, &c) != DECK_RECYCLED)
	{
		assert(s.t == ++t_prev);
		assert(memcmp(&cmp_c, &c, sizeof(c)) != 0);
	}
	assert(s.t == ++t_prev);

	cmp_c.t = c.t;
	assert(memcmp(&cmp_c, &c, sizeof(c)) == 0);

	/*
	 * TEST #2: TODO
	 */

#endif

	return EXIT_SUCCESS;
}

/*
 * ACTIONS
 */
enum action_result pull_from_deck (shadow_state *s)
{
	if (s->deck.num_cards > 0)
	{
		int n = 0;
		while ((n < s->gm) && s->deck.num_cards > 0)
		{
			n++;
			s->waste.cards[(s->waste.num_cards)] =
				s->deck.cards[--(s->deck.num_cards)];
			s->waste.cards[(s->waste.num_cards)++].fields.face_up =
				FACE_UP;
		}

		return n;
	}
	else
	{
		if (s->waste.num_cards == 0)
		{
			return INVALID_ACTION;
		}

		while (s->waste.num_cards > 0)
		{
			s->deck.cards[(s->deck.num_cards)] =
				s->waste.cards[--(s->waste.num_cards)];
			s->deck.cards[(s->deck.num_cards)++].fields.face_up =
				FACE_DOWN;
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

void _print_card (union card cd)
{
#ifdef DEBUG
	if (cd.value != 0)
	{
		fprintf(stderr, " %d", cd.value);
	}
	else
	{
		fprintf(stderr, " X");
	}
#endif
}

void print_card_verbose (union card cd)
{
#ifdef DEBUG
	fprintf(stderr, "%3d\t", cd.value);

	for (int j = 7 ; j >= 0 ; j--)
	{
		fprintf(stderr, "%d", (cd.value >> j) & 1);
	}
	fprintf(stderr, "\t");

	if (cd.fields.face_up)
	{
		fprintf(stderr, "FACE_UP\t");
	}
	else
	{
		fprintf(stderr, "       \t");
	}

	switch (cd.fields.color)
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
			fprintf(stderr, "ERR: Invalid color %d", cd.fields.color);
			abort();
	}
	fprintf(stderr, "\t");

	switch (cd.fields.rank)
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
	for (int i = 0 ; i < cs->num_cards ; i++)
	{
		_print_card(cs->cards[i]);
	}
	fprintf(stderr, "\n");
#endif
}

void _print_game_state (struct game_state *gs, bool is_shadow)
{
#ifdef DEBUG
	if (is_shadow && gs->dbglvl < DBG_PRINT_SHADOW)
	{
		return;
	}

	fprintf(stderr, "Printing %s game state with t=%d.\n",
		(is_shadow) ? "shadow" : "client", gs->t);

	// Print deck.
	fprintf(stderr, "deck (%d):", gs->deck.num_cards);
	print_so_cards(&(gs->deck));

	// Print waste.
	fprintf(stderr, "waste (%d):", gs->waste.num_cards);
	print_so_cards(&(gs->waste));

	// Print foundations.
	fprintf(stderr, "foudt (%d):",
		(gs->foundation[0].fields.rank)
		+ (gs->foundation[1].fields.rank)
		+ (gs->foundation[2].fields.rank)
		+ (gs->foundation[3].fields.rank));
	_print_card(gs->foundation[0]);
	_print_card(gs->foundation[1]);
	_print_card(gs->foundation[2]);
	_print_card(gs->foundation[3]);
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

void print_shadow_state (shadow_state *s)
{
#ifdef DEBUG
	_print_game_state(s, true);
#endif
}

void print_client_state (client_state *c)
{
#ifdef DEBUG
	_print_game_state(c, false);
#endif
}
