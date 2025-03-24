use strum::{Display, EnumIter};

#[derive(EnumIter, Display, Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Debug)]
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

impl Rank {
    pub const fn into_bits(self) -> u8 {
        self as _
    }

    pub const fn from_bits(value: u8) -> Self {
        match value {
            0b10000 => Self::A,
            0b10001 => Self::Two,
            0b10010 => Self::Three,
            0b10011 => Self::Four,
            0b10100 => Self::Five,
            0b10101 => Self::Six,
            0b10110 => Self::Seven,
            0b10111 => Self::Eight,
            0b11000 => Self::Nine,
            0b11001 => Self::Ten,
            0b11010 => Self::J,
            0b11011 => Self::Q,
            0b11100 => Self::K,
            _ => Self::Unknown,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::Rank;
    use test_case::test_case;

    #[test_case(Rank::A)]
    #[test_case(Rank::Two)]
    #[test_case(Rank::Three)]
    #[test_case(Rank::Four)]
    #[test_case(Rank::Five)]
    #[test_case(Rank::Six)]
    #[test_case(Rank::Seven)]
    #[test_case(Rank::Eight)]
    #[test_case(Rank::Nine)]
    #[test_case(Rank::Ten)]
    #[test_case(Rank::J)]
    #[test_case(Rank::Q)]
    #[test_case(Rank::K)]
    fn round_trip_bits(orig_rank: Rank) {
        let bits = orig_rank.into_bits();
        let rank = Rank::from_bits(bits);
        assert_eq!(rank, orig_rank);
    }
}
