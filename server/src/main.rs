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

extern crate rand;
use self::rand::{thread_rng, Rng};

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
            A     => write!(f, "A"),
            Two   => write!(f, "2"),
            Three => write!(f, "3"),
            Four  => write!(f, "4"),
            Five  => write!(f, "5"),
            Six   => write!(f, "6"),
            Seven => write!(f, "7"),
            Eight => write!(f, "8"),
            Nine  => write!(f, "9"),
            Ten   => write!(f, "10"),
            J     => write!(f, "J"),
            Q     => write!(f, "Q"),
            K     => write!(f, "K"),
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
    let mut all_cards: Vec<Card> = Vec::new();

    let ids_available: Vec<u8> = (0..51).collect();

    for color in Color::iterator()
    {
        for rank in Rank::iterator()
        {
            let curr_id: u8;

            curr_id = 0;

            let card = Card
            {
                color:     *color,
                rank:      *rank,
                id:        curr_id,
                facing_up: false
            };

            all_cards.push(card);
        }
    }

    for card in all_cards.iter()
    {
        println!("{}{} {} {}",
                 card.color, card.rank, card.id, card.facing_up);
    }
}
