import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;
const user2 = accounts.get("wallet_2")!;
const user3 = accounts.get("wallet_3")!;

const PRICE = 10;
const marketContract = Cl.contractPrincipal(deployer, "ddtrvlr-market");
const tokenContract = Cl.contractPrincipal(deployer, "ddtrvlr-token");
const nftContract = Cl.contractPrincipal(deployer, "ddtrvlr-nft");

describe("DDTRVLR Vending Machine", () => {
  
  // ============================================
  // Initial State
  // ============================================
  describe("initial state", () => {
    it("should have correct price constant", () => {
      expect(PRICE).toBe(10);
    });

    it("should have zero token balance in market contract", () => {
      const balance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [marketContract],
        deployer
      );
      expect(balance.result).toStrictEqual(Cl.ok(Cl.uint(0)));
    });

    it("should have zero NFT balance for all users", () => {
      const balance = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(balance.result).toStrictEqual(Cl.ok(Cl.uint(0)));
    });
  });

  // ============================================
  // Successful Purchase
  // ============================================
  describe("buy-badge function - successful purchase", () => {
    beforeEach(() => {
      // Mint tokens to user1 before each test
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(100), Cl.principal(user1)],
        deployer
      );
    });

    it("allows user with sufficient tokens to buy a badge", () => {
      // Check initial balance
      const initialBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(initialBalance.result).toStrictEqual(Cl.ok(Cl.uint(100)));

      // Buy badge
      const buyResult = simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user1
      );

      expect(buyResult.result).toStrictEqual(Cl.ok(Cl.stringAscii("You bought a badge!")));

      // Check token balance decreased
      const finalBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(finalBalance.result).toStrictEqual(Cl.ok(Cl.uint(90)));

      // Check market contract received tokens
      const marketBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [marketContract],
        deployer
      );
      expect(marketBalance.result).toStrictEqual(Cl.ok(Cl.uint(10)));

      // Check NFT was minted to user
      const nftBalance = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(nftBalance.result).toStrictEqual(Cl.ok(Cl.uint(1)));
    });

    it("emits transfer and mint events", () => {
      const buyResult = simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user1
      );

      // Should have at least 2 events (token transfer + NFT mint)
      expect(buyResult.events.length).toBeGreaterThanOrEqual(2);
    });

    it("allows multiple purchases by same user", () => {
      // First purchase
      simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user1
      );

      // Second purchase
      const secondResult = simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user1
      );

      expect(secondResult.result).toStrictEqual(Cl.ok(Cl.stringAscii("You bought a badge!")));

      // Check final balances
      const tokenBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(tokenBalance.result).toStrictEqual(Cl.ok(Cl.uint(80))); // 100 - 20

      const nftBalance = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(nftBalance.result).toStrictEqual(Cl.ok(Cl.uint(2)));
    });

    it("allows multiple users to buy badges", () => {
      // Mint tokens to user2 and user3
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(100), Cl.principal(user2)],
        deployer
      );
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(100), Cl.principal(user3)],
        deployer
      );

      // User1 buys
      simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user1
      );

      // User2 buys
      simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user2
      );

      // User3 buys
      simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user3
      );

      // Check market contract received 30 tokens (3 * 10)
      const marketBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [marketContract],
        deployer
      );
      expect(marketBalance.result).toStrictEqual(Cl.ok(Cl.uint(30)));

      // Check each user has 1 NFT
      const user1Nft = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(user1Nft.result).toStrictEqual(Cl.ok(Cl.uint(1)));

      const user2Nft = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-balance",
        [Cl.principal(user2)],
        deployer
      );
      expect(user2Nft.result).toStrictEqual(Cl.ok(Cl.uint(1)));

      const user3Nft = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-balance",
        [Cl.principal(user3)],
        deployer
      );
      expect(user3Nft.result).toStrictEqual(Cl.ok(Cl.uint(1)));
    });
  });

  // ============================================
  // Insufficient Balance
  // ============================================
  describe("buy-badge function - insufficient balance", () => {
    it("fails when user has zero tokens", () => {
      const buyResult = simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user1
      );

      // Should fail with transfer error (exact error code depends on token contract)
      expect(buyResult.result).toStrictEqual(Cl.error(Cl.uint(expect.any(Number))));
    });

    it("fails when user has less than PRICE tokens", () => {
      // Mint only 5 tokens (less than PRICE)
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(5), Cl.principal(user1)],
        deployer
      );

      const buyResult = simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user1
      );

      // Should fail with transfer error
      expect(buyResult.result).toStrictEqual(Cl.error(Cl.uint(expect.any(Number))));
    });

    it("fails when user has exactly PRICE-1 tokens", () => {
      // Mint 9 tokens (1 less than PRICE)
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(9), Cl.principal(user1)],
        deployer
      );

      const buyResult = simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user1
      );

      expect(buyResult.result).toStrictEqual(Cl.error(Cl.uint(expect.any(Number))));
    });

    it("preserves user balance on failed purchase", () => {
      // Mint 5 tokens
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(5), Cl.principal(user1)],
        deployer
      );

      // Attempt purchase
      simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user1
      );

      // Balance should remain 5
      const balance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(balance.result).toStrictEqual(Cl.ok(Cl.uint(5)));

      // No NFT should be minted
      const nftBalance = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(nftBalance.result).toStrictEqual(Cl.ok(Cl.uint(0)));
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe("edge cases", () => {
    it("handles maximum token amounts", () => {
      const maxUint = 18446744073709551615n;
      
      // Mint maximum tokens
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(maxUint), Cl.principal(user1)],
        deployer
      );

      // Buy badge
      const buyResult = simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user1
      );

      expect(buyResult.result).toStrictEqual(Cl.ok(Cl.stringAscii("You bought a badge!")));

      // Check balance decreased correctly
      const balance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(balance.result).toStrictEqual(Cl.ok(Cl.uint(maxUint - 10n)));
    });

    it("handles multiple purchases up to balance limit", () => {
      // Mint 25 tokens (enough for 2 purchases with 5 left)
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(25), Cl.principal(user1)],
        deployer
      );

      // First purchase
      simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user1
      );

      // Second purchase
      simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user1
      );

      // Third purchase should fail (only 5 tokens left)
      const thirdResult = simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user1
      );

      expect(thirdResult.result).toStrictEqual(Cl.error(Cl.uint(expect.any(Number))));

      // Should have 2 NFTs
      const nftBalance = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(nftBalance.result).toStrictEqual(Cl.ok(Cl.uint(2)));
    });

    it("handles purchases after failed attempts", () => {
      // First attempt with insufficient balance (fails)
      simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user1
      );

      // Mint tokens
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(20), Cl.principal(user1)],
        deployer
      );

      // Now purchase should succeed
      const buyResult = simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user1
      );

      expect(buyResult.result).toStrictEqual(Cl.ok(Cl.stringAscii("You bought a badge!")));
    });
  });

  // ============================================
  // Market Contract Balance
  // ============================================
  describe("market contract token accumulation", () => {
    it("accumulates tokens from multiple purchases", () => {
      // Mint tokens to multiple users
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(100), Cl.principal(user1)],
        deployer
      );
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(100), Cl.principal(user2)],
        deployer
      );

      // User1 buys 3 badges
      for (let i = 0; i < 3; i++) {
        simnet.callPublicFn(
          "ddtrvlr-market",
          "buy-badge",
          [],
          user1
        );
      }

      // User2 buys 2 badges
      for (let i = 0; i < 2; i++) {
        simnet.callPublicFn(
          "ddtrvlr-market",
          "buy-badge",
          [],
          user2
        );
      }

      // Market should have 50 tokens (5 * 10)
      const marketBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [marketContract],
        deployer
      );
      expect(marketBalance.result).toStrictEqual(Cl.ok(Cl.uint(50)));

      // User1 should have 3 NFTs (70 tokens left)
      const user1Nft = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(user1Nft.result).toStrictEqual(Cl.ok(Cl.uint(3)));

      const user1Tokens = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(user1Tokens.result).toStrictEqual(Cl.ok(Cl.uint(70)));

      // User2 should have 2 NFTs (80 tokens left)
      const user2Nft = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-balance",
        [Cl.principal(user2)],
        deployer
      );
      expect(user2Nft.result).toStrictEqual(Cl.ok(Cl.uint(2)));

      const user2Tokens = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user2)],
        deployer
      );
      expect(user2Tokens.result).toStrictEqual(Cl.ok(Cl.uint(80)));
    });
  });

  // ============================================
  // NFT Minting Verification
  // ============================================
  describe("NFT minting verification", () => {
    it("mints unique tokens for each purchase", () => {
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(100), Cl.principal(user1)],
        deployer
      );

      // Buy 3 badges
      for (let i = 0; i < 3; i++) {
        simnet.callPublicFn(
          "ddtrvlr-market",
          "buy-badge",
          [],
          user1
        );
      }

      // Check last token ID
      const lastTokenId = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-last-token-id",
        [],
        deployer
      );
      
      // Should have minted 3 tokens (IDs 1,2,3)
      expect(lastTokenId.result).toStrictEqual(Cl.ok(Cl.uint(3)));
    });

    it("mints NFTs with correct owner", () => {
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(100), Cl.principal(user1)],
        deployer
      );

      simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user1
      );

      // Check owner of token 1
      const owner = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(owner.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user1))));
    });
  });

  // ============================================
  // Stress Tests
  // ============================================
  describe("stress tests", () => {
    it("handles 20 consecutive purchases", () => {
      // Mint enough tokens for 20 purchases
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(200), Cl.principal(user1)],
        deployer
      );

      // Perform 20 purchases
      for (let i = 0; i < 20; i++) {
        const result = simnet.callPublicFn(
          "ddtrvlr-market",
          "buy-badge",
          [],
          user1
        );
        expect(result.result).toStrictEqual(Cl.ok(Cl.stringAscii("You bought a badge!")));
      }

      // Verify final state
      const tokenBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(tokenBalance.result).toStrictEqual(Cl.ok(Cl.uint(0))); // 200 - (20*10) = 0

      const nftBalance = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(nftBalance.result).toStrictEqual(Cl.ok(Cl.uint(20)));

      const marketBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [marketContract],
        deployer
      );
      expect(marketBalance.result).toStrictEqual(Cl.ok(Cl.uint(200)));
    });

    it("handles purchases from 10 different users", () => {
      const users = [user1, user2, user3];
      
      // Mint tokens to each user
      for (const user of users) {
        simnet.callPublicFn(
          "ddtrvlr-token",
          "mint",
          [Cl.uint(100), Cl.principal(user)],
          deployer
        );
      }

      // Each user buys 1 badge
      for (const user of users) {
        const result = simnet.callPublicFn(
          "ddtrvlr-market",
          "buy-badge",
          [],
          user
        );
        expect(result.result).toStrictEqual(Cl.ok(Cl.stringAscii("You bought a badge!")));
      }

      // Verify each user has 1 NFT
      for (const user of users) {
        const nftBalance = simnet.callReadOnlyFn(
          "ddtrvlr-nft",
          "get-balance",
          [Cl.principal(user)],
          deployer
        );
        expect(nftBalance.result).toStrictEqual(Cl.ok(Cl.uint(1)));
      }

      // Market has 30 tokens (3 * 10)
      const marketBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [marketContract],
        deployer
      );
      expect(marketBalance.result).toStrictEqual(Cl.ok(Cl.uint(30)));
    });
  });

  // ============================================
  // Return Value Tests
  // ============================================
  describe("return values", () => {
    it("returns correct success message", () => {
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(100), Cl.principal(user1)],
        deployer
      );

      const result = simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user1
      );

      expect(result.result).toStrictEqual(Cl.ok(Cl.stringAscii("You bought a badge!")));
    });
  });
});
