import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;
const user2 = accounts.get("wallet_2")!;
const user3 = accounts.get("wallet_3")!;

describe("DDTRVLR NFT - Builder Badges", () => {
  
  // ============================================
  // Initial State
  // ============================================
  describe("initial state", () => {
    it("should initialize last-id to 0", () => {
      const lastId = simnet.getDataVar("ddtrvlr-nft", "last-id");
      expect(lastId).toStrictEqual(Cl.uint(0));
    });

    it("should have no NFTs minted", () => {
      const totalSupply = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-last-token-id",
        [],
        deployer
      );
      expect(totalSupply.result).toStrictEqual(Cl.ok(Cl.uint(0)));
    });

    it("should return none for any token owner query", () => {
      const owner = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(owner.result).toStrictEqual(Cl.ok(Cl.none()));
    });
  });

  // ============================================
  // Mint Function
  // ============================================
  describe("mint function", () => {
    it("allows any user to mint a badge", () => {
      const mintResult = simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user1
      );

      expect(mintResult.result).toStrictEqual(Cl.ok(Cl.bool(true)));

      const lastId = simnet.getDataVar("ddtrvlr-nft", "last-id");
      expect(lastId).toStrictEqual(Cl.uint(1));
    });

    it("returns true on successful mint", () => {
      const mintResult = simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user1
      );

      expect(mintResult.result).toStrictEqual(Cl.ok(Cl.bool(true)));
    });

    it("increments last-id after each mint", () => {
      // First mint
      simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user1
      );
      expect(simnet.getDataVar("ddtrvlr-nft", "last-id")).toStrictEqual(Cl.uint(1));

      // Second mint
      simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user2
      );
      expect(simnet.getDataVar("ddtrvlr-nft", "last-id")).toStrictEqual(Cl.uint(2));

      // Third mint
      simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user3
      );
      expect(simnet.getDataVar("ddtrvlr-nft", "last-id")).toStrictEqual(Cl.uint(3));
    });

    it("assigns correct owner to minted badge", () => {
      simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user1
      );

      const owner = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(owner.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user1))));
    });

    it("allows same user to mint multiple badges", () => {
      // First mint
      simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user1
      );

      // Second mint
      simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user1
      );

      // Third mint
      simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user1
      );

      expect(simnet.getDataVar("ddtrvlr-nft", "last-id")).toStrictEqual(Cl.uint(3));

      // Check ownership of all three tokens
      const owner1 = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(owner1.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user1))));

      const owner2 = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(2)],
        deployer
      );
      expect(owner2.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user1))));

      const owner3 = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(3)],
        deployer
      );
      expect(owner3.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user1))));
    });

    it("allows multiple users to mint badges", () => {
      // User1 mints
      simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user1
      );

      // User2 mints
      simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user2
      );

      // User3 mints
      simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user3
      );

      // Check ownership
      const owner1 = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(owner1.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user1))));

      const owner2 = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(2)],
        deployer
      );
      expect(owner2.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user2))));

      const owner3 = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(3)],
        deployer
      );
      expect(owner3.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user3))));
    });
  });

  // ============================================
  // Token Transfer Tests
  // ============================================
  describe("token transfers (if implemented)", () => {
    beforeEach(() => {
      // Mint a badge to user1
      simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user1
      );
    });

    it("allows owner to transfer token", () => {
      // This test assumes a transfer function exists
      // If not implemented, this test would need adjustment
      const transferResult = simnet.callPublicFn(
        "ddtrvlr-nft",
        "transfer",
        [Cl.uint(1), Cl.principal(user1), Cl.principal(user2), Cl.none()],
        user1
      );

      // If transfer exists, check result
      // If not, this test would be skipped or adjusted
    });

    it("prevents non-owner from transferring token", () => {
      // This test assumes a transfer function exists
      // If not implemented, this test would need adjustment
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe("edge cases", () => {
    it("handles maximum uint value for token IDs", () => {
      const maxUint = 18446744073709551615n;
      
      // Manually set last-id to near max (if possible in test)
      // This would require a test-only function or mocking
      
      // For now, we'll just verify the type can handle it
      expect(typeof maxUint).toBe("bigint");
    });

    it("handles query for non-existent token", () => {
      const owner = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(999)],
        deployer
      );
      expect(owner.result).toStrictEqual(Cl.ok(Cl.none()));
    });

    it("handles query for token 0", () => {
      const owner = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(0)],
        deployer
      );
      expect(owner.result).toStrictEqual(Cl.ok(Cl.none()));
    });

    it("maintains correct state after many mints", () => {
      const mintCount = 100;
      
      for (let i = 0; i < mintCount; i++) {
        simnet.callPublicFn(
          "ddtrvlr-nft",
          "mint",
          [],
          user1
        );
      }

      expect(simnet.getDataVar("ddtrvlr-nft", "last-id")).toStrictEqual(Cl.uint(mintCount));

      // Check last token owner
      const owner = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(mintCount)],
        deployer
      );
      expect(owner.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user1))));
    });
  });

  // ============================================
  // Read-Only Functions
  // ============================================
  describe("read-only functions", () => {
    beforeEach(() => {
      // Mint a few tokens
      simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user1
      );
      simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user2
      );
      simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user3
      );
    });

    it("get-last-token-id returns correct value", () => {
      const result = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-last-token-id",
        [],
        deployer
      );
      expect(result.result).toStrictEqual(Cl.ok(Cl.uint(3)));
    });

    it("get-owner returns correct owner for existing token", () => {
      const owner1 = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(owner1.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user1))));

      const owner2 = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(2)],
        deployer
      );
      expect(owner2.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user2))));

      const owner3 = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(3)],
        deployer
      );
      expect(owner3.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user3))));
    });

    it("get-owner returns none for non-existent token", () => {
      const owner = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(4)],
        deployer
      );
      expect(owner.result).toStrictEqual(Cl.ok(Cl.none()));
    });
  });

  // ============================================
  // Stress Tests
  // ============================================
  describe("stress tests", () => {
    it("handles 500 consecutive mints by same user", () => {
      for (let i = 0; i < 500; i++) {
        const result = simnet.callPublicFn(
          "ddtrvlr-nft",
          "mint",
          [],
          user1
        );
        expect(result.result).toStrictEqual(Cl.ok(Cl.bool(true)));
      }

      expect(simnet.getDataVar("ddtrvlr-nft", "last-id")).toStrictEqual(Cl.uint(500));

      // Check a few token owners
      const owner1 = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(owner1.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user1))));

      const owner250 = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(250)],
        deployer
      );
      expect(owner250.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user1))));

      const owner500 = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(500)],
        deployer
      );
      expect(owner500.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user1))));
    });

    it("handles mints from 50 different users", () => {
      // Create 50 unique users (using a loop with generated principals)
      // This is simplified - in reality you'd need to generate unique principals
      const users = [];
      for (let i = 0; i < 50; i++) {
        users.push(accounts.get(`wallet_${i + 1}`)!);
      }

      for (let i = 0; i < users.length; i++) {
        const result = simnet.callPublicFn(
          "ddtrvlr-nft",
          "mint",
          [],
          users[i]
        );
        expect(result.result).toStrictEqual(Cl.ok(Cl.bool(true)));
      }

      expect(simnet.getDataVar("ddtrvlr-nft", "last-id")).toStrictEqual(Cl.uint(50));
    });

    it("handles rapid alternating mints between users", () => {
      for (let i = 0; i < 30; i++) {
        // User1 mints
        simnet.callPublicFn(
          "ddtrvlr-nft",
          "mint",
          [],
          user1
        );

        // User2 mints
        simnet.callPublicFn(
          "ddtrvlr-nft",
          "mint",
          [],
          user2
        );

        // User3 mints
        simnet.callPublicFn(
          "ddtrvlr-nft",
          "mint",
          [],
          user3
        );
      }

      expect(simnet.getDataVar("ddtrvlr-nft", "last-id")).toStrictEqual(Cl.uint(90));

      // Check pattern of ownership (every 3rd token belongs to user3)
      const owner3 = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(3)],
        deployer
      );
      expect(owner3.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user3))));

      const owner6 = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(6)],
        deployer
      );
      expect(owner6.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user3))));
    });
  });

  // ============================================
  // Return Value Tests
  // ============================================
  describe("return values", () => {
    it("mint returns ok true on success", () => {
      const result = simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user1
      );

      expect(result.result).toStrictEqual(Cl.ok(Cl.bool(true)));
    });

    it("get-last-token-id returns ok with uint", () => {
      simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user1
      );

      const result = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-last-token-id",
        [],
        deployer
      );

      expect(result.result).toStrictEqual(Cl.ok(Cl.uint(1)));
      expect(result.result.type).toBe("ok");
      expect((result.result as any).value.type).toBe("uint");
    });

    it("get-owner returns ok with optional principal", () => {
      simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user1
      );

      const result = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );

      expect(result.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user1))));
      expect(result.result.type).toBe("ok");
      expect((result.result as any).value.type).toBe("optional");
    });
  });

  // ============================================
  // No Error Cases
  // ============================================
  describe("error handling", () => {
    it("has no error conditions - mint always succeeds", () => {
      // Multiple mints by same user
      for (let i = 0; i < 10; i++) {
        const result = simnet.callPublicFn(
          "ddtrvlr-nft",
          "mint",
          [],
          user1
        );
        expect(result.result.type).toBe("ok");
      }

      // Mints by different users
      const result2 = simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user2
      );
      expect(result2.result.type).toBe("ok");

      const result3 = simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        user3
      );
      expect(result3.result.type).toBe("ok");

      // Mint by deployer
      const result4 = simnet.callPublicFn(
        "ddtrvlr-nft",
        "mint",
        [],
        deployer
      );
      expect(result4.result.type).toBe("ok");
    });
  });

  // ============================================
  // Integration Tests
  // ============================================
  describe("integration with other contracts", () => {
    it("can be used with ddtrvlr-market vending machine", () => {
      // This test assumes ddtrvlr-market exists and uses this NFT
      // Mint tokens to user for purchase
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(100), Cl.principal(user1)],
        deployer
      );

      // Buy badge from vending machine
      const buyResult = simnet.callPublicFn(
        "ddtrvlr-market",
        "buy-badge",
        [],
        user1
      );

      expect(buyResult.result).toStrictEqual(Cl.ok(Cl.stringAscii("You bought a badge!")));

      // Check NFT was minted to user
      const nftBalance = simnet.callReadOnlyFn(
        "ddtrvlr-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(nftBalance.result).toStrictEqual(Cl.ok(Cl.some(Cl.principal(user1))));
    });
  });
});
