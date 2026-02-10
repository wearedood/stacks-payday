;; ddtrvlr-token: SIP-010 Fungible Token
(define-fungible-token ddtrvlr-coin)

;; Mint new tokens (Utility)
(define-public (mint (amount uint) (recipient principal))
  (ft-mint? ddtrvlr-coin amount recipient)
)

;; Transfer tokens (SIP-010 Required)
;; This is the function the Market was looking for!
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    ;; 1. Check if the sender is the one signing the transaction
    (asserts! (is-eq tx-sender sender) (err u101))
    ;; 2. Perform the transfer
    (try! (ft-transfer? ddtrvlr-coin amount sender recipient))
    (ok true)
  )
)
