mod card_stacks;
mod color;
mod rank;

pub use card_stacks::ShuffledDeck;
use color::Color;
use rank::Rank;
use std::fmt::{self, Debug, Display, Formatter};

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
        } else if self.ever_revealed {
            write!(f, "({}{})", self.color, self.rank)
        } else {
            write!(f, "*")
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
