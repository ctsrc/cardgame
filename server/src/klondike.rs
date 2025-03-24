use crate::{
    cards::{Card, ShuffledDeck},
    impl_cardstack, impl_cardstack_ops,
};
use arrayvec::ArrayVec;
use newtype_derive::NewtypeFrom;
use std::ops::Deref;

impl_cardstack!(StockSlot, Card, 21); // 52 - (1 + 2 + 3 + 4 + 5 + 6 + 7) = 21
impl_cardstack!(WastePileSlot, Card, 21);
impl_cardstack!(FoundationSlot, Card, 13);
impl_cardstack!(TableauSlot, Card, 19);

pub struct Table {
    /// The shuffled deck contains 52 cards, is initialized
    /// when a game is started, and is never modified after.
    ///
    /// This is where we keep the mapping from card ids to actual card values.
    ///
    /// As far as the server is concerned, all the stacks of cards on the table
    /// reference only the card ids.
    deck: ShuffledDeck,
    pub stock: StockSlot,
    pub waste_pile: WastePileSlot,
    pub foundations: [FoundationSlot; 4],
    pub tableau: [TableauSlot; 7],
}
