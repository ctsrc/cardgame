use strum::{Display, EnumIter};

#[derive(EnumIter, Display, Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Debug)]
#[repr(u8)]
pub enum Color {
    #[strum(serialize = "?")]
    Unknown = 0,
    #[strum(serialize = "♠")]
    Spades = 0b100,
    #[strum(serialize = "♥")]
    Hearts = 0b101,
    #[strum(serialize = "♣")]
    Clubs = 0b110,
    #[strum(serialize = "♦")]
    Diamonds = 0b111,
}

impl Color {
    pub const fn into_bits(self) -> u8 {
        self as _
    }

    pub const fn from_bits(value: u8) -> Self {
        match value {
            0b100 => Self::Spades,
            0b101 => Self::Hearts,
            0b110 => Self::Clubs,
            0b111 => Self::Diamonds,
            _ => Self::Unknown,
        }
    }

    fn is_known(&self) -> bool {
        ((self.into_bits() >> 2) & 1) == 1
    }

    fn is_red(&self) -> Option<bool> {
        if self.into_bits() == 0 {
            // For unknown cards we don't know if it's red or black.
            None
        } else {
            // For known cards, red colors have the lowest bit set.
            Some((self.into_bits() & 1) == 1)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::Color;
    use test_case::test_case;

    #[test]
    fn unknown_card() {
        let color = Color::Unknown;
        assert!(!color.is_known());
        assert_eq!(color.is_red(), None);
    }

    #[test_case(Color::Hearts)]
    #[test_case(Color::Diamonds)]
    fn red_card(color: Color) {
        assert!(color.is_known());
        assert_eq!(color.is_red(), Some(true));
    }

    #[test_case(Color::Spades)]
    #[test_case(Color::Clubs)]
    fn black_card(color: Color) {
        assert!(color.is_known());
        assert_eq!(color.is_red(), Some(false));
    }

    #[test_case(Color::Unknown)]
    #[test_case(Color::Spades)]
    #[test_case(Color::Hearts)]
    #[test_case(Color::Clubs)]
    #[test_case(Color::Diamonds)]
    fn round_trip_bits(orig_color: Color) {
        let bits = orig_color.into_bits();
        let color = Color::from_bits(bits);
        assert_eq!(color, orig_color);
    }
}
