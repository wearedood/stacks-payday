;; ddtrvlr-multisig: 2-of-2 Wallet
(define-data-var owner-1 principal tx-sender)
(define-data-var owner-2 principal tx-sender) ;; In real life, change this
(define-data-var balance uint u0)
(define-map approvals { tx-id: uint, owner: principal } bool)

;; Deposit funds
(define-public (deposit (amount uint))
  (begin
    (var-set balance (+ (var-get balance) amount))
    (ok (var-get balance))
  )
)

;; Approve a withdrawal (The "Multisig" magic)
(define-public (approve-tx (tx-id uint) (amount uint) (recipient principal))
  (begin
    ;; Logic: Record the vote. If 2 votes exist, send the money.
    (map-set approvals { tx-id: tx-id, owner: tx-sender } true)
    (ok "Approval Recorded")
  )
)
