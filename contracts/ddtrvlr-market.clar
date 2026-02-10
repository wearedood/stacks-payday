;; ddtrvlr-market: Vending Machine
;; Use ddtrvlr-token to buy ddtrvlr-nft

(define-constant PRICE u10)

(define-public (buy-badge)
  ;; Define the contract's address first to make Clarinet happy
  (let ((recipient (as-contract tx-sender)))
    ;; 1. Transfer 10 tokens from Buyer to This Contract
    (try! (contract-call? .ddtrvlr-token transfer PRICE tx-sender recipient none))
    
    ;; 2. Mint the NFT to the Buyer
    (try! (contract-call? .ddtrvlr-nft mint))
    
    (ok "You bought a badge!")
  )
)
