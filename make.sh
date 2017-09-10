#!/usr/bin/env sh

cd server && cargo rustc --release -- -C target-cpu=native
