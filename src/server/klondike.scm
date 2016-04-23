;
; Copyright (c) 2016 Erik Nordstrøm <erik@nordstroem.no>
;
; Permission to use, copy, modify, and/or distribute this software for any
; purpose with or without fee is hereby granted, provided that the above
; copyright notice and this permission notice appear in all copies.
;
; THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
; WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
; MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
; ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
; WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
; ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
; OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
;

(require-extension bind)

(bind "uint32_t arc4random_uniform(uint32_t upper_bound)")

(use srfi-1)

(define (swap-index a b l)
	(let ([A (take l a)]
		[B (take (list-tail l (+ a 1)) (- b (+ a 1)))]
		[C (list-tail l (+ b 1))])
		(append A (cons (list-ref l b) B) (cons (list-ref l a) C))))

;(define t '('a 'b 'c 'd 'e 'f))
;(print t)
;(print (swap-index 2 4 t))

; Inside-out Fisher-Yates
(define (fill-deck d i)
	(if (= 52 i)
		d
		(fill-deck
			(let ([j (arc4random_uniform (+ i 1))])
				(if (= i j)
					(cons i d)
					(swap-index 0 (- i j) (cons i d))))
			(+ i 1))))

(define deck (fill-deck '() 0))
(print (length deck))
(print deck)
