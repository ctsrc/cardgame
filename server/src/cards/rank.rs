use strum::{Display, EnumIter};

#[derive(EnumIter, Display, Copy, Clone)]
#[repr(u8)]
pub enum Rank {
    #[strum(serialize = "?")]
    Unknown = 0,
    A = 0b10000,
    #[strum(serialize = "2")]
    Two = 0b10001,
    #[strum(serialize = "3")]
    Three = 0b10010,
    #[strum(serialize = "4")]
    Four = 0b10011,
    #[strum(serialize = "5")]
    Five = 0b10100,
    #[strum(serialize = "6")]
    Six = 0b10101,
    #[strum(serialize = "7")]
    Seven = 0b10110,
    #[strum(serialize = "8")]
    Eight = 0b10111,
    #[strum(serialize = "9")]
    Nine = 0b11000,
    #[strum(serialize = "10")]
    Ten = 0b11001,
    J = 0b11010,
    Q = 0b11011,
    K = 0b11100,
}
