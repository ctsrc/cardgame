use crate::{cards::Card, impl_cardstack, impl_cardstack_ops};
use arrayvec::ArrayVec;
use newtype_derive::NewtypeFrom;
use std::ops::Deref;

impl_cardstack!(StockSlot, 21); // 52 - (1 + 2 + 3 + 4 + 5 + 6 + 7) = 21
impl_cardstack!(WastePileSlot, 21);
impl_cardstack!(FoundationSlot, 13);
impl_cardstack!(TableauSlot, 19);

pub struct Table {
    pub stock: StockSlot,
    pub waste_pile: WastePileSlot,
    pub foundations: [FoundationSlot; 4],
    pub tableau: [TableauSlot; 7],
}
