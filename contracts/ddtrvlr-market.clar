;; ddtrvlr-market: Vending Machine
;; Use ddtrvlr-token to buy ddtrvlr-nft

(define-constant PRICE u10)

(define-public (buy-badge)
  (begin
    ;; 1. Transfer 10 tokens from Buyer (tx-sender) to This Contract (.ddtrvlr-market)
    ;; We use the direct name '.ddtrvlr-market' to avoid 'as-contract' errors
    (try! (contract-call? .ddtrvlr-token transfer PRICE tx-sender .ddtrvlr-market none))
    
    ;; 2. Mint the NFT to the Buyer
    (try! (contract-call? .ddtrvlr-nft mint))
    
    (ok "You bought a badge!")
  )
)
