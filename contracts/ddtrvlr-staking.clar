;; ddtrvlr-staking: Earn rewards by locking tokens
(define-map stakes principal uint)
(define-constant REWARD_RATE u5) 

;; Stake tokens (Lock them up)
(define-public (stake-tokens (amount uint))
  (begin
    ;; 1. Transfer tokens to this contract
    (try! (contract-call? .ddtrvlr-token transfer amount tx-sender (as-contract tx-sender) none))
    ;; 2. Record the stake
    (ok (map-set stakes tx-sender amount))
  )
)

;; Check my stake
(define-read-only (get-stake (staker principal))
  (ok (default-to u0 (map-get? stakes staker)))
)
