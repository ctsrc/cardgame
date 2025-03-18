mod cards;
mod klondike;

use crate::{cards::ShuffledDeck, klondike::Table};

fn main() {
    let deck = ShuffledDeck::new();

    for card in deck.iter() {
        if card.id < 51 {
            print!("{} ", card);
        } else {
            println!("{}", card);
        }
    }
}
