;; ddtrvlr-market: Vending Machine
;; Use ddtrvlr-token to buy ddtrvlr-nft

(define-constant PRICE u10)

(define-public (buy-badge)
  (begin
    ;; 1. Transfer 10 tokens from Buyer to Contract
    (try! (contract-call? .ddtrvlr-token transfer PRICE tx-sender (as-contract tx-sender) none))
    
    ;; 2. Mint the NFT to the Buyer
    (try! (contract-call? .ddtrvlr-nft mint))
    
    (ok "You bought a badge!")
  )
)
