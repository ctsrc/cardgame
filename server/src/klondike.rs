/*
 * Copyright (c) 2018 Erik Nordstrøm <erik@nordstroem.no>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

use arrayvec::ArrayVec;

use std::ops::Deref;

use cards::Card;

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
