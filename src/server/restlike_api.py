#!/usr/bin/env python3

#
# Copyright (c) 2016 Erik Nordstrøm <erik@nordstroem.no>
#
# Permission to use, copy, modify, and/or distribute this software for any
# purpose with or without fee is hereby granted, provided that the above
# copyright notice and this permission notice appear in all copies.
#
# THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
# WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
# MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
# ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
# WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
# ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
# OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
#

import re
import uuid
import json
import falcon
from wsgiref import simple_server

def init_game (user_id):

    game_id = str(uuid.uuid4())

    # TODO: Create game, store in memory along with
    #       game_id and owner_id (user_id).
    #       Redis? Ring buffer?

    # TODO: Return state of revision 0.

    return { 'game_id': game_id, 'rev': 0 }

class UserIDValidator:

    def process_request (self, req, resp):

        if 'uid' in req.cookies:
            try:
                u = req.cookies['uid']
                assert(u[0] == 'a') # Anonymous user. The only kind for now.
                assert(not re.match('^[1-9][0-9]*$', u[1:]) is None)
                assert(type(int(u[1:])) == int) # Want plain, not long int.
            except AssertionError:
                raise falcon.HTTPBadRequest('User ID invalid',
                    'Cookie \'uid\' must hold the letter \'a\' '
                        'followed by a plain integer.',
                    href='/docs/restlike-api/request-headers.htm#cookie-uid')
        else:
            raise falcon.HTTPBadRequest('User ID not provided',
                'Cookie \'uid\' must be set.',
                href='/docs/restlike-api/request-headers.htm#cookie-uid')

        if 'token' in req.cookies:
            try:
                t = uuid.UUID(req.cookies['token'])
                assert(t.variant == uuid.RFC_4122)
                assert(t.version == 4)
            except (ValueError, AssertionError):
                raise falcon.HTTPBadRequest('Access token invalid',
                    'Cookie \'token\' must hold a Version 4 UUID.',
                    href='/docs/restlike-api/request-headers.htm#cookie-token')
        else:
            raise falcon.HTTPBadRequest('Access token not provided',
                'Cookie \'token\' must be set.',
                href='/docs/restlike-api/request-headers.htm#cookie-token')

        # TODO: Validate (user id, token)-pair.

class RequireJSON:

    # https://falcon.readthedocs.io/en/stable/user/quickstart.html

    def process_request (self, req, resp):

        if not req.client_accepts_json:
            raise falcon.HTTPNotAcceptable(
                'This API only supports responses encoded as JSON.',
                href='/docs/restlike-api/response-body-json.htm')

        if req.method in ('POST', 'PUT'):
            if 'application/json' not in req.content_type:
                raise falcon.HTTPUnsupportedMediaType(
                    'This API only supports requests encoded as JSON.',
                    href='/docs/restlike-api/json/request-body-json.htm')

class JSONTranslator:

    # https://falcon.readthedocs.io/en/stable/user/quickstart.html

    def process_request (self, req, resp):

        if req.content_length in (None, 0):
            return

        body = req.stream.read()
        if not body:
            raise falcon.HTTPBadRequest('Empty request body',
                'A valid JSON document is required.',
                href='/docs/restlike-api/json/request-body-json.htm')

        try:
            req.context['doc'] = json.loads(body.decode('utf-8'))

        except (ValueError, UnicodeDecodeError):
            raise falcon.HTTPError(falcon.HTTP_753,
                'Malformed JSON',
                'Could not decode the request body. '
                    'The JSON was incorrect or not encoded as UTF-8.',
                href='/docs/restlike-api/json/request-body-json.htm')

    def process_response (self, req, resp, resource):

        if 'result' not in req.context:
            return

        resp.body = json.dumps(req.context['result'])

class Games:

    def on_post (self, req, resp):

        gamerev = init_game(req.cookies['uid'])
        req.context['result'] = gamerev
        resp.status = falcon.HTTP_201
        resp.location = '/%s/revs/%s' % (gamerev['game_id'], gamerev['rev'])

    def on_get (self, req, resp):

        # Return list of games.

        req.context['result'] = [ ]
        resp.status = falcon.HTTP_200

class Game:

    def on_get (self, req, resp, game_id):

        # Return properties of game.

        req.context['result'] = { }
        resp.status = falcon.HTTP_200

class GameRevisions:

    def on_post (self, req, resp, game_id):

        # TODO: Ensure user is owner of game.

        # TODO: Validate transformation, return new revision.

        gamerev = { 'game_id': game_id, 'rev': 1 } # TODO use real data.

        req.context['result'] = { }
        resp.status = falcon.HTTP_201
        resp.location = '/%s/revs/%s' % (gamerev['game_id'], gamerev['rev'])

    def on_get (self, req, resp, game_id):

        # Return list of game revisions.

        req.context['result'] = [ ]
        resp.status = falcon.HTTP_200

class GameRevision:

    def on_get (self, req, resp, game_id, rev):

        # Return list of game revisions.

        req.context['result'] = { }
        resp.status = falcon.HTTP_200

app = falcon.API(middleware=[
    UserIDValidator(), RequireJSON(), JSONTranslator()])

games = Games()
app.add_route('/', games)

game = Game()
app.add_route('/{game_id}/', game)

gamerevs = GameRevisions()
app.add_route('/{game_id}/revs/', gamerevs)

gamerev = GameRevision()
app.add_route('/{game_id}/revs/{rev}/', gamerev)

if __name__ == '__main__':
    httpd = simple_server.make_server('127.0.0.1', 8080, app)
    httpd.serve_forever()
