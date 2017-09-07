use self::Color::*;
use self::Rank::*;
use std::slice::Iter;
use std::fmt;

extern crate rand;
use self::rand::{thread_rng, Rng};

#[derive(Copy, Clone)]
enum Color
{
    Spades,   // ♠,
    Hearts,   // ♥,
    Diamonds, // ♦,
    Clubs,    // ♣
}

#[derive(Copy, Clone)]
enum Rank
{
    A     = 1,
    Two,
    Three,
    Four,
    Five,
    Six,
    Seven,
    Eight,
    Nine,
    J,
    Q,
    K
}

impl Color
{
    // https://stackoverflow.com/a/21376984
    fn iterator () -> Iter<'static, Color>
    {
        static COLORS: [Color; 4] = [Spades, Hearts, Diamonds, Clubs];
        COLORS.into_iter()
    }
}

impl fmt::Display for Color
{
    // https://stackoverflow.com/a/45893535
    fn fmt (&self, f: &mut fmt::Formatter) -> fmt::Result
    {
        match *self
        {
            Spades => write!(f, "♠"),
            Hearts => write!(f, "♥"),
            Diamonds => write!(f, "♦"),
            Clubs => write!(f, "♣"),
        }
    }
}

impl Rank
{
    fn iterator () -> Iter<'static, Rank>
    {
        static RANKS: [Rank; 12] =
            [ A, Two, Three, Four, Five, Six, Seven, Eight, Nine, J, Q, K ] ;
        RANKS.into_iter()
    }
}

impl fmt::Display for Rank
{
    fn fmt (&self, f: &mut fmt::Formatter) -> fmt::Result
    {
        match *self
        {
            A     => write!(f, "A"),
            Two   => write!(f, "2"),
            Three => write!(f, "3"),
            Four  => write!(f, "4"),
            Five  => write!(f, "5"),
            Six   => write!(f, "6"),
            Seven => write!(f, "7"),
            Eight => write!(f, "8"),
            Nine  => write!(f, "9"),
            J     => write!(f, "J"),
            Q     => write!(f, "Q"),
            K     => write!(f, "K"),
        }
    }
}

struct Card
{
    color:     Color,
    rank:      Rank,
    id:        u8,
    facing_up: bool
}

fn main ()
{
    let mut all_cards: Vec<Card> = Vec::new();

    let ids_available: Vec<u8> = (0..51).collect();

    for color in Color::iterator()
    {
        for rank in Rank::iterator()
        {
            let curr_id: u8;

            curr_id = 0;

            let card = Card
            {
                color:     *color,
                rank:      *rank,
                id:        curr_id,
                facing_up: false
            };

            all_cards.push(card);
        }
    }

    for card in all_cards.iter()
    {
        println!("{}{} {} {}",
                 card.color, card.rank, card.id, card.facing_up);
    }
}
