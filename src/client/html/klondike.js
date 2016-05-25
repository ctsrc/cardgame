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

var stylescale = 1;

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
		this.x = cur.getLocalCoordXCardByIdx(oidx) + cur.x;
		this.y = cur.getLocalCoordYCardByIdx(oidx) + cur.y;
		this.z = cur.getLocalCoordZCardByIdx(oidx) + cur.z;
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
		var ret = super.splice(idx);

		this.rl_visible.refresh();
		this.rl_pickable.refresh();
		this.rl_putable.refresh();

		return ret;
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
				+ i * (BU.card.width + BU.margin.elem_horz),
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

function renderCard (ctx, card, x, y)
{
	const _symb_color = ['', '♥', '♠', '♦', '♣', ''];

	const _symb_rank = ['', 'A', '2', '3', '4', '5', '6',
		'7', '8', '9', '10', 'J', 'Q', 'K', ''];

	const PX = Math.floor(x * drawscale);
	const PY = Math.floor(y * drawscale);

	ctx.fillStyle = 'rgb(0,0,0)';
	ctx.fillRect(PX, PY, ps.card.width, ps.card.height);

	if (card == NULLCARD)
	{
		ctx.fillStyle = 'rgb(128,128,128)';
		ctx.fillRect(
			PX + ps.card.border,
			PY + ps.card.border,
			ps.card.width - 2 * ps.card.border,
			ps.card.height - 2 * ps.card.border);
	}
	else if (card == UNKNOWNCARD)
	{
		ctx.fillStyle = 'rgb(0,0,255)';
		ctx.fillRect(
			PX + ps.card.border,
			PY + ps.card.border,
			ps.card.width - 2 * ps.card.border,
			ps.card.height - 2 * ps.card.border);
	}
	else
	{
		const COLOR = getColor(card);
		const RANK = getRank(card);

		ctx.fillStyle = 'rgb(255,255,255)';
		ctx.fillRect(
			PX + ps.card.border,
			PY + ps.card.border,
			ps.card.width - 2 * ps.card.border,
			ps.card.height - 2 * ps.card.border);

		ctx.textBaseline = 'top';
		ctx.font = ((ps.card.width
			- (ps.card.width % 3))/3) + 'px serif';
		ctx.fillStyle = 'rgb(' + (COLOR & 1) * 255 + ',0,0)';
		ctx.fillText(_symb_rank[RANK] + _symb_color[COLOR],
			PX + ps.card.border + 3,
			PY + ps.card.border + 4);
	}
}

function cardRenderer (ctx)
{
	return function (rc, idx)
	{
		renderCard(ctx, rc.card, rc.x, rc.y);
	}
}

function cardIdxRenderer (ctx)
{
	return function (rc, idx)
	{
		ctx.fillStyle = 'rgb(' + (4 * idx + 1) + ',0,0)';
		ctx.fillRect(
			Math.floor(rc.x * drawscale),
			Math.floor(rc.y * drawscale),
			ps.card.width,
			ps.card.height);
	}
}

var hand = new StackOfCards([], 0, 0, 0);
hand.x = 0;
hand.y = 0;
hand.offs_x = 0;
hand.offs_y = 0;
hand.getLocalCoordYCardByIdx = function (idx)
{
	return BU.margin.elem_vert * idx;
};

var renderRenderableCardToTable = cardRenderer(TTX);
function renderTable ()
{
	TTX.clearRect(0, 0, T.width, T.height);
	table.getRLVisible().forEach(renderRenderableCardToTable);
}

var renderRenderableCardToPickable = cardIdxRenderer(PKTX);
function renderPickable ()
{
	PKTX.clearRect(0, 0, PK.width, PK.height);
	table.getRLPickable().forEach(renderRenderableCardToPickable);
}

var renderRenderableCardToPutable = cardIdxRenderer(PTTX);
function renderPutable ()
{
	PTTX.clearRect(0, 0, PT.width, PT.height);
	table.getRLPutable().forEach(renderRenderableCardToPutable);
}

var renderRenderableCardToHand = cardRenderer(GFTX);
function renderHand ()
{
	GFTX.clearRect(0, 0, GF.width, GF.height);
	hand.forEach(renderRenderableCardToHand);
}

function renderGame ()
{
	GTX.clearRect(0, 0, G.width, G.height);

	GTX.drawImage(T, 0, 0);

	if (hand.length > 0)
	{
		GTX.drawImage(GF, (hand.x - hand.offs_x) * drawscale,
			(hand.y - hand.offs_y) * drawscale);
		window.requestAnimationFrame(renderGame);
	}

	if (DEBUG)
	{
		const MINIW = Math.floor(G.height / 8);
		const MINIH = Math.floor(G.width / 8);
		GTX.strokeStyle = '#808';
		GTX.lineWidth = 2;
		GTX.strokeRect(
			ps.margin.left,
			G.height - (MINIH + ps.margin.bottom),
			MINIW,
			MINIH);
		GTX.strokeRect(
			2 * ps.margin.left + MINIW,
			G.height - (MINIH + ps.margin.bottom),
			MINIW,
			MINIH);
		if (hand.length == 0)
		{
			GTX.drawImage(
				PK,
				ps.margin.left,
				G.height - (MINIH + ps.margin.bottom),
				MINIW,
				MINIH);
		}
		else
		{
			GTX.drawImage(
				PT,
				2 * ps.margin.left + MINIW,
				G.height - (MINIH + ps.margin.bottom),
				MINIW,
				MINIH);
		}
	}
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

	if (!NORESIZE)
	{
		stylescale = AW / G.width;
		console.log('stylescale: ' + stylescale);

		G.style.width = AW + 'px';
		G.style.height = Math.floor(G.height * stylescale) + 'px';

		if (DEBUG)
		{
			T.style.width = G.style.width;
			T.style.height = G.style.height;

			PK.style.width = G.style.width;
			PK.style.height = G.style.height;

			PT.style.width = G.style.width;
			PT.style.height = G.style.height;

			GF.style.width = Math.floor(GF.width
				* stylescale) + 'px';
			GF.style.height = Math.floor(GF.height
				* stylescale) + 'px';
		}
	}

	renderTable();
	renderPickable();
	renderGame();
}

adaptToDimsAndRes();

var id_ra;
window.onresize = function ()
{
	clearTimeout(id_ra);
	id_ra = setTimeout(adaptToDimsAndRes, 64);
};

function updateHandPosMouse (e)
{
	const X = (e.pageX - G.offsetLeft) / (stylescale * drawscale);
	const Y = (e.pageY - G.offsetTop) / (stylescale * drawscale);

	// XXX: Limit x to margins
	hand.x = Math.max(BU.margin.left,
		Math.min(X, AREABU.g.width - BU.margin.right));
	// XXX: Limit y to margins
	hand.y = Math.max(BU.margin.top,
		Math.min(Y, AREABU.g.height - BU.margin.bottom));
}

G.addEventListener('mousemove', function (e)
{
	if (hand.length > 0)
	{
		updateHandPosMouse(e);
	}
});

function updateHandPosTouch (e)
{
	const X = (e.touches[0].pageX - G.offsetLeft)
		/ (stylescale * drawscale);
	const Y = (e.touches[0].pageY - G.offsetTop)
		/ (stylescale * drawscale);

	// XXX: Limit x to margins
	hand.x = Math.max(BU.margin.left,
		Math.min(X, AREABU.g.width - BU.margin.right));
	// XXX: Limit y to margins
	hand.y = Math.max(BU.margin.top,
		Math.min(Y, AREABU.g.height - BU.margin.bottom));
}

G.addEventListener('touchmove', function (e)
{
	if (hand.length > 0)
	{
		updateHandPosTouch(e);
	}
});

function pick (e)
{
	const PIXEL = PKTX.getImageData(
		hand.x * drawscale, hand.y * drawscale, 1, 1);
	const VAL = PIXEL.data[0];
	if (VAL)
	{
		var card = table.getRLPickable()[(VAL - 1) / 4];
		hand.offs_x = hand.x - card.x;
		hand.offs_y = hand.y - card.y;
		const CARDS = card.origin.splice(card.oidx);
		const X = hand.x;
		const Y = hand.y;
		hand.x = 0;
		hand.y = 0;
		for (var i = 0 ; i < CARDS.length ; i++)
		{
			hand.push(new RenderableCard(CARDS[i],
				hand, card.origin, i));
		}
		hand.x = X;
		hand.y = Y;
		renderHand();
		renderPutable();
		renderTable();
		window.requestAnimationFrame(renderGame);
	}
}

G.addEventListener('mousedown', function (e)
{
	updateHandPosMouse(e);
	pick(e);
});

G.addEventListener('touchstart', function (e)
{
	updateHandPosTouch(e);
	pick(e);
});

function place (e)
{
	if (hand.length > 0)
	{
		const PIXEL = PTTX.getImageData(
			hand.x * drawscale, hand.y * drawscale, 1, 1);
		const VAL = PIXEL.data[0];
		var tgt;
		if (VAL)
		{
			tgt = table.getRLPutable()[(VAL - 1) / 4];
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
