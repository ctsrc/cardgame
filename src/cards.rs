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
use rand::Rng;

#[derive(EnumIter, Display, Copy, Clone)]
pub enum Color
{
    #[strum(serialize="?")]
    Unknown,
    #[strum(serialize="♠")]
    Spades,
    #[strum(serialize="♥")]
    Hearts,
    #[strum(serialize="♦")]
    Diamonds,
    #[strum(serialize="♣")]
    Clubs
}

#[derive(EnumIter, Display, Copy, Clone)]
pub enum Rank
{
    #[strum(serialize="?")]
    Unknown,
    A,
    #[strum(serialize="2")]
    Two,
    #[strum(serialize="3")]
    Three,
    #[strum(serialize="4")]
    Four,
    #[strum(serialize="5")]
    Five,
    #[strum(serialize="6")]
    Six,
    #[strum(serialize="7")]
    Seven,
    #[strum(serialize="8")]
    Eight,
    #[strum(serialize="9")]
    Nine,
    #[strum(serialize="10")]
    Ten,
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

// TODO: Change to ArrayVec<[Card; 52]> after PR for that size has been merged.
pub fn cards_by_id_shuffled_deck () -> ArrayVec<[Card; 56]>
{
    /*
     * The cards in the shuffled deck appear in order of their IDs,
     * such that the card with ID n is at array position n.
     */

    let mut all_cards = ArrayVec::<[_; 56]>::new();

    let mut card_ids: Vec<i8> = (0..52).collect();
    rand::thread_rng().shuffle(&mut card_ids);

    let mut card_ids_iter = card_ids.iter_mut();

    for color in Color::iter().skip(1)
    {
        for rank in Rank::iter().skip(1)
        {
            let curr_id = *(card_ids_iter.next().unwrap());

            let card = Card
            {
                color:     color,
                rank:      rank,
                id:        curr_id,
                facing_up: false
            };

            all_cards.push(card);
        }
    }

    all_cards.sort_unstable_by_key(|k| k.id);

    all_cards
}
