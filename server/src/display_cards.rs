/*
 * Copyright (c) 2017 Erik Nordstrøm <erik@nordstroem.no>
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

use std::fmt;

use cards::Color;
use cards::Color::*;
use cards::Rank;
use cards::Rank::*;

// https://stackoverflow.com/a/45893535

impl fmt::Display for Color
{
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

impl fmt::Display for Rank
{
    fn fmt (&self, f: &mut fmt::Formatter) -> fmt::Result
    {
        match *self
        {
            A     => write!(f, "{:-2}", "A"),
            Two   => write!(f, "{:-2}", "2"),
            Three => write!(f, "{:-2}", "3"),
            Four  => write!(f, "{:-2}", "4"),
            Five  => write!(f, "{:-2}", "5"),
            Six   => write!(f, "{:-2}", "6"),
            Seven => write!(f, "{:-2}", "7"),
            Eight => write!(f, "{:-2}", "8"),
            Nine  => write!(f, "{:-2}", "9"),
            Ten   => write!(f, "{:-2}", "10"),
            J     => write!(f, "{:-2}", "J"),
            Q     => write!(f, "{:-2}", "Q"),
            K     => write!(f, "{:-2}", "K"),
        }
    }
}
