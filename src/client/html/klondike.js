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
	HEARTS : 1,
	SPADES : 2,
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

		this.parent.detachChild();
		new_parent.setChild(this);
		this.parent = new_parent;

		return old_parent;
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
			return next.render(ctx, drawscale, x + dx, y + dy, z + dz, dx, dy, dz);
		}
		else
		{
			return [cx + cw, cy + ch, cz + ct];
		}
	}

	renderPickable (ctx, drawscale, x, y, z, dx, dy, dz)
	{
		let [cx, cy, cz, cw, ch, ct] = this.getDims(drawscale, x, y, z);

		if (this.isFacingUp())
		{
			ctx.fillStyle = 'rgb(' + this.colorid.red + ', 0, ' + this.colorid.blue + ')';
			ctx.fillRect(cx, cy, cw, ch);
		}

		let next = this.child;

		if (next !== null)
		{
			return next.renderPickable(ctx, drawscale, x + dx, y + dy, z + dz, dx, dy, dz);
		}
		else
		{
			return [cx + cw, cy + ch, cz + ct];
		}
	}
}

class CardLocation extends ParentToCard
{
	constructor (cdims, margs, x, y, z, stacking, w, h)
	{
		super(cdims, margs, stacking);

		this.x = x;
		this.y = y;
		this.z = z;

		this.w = w;
		this.h = h;

		this.canvas = document.createElement('canvas');
		this.ctx = this.canvas.getContext('2d');
	}

	render (ctx, drawscale)
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

		if (render_from == null)
		{
			// TODO
		}
		else
		{
			this.recalcWH();
			this.canvas.width = Math.ceil(drawscale * this.w);
			this.canvas.height = Math.ceil(drawscale * this.h);

			let [lx, ly, lz] = render_from.render(this.ctx, drawscale, 0, 0, 0, dx, dy, 0);

			ctx.drawImage(this.canvas, Math.floor(this.x * drawscale), Math.floor(this.y * drawscale));
			console.log(this.canvas, Math.floor(this.x * drawscale), Math.floor(this.y * drawscale));
		}
	}
}

class Deck extends CardLocation
{
	constructor (cdims, margs, x, y, z)
	{
		super(cdims, margs, x, y, z, enum_stacking.ONE_STACK, cdims.cw, cdims.ch);
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

renderTopmostPickable = function ()
{
	// TODO
}

class Waste extends CardLocation
{
	constructor (cdims, margs, x, y, z)
	{
		super(cdims, margs, x, y, z, enum_stacking.TOP_THREE_HORZ, cdims.cw * 3 + margs.cmin_x * 2, cdims.ch);
	}

	recalcWH ()
	{
		let num_children_places = num_children = this.countChildren();

		if (num_children == 0)
		{
			num_children_places = 1;
		}
		elif (num_children > 3)
		{
			num_children_places = 3;
		}

		this.w = num_children_places * this.cdims.cw + (num_children_places - 1) * this.margs.cmin_x;
	}
}
Waste.prototype.renderPickable = renderTopmostPickable;

class Foundation extends CardLocation
{
	constructor (cdims, margs, x, y, z)
	{
		super(cdims, margs, x, y, z, enum_stacking.ONE_STACK, cdims.cw, cdims.ch);
	}

	renderPutable (card)
	{
		// TODO
	}

	recalcWH ()
	{
		// XXX: Does not change.
	}
}
Foundation.prototype.renderPickable = renderTopmostPickable;

class Tableau extends CardLocation
{
	constructor (cdims, margs, x, y, z)
	{
		super(cdims, margs, x, y, z, enum_stacking.VERT_SPACE, cdims.cw, cdims.ch * 13 + margs.cmin_y * 12);
	}

	renderPickable ()
	{
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
	constructor (cdims, margs, x, y, z)
	{
		super(cdims, margs, x, y, z, enum_stacking.VERT_SPACE);
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
	constructor (id, canvas, cdims, margs)
	{
		this.id = id;
		this.canvas = canvas;
		this.cdims = cdims;
		this.margs = margs;

		this.ctx = canvas.getContext('2d');

		canvas.addEventListener('mousedown', (e) =>
		{
			this.updateHandPosMouse(e);
			//this.interact(e);
		});
		canvas.addEventListener('mousemove', (e) =>
		{
			if (this.hand.child !== null)
			{
				this.updateHandPosMouse(e);
			}
		});
		canvas.addEventListener('mouseup', this.release);
		canvas.addEventListener('mouseout', this.release);

		canvas.addEventListener('touchstart', (e) =>
		{
			this.updateHandPosTouch(e);
			//this.interact(e);
		});
		canvas.addEventListener('touchmove', (e) =>
		{
			if (this.hand.child !== null)
			{
				this.updateHandPosTouch(e);
			}
		});
		canvas.addEventListener('touchend', this.release);

		let deck_x = margs.tleft;
		this.deck = new Deck(cdims, margs, deck_x, margs.ttop, 0);

		let waste_x = deck_x + cdims.cw + margs.cmin_x;
		this.waste = new Waste(cdims, margs, waste_x, margs.ttop, 0);

		this.tableaus = new Array(7);
		for (var i = 0 ; i < 7 ; i++)
		{
			let tableau_x =
				margs.tleft + (cdims.cw + margs.cmin_x) * i;
			this.tableaus[i] = new Tableau(cdims, margs, tableau_x,
				margs.ttop + cdims.ch + margs.cmin_y, 0);
		}

		let foundation_start = this.tableaus[6].x
			- 3 * (cdims.cw + margs.cmin_x);
		this.foundations = new Array(4);
		for (var i = 0 ; i < 4 ; i++)
		{
			let foundation_x =
				foundation_start
				+ (cdims.cw + margs.cmin_x) * i;
			this.foundations[i] = new Foundation(cdims, margs,
				foundation_x, margs.ttop, 0);
		}

		this.w = this.tableaus[6].x + cdims.cw + margs.tright;
		this.h = this.tableaus[6].y + 12 * margs.cmin_y
			+ cdims.ch + margs.tbottom;

		this.hand = new Hand(cdims, margs, 0, 0, 0);

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

		this.render();
	}

	fitRectNearEightToDims (rw, rh, dw, dh)
	{
		let wlim = (rw / rh <= dw / dh) ? Math.floor(dh * rw / rh) : dw;
		return wlim - wlim % 8;
	}

	drawscaleMax ()
	{
		/*
		 * XXX: We use 2x under the assumption that it's good
		 * 	for retina resolution displays. Haven't checked
		 * 	whether it actually is lol.
		 */
		console.log(window.innerWidth + 'x' + window.innerHeight);
		return this.fitRectNearEightToDims(
			this.w, this.h,
			2 * window.innerWidth, 2 * window.innerHeight)
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

	/*
		if (hand.card === null)
		{
			deck.renderTouchActionable();
			waste.renderPickable();
		}
		else
		{
			// TODO
		}
	*/

	consoleLogState ()
	{
		console.log('Table');
		console.log(this);

		console.log('Deck');
		console.log(this.deck);

		console.log('Waste');
		console.log(this.waste);

		for (var i = 0 ; i < 4 ; i++)
		{
			console.log('Foundation ' + i);
			console.log(this.foundations[i]);
		}

		for (var i = 0 ; i < 7 ; i++)
		{
			console.log('Tableau ' + i);
			console.log(this.tableaus[i]);
		}

		console.log('Hand');
		console.log(this.hand);
	}

	updateHandPos (page_x, page_y)
	{
		let margs = this.margs;
		let stylescale = this.stylescale;
		let drawscale = this.drawscale;
		let hand = this.hand;

		const x = (page_x - margs.tleft) / (stylescale * drawscale);
		const y = (page_y - margs.ttop) / (stylescale * drawscale);

		// XXX: Limit x to margins
		hand.x = Math.max(margs.tleft,
			Math.min(x, this.w - margs.tright));

		// XXX: Limit y to margins
		hand.y = Math.max(margs.ttop,
			Math.min(y, this.h - margs.tbottom));

		console.log(hand);
	}

	updateHandPosMouse (e)
	{
		this.updateHandPos(e.pageX, e.pageY);
	}

	updateHandPosTouch (e)
	{
		this.updateHandPos(e.touches[0].pageX, e.touches[0].pageY);
	}

	render ()
	{
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		this.deck.render(this.ctx, this.drawscale);

		this.waste.render(this.ctx, this.drawscale);

		for (var i = 0 ; i < 4 ; i++)
		{
			this.foundations[i].render(this.ctx, this.drawscale);
		}

		for (var i = 0 ; i < 7 ; i++)
		{
			this.tableaus[i].render(this.ctx, this.drawscale);
		}

		this.hand.render(this.drawscale);
	}
}

let id = 0; // TODO: Get UUID game ID from server.

let cdims = new CardDims(2.5, 3.5, 0.012);
let margs = new Margins(0.5, 0.5, 0.5, 0.5, 0.5, 0.5);

const table = new Table(id, document.getElementById('game'), cdims, margs);

//table.consoleLogState();

/*
// TODO: Turn the following manual check into a unit test maybe?
for (var i = -7 ; i <= 7 ; i++)
{
	console.log('table.tableaus[5].getChildN(' + i + ')');
	try
	{
		let result = table.tableaus[5].getChildN(i);
		if (result === null)
		{
			console.log(null);
		}
		else
		{
			console.log(result.id);
		}
	}
	catch (e)
	{
		console.log('Caught exception.');
		console.log(e);
	}
}
*/
