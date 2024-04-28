/*
 * Copyright (c) 2018, 2019, 2024 Erik Nordstrøm <erik@nordstroem.no>
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

const elem_table = document.body.querySelector('#table');

class IncognitoUser
{
  constructor ()
  {
  }

  get_displayname_html ()
  {
    return '<span class="incognito user"></span>';
  }
}

class AnonymousUser
{
  constructor (roomlocal_userid)
  {
    this.roomlocal_userid = roomlocal_userid;
  }

  get_displayname_html ()
  {
    return '<span class=user><span class=anonymous></span><span class=userid>`$this.roomlocal_userid`</span></span>';
  }
}

class Staff
{
  constructor (username)
  {
    this.username = username;
  }

  get_displayname_html ()
  {
    return '<span class=staff>`$this.username`</span>';
  }
}

/*
 * Enter room
 */

let roomlocal_userids_users_in_current_room = [5371, 7040, 3196, 3220, 'Incognito', 4970, 'Incognito', 'ModBot'];

let roomlocal_userids_map = new Map();

for (let roomlocal_userid of roomlocal_userids_users_in_current_room)
{
  if (typeof roomlocal_userid === 'number')
  {
    roomlocal_userids_map.set(roomlocal_userid, new AnonymousUser(roomlocal_userid));
  }
  else if (roomlocal_userid === 'Incognito')
  {
    if (!(roomlocal_userids_map.has('Incognito')))
    {
      roomlocal_userids_map.set('Incognito', new IncognitoUser());
    }
  }
  else if (roomlocal_userid === 'ModBot')
  {
    roomlocal_userids_map.set('ModBot', new Staff('ModBot'));
  }
}

let votes_moves = [];

votes_moves.push({
  userid_voter: 5371,
  selector_move_card: '[data-card-id="30"]',
  selector_move_onto: '#foundation-slot-2',
});

votes_moves.push({
  userid_voter: 7040,
  selector_move_card: '[data-card-id="34"]',
  selector_move_onto: '[data-card-id="25"]',
});

votes_moves.push({
  userid_voter: 3196,
  selector_move_card: '[data-card-id="30"]',
  selector_move_onto: '#foundation-slot-2',
});

let unique_move_cards = new Set();
let unique_moves = new WeakMap();

for (let vote_move of votes_moves)
{
  const move_card = elem_table.querySelector(vote_move.selector_move_card);
  const move_onto = elem_table.querySelector(vote_move.selector_move_onto);

  if (!(unique_move_cards.has(move_card)))
  {
    unique_move_cards.add(move_card);
    unique_moves.set(move_card, {
      unique_ontos: new Set(),
      votes_map: new WeakMap(),
    });
  }

  const unique_moves_from_current_move_card = unique_moves.get(move_card);

  if (!(unique_moves_from_current_move_card.unique_ontos.has(move_onto)))
  {
    unique_moves_from_current_move_card.unique_ontos.add(move_onto),
    unique_moves_from_current_move_card.votes_map.set(move_onto, {
      you_voted_for_this: false,
      usernames_voters: [],
    })
  }
}

console.log(unique_move_cards, unique_moves);
