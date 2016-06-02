#!/usr/bin/env bash

# Obviously, this is not proper testing - it's just a draft.

# POST to /

curl -v \
  -H 'Cookie: uid=a1;token=04c50e95-eb99-4758-8686-121c44b2f290' \
  -H 'Content-Type: application/json' \
  -X POST \
  http://127.0.0.1:8080/

echo ; echo

# GET /

curl -v \
  -H 'Cookie: uid=a1;token=04c50e95-eb99-4758-8686-121c44b2f290' \
  -H 'Content-Type: application/json' \
  http://127.0.0.1:8080/

echo ; echo

# GET /{game_id}/

curl -v \
  -H 'Cookie: uid=a1;token=04c50e95-eb99-4758-8686-121c44b2f290' \
  -H 'Content-Type: application/json' \
  http://127.0.0.1:8080/f0cfae2e-afd5-4dd4-ab1c-f3c5da091ee3/

echo ; echo

# GET /{game_id}/revs/

curl -v \
  -H 'Cookie: uid=a1;token=04c50e95-eb99-4758-8686-121c44b2f290' \
  -H 'Content-Type: application/json' \
  http://127.0.0.1:8080/f0cfae2e-afd5-4dd4-ab1c-f3c5da091ee3/revs/

echo ; echo

# POST /{game_id}/revs/

curl -v \
  -H 'Cookie: uid=a1;token=04c50e95-eb99-4758-8686-121c44b2f290' \
  -H 'Content-Type: application/json' \
  -X POST \
  http://127.0.0.1:8080/f0cfae2e-afd5-4dd4-ab1c-f3c5da091ee3/revs/

echo ; echo

# GET /{game_id}/revs/{rev_id}/

curl -v \
  -H 'Cookie: uid=a1;token=04c50e95-eb99-4758-8686-121c44b2f290' \
  -H 'Content-Type: application/json' \
  http://127.0.0.1:8080/f0cfae2e-afd5-4dd4-ab1c-f3c5da091ee3/revs/0/

echo ; echo
