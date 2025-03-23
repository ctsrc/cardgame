use crate::cards::Card;
use crate::cards::color::Color;
use crate::cards::rank::Rank;
use arrayvec::ArrayVec;
use newtype_derive::NewtypeFrom;
use rand::prelude::SliceRandom;
use std::ops::Deref;
use strum::IntoEnumIterator;

#[macro_export]
macro_rules! impl_cardstack_ops {
    ($t:ident, $n:expr) => {
        pub struct $t(ArrayVec<Card, $n>);

        NewtypeFrom! { () pub struct $t(ArrayVec<Card, $n>); }

        impl $t {
            pub fn push(&mut self, element: Card) {
                self.0.push(element)
            }
        }

        impl Deref for $t {
            type Target = [Card];

            fn deref(&self) -> &[Card] {
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

        impl Default for $t {
            fn default() -> Self {
                Self::new()
            }
        }
    };
}

#[macro_export]
macro_rules! impl_cardstack {
    ($t:ident, $n:expr) => {
        impl_cardstack_ops!($t, $n);

        impl $t {
            pub fn new() -> $t {
                $t::from(ArrayVec::<Card, $n>::new())
            }
        }
    };
}

impl_cardstack_ops!(ShuffledDeck, 52);

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
