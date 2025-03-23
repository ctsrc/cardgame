mod card_stacks;
mod color;
mod rank;

use bitfield_struct::bitfield;
pub use card_stacks::ShuffledDeck;
use color::Color;
use rank::Rank;
use std::fmt::{self, Debug, Display, Formatter};

#[bitfield(u16, debug = false)]
pub struct Card {
    /// The color of the card.
    #[bits(3)]
    pub color: Color,
    /// The rank of the card.
    #[bits(5)]
    pub rank: Rank,
    /// Whether this card has yet been revealed to the player(s).
    pub ever_revealed: bool,
    /// Whether the card is currently facing up.
    pub currently_facing_up: bool,
    /// Unique id of card in deck.
    ///
    /// This id is tied to the original position the card had in the deck after shuffling.
    #[bits(6)]
    pub id: u8,
}

impl Display for Card {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        if self.currently_facing_up() {
            write!(f, "{}{}", self.color(), self.rank())
        } else if self.ever_revealed() {
            write!(f, "({}{})", self.color(), self.rank())
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
            self.color(),
            self.rank(),
            self.id(),
            self.ever_revealed(),
            self.currently_facing_up()
        )
    }
}
