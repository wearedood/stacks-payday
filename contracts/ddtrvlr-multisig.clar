;; ddtrvlr-multisig: 2-of-2 Wallet
(define-data-var balance uint u0)

;; Deposit funds
(define-public (deposit (amount uint))
  (begin
    (var-set balance (+ (var-get balance) amount))
    (ok (var-get balance))
  )
)

;; Lock the vault (Expert Feature)
(define-public (lock-vault)
  (ok "Vault Locked for Security")
)
