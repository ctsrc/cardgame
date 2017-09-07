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

const OPTS = window.location.search.replace("?", "").split('&');
const DEBUG = !!OPTS.find((e) => { return e === 'DEBUG'; });
console.log('DEBUG: ' + DEBUG);
const LOWRES = !!OPTS.find((e) => { return e === 'LOWRES'; });
console.log('LOWRES: ' + LOWRES);
const NORESIZE = !!OPTS.find((e) => { return e === 'NORESIZE'; });
console.log('NORESIZE: ' + NORESIZE);

// Base units
const BU =
{
	'card':
	{
		'width': 2.5,
		'height': 3.5,
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

// Pixel size
var ps = { 'card': {}, 'margin': {} };

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

const M = document.getElementById('messages');

let displayMessage = (msgt, msgc) =>
{
	var msg = document.createElement('p');
	msg.className = msgc;
	msg.innerHTML = msgt;
	M.appendChild(msg);
}

let displayError = (msgt) =>
{
	G.style.display = 'none';
	displayMessage('ERROR: ' + msgt, 'err');
}

let resetDisplay = () =>
{
	while (M.firstChild) {
		M.removeChild(M.firstChild);
	}

	G.style.display = 'block';
}

// Returns the new width of rectangle that will make it fit within dw x dh.
let fitRectNearEightToDims = (cw, ch, dw, dh) =>
{
	console.log('Wish to fit ' + cw + 'x' + ch + ' to ' + dw + 'x' + dh);

	const WLIM = (cw / ch <= dw / dh) ? Math.floor(dh * cw / ch) : dw;

	return WLIM - WLIM % 8;
}

const DRAWSCALE_MIN = LOWRES ? 16 : Math.ceil(512 / AREABU.g.width);
console.log('DRAWSCALE_MIN: ' + DRAWSCALE_MIN);

/*
 * To the extent permitted by the frame time of 16 ms, we want to draw
 * at a resolution up to twice the one reported by the browser. The idea is to
 * try and look good on retina displays. I don't yet know if it actually does.
 * Will sometimes produce jagged edges on straight lines in Firefox
 * on my non-retina computer but that's part of the fun so I'm keeping this.
 */

const DRAWSCALE_RETINA = LOWRES ? 16 : Math.floor(fitRectNearEightToDims(
		AREABU.g.width, AREABU.g.height,
		2 * screen.width, 2 * screen.height)
	/ AREABU.g.width);
console.log('DRAWSCALE_RETINA: ' + DRAWSCALE_RETINA);

let acceptableFramerate = (drawscale) =>
{
	G.width = AREABU.g.width * drawscale;
	G.height = AREABU.g.height * drawscale;

	var i = 0;
	for (const START = new Date().getTime() ;
		i < 52 && new Date().getTime() - START <= 16; i++)
	{
		GTX.fillStyle = 'rgb(' +
			Math.floor(Math.random() * 255) + ', ' +
			Math.floor(Math.random() * 255) + ', ' +
			Math.floor(Math.random() * 255) + ')';
		GTX.fillRect(
			Math.random() * G.width, Math.random() * G.height,
			Math.random() * G.width, Math.random() * G.height);
	}

	return i == 52;
}

var ds_lb = DRAWSCALE_MIN;
var ds_ub = DRAWSCALE_RETINA;

var ds_accept_last = false;
do
{
	drawscale = ds_lb + Math.ceil((ds_ub - ds_lb)/2);
	console.log('Trying drawscale `' + drawscale + "'");
	ds_accept_last = acceptableFramerate(drawscale);
	if (ds_accept_last)
	{
		ds_lb = drawscale;
	}
	else
	{
		ds_ub = drawscale;
	}
} while (ds_ub - ds_lb > 0);
if (!ds_accept_last)
{
	displayError('Unable to find an acceptable '
		+ 'resolution, frame rate pair.');
	throw('FATAL ERROR :(');
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

let isFacingUp = (card) =>
{
	return card & FACE_UP;
}

let getColor = (card) =>
{
	return (card & MASK_COLOR) >> 4;
}

let getRank = (card) =>
{
	return card & MASK_RANK;
}

class ChainableCard
{
	constructor (value)
	{
		this.value = value;

		this.offset_x = 0;
		this.offset_y = 0;
		this.offset_z = 0;

		this.child = null;
	}

	setOffset (x, y, z)
	{
		this.offset_x = x;
		this.offset_y = y;
		this.offset_z = z;
	}

	attachChild (child)
	{
		if (this.child !== null)
		{
			// TODO: Throw exception
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
			// TODO: Throw exception
		}
		else
		{
			child = this.child;
			this.child = null;
			return child;
		}
	}
}

class StackPosition
{
	constructor (x, y, z)
	{
		this.x = x;
		this.y = y;
		this.z = z;

		this.card = null;
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

	getRLVisible ()
	{
		var ret = Array(this.length);

		for (var i = 0 ; i < this.length ; i++)
		{
			ret.push(new RenderableCard(this[i], this, this, i));
		}
		if (this.length == 0)
		{
			ret.push(new RenderableCard(NULLCARD, this, this, 0));
		}

		return ret;
	}

	// Topmost pickable by default
	getRLPickable ()
	{
		if (this.length > 0)
		{
			return [new RenderableCard(
				this[this.length - 1],
				this,
				this,
				this.length - 1)];
		}
		else
		{
			return [];
		}
	}

	putable ()
	{
		return false;
	}

	getRLPutable ()
	{
		if (this.putable())
		{
			return [new RenderableCard(
				this[this.length - 1],
				this,
				this,
				this.length - 1)];
		}
	}
}

/*
 * XXX: WasteStackOfStackOfCards holds multiple StackOfCards instances,
 *	each of which holds up to three cards. Meanwhile, WSOSOC appears
 *	externally like any other StackOfCards. Talk about hiding
 *	complexity, eh :)
 */
class WasteStackOfStacksOfCards extends StackOfCards
{
	constructor (cards, x, y, z)
	{
		super();

		this.x = x;
		this.y = y;
		this.z = z;

		var stacksoc = [];

		while (cards.length > 3)
		{
			stacksoc.append(new StackOfCards(
				cards.splice(3), x, y, z));
		}

		if (cards.length)
		{
			stacksoc.append(new StackOfCards(cards, x, y, z));
		}

		StackOfCards.prototype.push.apply(this, stacksoc);
	}

	push (card)
	{
		console.log('WSOSOC pushing card ' + card);

		if (!this.length || this[this.length - 1].length == 3)
		{
			StackOfCards.prototype.push.apply(
				this, [new StackOfCards(
					[], this.x, this.y, this.z)]);
		}

		this[this.length - 1].push(card);

		console.log(this);

		return this.length;
	}

	getLocalCoordXCardByIdx (idx)
	{
		console.log('WSOC gLCXCBI, idx: ' + idx);
		return BU.margin.elem_horz * (idx % 3);
	}

	getRLVisible ()
	{
		if (this.length)
		{
			console.log('WSOSC getRLVisible');
			console.log(this[this.length - 1].getRLVisible());
			return this[this.length - 1].getRLVisible();
		}
		else
		{
			return [];
		}
	}

	getRLPutable ()
	{
		if (this.length)
		{
			return this[this.length - 1].getRLPutable();
		}
		else
		{
			return [];
		}
	}
}

class FoundationStackOfCards extends StackOfCards
{
	constructor (cards, x, y, z)
	{
		super(cards, x, y, z);
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
	}

	getLocalCoordYCardByIdx (idx)
	{
		return BU.margin.elem_vert * idx;
	}

	putable ()
	{
		return true; // TODO
	}

	getRLPickable ()
	{
		var ret = [];

		for (var i = 0 ; i < this.length ; i++)
		{
			if (isFacingUp(this[i]))
			{
				ret.push(new RenderableCard(
					this[i], this, this, i));
			}
		}

		return ret;
	}
}

StackOfCards.prototype.push.apply = (obj, cards) =>
{
	Array.prototype.push.apply(obj, cards);
}

WasteStackOfStacksOfCards.prototype.push.apply = (obj, cards) =>
{
	console.log('WSOC.prot.push.apply, len: ' + cards.length);
	for (i in cards)
	{
		obj.push(cards[i]);
	}
}

var table = {};
table.x = 0;
table.y = 0;
table.z = 0;
table.foundation = [];
table.tableau = [];
table.initialize = () =>
{
	this.table.deck = new StackOfCards([],
		this.x + BU.margin.left, this.y + BU.margin.top, this.z);

	this.table.waste = new WasteStackOfStacksOfCards([],
		this.x + BU.margin.left + BU.card.width + BU.margin.elem_horz,
		this.y + BU.margin.top, this.z);

	for (var i = 0 ; i < 4 ; i++)
	{
		this.table.foundation.push(new FoundationStackOfCards([],
			this.x + BU.margin.left
				+ (3 + i) * (BU.card.width
					+ BU.margin.elem_horz),
			this.y + BU.margin.top, this.z));
	}

	for (var i = 0 ; i < 7 ; i++)
	{
		this.table.tableau.push(new TableauStackOfCards([],
			this.x + BU.margin.left
				+ i * (BU.card.width + BU.margin.elem_horz),
			this.y + BU.margin.top + BU.card.height
				+ BU.margin.elem_vert,
			this.z));
	}

	// TODO: Get initial state from server.

	// Initialize deck
	//for (var i = 0 ; i < 24 ; i++)
	var cards = [];
	for (var i = 0 ; i < 18 ; i++)
	{
		cards[i] = UNKNOWNCARD;
	}
	this.table.deck.push.apply(this.table.deck, cards);

	// Waste is empty as it should be. No further initialization required.
	// Initialize with a few cards for testing.
	console.log('hurr');
	this.table.waste.push.apply(this.table.waste,
		[43 | FACE_UP, 42 | FACE_UP, 41 | FACE_UP,
			36 | FACE_UP, 18 | FACE_UP]);
	console.log('durr');

	// Foundations are empty as they should be.

	// Initialize tableaus
	for (var i = 0 ; i < 7 ; i++)
	{
		var cards = [];
		for (var j = 0 ; j < i ; j++)
		{
			cards[j] = UNKNOWNCARD;
		}
		this.table.tableau[i].push.apply(this.table.tableau[i], cards);
	}
	this.table.tableau[0].push(21 | FACE_UP);
	this.table.tableau[1].push(19 | FACE_UP);
	this.table.tableau[2].push(61 | FACE_UP);
	this.table.tableau[3].push(56 | FACE_UP);
	this.table.tableau[4].push(52 | FACE_UP);
	this.table.tableau[5].push(49 | FACE_UP);
	this.table.tableau[6].push(44 | FACE_UP);

	this.table.getRLVisible = () =>
	{
		/*
		 * XXX: I prefer prototype call. I find it
		 *	to be more readable than calling
		 *	concat on first array with
		 *	the others as arguments.
		 */
		return Array.prototype.concat.call(
			this.table.deck.getRLVisible(),
			this.table.waste.getRLVisible(),
			this.table.foundation[0].getRLVisible(),
			this.table.foundation[1].getRLVisible(),
			this.table.foundation[2].getRLVisible(),
			this.table.foundation[3].getRLVisible(),
			this.table.tableau[0].getRLVisible(),
			this.table.tableau[1].getRLVisible(),
			this.table.tableau[2].getRLVisible(),
			this.table.tableau[3].getRLVisible(),
			this.table.tableau[4].getRLVisible(),
			this.table.tableau[5].getRLVisible(),
			this.table.tableau[6].getRLVisible());
	};

	this.table.getRLPickable = () =>
	{
		return Array.prototype.concat.call(
			this.table.waste.getRLPickable(),
			this.table.foundation[0].getRLPickable(),
			this.table.foundation[1].getRLPickable(),
			this.table.foundation[2].getRLPickable(),
			this.table.foundation[3].getRLPickable(),
			this.table.tableau[0].getRLPickable(),
			this.table.tableau[1].getRLPickable(),
			this.table.tableau[2].getRLPickable(),
			this.table.tableau[3].getRLPickable(),
			this.table.tableau[4].getRLPickable(),
			this.table.tableau[5].getRLPickable(),
			this.table.tableau[6].getRLPickable());
	};

	this.table.getRLPutable = () =>
	{
		return Array.prototype.concat.call(
			this.table.foundation[0].getRLPutable(),
			this.table.foundation[1].getRLPutable(),
			this.table.foundation[2].getRLPutable(),
			this.table.foundation[3].getRLPutable(),
			this.table.tableau[0].getRLPutable(),
			this.table.tableau[1].getRLPutable(),
			this.table.tableau[2].getRLPutable(),
			this.table.tableau[3].getRLPutable(),
			this.table.tableau[4].getRLPutable(),
			this.table.tableau[5].getRLPutable(),
			this.table.tableau[6].getRLPutable());
	};
};

table.initialize();

let renderCard = (ctx, card, x, y) =>
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

let cardRenderer = (ctx) =>
{
	return (rc, idx) =>
	{
		renderCard(ctx, rc.card, rc.x, rc.y);
	}
}

let cardIdxRenderer = (ctx) =>
{
	return (rc, idx) =>
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
hand.getLocalCoordYCardByIdx = (idx) =>
{
	return BU.margin.elem_vert * idx;
};

var renderRenderableCardToTable = cardRenderer(TTX);
let renderTable = () =>
{
	TTX.clearRect(0, 0, T.width, T.height);
	table.getRLVisible().forEach(renderRenderableCardToTable);
}

var renderRenderableCardToPickable = cardIdxRenderer(PKTX);
let renderPickable = () =>
{
	PKTX.clearRect(0, 0, PK.width, PK.height);
	table.getRLPickable().forEach(renderRenderableCardToPickable);
}

var renderRenderableCardToPutable = cardIdxRenderer(PTTX);
let renderPutable = () =>
{
	PTTX.clearRect(0, 0, PT.width, PT.height);
	table.getRLPutable().forEach(renderRenderableCardToPutable);
}

var renderRenderableCardToHand = cardRenderer(GFTX);
let renderHand = () =>
{
	GFTX.clearRect(0, 0, GF.width, GF.height);
	hand.forEach(renderRenderableCardToHand);
}

let renderGame = () =>
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

let adaptToDimsAndRes = () =>
{
	resetDisplay();

	const AW = Math.floor(fitRectNearEightToDims(
		AREABU.g.width, AREABU.g.height,
		window.innerWidth, window.innerHeight));

	const DRAWSCALE_DESIRED = 2 * Math.floor(AW / AREABU.g.width);
	console.log('DRAWSCALE_DESIRED: ' + DRAWSCALE_DESIRED);
	drawscale = DRAWSCALE_DESIRED;
	stylescale = 1 / 2;
	ps.card.border = 1;

	if (drawscale > DRAWSCALE_MAX)
	{
		stylescale = drawscale / (2 * DRAWSCALE_MAX);
		drawscale = DRAWSCALE_MAX;
	}

	console.log('drawscale: ' + drawscale);

	if (drawscale >= DRAWSCALE_MIN)
	{
		ps.card.width = Math.floor(BU.card.width * drawscale);
		ps.card.height = Math.floor(BU.card.height * drawscale);
		ps.card.thickness = Math.floor(BU.card.thickness * drawscale);

		ps.margin.elem_vert = Math.floor(BU.margin.elem_vert
			* drawscale);
		ps.margin.elem_horz = Math.floor(BU.margin.elem_horz
			* drawscale);
		ps.margin.top = Math.floor(BU.margin.top * drawscale);
		ps.margin.right = Math.floor(BU.margin.right * drawscale);
		ps.margin.bottom = Math.floor(BU.margin.bottom * drawscale);
		ps.margin.left = Math.floor(BU.margin.left * drawscale);

		G.width = AREABU.g.width * drawscale;
		G.height = AREABU.g.height * drawscale;

		T.width = G.width;
		T.height = G.height

		PK.width = G.width;
		PK.height = G.height

		PT.width = G.width;
		PT.height = G.height

		GF.width = ps.card.width;
		GF.height = ps.card.height + 12 * ps.margin.elem_horz;

		if (NORESIZE)
		{
			stylescale = 1;
		}
		else
		{
			ps.card.border = 1 / stylescale;

			G.style.width =
				Math.floor(G.width * stylescale) + 'px';
			G.style.height =
				Math.floor(G.height * stylescale) + 'px';

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
		console.log('stylescale: ' + stylescale);

		renderTable();
		renderPickable();
		renderGame();
	}
	else
	{
		displayError('Browser window is too small.');
	}
}

adaptToDimsAndRes();

var id_ra;
window.onresize = () =>
{
	clearTimeout(id_ra);
	id_ra = setTimeout(adaptToDimsAndRes, 64);
};

let updateHandPosMouse = (e) =>
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

G.addEventListener('mousemove', (e) =>
{
	if (hand.length > 0)
	{
		updateHandPosMouse(e);
	}
});

let updateHandPosTouch = (e) =>
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

G.addEventListener('touchmove', (e) =>
{
	if (hand.length > 0)
	{
		updateHandPosTouch(e);
	}
});

let pick = (e) =>
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

G.addEventListener('mousedown', (e) =>
{
	updateHandPosMouse(e);
	pick(e);
});

G.addEventListener('touchstart', (e) =>
{
	updateHandPosTouch(e);
	pick(e);
});

let place = (e) =>
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
		var cards = hand.splice(0).map((e) => { return e.card; });
		tgt.origin.push.apply(tgt.origin, cards);
		renderTable();
		renderPickable();
	}
}

G.addEventListener('mouseup', place);
G.addEventListener('mouseout', place);
G.addEventListener('touchend', place);