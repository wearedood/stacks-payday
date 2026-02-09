;; ddtrvlr-nft: Simple NFT for Builder Rewards
(define-non-fungible-token builder-badge uint)
(define-data-var last-id uint u0)

;; Mint a new badge
(define-public (mint)
  (let ((id (+ (var-get last-id) u1)))
    (var-set last-id id)
    (nft-mint? builder-badge id tx-sender)
  )
)
