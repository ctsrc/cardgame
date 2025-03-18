extern crate strum;
#[macro_use]
extern crate strum_macros;
extern crate arrayvec;
#[macro_use]
extern crate newtype_derive;
extern crate rand;

#[macro_use]
mod cards;
use cards::ShuffledDeck;

mod klondike;
use klondike::Table;

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
