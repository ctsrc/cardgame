/*
 * Copyright (c) 2016 Erik Nordstrøm <erik@nordstroem.no>
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

document.body.addEventListener('touchmove', function (event) {
	event.preventDefault();
}, false);

const OPTS = window.location.search.replace("?", "").split('&');
const DEBUG = !!OPTS.find(function (e) { return e === 'DEBUG'; });
console.log('DEBUG: ' + DEBUG);
const LOWRES = !!OPTS.find(function (e) { return e === 'LOWRES'; });
console.log('LOWRES: ' + LOWRES);
const NORESIZE = !!OPTS.find(function (e) { return e === 'NORESIZE'; });
console.log('NORESIZE: ' + NORESIZE);

// Base units
const BU =
{
	'card':
	{
		'width': 2.5,
		'height': 3.5,
		'border': 0.02,
		'thickness': 0.012
	},
	'margin':
	{
		'elem_vert': 0.5,
		'elem_horz': 0.5,
		'top': 0.5,
		'right': 0.5,
		'bottom': 0.5,
		'left': 0.5
	}
};

// Pixel size
var ps = { 'card': {}, 'margin': {} };

// Areas in base units
const AREABU =
{
	'g':
	{
		'width': BU.margin.left + 7 * BU.card.width
			+ 6 * BU.margin.elem_horz + BU.margin.right,
		'height': BU.margin.top + 2 * BU.card.height
			+ 25 * BU.margin.elem_vert + BU.margin.bottom
	},
	'gf':
	{
		'width': BU.card.width,
		'height': BU.card.height + 12 * BU.margin.elem_horz
	},
	'sprt':
	{
		'width': 15 * BU.card.width,
		'height': 6 * BU.card.height
	}
};

// Game area pixel size width minimum
const GAPSW_MIN = 512;

const G = document.getElementById('game');
const GTX = G.getContext('2d');

const T = document.createElement('canvas');
const TTX = T.getContext('2d');

const PK = document.createElement('canvas');
const PKTX = PK.getContext('2d');

const PT = document.createElement('canvas');
const PTTX = PT.getContext('2d');

const GF = document.createElement('canvas');
const GFTX = GF.getContext('2d');

const SPRT = document.createElement('canvas');
const SPRTTX = SPRT.getContext('2d');

if (DEBUG)
{
	const KS = document.getElementById('ks');

	T.setAttribute('id', 'table');
	document.body.insertBefore(T, KS);
	document.body.insertBefore(document.createTextNode('\n'), KS);

	PT.setAttribute('id', 'putable');
	document.body.insertBefore(PT, KS);
	document.body.insertBefore(document.createTextNode('\n'), KS);

	PK.setAttribute('id', 'pickable');
	document.body.insertBefore(PK, KS);
	document.body.insertBefore(document.createTextNode('\n'), KS);

	GF.setAttribute('id', 'hand');
	document.body.insertBefore(GF, KS);
	document.body.insertBefore(document.createTextNode('\n'), KS);

	SPRT.setAttribute('id', 'sprt');
	document.body.insertBefore(SPRT, KS);
	document.body.insertBefore(document.createTextNode('\n'), KS);
}

// Returns the new width of rectangle that will make it fit within dw x dh.
function fitRectNearEightToDims (cw, ch, dw, dh)
{
	const WLIM = (cw / ch <= dw / dh) ? Math.floor(dh * cw / ch) : dw;

	return WLIM - WLIM % 8;
}

/*
 * To the extent permitted by the frame time of 16 ms, we want to draw
 * at a resolution up to twice the one reported by the browser. The idea is to
 * try and look good on retina displays. I don't yet know if it actually does.
 * Will sometimes produce jagged edges on straight lines in Firefox
 * on my non-retina computer but that's part of the fun so I'm keeping this.
 */

function benchApprox ()
{
	const START = new Date().getTime();

	for (var i = 0 ; i < 52 ; i++)
	{
		GTX.fillStyle = 'rgb(' +
			Math.floor(Math.random() * 255) + ', ' +
			Math.floor(Math.random() * 255) + ', ' +
			Math.floor(Math.random() * 255) + ')';
		GTX.fillRect(
			Math.random() * G.width, Math.random() * G.height,
			Math.random() * G.width, Math.random() * G.height);
	}

	return new Date().getTime() - START;
}

var drawscale = 4 * fitRectNearEightToDims(AREABU.g.width, AREABU.g.height,
	screen.width, screen.height) / AREABU.g.width;

do
{
	drawscale /= 2;
	G.width = AREABU.g.width * drawscale;
	G.height = AREABU.g.height * drawscale;
} while (benchApprox() > 16 && AREABU.g.width * drawscale >= 2 * GAPSW_MIN)

if (LOWRES)
{
	// Force low resolution
	drawscale = 16;
}

const DRAWSCALE_MAX = drawscale;
console.log('DRAWSCALE_MAX: ' + DRAWSCALE_MAX);

function renderSprites ()
{
	const _enum_color =
	{
		NO_COLOR : 0,
		HEARTS : 1,
		SPADES : 2,
		DIAMONDS : 3,
		CLUBS : 4,
		UNKNOWN_COLOR : 5
	};

	const _enum_rank =
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

	const _symb_color = ['', '♥', '♠', '♦', '♣', ''];

	const _symb_rank = ['', 'A', '2', '3', '4', '5', '6',
		'7', '8', '9', '10', 'J', 'Q', 'K', ''];

	SPRTTX.fillStyle = 'rgb(0,0,0)';
	SPRTTX.fillRect(0, 0, SPRT.width, SPRT.height);

	SPRTTX.fillStyle = 'rgb(128,128,128)';
	SPRTTX.fillRect(_enum_rank.NO_RANK * ps.card.width,
		_enum_color.NO_COLOR * ps.card.height,
		ps.card.width, ps.card.height);

	SPRTTX.textBaseline = 'top';
	SPRTTX.font = ((ps.card.width - (ps.card.width % 3))/3) + 'px serif';
	for (var i = _enum_color.HEARTS ; i <= _enum_color.CLUBS ; i++)
	{
		for (var j = _enum_rank.ACE ; j <= _enum_rank.KING ; j++)
		{
			SPRTTX.fillStyle = 'rgb(255,255,255)';
			SPRTTX.fillRect((j * ps.card.width) + ps.card.border,
				(i * ps.card.height) + ps.card.border,
					ps.card.width - 2 * ps.card.border,
					ps.card.height - 2 * ps.card.border);
			SPRTTX.fillStyle = 'rgb(' + (i & 1) * 255 + ',0,0)';
			SPRTTX.fillText(_symb_rank[j] + _symb_color[i],
				(j * ps.card.width) + ps.card.border + 3,
				(i * ps.card.height) + ps.card.border + 4);
		}
	}

	SPRTTX.fillStyle = 'rgb(0,0,255)';
	SPRTTX.fillRect((_enum_rank.UNKNOWN_RANK * ps.card.width)
		+ ps.card.border, (_enum_color.UNKNOWN_COLOR * ps.card.height)
		+ ps.card.border, ps.card.width - 2 * ps.card.border,
		ps.card.height - 2 * ps.card.border);
}

function adaptToDimsAndRes ()
{
	const AW = fitRectNearEightToDims(AREABU.g.width, AREABU.g.height,
		window.innerWidth, window.innerHeight);

	drawscale = Math.min(DRAWSCALE_MAX, 2 * AW / AREABU.g.width);
	console.log('drawscale: ' + drawscale);

	ps.card.width = Math.floor(BU.card.width * drawscale);
	ps.card.height = Math.floor(BU.card.height * drawscale);
	ps.card.border = Math.floor(1 + BU.card.border * drawscale);
	ps.card.thickness = Math.floor(BU.card.thickness * drawscale);

	ps.margin.elem_vert = Math.floor(BU.margin.elem_vert * drawscale);
	ps.margin.elem_horz = Math.floor(BU.margin.elem_horz * drawscale);
	ps.margin.top = Math.floor(BU.margin.top * drawscale);
	ps.margin.right = Math.floor(BU.margin.right * drawscale);
	ps.margin.bottom = Math.floor(BU.margin.bottom * drawscale);
	ps.margin.left = Math.floor(BU.margin.left * drawscale);

	G.width = ps.margin.left + 7 * ps.card.width
		+ 6 * ps.margin.elem_horz + ps.margin.right;
	G.height = ps.margin.top + 2 * ps.card.height
		+ 25 * ps.margin.elem_vert + ps.margin.bottom;

	T.width = G.width;
	T.height = G.height

	PK.width = G.width;
	PK.height = G.height

	PT.width = G.width;
	PT.height = G.height

	GF.width = ps.card.width;
	GF.height = ps.card.height + 12 * ps.margin.elem_horz;

	SPRT.width = 15 * ps.card.width;
	SPRT.height = 6 * ps.card.height;

	if (!NORESIZE)
	{
		const STYLESCALE = AW / G.width;
		console.log('STYLESCALE: ' + STYLESCALE);

		G.style.width = AW + 'px';
		G.style.height = Math.floor(G.height * STYLESCALE) + 'px';

		if (DEBUG)
		{
			T.style.width = G.style.width;
			T.style.height = G.style.height;

			PK.style.width = G.style.width;
			PK.style.height = G.style.height;

			PT.style.width = G.style.width;
			PT.style.height = G.style.height;

			GF.style.width = Math.floor(GF.width
				* STYLESCALE) + 'px';
			GF.style.height = Math.floor(GF.height
				* STYLESCALE) + 'px';

			SPRT.style.width = Math.floor(SPRT.width
				* STYLESCALE) + 'px';
			SPRT.style.height = Math.floor(SPRT.height
				* STYLESCALE) + 'px';
		}
	}

	renderSprites();
}

adaptToDimsAndRes();

var id_ra;
window.onresize = function ()
{
	clearTimeout(id_ra);
	id_ra = setTimeout(adaptToDimsAndRes, 64);
};

const enum_lc =
{
	NO_USE_LOCAL_COORDS : 0,
	USE_LOCAL_COORDS : 1
};

const NULLCARD = 0;
const UNKNOWNCARD = 94;

const FACE_UP = Math.pow(2, 7);

const MASK_COLOR = 7 << 4;
const MASK_RANK = 15;

function isFacingUp (card)
{
	return card & FACE_UP;
}

function getColor (card)
{
	return (card & MASK_COLOR) >> 4;
}

function getRank (card)
{
	return card & MASK_RANK;
}

class RenderableCard
{
	constructor (card, cur, soc, oidx)
	{
		this.card = card;
		this.cur = cur;
		this.x = cur.getLocalCoordXCardByIdx(oidx);
		this.y = cur.getLocalCoordYCardByIdx(oidx);
		this.z = cur.getLocalCoordZCardByIdx(oidx);
		this.origin = soc;
		this.oidx = oidx;
	}
}

class RenderList extends Array
{
	constructor (soc)
	{
		super();
		this.soc = soc;
		this.refresh();
	}
}

class RLVisible extends RenderList
{
	refresh ()
	{
		this.splice(0);
		for (var i = 0 ; i < this.soc.length ; i++)
		{
			this.push(new RenderableCard(this.soc[i],
				this.soc, this.soc, i));
		}
		if (this.soc.length == 0)
		{
			this.push(new RenderableCard(NULLCARD,
				this.soc, this.soc, 0));
		}
	}
}

class RLPickable extends RenderList
{
	refresh ()
	{
		this.splice(0);
	}
}

class RLTopmostPickable extends RLPickable
{
	refresh ()
	{
		this.splice(0);
		if (this.soc.length > 0)
		{
			this.push(new RenderableCard(
				this.soc[this.soc.length - 1],
				this.soc, this.soc, this.soc.length - 1));
		}
	}
}

class RLFacingUpPickable extends RLPickable
{
	refresh ()
	{
		this.splice(0);
		for (var i = 0 ; i < this.soc.length ; i++)
		{
			if (isFacingUp(this.soc[i]))
			{
				this.push(new RenderableCard(this.soc[i],
					this.soc, this.soc, i));
			}
		}
	}
}

class RLPutable extends RenderList
{
	refresh ()
	{
		this.splice(0);
	}
}

class RLTopmostPutable extends RLPutable
{
	refresh ()
	{
		this.splice(0);
		if (this.soc.putable())
		{
			this.push(new RenderableCard(
				this.soc[this.soc.length - 1],
				this.soc, this.soc, this.soc.length - 1));
		}
	}
}

class StackOfCards extends Array
{
	constructor (cards, x, y, z)
	{
		super();

		this.x = x;
		this.y = y;
		this.z = z;

		this.rl_visible = new RLVisible(this);
		this.rl_pickable = new RLPickable(this);
		this.rl_putable = new RLPutable(this);

		StackOfCards.prototype.push.apply(this, cards);
	}

	push (card)
	{
		super.push(card);

		this.rl_visible.refresh();
		this.rl_pickable.refresh();
		this.rl_putable.refresh();
	}

	splice (idx)
	{
		const RET = super.splice(idx);

		this.rl_visible.refresh();
		this.rl_pickable.refresh();
		this.rl_putable.refresh();

		return RET;
	}

	getLocalCoordXCardByIdx (idx)
	{
		return 0;
	}

	getLocalCoordYCardByIdx (idx)
	{
		return 0;
	}

	getLocalCoordZCardByIdx (idx)
	{
		return BU.card.thickness * idx;
	}
}

class FoundationStackOfCards extends StackOfCards
{
	constructor (cards, x, y, z)
	{
		super(cards, x, y, z);

		this.rl_pickable = new RLTopmostPickable(this);
		this.rl_putable = new RLTopmostPutable(this);
	}

	putable ()
	{
		return true; // TODO
	}
}

class TableauStackOfCards extends StackOfCards
{
	constructor (cards, x, y, z)
	{
		super(cards, x, y, z);

		this.rl_pickable = new RLFacingUpPickable(this);
		this.rl_putable = new RLTopmostPutable(this);
	}

	getLocalCoordYCardByIdx (idx)
	{
		return BU.margin.elem_vert * idx;
	}

	putable ()
	{
		return true; // TODO
	}
}

StackOfCards.prototype.push.apply = function (obj, cards)
{
	Array.prototype.push.apply(obj, cards);

	obj.rl_visible.refresh();
	obj.rl_pickable.refresh();
	obj.rl_putable.refresh();
}

var table = {};
table.x = 0;
table.y = 0;
table.z = 0;
table.deck = {};
table.waste = {};
table.foundation = [];
table.tableau = [];
//table.rl_visible = new RLVisible(); // TODO
table.getRLVisible = function ()
{
	/*
	 * XXX: I prefer prototype call. I find it
	 *      to be more readable than calling
	 *      concat on first array with
	 *      the others as arguments.
	 */
	return Array.prototype.concat.call(
		this.deck.rl_visible,
		this.waste.rl_visible,
		this.foundation[0].rl_visible,
		this.foundation[1].rl_visible,
		this.foundation[2].rl_visible,
		this.foundation[3].rl_visible,
		this.tableau[0].rl_visible,
		this.tableau[1].rl_visible,
		this.tableau[2].rl_visible,
		this.tableau[3].rl_visible,
		this.tableau[4].rl_visible,
		this.tableau[5].rl_visible,
		this.tableau[6].rl_visible);
};
table.getRLPickable = function ()
{
	return Array.prototype.concat.call(
		this.waste.rl_pickable,
		this.foundation[0].rl_pickable,
		this.foundation[1].rl_pickable,
		this.foundation[2].rl_pickable,
		this.foundation[3].rl_pickable,
		this.tableau[0].rl_pickable,
		this.tableau[1].rl_pickable,
		this.tableau[2].rl_pickable,
		this.tableau[3].rl_pickable,
		this.tableau[4].rl_pickable,
		this.tableau[5].rl_pickable,
		this.tableau[6].rl_pickable);
};
table.getRLPutable = function ()
{
	return Array.prototype.concat.call(
		this.foundation[0].rl_putable,
		this.foundation[1].rl_putable,
		this.foundation[2].rl_putable,
		this.foundation[3].rl_putable,
		this.tableau[0].rl_putable,
		this.tableau[1].rl_putable,
		this.tableau[2].rl_putable,
		this.tableau[3].rl_putable,
		this.tableau[4].rl_putable,
		this.tableau[5].rl_putable,
		this.tableau[6].rl_putable);
};
table.initialize = function ()
{
	this.deck = new StackOfCards([],
		this.x + BU.margin.left, this.y + BU.margin.top, this.z);

	this.waste = new StackOfCards([],
		this.x + BU.margin.left + BU.card.width + BU.margin.elem_horz,
		this.y + BU.margin.top, this.z);
	this.waste.rl_visible = new RLVisible(this.waste); // TODO: Replace
	this.waste.rl_pickable = new RLTopmostPickable(this.waste);
	this.waste.getLocalCoordXCardByIdx = function (idx)
	{
		return BU.margin.elem_horz * (idx % 3);
	};

	for (var i = 0 ; i < 4 ; i++)
	{
		this.foundation.push(new FoundationStackOfCards([],
			table.x + BU.margin.left
				+ (3 + i) * (BU.card.width
					+ BU.margin.elem_horz),
			table.y + BU.margin.top, table.z));
	}

	for (var i = 0 ; i < 7 ; i++)
	{
		this.tableau.push(new TableauStackOfCards([],
			table.x + BU.margin.left
				+ i * (BU.card.height + BU.margin.elem_horz),
			table.y + BU.margin.top + BU.card.height
				+ BU.margin.elem_vert,
			table.z));
	}

	// TODO: Get initial state from server.

	// Initialize deck
	//for (var i = 0 ; i < 24 ; i++)
	var cards = [];
	for (var i = 0 ; i < 18 ; i++)
	{
		cards[i] = UNKNOWNCARD;
	}
	StackOfCards.prototype.push.apply(this.deck, cards);

	// Waste is empty as it should be. No further initialization required.
	// Initialize with a few cards for testing.
	StackOfCards.prototype.push.apply(this.waste,
		[43 | FACE_UP, 42 | FACE_UP, 41 | FACE_UP,
			36 | FACE_UP, 18 | FACE_UP, 17 | FACE_UP]);

	// Foundations are empty as they should be.

	// Initialize tableaus
	for (var i = 0 ; i < 7 ; i++)
	{
		var cards = [];
		for (var j = 0 ; j < i ; j++)
		{
			cards[j] = UNKNOWNCARD;
		}
		StackOfCards.prototype.push.apply(this.tableau[i], cards);
	}
	this.tableau[0].push(21 | FACE_UP);
	this.tableau[1].push(19 | FACE_UP);
	this.tableau[2].push(61 | FACE_UP);
	this.tableau[3].push(56 | FACE_UP);
	this.tableau[4].push(52 | FACE_UP);
	this.tableau[5].push(49 | FACE_UP);
	this.tableau[6].push(44 | FACE_UP);
};

table.initialize();

/*
function cardRenderer (c, ctx, ulc)
{
	return function (rc, idx)
	{
		var sx = Math.floor(((ulc ? 0 : rc.cur.x)
			+ rc.x) * (c.width / CANVASWIDTH));
		var sy = Math.floor(((ulc ? 0 : rc.cur.y)
			+ rc.y) * (c.height / CANVASHEIGHT));
		var sw = Math.floor(CARDWIDTH * (c.width / CANVASWIDTH));
		var sh = Math.floor(CARDHEIGHT * (c.height / CANVASHEIGHT));
		if (rc.card)
		{
			ctx.fillStyle = 'rgb(0,0,0)';
			ctx.fillRect(sx, sy, sw, sh);
			if (isFacingUp(rc.card))
			{
				ctx.fillStyle = 'rgb(255,255,255)';
				ctx.fillRect(sx + 1, sy + 1, sw - 2, sh - 2);
				ctx.fillStyle = 'rgb('
					+ (getColor(rc.card) & 1) * 255
					+ ',0,0)';
				ctx.textBaseline = 'top';
				ctx.fillText(symb_rank[getRank(rc.card)]
					+ symb_color[getColor(rc.card)],
					sx + 3, sy + 4);
			}
			else
			{
				ctx.fillStyle = 'rgb(0,0,255)';
				ctx.fillRect(sx + 1, sy + 1, sw - 2, sh - 2);
			}
		}
		else
		{
			ctx.fillStyle = 'rgb(128,128,128)';
			ctx.fillRect(sx, sy, sw, sh);
		}
	}
}

function cardIdxRenderer (c, ctx, ulc)
{
	return function (rc, idx)
	{
		ctx.fillStyle = 'rgb(' + (4 * idx + 1) + ',0,0)';
		ctx.fillRect(
			Math.floor(((ulc ? 0 : rc.cur.x) + rc.x)
				* (c.width / CANVASWIDTH)),
			Math.floor(((ulc ? 0 : rc.cur.y) + rc.y)
				* (c.height / CANVASHEIGHT)),
			Math.floor(CARDWIDTH * (c.width / CANVASWIDTH)),
			Math.floor(CARDHEIGHT * (c.height / CANVASHEIGHT)));
	}
}
*/

var hand = new StackOfCards([], 0, 0, 0);
hand.x = 0;
hand.y = 0;
hand.offs_x = 0;
hand.offs_y = 0;
hand.getLocalCoordYCardByIdx = function (idx)
{
	return DISTVERT * idx;
};

//var renderRenderableCardToTable = cardRenderer(T, TTX,
//	enum_lc.NO_USE_LOCAL_COORDS);
function renderTable ()
{
	TTX.clearRect(0, 0, T.width, T.height);
	table.getRLVisible().forEach(renderRenderableCardToTable);
}

//var renderRenderableCardToPickable = cardIdxRenderer(PK, PKTX);
function renderPickable ()
{
	PKTX.clearRect(0, 0, PK.width, PK.height);
	//table.getRLPickable().forEach(renderRenderableCardToPickable);
}

//var renderRenderableCardToPutable = cardIdxRenderer(PT, PTTX);
function renderPutable ()
{
	PTTX.clearRect(0, 0, PT.width, PT.height);
	//table.getRLPutable().forEach(renderRenderableCardToPutable);
}

// XXX: We pass G instead of GF since card size is calculated from canvas size.
// TODO: Rework probably
//var renderRenderableCardToHand = cardRenderer(G, GFTX,
//	enum_lc.USE_LOCAL_COORDS);
function renderHand ()
{
	GFTX.clearRect(0, 0, GF.width, GF.height);
	//hand.forEach(renderRenderableCardToHand);
}

function updateHandPos (e)
{
	var x, y;
	if (window.TouchEvent && e instanceof TouchEvent)
	{
		x = e.touches[0].pageX - g.offsetLeft;
		y = e.touches[0].pageY - g.offsetTop;
	}
	else
	{
		x = e.layerX;
		y = e.layerY;
	}
	// XXX: Limit x to margins
	hand.x = Math.max(0.1 * g.width
			- CARDWIDTH * (g.width / CANVASWIDTH),
		Math.min(x, 0.9 * g.width));
	// XXX: Limit y to margins
	hand.y = Math.max(0.1 * g.height
			- CARDHEIGHT * (g.height / CANVASHEIGHT),
		Math.min(y, 0.9 * g.height));
}

//var renderRenderableCardToTable = cardRenderer(T, TTX);
function renderTable ()
{
	TTX.clearRect(0, 0, T.width, T.height);

	//table.getRLVisible().forEach(renderRenderableCardToTable);
}

function renderGame ()
{
	GTX.clearRect(0, 0, G.width, G.height);

	GTX.drawImage(T, 0, 0);

	if (hand.length > 0)
	{
		GTX.drawImage(GF, hand.x - hand.offs_x, hand.y - hand.offs_y);
		window.requestAnimationFrame(renderGame);
	}
}

function pick (e)
{
	updateHandPos(e);
	var pixel = pktx.getImageData(hand.x, hand.y, 1, 1);
	var val = pixel.data[0];
	if (val)
	{
		var card = table.getRLPickable()[(val - 1) / 4];
		var cards = card.origin.splice(card.oidx);
		hand.offs_x = hand.x -
			Math.floor((card.origin.x + card.x)
				* (g.width / CANVASWIDTH));
		hand.offs_y = hand.y -
			Math.floor((card.origin.y + card.y)
				* (g.height / CANVASHEIGHT));
		for (var i = 0 ; i < cards.length ; i++)
		{
			hand.push(new RenderableCard(cards[i],
				hand, card.origin, card.oidx));
		}
		renderHand();
		renderPutable();
		renderTable();
		window.requestAnimationFrame(renderGame);
	}
}

G.addEventListener('mousedown', pick);
G.addEventListener('touchstart', pick);

function transpose (e)
{
	if (hand.length > 0)
	{
		updateHandPos(e);
	}
}

G.addEventListener('mousemove', transpose);
G.addEventListener('touchmove', transpose);

function place (e)
{
	if (hand.length > 0)
	{
		var pixel = pttx.getImageData(hand.x, hand.y, 1, 1);
		var val = pixel.data[0];
		var tgt;
		if (val)
		{
			tgt = table.getRLPutable()[(val - 1) / 4];
		}
		else
		{
			tgt = hand[0];
		}
		var cards = hand.splice(0).map(function (e)
		{
			return e.card;
		});
		StackOfCards.prototype.push.apply(tgt.origin, cards);
		renderTable();
		renderPickable();
	}
}

G.addEventListener('mouseup', place);
G.addEventListener('mouseout', place);
G.addEventListener('touchend', place);

renderTable();
renderPickable();
renderGame();
