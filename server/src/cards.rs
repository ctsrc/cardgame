/*
 * Copyright (c) 2017, 2018 Erik Nordstrøm <erik@nordstroem.no>
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

use strum::IntoEnumIterator;
use arrayvec::ArrayVec;
use rand::seq::SliceRandom;

use std::ops::Deref;
use std::fmt;
use std::fmt::{Display, Formatter};

#[derive(EnumIter, Display, Copy, Clone)]
pub enum Color
{
    #[strum(serialize="?")]     Unknown,
    #[strum(serialize="♠")]     Spades,
    #[strum(serialize="♥")]     Hearts,
    #[strum(serialize="♦")]     Diamonds,
    #[strum(serialize="♣")]     Clubs
}

#[derive(EnumIter, Display, Copy, Clone)]
pub enum Rank
{
    #[strum(serialize="?")]     Unknown,
                                A,
    #[strum(serialize="2")]     Two,
    #[strum(serialize="3")]     Three,
    #[strum(serialize="4")]     Four,
    #[strum(serialize="5")]     Five,
    #[strum(serialize="6")]     Six,
    #[strum(serialize="7")]     Seven,
    #[strum(serialize="8")]     Eight,
    #[strum(serialize="9")]     Nine,
    #[strum(serialize="10")]    Ten,
                                J,
                                Q,
                                K
}

pub struct Card
{
    pub color:     Color,
    pub rank:      Rank,
    pub id:        i8,
    pub facing_up: bool
}

impl Display for Card
{
    fn fmt (&self, f: &mut Formatter) -> fmt::Result
    {
        write!(f, "{}{}", self.color, self.rank)
    }
}

macro_rules! impl_cardstack_ops
{
    ($t:ident, $a:ident, $n:expr) =>
    {
        type $a = [Card; $n];

        pub struct $t(ArrayVec<$a>);

        NewtypeFrom! { () pub struct $t(ArrayVec<$a>); }

        impl $t
        {
            pub fn push (&mut self, element: <$a as arrayvec::Array>::Item)
            {
                ArrayVec::<$a>::push(&mut self.0, element)
            }
        }

        impl Deref for $t
        {
            type Target = [<$a as arrayvec::Array>::Item];

            fn deref (&self) -> &[<$a as arrayvec::Array>::Item]
            {
                ArrayVec::<$a>::deref(&self.0)
            }
        }
    }
}

macro_rules! impl_cardstack
{
    ($t:ident, $a:ident, $n:expr) =>
    {
        impl_cardstack_ops!($t, $a, $n);

        impl $t
        {
            pub fn new () -> $t
            {
                $t::from(ArrayVec::<$a>::new())
            }
        }
    }
}

// TODO: Change to ArrayVec<[Card; 52]> after PR for that size has been merged.
impl_cardstack_ops!(ShuffledDeck, ShuffledDeckArray, 56);

impl ShuffledDeck
{
    pub fn new () -> ShuffledDeck
    {
        /*
         * The cards in the shuffled deck appear in order of their IDs,
         * such that the card with ID n is at array position n.
         */

        let mut deck = ArrayVec::<ShuffledDeckArray>::new();

        let mut card_ids: Vec<i8> = (0..52).collect();
        card_ids.shuffle(&mut rand::thread_rng());

        let mut card_ids_iter = card_ids.iter_mut();

        for color in Color::iter().skip(1)
        {
            for rank in Rank::iter().skip(1)
            {
                deck.push(Card
                {
                    color:     color,
                    rank:      rank,
                    id:        *(card_ids_iter.next().unwrap()),
                    facing_up: false
                });
            }
        }

        deck.sort_unstable_by_key(|k| k.id);

        ShuffledDeck::from(deck)
    }
}
