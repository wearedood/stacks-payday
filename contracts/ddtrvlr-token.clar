;; ddtrvlr-token: A simple SIP-010 style token
(define-fungible-token dd-token u1000000)

;; Mint tokens to yourself
(begin
  (ft-mint? dd-token u1000 tx-sender)
)

;; Check your balance
(define-read-only (get-balance (user principal))
  (ok (ft-get-balance dd-token user))
)
