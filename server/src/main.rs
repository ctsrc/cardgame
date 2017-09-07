/*
 * Copyright (c) 2017 Erik Nordstrøm <erik@nordstroem.no>
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

use self::Color::*;
use self::Rank::*;
use std::slice::Iter;
use std::fmt;
use std::mem;

extern crate rand;
use rand::Rng;

#[derive(Copy, Clone)]
enum Color
{
    Spades,   // ♠,
    Hearts,   // ♥,
    Diamonds, // ♦,
    Clubs,    // ♣
}

#[derive(Copy, Clone)]
enum Rank
{
    A     = 1,
    Two,
    Three,
    Four,
    Five,
    Six,
    Seven,
    Eight,
    Nine,
    Ten,
    J,
    Q,
    K
}

impl Color
{
    // https://stackoverflow.com/a/21376984
    fn iterator () -> Iter<'static, Color>
    {
        static COLORS: [Color; 4] = [Spades, Hearts, Diamonds, Clubs];
        COLORS.into_iter()
    }
}

impl fmt::Display for Color
{
    // https://stackoverflow.com/a/45893535
    fn fmt (&self, f: &mut fmt::Formatter) -> fmt::Result
    {
        match *self
        {
            Spades => write!(f, "♠"),
            Hearts => write!(f, "♥"),
            Diamonds => write!(f, "♦"),
            Clubs => write!(f, "♣"),
        }
    }
}

impl Rank
{
    fn iterator () -> Iter<'static, Rank>
    {
        static RANKS: [Rank; 13] =
            [ A, Two, Three, Four, Five, Six, Seven,
              Eight, Nine, Ten, J, Q, K ] ;
        RANKS.into_iter()
    }
}

impl fmt::Display for Rank
{
    fn fmt (&self, f: &mut fmt::Formatter) -> fmt::Result
    {
        match *self
        {
            A     => write!(f, "{:-2}", "A"),
            Two   => write!(f, "{:-2}", "2"),
            Three => write!(f, "{:-2}", "3"),
            Four  => write!(f, "{:-2}", "4"),
            Five  => write!(f, "{:-2}", "5"),
            Six   => write!(f, "{:-2}", "6"),
            Seven => write!(f, "{:-2}", "7"),
            Eight => write!(f, "{:-2}", "8"),
            Nine  => write!(f, "{:-2}", "9"),
            Ten   => write!(f, "{:-2}", "10"),
            J     => write!(f, "{:-2}", "J"),
            Q     => write!(f, "{:-2}", "Q"),
            K     => write!(f, "{:-2}", "K"),
        }
    }
}

struct Card
{
    color:     Color,
    rank:      Rank,
    id:        u8,
    facing_up: bool
}

fn main ()
{
    // https://stackoverflow.com/a/31361031
    let all_cards = unsafe
    {
        let mut _all_cards: [Card; 52] = mem::uninitialized();

        let mut ids_available: Vec<u8> = (0..52).collect();

        // https://stackoverflow.com/a/26035435
        let mut ids_avail_slice = ids_available.as_mut_slice();
        rand::thread_rng().shuffle(ids_avail_slice);
        let mut id_iter = ids_avail_slice.iter_mut();

        for color in Color::iterator()
        {
            for rank in Rank::iterator()
            {

                let curr_id = *(id_iter.next().unwrap());

                let card = Card
                {
                    color:     *color,
                    rank:      *rank,
                    id:        curr_id,
                    facing_up: false
                };

                _all_cards[curr_id as usize] = card;
            }
        }

        _all_cards
    };

    for card in all_cards.iter()
    {
        println!("{}{} {:2} {}",
                 card.color, card.rank, card.id, card.facing_up);
    }
}
