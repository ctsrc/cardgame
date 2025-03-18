use crate::{cards::Card, impl_cardstack, impl_cardstack_ops};
use arrayvec::ArrayVec;
use std::ops::Deref;
use newtype_derive::NewtypeFrom;

impl_cardstack!(StockSlot, StockSlotArray, 21); // 52 - (1 + 2 + 3 + 4 + 5 + 6 + 7) = 21
impl_cardstack!(WastePileSlot, WastePileSlotArray, 21);
impl_cardstack!(FoundationSlot, FoundationSlotArray, 13);
impl_cardstack!(TableauSlot, TableauSlotArray, 19);

pub struct Table {
    pub stock: StockSlot,
    pub waste_pile: WastePileSlot,
    pub foundations: [FoundationSlot; 4],
    pub tableau: [TableauSlot; 7],
}
