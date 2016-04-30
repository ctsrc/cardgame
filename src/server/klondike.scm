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

(define-constant DEBUG (get-environment-variable "DEBUG"))

(bind "uint32_t arc4random_uniform (uint32_t upper_bound)")

(define (swap-index a b l)
	(let ((A (take l a))
		(B (take (list-tail l (+ a 1)) (- b (+ a 1))))
		(C (list-tail l (+ b 1))))
		(append A (cons (list-ref l b) B) (cons (list-ref l a) C))))

(define (card color rank facing-up)
	(list 'card color rank facing-up))

(define (card? l)
	(eq? (car l) 'card))

(define (card-color card)
	(cadr card))

(define (card-rank card)
	(caddr card))

(define (card-facing-up? card)
	(cadddr card))

(define (n-to-card n)
	(let* ((rank (modulo n 13))
		(color (modulo (- n rank) 4)))
		(list
			'card
			(cond ((= color 0) 'hearts)
				((= color 1) 'spades)
				((= color 2) 'diamonds)
				((= color 3) 'clubs))
			(+ rank 1)
			#f)))

(define (cards l)
	(cdr l))

(define (deck cards)
	(cons 'deck cards))

(define (deck? l)
	(eq? (car l) 'deck))

(define (insert-no-shuffle i deck)
	(cons (n-to-card i) deck))

; Inside-out Fisher-Yates
(define (insert-shuffle i deck)
	(let ((j (arc4random_uniform (+ i 1))))
		(if (= i j)
			(insert-no-shuffle i deck)
			(swap-index 0 (- i j) (insert-no-shuffle i deck)))))

(define (init-deck deck-inserter)
	(deck ((define (fill-deck deck i)
		(if (= 52 i)
			deck
			(fill-deck (deck-inserter i deck) (+ i 1))))
		'() 0)))

(define (waste cards)
	(cons 'waste cards))

(define (waste? l)
	(eq? (car l) 'waste))

(define (foundation cards)
	(cons 'foundation cards))

(define (foundation? l)
	(eq? (car l) 'foundation))

(define (tableau cards)
	(cons 'tableau cards))

(define (tableau? l)
	(eq? (car l) 'tableau))

(define (hand origin held)
	(list 'hand origin held))

(define (hand-origin hand)
	(cadr hand))

(define (hand-held hand)
	(caddr hand))

(define (foundation-accept-hand? target hand)
	(and (eq? (cdr (hand-held hand)) '())
		(or (eq? (cards target) '())
			(let ((fct (car (cards target)))
				(fch (car (hand-held hand))))
				(and (= (card-color fch) (card-color fct))
					(= (card-rank fch)
						(+ (card-rank fct) 1)))))))

(define (tableau-accept-hand? target hand)
	(or (eq? (cards target) '())
		(let ((fct (car (cards target)))
			(fch (car (hand-held hand))))
			(and (or (and (or (= (card-color fch) 'hearts)
					(= (card-color fch) 'diamonds))
				(or (= (card-color fct) 'hearts)
					(= card-color fch) 'diamonds))
				(and (or (= (card-color fch) 'spades)
						(= (card-color fch) 'clubs))
					(or (= (card-color fct) 'spades)
						(= card-color fch) 'clubs)))
				(= (card-rank fch) (+ (card-rank fct) 1))))))

(define (accept-hand? target hand)
	(cond ((waste? target) (deck? (hand-origin hand)))
		((foundation? target) (foundation-accept-hand? target hand))
		((tableau? target) (tableau-accept-hand? target hand))))

(if DEBUG (print "Running DEBUG build."))

(if DEBUG (define no-shuffle-deck #t))

(if (and DEBUG no-shuffle-deck)
	(print "No shuffle deck. (Available to DEBUG build only.)"))

(define current-deck
	(if (and DEBUG no-shuffle-deck)
		(init-deck insert-no-shuffle)
		(init-deck insert-shuffle)))

(if DEBUG
	(begin (print (deck? current-deck) " "
		(length (cards current-deck)) "\n" current-deck)
		(let ((top (cadr current-deck)))
			(print (card? top) " " (card-color top) " "
				(card-rank top) " " (card-facing-up? top)))))
