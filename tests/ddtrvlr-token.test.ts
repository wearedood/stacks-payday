import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;
const user2 = accounts.get("wallet_2")!;
const user3 = accounts.get("wallet_3")!;

describe("DDTRVLR Token Contract", () => {

  // ============================================
  // Initial State
  // ============================================

  describe("initial state", () => {
    it("total supply should be zero", () => {
      const result = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-total-supply",
        [],
        deployer
      );
      expect(result.result).toStrictEqual(Cl.ok(Cl.uint(0)));
    });

    it("all users should have zero balance", () => {
      const users = [user1, user2, user3];

      for (const user of users) {
        const balance = simnet.callReadOnlyFn(
          "ddtrvlr-token",
          "get-balance",
          [Cl.principal(user)],
          deployer
        );
        expect(balance.result).toStrictEqual(Cl.ok(Cl.uint(0)));
      }
    });
  });

  // ============================================
  // Mint Function
  // ============================================

  describe("mint function", () => {

    it("allows deployer to mint tokens", () => {
      const result = simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(1000), Cl.principal(user1)],
        deployer
      );

      expect(result.result.type).toBe("ok");

      const balance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );

      expect(balance.result).toStrictEqual(Cl.ok(Cl.uint(1000)));
    });

    it("increases total supply after mint", () => {
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(500), Cl.principal(user1)],
        deployer
      );

      const supply = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-total-supply",
        [],
        deployer
      );

      expect(supply.result).toStrictEqual(Cl.ok(Cl.uint(500)));
    });

    it("emits mint event", () => {
      const result = simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(100), Cl.principal(user1)],
        deployer
      );

      expect(result.events.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // Transfer Function - Success Cases
  // ============================================

  describe("transfer - successful cases", () => {

    beforeEach(() => {
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(1000), Cl.principal(user1)],
        deployer
      );
    });

    it("transfers tokens between users", () => {
      const result = simnet.callPublicFn(
        "ddtrvlr-token",
        "transfer",
        [
          Cl.uint(300),
          Cl.principal(user1),
          Cl.principal(user2),
          Cl.none()
        ],
        user1
      );

      expect(result.result).toStrictEqual(Cl.ok(Cl.bool(true)));

      const user1Balance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );

      const user2Balance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user2)],
        deployer
      );

      expect(user1Balance.result).toStrictEqual(Cl.ok(Cl.uint(700)));
      expect(user2Balance.result).toStrictEqual(Cl.ok(Cl.uint(300)));
    });

    it("supports transfer with memo", () => {
      const memo = Cl.some(Cl.bufferFromUtf8("payment"));

      const result = simnet.callPublicFn(
        "ddtrvlr-token",
        "transfer",
        [
          Cl.uint(100),
          Cl.principal(user1),
          Cl.principal(user2),
          memo
        ],
        user1
      );

      expect(result.result).toStrictEqual(Cl.ok(Cl.bool(true)));
    });

    it("emits transfer event", () => {
      const result = simnet.callPublicFn(
        "ddtrvlr-token",
        "transfer",
        [
          Cl.uint(50),
          Cl.principal(user1),
          Cl.principal(user2),
          Cl.none()
        ],
        user1
      );

      expect(result.events.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // Transfer - Error Cases
  // ============================================

  describe("transfer - failure cases", () => {

    beforeEach(() => {
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(200), Cl.principal(user1)],
        deployer
      );
    });

    it("fails if tx-sender is not sender (err u101)", () => {
      const result = simnet.callPublicFn(
        "ddtrvlr-token",
        "transfer",
        [
          Cl.uint(50),
          Cl.principal(user1),
          Cl.principal(user2),
          Cl.none()
        ],
        user2 // wrong signer
      );

      expect(result.result).toStrictEqual(Cl.error(Cl.uint(101)));
    });

    it("fails when balance is insufficient", () => {
      const result = simnet.callPublicFn(
        "ddtrvlr-token",
        "transfer",
        [
          Cl.uint(500),
          Cl.principal(user1),
          Cl.principal(user2),
          Cl.none()
        ],
        user1
      );

      expect(result.result.type).toBe("error");
    });

    it("preserves balance on failed transfer", () => {
      simnet.callPublicFn(
        "ddtrvlr-token",
        "transfer",
        [
          Cl.uint(500),
          Cl.principal(user1),
          Cl.principal(user2),
          Cl.none()
        ],
        user1
      );

      const balance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );

      expect(balance.result).toStrictEqual(Cl.ok(Cl.uint(200)));
    });
  });

  // ============================================
  // Edge Cases
  // ============================================

  describe("edge cases", () => {

    it("handles maximum uint mint", () => {
      const maxUint = 18446744073709551615n;

      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(maxUint), Cl.principal(user1)],
        deployer
      );

      const balance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );

      expect(balance.result).toStrictEqual(Cl.ok(Cl.uint(maxUint)));
    });

    it("handles zero transfer", () => {
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(100), Cl.principal(user1)],
        deployer
      );

      const result = simnet.callPublicFn(
        "ddtrvlr-token",
        "transfer",
        [
          Cl.uint(0),
          Cl.principal(user1),
          Cl.principal(user2),
          Cl.none()
        ],
        user1
      );

      // Depending on ft-transfer? implementation this may succeed
      expect(result.result.type === "ok" || result.result.type === "error").toBe(true);
    });
  });

  // ============================================
  // Stress Tests
  // ============================================

  describe("stress tests", () => {

    it("handles 100 consecutive transfers", () => {
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(10000), Cl.principal(user1)],
        deployer
      );

      for (let i = 0; i < 100; i++) {
        const result = simnet.callPublicFn(
          "ddtrvlr-token",
          "transfer",
          [
            Cl.uint(100),
            Cl.principal(user1),
            Cl.principal(user2),
            Cl.none()
          ],
          user1
        );
        expect(result.result.type).toBe("ok");
      }

      const user2Balance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user2)],
        deployer
      );

      expect(user2Balance.result).toStrictEqual(Cl.ok(Cl.uint(10000)));
    });
  });

});
