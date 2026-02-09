;; ddtrvlr-vault: Simple escrow contract
(define-data-var total-stashed uint u0)

;; Let a user stash their amount
(define-public (stash (amount uint))
  (begin
    (var-set total-stashed (+ (var-get total-stashed) amount))
    (ok (var-get total-stashed))
  )
)

;; Read how much is in the vault
(define-read-only (get-vault-total)
  (ok (var-get total-stashed))
)
