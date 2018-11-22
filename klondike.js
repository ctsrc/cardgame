/*
 * Copyright (c) 2016, 2017 Erik Nordstrøm <erik@nordstroem.no>
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

document.body.addEventListener('touchmove', (e) => { e.preventDefault(); });

const enum_color =
{
	NO_COLOR : 0,
	SPADES : 1,
	HEARTS : 2,
	DIAMONDS : 3,
	CLUBS : 4,
	UNKNOWN_COLOR : 5
};

const enum_rank =
{
	NO_RANK : 0,
	ACE : 1,
	TWO : 2,
	THREE : 3,
	FOUR : 4,
	FIVE : 5,
	SIX : 6,
	SEVEN : 7,
	EIGHT : 8,
	NINE : 9,
	TEN : 10,
	JACK : 11,
	QUEEN : 12,
	KING : 13,
	UNKNOWN_RANK : 14
};

const NULLCARD = 0;
const UNKNOWNCARD = 94;

// XXX: How cards are stacked
const enum_stacking =
{
	ONE_STACK : 0,
	TOP_THREE_HORZ : 1,
	VERT_SPACE : 2,
	INHERIT : 3
};

class ParentToCard
{
	constructor (cdims, margs, stacking)
	{
		this.cdims = cdims;
		this.margs = margs;
		this.child = null;
		this.stacking = stacking;
	}

	setChild (child)
	{
		if (this.child !== null)
		{
			throw 'Attempted to set child where already set.';
		}
		else
		{
			this.child = child;
		}
	}

	detachChild ()
	{
		if (this.child === null)
		{
			throw 'Attempted to detach child where not set.';
		}
		else
		{
			let child = this.child;
			this.child = null;
			return child;
		}
	}

	countChildren ()
	{
		let count = 0;
		let curr = this;

		while (curr.child !== null)
		{
			curr = curr.child;
			count++;
		}

		return count;
	}

	/*
	 * Returns the child offset by n (zero index) if it exists,
	 *   where a negative requested index means counting
	 *   backward from the end,
	 * returns null if exactly off by one,
	 * throws an exception if out of bounds.
	 */
	getChildN (n)
	{
		let curr = this.child;

		if (n > 0)
		{
			let i = 0;
			while (curr !== null && i < n)
			{
				curr = curr.child;
				i++;
			}

			if (i < n)
			{
				throw 'Attempted to get child out of bounds.';
			}
		}
		else if (n < 0)
		{
			let tail = this.getChildN(-n);

			while (tail !== null)
			{
				curr = curr.child;
				tail = tail.child;
			}
		}
		// else if n !== 0 do we not bother to check for.
		// else n === 0, we already have the requested child.

		return curr;
	}

	/*
	 * Returns the nth-last-most child if it exists,
	 * returns the first child (may be null) otherwise.
	 * Throws an exception if n <= 0.
	 */
	getDownToNthLastChild (n)
	{
		if (n <= 0)
		{
			throw 'Requested n is out of range. Need n > 0.';
		}

		if (this.countChildren() > n)
		{
			return this.getChildN(-n);
		}
		else
		{
			return this.child;
		}
	}

	getRootParent ()
	{
		return this;
	}
}

class ChainableCard extends ParentToCard
{
	constructor (cdims, margs, id, colorid)
	{
		super(cdims, margs, enum_stacking.INHERIT);
		this.parent = null;

		this.id = id;

		this.colorid = colorid;

		this.value = UNKNOWNCARD;
	}

	replaceParent (new_parent)
	{
		let old_parent = this.parent;

		new_parent.setChild(this);
		this.parent = new_parent;
		old_parent.detachChild();

		return old_parent;
	}

	getRootParent ()
	{
		return this.parent.getRootParent();
	}

	setParent (new_parent)
	{
		if (this.parent !== null)
		{
			throw 'Attempted to set parent where already set.';
		}
		else
		{
			new_parent.setChild(this);
			this.parent = new_parent;
		}
	}

	isFacingUp ()
	{
		return this.value & (1 << 7);
	}

	getColor ()
	{
		return (this.value & (7 << 4)) >> 4;
	}

	getRank ()
	{
		return this.value & 15;
	}

	getDims (drawscale, x, y, z)
	{
		let cx = Math.floor(x * drawscale);
		let cy = Math.floor(y * drawscale);
		let cz = 0;
		let cw = Math.ceil(this.cdims.cw * drawscale);
		let ch = Math.ceil(this.cdims.ch * drawscale);
		let ct = 0;

		return [cx, cy, cz, cw, ch, ct];
	}

	render (ctx, drawscale, x, y, z, dx, dy, dz)
	{
		// TODO: Render only visible portion of card.

		let [cx, cy, cz, cw, ch, ct] = this.getDims(drawscale, x, y, z);

		ctx.fillStyle = 'rgb(0, 0, 0)';
		ctx.fillRect(cx, cy, cw, ch);

		if (this.isFacingUp())
		{
			ctx.fillStyle = 'rgb(255, 255, 255)';
		}
		else
		{
			// TODO: Render backside
			ctx.fillStyle = 'rgb(' + this.colorid.red + ', 0, ' + this.colorid.blue + ')';
		}
		ctx.fillRect(cx + 2, cy + 2, cw - 4, ch - 4);

		let next = this.child;

		if (next !== null)
		{
			next.render(ctx, drawscale, x + dx, y + dy, z + dz, dx, dy, dz);
		}
	}

	renderId (ctx, drawscale, x, y, z)
	{
		let [cx, cy, cz, cw, ch, ct] = this.getDims(drawscale, x, y, z);

		ctx.fillStyle = 'rgb(' + this.colorid.red + ', 0, ' + this.colorid.blue + ')';
		ctx.fillRect(cx, cy, cw, ch);
	}

	renderPickable (ctx, drawscale, x, y, z, dx, dy, dz)
	{
		if (this.isFacingUp())
		{
			this.renderId(ctx, drawscale, x, y, z);
		}

		let next = this.child;

		if (next !== null)
		{
			next.renderPickable(ctx, drawscale, x + dx, y + dy, z + dz, dx, dy, dz);
		}
	}
}

class CardLocation extends ParentToCard
{
	constructor (name, cdims, margs, x, y, z, stacking, w, h)
	{
		super(cdims, margs, stacking);

		this.name = name;

		this.x = x;
		this.y = y;
		this.z = z;

		this.w = w;
		this.h = h;

		this.canvas = document.createElement('canvas');
		this.ctx = this.canvas.getContext('2d');

		this.stale = true;
	}

	render (drawscale)
	{
		let render_from = this.child;

		let dx = 0;
		let dy = this.margs.cmin_y;

		if (this.stacking === enum_stacking.ONE_STACK)
		{
			render_from = this.getDownToNthLastChild(1);
		}
		else if (this.stacking === enum_stacking.TOP_THREE_HORZ)
		{
			render_from = this.getDownToNthLastChild(3);
			dx = this.margs.cmin_x;
			dy = 0;
		}

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		if (render_from === null)
		{
			// TODO: Draw pattern.
		}
		else
		{
			this.recalcWH();
			this.canvas.width = Math.ceil(drawscale * this.w);
			this.canvas.height = Math.ceil(drawscale * this.h);

			render_from.render(this.ctx, drawscale, 0, 0, 0, dx, dy, 0);
		}

		this.stale = false;
	}
}

class Deck extends CardLocation
{
	constructor (name, cdims, margs, x, y, z)
	{
		super(name, cdims, margs, x, y, z, enum_stacking.ONE_STACK, cdims.cw, cdims.ch);
	}

	renderTouchActionable ()
	{
		// TODO
	}

	recalcWH ()
	{
		// XXX: w and h do not change
	}
}

renderTopmostPickable = function (ctx, drawscale)
{
	topmost = this.getDownToNthLastChild(1);

	if (topmost != null)
	{
		topmost.renderPickable(ctx, drawscale, this.x, this.y, this.z, 0, 0, 0);
	}
}

class Waste extends CardLocation
{
	constructor (name, cdims, margs, x, y, z)
	{
		super(name, cdims, margs, x, y, z, enum_stacking.TOP_THREE_HORZ, cdims.cw * 3 + margs.cmin_x * 2, cdims.ch);
	}

	recalcWH ()
	{
		let num_children = this.countChildren();
		let num_children_places = num_children;

		if (num_children == 0)
		{
			num_children_places = 1;
		}
		else if (num_children > 3)
		{
			num_children_places = 3;
		}

		this.w = num_children_places * this.cdims.cw + (num_children_places - 1) * this.margs.cmin_x;
	}
}
Waste.prototype.renderPickable = renderTopmostPickable;

class Foundation extends CardLocation
{
	constructor (name, cdims, margs, x, y, z)
	{
		super(name, cdims, margs, x, y, z, enum_stacking.ONE_STACK, cdims.cw, cdims.ch);
	}

	renderPutable (card)
	{
		// TODO
	}

	recalcWH ()
	{
		// XXX: Does not change.
	}

	renderPutable (ctx, drawscale, hand)
	{
		let possibly_putable = hand.getDownToNthLastChild(1);

		if (possibly_putable !== null)
		{
			if (hand.countChildren() !== 1)
			{
				return;
			}

			if (hand.child.getColor() !== possibly_putable.getColor())
			{
				return;
			}

			if (hand.child.getRank() !== possibly_putable.getRank() - 1)
			{
				return;
			}

			possibly_putable.renderId(ctx, drawscale, this.x, this.y, this.z);
		}
	}
}
Foundation.prototype.renderPickable = renderTopmostPickable;

class Tableau extends CardLocation
{
	constructor (name, cdims, margs, x, y, z)
	{
		super(name, cdims, margs, x, y, z, enum_stacking.VERT_SPACE, cdims.cw, cdims.ch * 13 + margs.cmin_y * 12);
	}

	renderPickable (ctx, drawscale)
	{
		let possibly_pickable = this.child;

		if (possibly_pickable != null)
		{
			possibly_pickable.renderPickable(ctx, drawscale, this.x, this.y, this.z, 0, this.margs.cmin_y, 0);
		}
	}

	renderPutable (card)
	{
	}

	recalcWH ()
	{
		let num_children = this.countChildren();
		let num_children_places = num_children;

		if (num_children == 0)
		{
			num_children_places = 1;
		}

		this.h = num_children_places * this.cdims.ch + (num_children_places - 1) * this.margs.cmin_y;
	}
}

class Hand extends CardLocation
{
	constructor (name, cdims, margs, x, y, z)
	{
		super(name, cdims, margs, x, y, z, enum_stacking.VERT_SPACE, cdims.cw, cdims.ch * 13 + margs.cmin_y * 12);

		this.prev_parent_of_child = null;

		this.has_moved = false;
	}

	recalcWH ()
	{
		let num_children = this.countChildren();
		let num_children_places = num_children;

		if (num_children == 0)
		{
			num_children_places = 1;
		}

		this.h = num_children_places * this.cdims.ch + (num_children_places - 1) * this.margs.cmin_y;
	}

	pick (card)
	{
		this.prev_parent_of_child = card.replaceParent(this);
		this.prev_parent_of_child.getRootParent().stale = true;
		this.stale = true;
	}

	drop ()
	{
		this.child.replaceParent(this.prev_parent_of_child);
		this.prev_parent_of_child.getRootParent().stale = true;
		this.prev_parent_of_child = null;
		this.stale = true;
	}

	put (new_parent)
	{
		this.child.replaceParent(new_parent);
		new_parent.getRootParent().stale = true;
		this.prev_parent_of_child = null;
		this.stale = true;
	}
}

class CardDims
{
	constructor (cw, ch, ct)
	{
		this.cw = cw; // Width
		this.ch = ch; // Height
		this.ct = ct; // Thickness
	}
}

class Margins
{
	constructor (cmin_x, cmin_y, ttop, tright, tbottom, tleft)
	{
		this.cmin_x = cmin_x; // Min dist cards horizontal
		this.cmin_y = cmin_y; // Min dist cards vertical
		this.ttop = ttop; // Table top
		this.tright = tright; // Table right
		this.tbottom = tbottom; // Table bottom
		this.tleft = tleft; // Table left
	}
}

class Table
{
	constructor (id, cdims, margs, canvas, ctx = null,
		canvas_pickable = null, ctx_pickable = null,
		canvas_putable = null, ctx_putable = null)
	{
		this.id = id;

		this.cdims = cdims;
		this.margs = margs;

		this.canvas = canvas;

		if (ctx === null)
		{
			this.ctx = canvas.getContext('2d');
		}
		else
		{
			this.ctx = ctx;
		}

		if (canvas_pickable === null)
		{
			this.canvas_pickable = document.createElement('canvas');
		}
		else
		{
			this.canvas_pickable = canvas_pickable;
		}

		if (ctx_pickable === null)
		{
			this.ctx_pickable = this.canvas_pickable.getContext('2d');
		}
		else
		{
			this.ctx_pickable = ctx_pickable;
		}

		if (canvas_putable === null)
		{
			this.canvas_putable = document.createElement('canvas');
		}
		else
		{
			this.canvas_putable = canvas_putable;
		}

		if (ctx_putable === null)
		{
			this.ctx_putable = this.canvas_putable.getContext('2d');
		}
		else
		{
			this.ctx_putable = ctx_putable;
		}

		this.canvas_tablecache = document.createElement('canvas');
		this.ctx_tablecache = this.canvas_tablecache.getContext('2d');

		canvas.addEventListener('mousedown', (e) =>
		{
			this.updateHandPosMouse(e);
			this.interactionStart();
		});
		canvas.addEventListener('mousemove', (e) =>
		{
			this.updateHandPosMouse(e);
		});
		canvas.addEventListener('mouseup', (e) =>
		{
			this.updateHandPosMouse(e);
			this.interactionEnd();
		});
		canvas.addEventListener('mouseout', (e) =>
		{
			this.updateHandPosMouse(e);
			this.interactionEnd();
		});

		canvas.addEventListener('touchstart', (e) =>
		{
			this.updateHandPosTouch(e);
			this.interactionStart();
		});
		canvas.addEventListener('touchmove', (e) =>
		{
			this.updateHandPosTouch(e);
		});
		canvas.addEventListener('touchend', (e) =>
		{
			this.updateHandPosTouch(e);
			this.interactionEnd();
		});

		this.cardlocations = new Array(13);

		let deck_x = margs.tleft;
		this.deck = new Deck('Deck', cdims, margs, deck_x, margs.ttop, 0);
		this.cardlocations[0] = this.deck;

		let waste_x = deck_x + cdims.cw + margs.cmin_x;
		this.waste = new Waste('Waste', cdims, margs, waste_x, margs.ttop, 0);
		this.cardlocations[1] = this.waste;

		let foundation_start = 4 * (cdims.cw + margs.cmin_x);
		this.foundations = new Array(4);
		for (var i = 0 ; i < 4 ; i++)
		{
			let foundation_x =
				foundation_start
				+ (cdims.cw + margs.cmin_x) * i;
			this.foundations[i] = new Foundation(
				'Foundation #' + (i + 1), cdims, margs,
				foundation_x, margs.ttop, 0);
			this.cardlocations[2 + i] = this.foundations[i];
		}

		this.tableaus = new Array(7);
		for (var i = 0 ; i < 7 ; i++)
		{
			let tableau_x =
				margs.tleft + (cdims.cw + margs.cmin_x) * i;
			this.tableaus[i] = new Tableau('Tableau #' + (i + 1),
				cdims, margs, tableau_x,
				margs.ttop + cdims.ch + margs.cmin_y, 0);
			this.cardlocations[6 + i] = this.tableaus[i];
		}

		this.w = this.tableaus[6].x + cdims.cw + margs.tright;
		this.h = this.tableaus[6].y + 12 * margs.cmin_y
			+ cdims.ch + margs.tbottom;

		this.hand = new Hand('Hand', cdims, margs, 0, 0, 0);

		this.ownprops_stale = true;

		this.drawscale_min = 16;

		this.adaptToDimsAndRes();

		this.colormap = {};

		this.all_cards = new Array(52);
		for (var i = 1 ; i <= 52 ; i++)
		{
			let red_blue = i * (Math.pow(2, 16) - 1) / 52;

			let colorid =
			{
				'red': (red_blue >> 8) & (Math.pow(2, 8) - 1),
				'blue': red_blue & (Math.pow(2, 8) - 1)
			};

			let card = new ChainableCard(cdims, margs, i, colorid);

			this.colormap['(' + colorid.red + ', 0, ' + colorid.blue + ')'] = card;

			this.all_cards[i - 1] = card;
		}
		this.all_cards[0].setParent(this.deck);
		for (var i = 2 ; i <= 52 ; i++)
		{
			this.all_cards[i - 1].setParent(this.all_cards[i - 2]);
		}

		for (var i = 0 ; i < 7 ; i++)
		{
			let reloc_to_tableau = this.deck.child;
			reloc_to_tableau.replaceParent(this.tableaus[i]);
			let reloc_to_deck = reloc_to_tableau.getChildN(i);
			reloc_to_deck.replaceParent(this.deck);
		}

		this.tablecache_stale = true;
		this.render();
	}

	fitRectNearEightToDims (rw, rh, dw, dh)
	{
		let wlim = (rw / rh <= dw / dh) ? Math.floor(dh * rw / rh) : dw;
		return wlim - wlim % 8;
	}

	drawscaleMax ()
	{
		// 2x for retina? 0.5x for performance? 1x for now.
		// TODO: Benchmark to decide max drawscale for host.
		console.log(window.innerWidth + 'x' + window.innerHeight);
		return this.fitRectNearEightToDims(
			this.w, this.h,
			1 * window.innerWidth, 1 * window.innerHeight)
			/ this.w;
	}

	adaptToDimsAndRes ()
	{
		this.drawscale = this.drawscaleMax();
		if (this.drawscale < this.drawscale_min)
		{
			this.drawscale = this.drawscale_min;
		}
		this.stylescale =  window.innerHeight
			/ (this.drawscale * this.h);

		this.canvas.width = this.drawscale * this.w;
		this.canvas.height = this.drawscale * this.h;

		this.canvas_pickable.width = this.drawscale * this.w;
		this.canvas_pickable.height = this.drawscale * this.h;

		this.canvas_putable.width = this.drawscale * this.w;
		this.canvas_putable.height = this.drawscale * this.h;

		this.canvas_tablecache.width = this.drawscale * this.w;
		this.canvas_tablecache.height = this.drawscale * this.h;

		this.canvas.style.width = Math.floor(
			this.canvas.width * this.stylescale) + 'px';
		this.canvas.style.height = Math.floor(
			this.canvas.height * this.stylescale) + 'px';

		this.deck.canvas.width = this.drawscale * this.deck.w;
		this.deck.canvas.height = this.drawscale * this.deck.h;

		this.waste.canvas.width = this.drawscale * this.waste.w;
		this.waste.canvas.height = this.drawscale * this.waste.h;

		for (var i = 0 ; i < 4 ; i++)
		{
			this.foundations[i].canvas.width = this.drawscale * this.foundations[i].w;
			this.foundations[i].canvas.height = this.drawscale * this.foundations[i].h;
		}

		for (var i = 0 ; i < 7 ; i++)
		{
			this.tableaus[i].canvas.width = this.drawscale * this.tableaus[i].w;
			this.tableaus[i].canvas.height = this.drawscale * this.tableaus[i].h;
		}

		this.hand.canvas.width = this.drawscale * this.hand.w;
		this.hand.canvas.height = this.drawscale * this.hand.h;
	}

	consoleLogState ()
	{
		console.log('Table', this);

		for (var i in this.cardlocations)
		{
			let cardlocation = this.cardlocations[i];
			console.log(cardlocation.name, cardlocation);
		}

		console.log(this.hand.name, this.hand);
	}

	updateHandPos (page_x, page_y)
	{
		let margs = this.margs;
		let stylescale = this.stylescale;
		let drawscale = this.drawscale;
		let hand = this.hand;

		let x = (page_x - this.canvas.offsetLeft) / (stylescale * drawscale);
		let y = (page_y - this.canvas.offsetTop) / (stylescale * drawscale);

		hand.x = Math.max(margs.tleft, Math.min(x, this.w - margs.tright));
		hand.y = Math.max(margs.ttop, Math.min(y, this.h - margs.tbottom));

		this.hand.has_moved = true;
	}

	updateHandPosMouse (e)
	{
		this.updateHandPos(e.pageX, e.pageY);
	}

	updateHandPosTouch (e)
	{
		this.updateHandPos(e.touches[0].pageX, e.touches[0].pageY);
	}

	interactionStart ()
	{
		if (this.hand.child === null)
		{
			this.renderPickable();

			// TODO: Pick

			if (this.hand.child !== null)
			{
				this.tablecache_stale = true;
			}
		}
	}

	interactionEnd ()
	{
		if (this.hand.child !== null)
		{
			this.renderPutable();

			// if (...) // TODO: If putable
			// {
			// 	// TODO: Put
			// }
			// else
			// {
				this.hand.drop();
			// }

			this.tablecache_stale = true;
		}
	}

	rerenderTablecache ()
	{
		let ctx = this.ctx_tablecache, canvas = this.canvas_tablecache;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		let any_stale = false;

		for (var i in this.cardlocations)
		{
			let cardlocation = this.cardlocations[i];

			if (cardlocation.stale)
			{
				any_stale = true;
				cardlocation.render(this.drawscale);
			}

			ctx.drawImage(cardlocation.canvas,
				Math.floor(cardlocation.x * this.drawscale),
				Math.floor(cardlocation.y * this.drawscale));
		}

		if (!any_stale)
		{
			throw 'rerenderTablecache was called but it seems that tablecache was not stale.';
		}

		this.tablecache_stale = false;
	}

	render ()
	{
		let ctx = this.ctx;
		let canvas = this.canvas;

		let tablecache_was_stale = this.tablecache_stale;

		if (this.tablecache_stale)
		{
			this.rerenderTablecache();

			ctx.clearRect(0, 0,
				this.canvas_tablecache.width, this.canvas_tablecache.height);
			ctx.drawImage(this.canvas_tablecache, 0, 0);
		}

		if (tablecache_was_stale || (this.hand.has_moved && this.hand.countChildren()) || this.hand.stale)
		{
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(this.canvas_tablecache, 0, 0);

			if (this.hand.stale)
			{
				this.hand.render(this.drawscale);
			}

			// TODO MAYBE: Position relative to where on card card was picked?
			ctx.drawImage(this.hand.canvas,
				Math.floor((this.hand.x - 0.5 * this.cdims.cw) * this.drawscale),
				Math.floor((this.hand.y - 0.5 * this.cdims.ch) * this.drawscale));

			this.hand.has_moved = false;
		}

		window.requestAnimationFrame(this.render.bind(this));
	}

	renderPickable (ctx = this.ctx_pickable, canvas = this.canvas_pickable)
	{
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (!(this.hand.countChildren())) // Can't pick if you have something on hand.
		{
			this.waste.renderPickable(ctx, this.drawscale);

			for (var i = 0 ; i < 4 ; i++)
			{
				this.foundations[i].renderPickable(ctx, this.drawscale);
			}

			for (var i = 0 ; i < 7 ; i++)
			{
				this.tableaus[i].renderPickable(ctx, this.drawscale);
			}
		}
	}

	renderPutable (ctx = this.ctx_putable, canvas = this.canvas_putable)
	{
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (this.hand.countChildren() === 1)
		{
			for (var i = 0 ; i < 4 ; i++)
			{
				this.foundations[i].renderPutable(ctx, this.drawscale, this.hand);
			}
		}

		if (this.hand.countChildren() >= 1)
		{
			for (var i = 0 ; i < 7 ; i++)
			{
				this.tableaus[i].renderPutable(ctx, this.drawscale, this.hand);
			}
		}
	}
}

let id = 0; // TODO: Get UUID game ID from server.

let cdims = new CardDims(2.5, 3.5, 0.012);
let margs = new Margins(0.5, 0.5, 0.5, 0.5, 0.5, 0.5);

const table = new Table(id, cdims, margs, document.getElementById('game'));

document.addEventListener('mouseenter', (e) =>
{
	document.removeEventListener('mouseenter', this);

	// TODO: Hide native cursor, draw custom cursor in hand.

	// TODO: Remove the two debug testing lines below.
	table.hand.pick(table.all_cards[0]);
	table.tablecache_stale = true;
});