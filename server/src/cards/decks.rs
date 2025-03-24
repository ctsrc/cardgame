use crate::cards::color::Color;
use crate::cards::rank::Rank;
use crate::cards::{Card, WireCardServerOrigin};
use arrayvec::ArrayVec;
use newtype_derive::NewtypeFrom;
use rand::prelude::SliceRandom;
use std::fmt::{Display, Formatter};
use std::ops::Deref;
use strum::IntoEnumIterator;

/// The unique identifier of a card within a deck.
///
/// The id is tied to the initial position of a card within its deck after initial shuffle.
#[derive(Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Debug)]
pub struct CardId(u8);

NewtypeFrom! { () pub struct CardId(u8); }

impl Display for CardId {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        self.0.fmt(f)
    }
}

impl CardId {
    pub const fn into_bits(self) -> u8 {
        self.0
    }

    pub const fn from_bits(value: u8) -> Self {
        // Only values in range `(0..=51)` are valid.
        // We use a special value with all bits set to indicate invalid value.
        if value >= 52 {
            Self(0b11111111)
        } else {
            Self(value)
        }
    }

    /// The situation in which we may encounter an invalid id (aside from bit flips in RAM)
    /// is when a client sent an id to us. In the case where the id was sent to us by a client,
    /// we will have converted it from bits already and any combination of bits outside of the
    /// allowable range `(0..=51)` will have been converted to a special value of `0b11111111`.
    pub fn is_valid(&self) -> bool {
        self.0 != 0b11111111
    }
}

macro_rules! impl_deck_ops {
    ($t:ident, $c:ident, $n:expr) => {
        #[derive(Clone)]
        pub struct $t(ArrayVec<$c, $n>);

        NewtypeFrom! { () pub struct $t(ArrayVec<$c, $n>); }

        impl Deref for $t {
            type Target = [$c];

            fn deref(&self) -> &[$c] {
                self.0.deref()
            }
        }

        impl std::fmt::Display for $t {
            fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
                let mut it = self.iter();
                let Some(card) = it.next() else {
                    return Ok(());
                };
                write!(f, "{card}")?;
                for card in it {
                    write!(f, " {card}")?;
                }
                Ok(())
            }
        }

        impl std::fmt::Debug for $t {
            fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
                let mut it = self.iter();
                let Some(card) = it.next() else {
                    return Ok(());
                };
                write!(f, "{card:?}")?;
                for card in it {
                    write!(f, " {card:?}")?;
                }
                Ok(())
            }
        }
    };
}

impl_deck_ops!(ShuffledDeck, Card, 52);

impl ShuffledDeck {
    pub fn new() -> ShuffledDeck {
        /*
         * The cards in the shuffled deck appear in order of their IDs,
         * such that the card with ID n is at array position n.
         */

        let mut deck = ArrayVec::<Card, 52>::new();

        let mut card_ids: Vec<u8> = (0..52).collect();
        card_ids.shuffle(&mut rand::rng());

        let mut card_ids_iter = card_ids.iter_mut();

        for color in Color::iter().skip(1) {
            for rank in Rank::iter().skip(1) {
                deck.push(
                    Card::new()
                        .with_color(color)
                        .with_rank(rank)
                        .with_ever_revealed(false)
                        .with_currently_facing_up(false)
                        .with_id(CardId::from(*(card_ids_iter.next().unwrap()))),
                );
            }
        }

        deck.sort_unstable_by_key(|k| k.id());

        ShuffledDeck::from(deck)
    }
}

impl Default for ShuffledDeck {
    fn default() -> Self {
        Self::new()
    }
}

impl_deck_ops!(WireShuffledDeckServerOrigin, WireCardServerOrigin, 52);

impl From<ShuffledDeck> for WireShuffledDeckServerOrigin {
    fn from(deck: ShuffledDeck) -> Self {
        Self(deck.iter().map(|&c| c.into()).collect())
    }
}
