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
use rand::Rng;

use std::mem;

#[derive(EnumIter, Display, Copy, Clone)]
pub enum Color
{
    #[strum(serialize="♠")]
    Spades   = 1,
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
    A = 1,
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
    pub id:        u8,
    pub facing_up: bool
}

pub fn cards_by_id_shuffled_deck () -> Box<[Card; 52]>
{
    /*
     * Returns a boxed array of Cards, where the cards
     * appear in order of their IDs, such that the card
     * with ID n is at array position n.
     */

    // https://stackoverflow.com/a/31361031
    let all_cards = unsafe
    {
        let mut _all_cards: [Card; 52] = mem::uninitialized();

        let mut ids_available: Vec<u8> = (0..52).collect();

        // https://stackoverflow.com/a/26035435
        let ids_avail_slice = ids_available.as_mut_slice();
        rand::thread_rng().shuffle(ids_avail_slice);
        let mut id_iter = ids_avail_slice.iter_mut();

        for color in Color::iter()
        {
            for rank in Rank::iter()
            {
                let curr_id = *(id_iter.next().unwrap());

                let card = Card
                {
                    color:     color,
                    rank:      rank,
                    id:        curr_id,
                    facing_up: false
                };

                _all_cards[curr_id as usize] = card;
            }
        }

        _all_cards
    };

    Box::new(all_cards)
}
