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

import uuid
import json
import falcon
from wsgiref import simple_server

def init_game (user_id):

    game_id = str(uuid.uuid4())

    # TODO: Create game, store in memory.
    #       Redis? Ring buffer?

    # TODO: Include state and encrypted shadow state.

    return { 'game_id': game_id }

class UserIDValidation:

    def process_request (self, req, resp):

        if 'user_id' in req.cookies:
            try:
                u = uuid.UUID(req.cookies['user_id'])
                assert(u.variant == uuid.RFC_4122)
                assert(u.version == 4)
            except (ValueError, AssertionError):
                raise falcon.HTTPBadRequest('User ID invalid',
                    'Cookie \'user_id\' must hold a Version 4 UUID.',
                    href='/docs/api/request-headers.htm')
        else:
            raise falcon.HTTPBadRequest('User ID not provided',
                'Cookie \'user_id\' must be set.',
                href='/docs/api/request-headers.htm')

class RequireJSON:

    def process_request (self, req, resp):

        if not req.client_accepts_json:
            raise falcon.HTTPNotAcceptable(
                'This API only supports responses encoded as JSON.',
                href='/docs/api/response-body-json.htm')

        if req.method in ('POST', 'PUT'):
            if 'application/json' not in req.content_type:
                raise falcon.HTTPUnsupportedMediaType(
                    'This API only supports requests encoded as JSON.',
                    href='/docs/api/json/request-body-json.htm')

class JSONTranslator:

    def process_request (self, req, resp):

        if req.content_length in (None, 0):
            return

        body = req.stream.read()
        if not body:
            raise falcon.HTTPBadRequest('Empty request body',
                'A valid JSON document is required.',
                href='/docs/api/json/request-body-json.htm')

        try:
            req.context['doc'] = json.loads(body.decode('utf-8'))

        except (ValueError, UnicodeDecodeError):
            raise falcon.HTTPError(falcon.HTTP_753,
                'Malformed JSON',
                'Could not decode the request body. '
                    'The JSON was incorrect or not encoded as UTF-8.',
                href='/docs/api/json/request-body-json.htm')

    def process_response (self, req, resp, resource):

        if 'result' not in req.context:
            return

        resp.body = json.dumps(req.context['result'])

class CreateGame:

    def on_post (self, req, resp):

        game = init_game(req.cookies['user_id'])
        req.context['result'] = game
        resp.status = falcon.HTTP_201
        resp.location = '/%s/' % game['game_id']

class PlayGame:

    def on_get (self, req, resp, game_id):

        # TODO: Ensure user is owner of game.

        req.context['result'] = { 'game_id': game_id }
        resp.status = falcon.HTTP_200

    def on_post (self, req, resp, game_id):

        # TODO: Ensure user is owner of game.

        req.context['result'] = { 'game_id': game_id }
        resp.status = falcon.HTTP_200

    def on_put (self, req, resp, game_id):

        # TODO: Restore from encrypted shadow state.

        pass

app = falcon.API(middleware=[
    UserIDValidation(), RequireJSON(), JSONTranslator()])

create_game = CreateGame()
app.add_route('/', create_game)

play_game = PlayGame()
app.add_route('/{game_id}/', play_game)

if __name__ == '__main__':
    httpd = simple_server.make_server('127.0.0.1', 8080, app)
    httpd.serve_forever()
