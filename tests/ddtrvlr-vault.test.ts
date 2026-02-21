import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;
const user2 = accounts.get("wallet_2")!;
const user3 = accounts.get("wallet_3")!;

describe("DDTRVLR Vault Contract", () => {

  // ============================================
  // Initial State
  // ============================================

  describe("initial state", () => {
    it("should start with zero total stashed", () => {
      const result = simnet.callReadOnlyFn(
        "ddtrvlr-vault",
        "get-vault-total",
        [],
        deployer
      );

      expect(result.result).toStrictEqual(Cl.ok(Cl.uint(0)));
    });
  });

  // ============================================
  // Stash Function - Success Cases
  // ============================================

  describe("stash function", () => {

    it("allows a user to stash amount", () => {
      const result = simnet.callPublicFn(
        "ddtrvlr-vault",
        "stash",
        [Cl.uint(100)],
        user1
      );

      expect(result.result).toStrictEqual(Cl.ok(Cl.uint(100)));

      const total = simnet.callReadOnlyFn(
        "ddtrvlr-vault",
        "get-vault-total",
        [],
        deployer
      );

      expect(total.result).toStrictEqual(Cl.ok(Cl.uint(100)));
    });

    it("accumulates multiple stashes from same user", () => {
      simnet.callPublicFn(
        "ddtrvlr-vault",
        "stash",
        [Cl.uint(50)],
        user1
      );

      const result = simnet.callPublicFn(
        "ddtrvlr-vault",
        "stash",
        [Cl.uint(150)],
        user1
      );

      expect(result.result).toStrictEqual(Cl.ok(Cl.uint(200)));

      const total = simnet.callReadOnlyFn(
        "ddtrvlr-vault",
        "get-vault-total",
        [],
        deployer
      );

      expect(total.result).toStrictEqual(Cl.ok(Cl.uint(200)));
    });

    it("accumulates stashes from multiple users", () => {
      simnet.callPublicFn(
        "ddtrvlr-vault",
        "stash",
        [Cl.uint(100)],
        user1
      );

      simnet.callPublicFn(
        "ddtrvlr-vault",
        "stash",
        [Cl.uint(300)],
        user2
      );

      simnet.callPublicFn(
        "ddtrvlr-vault",
        "stash",
        [Cl.uint(600)],
        user3
      );

      const total = simnet.callReadOnlyFn(
        "ddtrvlr-vault",
        "get-vault-total",
        [],
        deployer
      );

      expect(total.result).toStrictEqual(Cl.ok(Cl.uint(1000)));
    });

    it("returns updated total after each stash", () => {
      let result = simnet.callPublicFn(
        "ddtrvlr-vault",
        "stash",
        [Cl.uint(10)],
        user1
      );
      expect(result.result).toStrictEqual(Cl.ok(Cl.uint(10)));

      result = simnet.callPublicFn(
        "ddtrvlr-vault",
        "stash",
        [Cl.uint(20)],
        user2
      );
      expect(result.result).toStrictEqual(Cl.ok(Cl.uint(30)));
    });

  });

  // ============================================
  // Edge Cases
  // ============================================

  describe("edge cases", () => {

    it("handles zero stash", () => {
      const result = simnet.callPublicFn(
        "ddtrvlr-vault",
        "stash",
        [Cl.uint(0)],
        user1
      );

      expect(result.result).toStrictEqual(Cl.ok(Cl.uint(0)));

      const total = simnet.callReadOnlyFn(
        "ddtrvlr-vault",
        "get-vault-total",
        [],
        deployer
      );

      expect(total.result).toStrictEqual(Cl.ok(Cl.uint(0)));
    });

    it("handles large uint values", () => {
      const large = 18446744073709551615n;

      const result = simnet.callPublicFn(
        "ddtrvlr-vault",
        "stash",
        [Cl.uint(large)],
        user1
      );

      expect(result.result).toStrictEqual(Cl.ok(Cl.uint(large)));

      const total = simnet.callReadOnlyFn(
        "ddtrvlr-vault",
        "get-vault-total",
        [],
        deployer
      );

      expect(total.result).toStrictEqual(Cl.ok(Cl.uint(large)));
    });

  });

  // ============================================
  // Stress Tests
  // ============================================

  describe("stress tests", () => {

    it("handles 100 consecutive stash calls", () => {
      for (let i = 0; i < 100; i++) {
        const result = simnet.callPublicFn(
          "ddtrvlr-vault",
          "stash",
          [Cl.uint(10)],
          user1
        );

        expect(result.result.type).toBe("ok");
      }

      const total = simnet.callReadOnlyFn(
        "ddtrvlr-vault",
        "get-vault-total",
        [],
        deployer
      );

      expect(total.result).toStrictEqual(Cl.ok(Cl.uint(1000)));
    });

    it("handles alternating users stashing", () => {
      for (let i = 0; i < 10; i++) {
        simnet.callPublicFn(
          "ddtrvlr-vault",
          "stash",
          [Cl.uint(5)],
          user1
        );

        simnet.callPublicFn(
          "ddtrvlr-vault",
          "stash",
          [Cl.uint(15)],
          user2
        );
      }

      const total = simnet.callReadOnlyFn(
        "ddtrvlr-vault",
        "get-vault-total",
        [],
        deployer
      );

      expect(total.result).toStrictEqual(Cl.ok(Cl.uint(200)));
    });

  });

});
