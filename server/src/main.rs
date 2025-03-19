mod cards;
mod klondike;

use crate::{cards::ShuffledDeck, klondike::Table};

fn main() {
    let deck = ShuffledDeck::new();

    // Display cards in deck.
    println!("{deck}");

    println!();

    // Debug display cards in deck.
    dbg!(&deck);
}
