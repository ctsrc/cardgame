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

(require-extension bind srfi-1)

(bind "uint32_t arc4random_uniform (uint32_t upper_bound)")

(define (swap-index a b l)
	(let ((A (take l a))
		(B (take (list-tail l (+ a 1)) (- b (+ a 1))))
		(C (list-tail l (+ b 1))))
		(append A (cons (list-ref l b) B) (cons (list-ref l a) C))))

(define (n-to-card n)
	(let ((rank (modulo n 13)))
		(let ((color (modulo (- n rank) 4)))
			(list
				(cond ((= color 0) 'hearts)
					((= color 1) 'spades)
					((= color 2) 'diamonds)
					((= color 3) 'clubs))
				(+ rank 1)
				#f))))

; Inside-out Fisher-Yates
(define (shuffled-deck)
	((define (fill-deck d i)
		(if (= 52 i)
			d
			(fill-deck
				(let ((j (arc4random_uniform (+ i 1))))
					(if (= i j)
						(cons (n-to-card i) d)
						(swap-index 0 (- i j)
							(cons (n-to-card i) d))))
				(+ i 1))))
		'() 0))

(define (unshuffled-deck)
	((define (fill-deck d i)
		(if (= 52 i)
			d
			(fill-deck (cons (n-to-card i) d) (+ i 1))))
		'() 0))

(define deck (unshuffled-deck))
(print (length deck) "\n" deck)
