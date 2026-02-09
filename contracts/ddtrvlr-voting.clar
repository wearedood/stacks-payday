;; ddtrvlr-voting: Governance Contract
(define-map proposals uint { title: (string-ascii 50), votes: uint })
(define-data-var proposal-count uint u0)

;; Create a new proposal
(define-public (create-proposal (title (string-ascii 50)))
  (begin
    (var-set proposal-count (+ (var-get proposal-count) u1))
    (map-set proposals (var-get proposal-count) { title: title, votes: u0 })
    (ok (var-get proposal-count))
  )
)

;; Vote on a proposal (Simplified)
(define-public (vote (id uint))
  (let ((proposal (unwrap! (map-get? proposals id) (err u404))))
    (ok (map-set proposals id (merge proposal { votes: (+ (get votes proposal) u1) })))
  )
)
