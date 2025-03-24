mod card_stacks;
mod color;
mod rank;

use bitfield_struct::bitfield;
pub use card_stacks::{ShuffledDeck, WireShuffledDeckServerOrigin};
use color::Color;
use rank::Rank;
use std::fmt::{self, Debug, Display, Formatter};

/// Wire representation of card for transmission from server to client.
///
/// See [Card] for field descriptions; they are the same.
///
/// The difference between the wire transmission representation and the
/// server side representations for cards, is that for cards which have
/// not yet been revealed to the player(s), we zero out the secrets.
#[bitfield(u16, debug = false)]
pub struct WireCardServerOrigin {
    #[bits(3)]
    pub color: Color,
    #[bits(5)]
    pub rank: Rank,
    pub ever_revealed: bool,
    pub currently_facing_up: bool,
    #[bits(6)]
    pub id: u8,
}

impl From<Card> for WireCardServerOrigin {
    fn from(card: Card) -> Self {
        if card.ever_revealed() {
            // This card has already been revealed in the game, so it is fine to
            // expose the secrets of the card. Nothing about the card is hidden
            // from the client in this case.
            WireCardServerOrigin::from(card.into_bits())
        } else {
            // This card has NOT yet been revealed in the game, so we have to keep
            // the secrets secret. No revealing the color and the rank to any of
            // the players for this card yet.
            WireCardServerOrigin::new()
                .with_color(Color::Unknown) // Color not yet revealed to players.
                .with_rank(Rank::Unknown) // Rank not yet revealed to players.
                .with_ever_revealed(false) // Card not yet revealed. That's why we're here in the first place.
                .with_currently_facing_up(false) // A card that has not been revealed is by definition also not currently facing up.
                .with_id(card.id()) // The ID of the card is necessary and non-secret.
        }
    }
}

impl Display for WireCardServerOrigin {
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

impl Debug for WireCardServerOrigin {
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

/// Local representation of card on client or server.
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
