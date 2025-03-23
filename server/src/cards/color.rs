use strum::{Display, EnumIter};

#[derive(EnumIter, Display, Copy, Clone)]
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
    fn is_known(&self) -> bool {
        ((*self as u8 >> 2) & 1) == 1
    }

    fn is_red(&self) -> Option<bool> {
        if *self as u8 == 0 {
            // For unknown cards we don't know if it's red or black.
            None
        } else {
            // For known cards, red colors have the lowest bit set.
            Some((*self as u8 & 1) == 1)
        }
    }
}

#[cfg(test)]
mod test {
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
}
