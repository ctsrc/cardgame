use crate::cards::color::Color;
use crate::cards::rank::Rank;
use crate::cards::{Card, WireCardServerOrigin};
use arrayvec::ArrayVec;
use newtype_derive::NewtypeFrom;
use rand::prelude::SliceRandom;
use std::ops::Deref;
use strum::IntoEnumIterator;

#[macro_export]
macro_rules! impl_cardstack_ops {
    ($t:ident, $c:ident, $n:expr) => {
        #[derive(Clone)]
        pub struct $t(ArrayVec<$c, $n>);

        NewtypeFrom! { () pub struct $t(ArrayVec<$c, $n>); }

        impl $t {
            pub fn push(&mut self, element: $c) {
                self.0.push(element)
            }
        }

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

#[macro_export]
macro_rules! impl_cardstack {
    ($t:ident, $c:ident, $n:expr) => {
        impl_cardstack_ops!($t, $c, $n);

        impl $t {
            pub fn new() -> $t {
                $t::from(ArrayVec::<$c, $n>::new())
            }
        }

        impl Default for $t {
            fn default() -> Self {
                Self::new()
            }
        }
    };
}

impl_cardstack_ops!(ShuffledDeck, Card, 52);

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
                        .with_id(*(card_ids_iter.next().unwrap())),
                );
            }
        }

        deck.sort_unstable_by_key(|k| k.id());

        ShuffledDeck::from(deck)
    }
}

impl_cardstack_ops!(WireShuffledDeckServerOrigin, WireCardServerOrigin, 52);

impl From<ShuffledDeck> for WireShuffledDeckServerOrigin {
    fn from(deck: ShuffledDeck) -> Self {
        Self(deck.iter().map(|&c| c.into()).collect())
    }
}
