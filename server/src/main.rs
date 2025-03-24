mod cards;
mod klondike;

use crate::{
    cards::{ShuffledDeck, WireShuffledDeckServerOrigin},
    klondike::Table,
};

fn main() {
    let deck = ShuffledDeck::new();

    // Wire representation of what we would send to client if we were to send deck at this point.
    let deck_for_client: WireShuffledDeckServerOrigin = deck.to_owned().into();

    // Display cards in deck on server-side representation.
    println!("{deck}");

    println!();

    // Debug display wire repr of what we would send to client regarding cards in deck.
    dbg!(&deck_for_client);

    println!();

    // Debug display cards in deck on server-side representation.
    dbg!(&deck);
}
