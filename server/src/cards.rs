use arrayvec::ArrayVec;
use newtype_derive::NewtypeFrom;
use rand::seq::SliceRandom;
use std::fmt::Debug;
use std::{
    fmt::{self, Display, Formatter},
    ops::Deref,
};
use strum::{Display, EnumIter, IntoEnumIterator};

#[derive(EnumIter, Display, Copy, Clone)]
pub enum Color {
    #[strum(serialize = "?")]
    Unknown,
    #[strum(serialize = "♠")]
    Spades,
    #[strum(serialize = "♥")]
    Hearts,
    #[strum(serialize = "♦")]
    Diamonds,
    #[strum(serialize = "♣")]
    Clubs,
}

#[derive(EnumIter, Display, Copy, Clone)]
pub enum Rank {
    #[strum(serialize = "?")]
    Unknown,
    A,
    #[strum(serialize = "2")]
    Two,
    #[strum(serialize = "3")]
    Three,
    #[strum(serialize = "4")]
    Four,
    #[strum(serialize = "5")]
    Five,
    #[strum(serialize = "6")]
    Six,
    #[strum(serialize = "7")]
    Seven,
    #[strum(serialize = "8")]
    Eight,
    #[strum(serialize = "9")]
    Nine,
    #[strum(serialize = "10")]
    Ten,
    J,
    Q,
    K,
}

pub struct Card {
    /// Unique id of card in deck.
    ///
    /// This id is tied to the original position the card had in the deck after shuffling.
    pub id: i8,
    /// The color of the card.
    pub color: Color,
    /// The rank of the card.
    pub rank: Rank,
    /// Whether this card has yet been revealed.
    pub ever_revealed: bool,
    /// Whether the card is currently facing up.
    pub currently_facing_up: bool,
}

impl Display for Card {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        if self.currently_facing_up {
            write!(f, "{}{}", self.color, self.rank)
        } else {
            if self.ever_revealed {
                write!(f, "({}{})", self.color, self.rank)
            } else {
                write!(f, "*")
            }
        }
    }
}

impl Debug for Card {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        write!(
            f,
            "{}{}({},{},{})",
            self.color, self.rank, self.id, self.ever_revealed, self.currently_facing_up
        )
    }
}

#[macro_export]
macro_rules! impl_cardstack_ops {
    ($t:ident, $n:expr) => {
        pub struct $t(ArrayVec<Card, $n>);

        NewtypeFrom! { () pub struct $t(ArrayVec<Card, $n>); }

        impl $t {
            pub fn push(&mut self, element: Card) {
                self.0.push(element)
                //ArrayVec::<Card, $n>::push(&mut self.0, element)
            }
        }

        impl Deref for $t {
            type Target = [Card];

            fn deref(&self) -> &[Card] {
                self.0.deref()
                //ArrayVec::<Card, $n>::deref(&self.0)
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

        let mut card_ids: Vec<i8> = (0..52).collect();
        card_ids.shuffle(&mut rand::rng());

        let mut card_ids_iter = card_ids.iter_mut();

        for color in Color::iter().skip(1) {
            for rank in Rank::iter().skip(1) {
                deck.push(Card {
                    color,
                    rank,
                    id: *(card_ids_iter.next().unwrap()),
                    ever_revealed: false,
                    currently_facing_up: false,
                });
            }
        }

        deck.sort_unstable_by_key(|k| k.id);

        ShuffledDeck::from(deck)
    }
}
