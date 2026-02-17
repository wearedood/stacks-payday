import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;
const user2 = accounts.get("wallet_2")!;
const user3 = accounts.get("wallet_3")!;

describe("DDTRVLR Voting Contract", () => {

  // ============================================
  // Initial State
  // ============================================

  describe("initial state", () => {
    it("should start with proposal count = 0", () => {
      const result = simnet.callReadOnlyFn(
        "ddtrvlr-voting",
        "proposal-count",
        [],
        deployer
      );

      // If proposal-count is not exposed as read-only,
      // you may need to add a getter in contract.
      expect(result.result).toStrictEqual(Cl.ok(Cl.uint(0)));
    });
  });

  // ============================================
  // Create Proposal
  // ============================================

  describe("create-proposal", () => {

    it("creates a proposal and returns id", () => {
      const result = simnet.callPublicFn(
        "ddtrvlr-voting",
        "create-proposal",
        [Cl.stringAscii("Upgrade protocol")],
        user1
      );

      expect(result.result).toStrictEqual(Cl.ok(Cl.uint(1)));
    });

    it("increments proposal count", () => {
      simnet.callPublicFn(
        "ddtrvlr-voting",
        "create-proposal",
        [Cl.stringAscii("Proposal A")],
        user1
      );

      const result = simnet.callPublicFn(
        "ddtrvlr-voting",
        "create-proposal",
        [Cl.stringAscii("Proposal B")],
        user1
      );

      expect(result.result).toStrictEqual(Cl.ok(Cl.uint(2)));
    });

    it("stores proposal with zero votes", () => {
      simnet.callPublicFn(
        "ddtrvlr-voting",
        "create-proposal",
        [Cl.stringAscii("Test Proposal")],
        user1
      );

      const proposal = simnet.callReadOnlyFn(
        "ddtrvlr-voting",
        "proposals",
        [Cl.uint(1)],
        deployer
      );

      expect(proposal.result.value.data.votes).toStrictEqual(Cl.uint(0));
    });

  });

  // ============================================
  // Voting
  // ============================================

  describe("vote", () => {

    beforeEach(() => {
      simnet.callPublicFn(
        "ddtrvlr-voting",
        "create-proposal",
        [Cl.stringAscii("New Feature")],
        user1
      );
    });

    it("allows voting on valid proposal", () => {
      const result = simnet.callPublicFn(
        "ddtrvlr-voting",
        "vote",
        [Cl.uint(1)],
        user2
      );

      expect(result.result.type).toBe("ok");
    });

    it("increments vote count", () => {
      simnet.callPublicFn(
        "ddtrvlr-voting",
        "vote",
        [Cl.uint(1)],
        user1
      );

      const proposal = simnet.callReadOnlyFn(
        "ddtrvlr-voting",
        "proposals",
        [Cl.uint(1)],
        deployer
      );

      expect(proposal.result.value.data.votes).toStrictEqual(Cl.uint(1));
    });

    it("accumulates multiple votes", () => {
      simnet.callPublicFn("ddtrvlr-voting", "vote", [Cl.uint(1)], user1);
      simnet.callPublicFn("ddtrvlr-voting", "vote", [Cl.uint(1)], user2);
      simnet.callPublicFn("ddtrvlr-voting", "vote", [Cl.uint(1)], user3);

      const proposal = simnet.callReadOnlyFn(
        "ddtrvlr-voting",
        "proposals",
        [Cl.uint(1)],
        deployer
      );

      expect(proposal.result.value.data.votes).toStrictEqual(Cl.uint(3));
    });

    it("fails when proposal does not exist (err u404)", () => {
      const result = simnet.callPublicFn(
        "ddtrvlr-voting",
        "vote",
        [Cl.uint(999)],
        user1
      );

      expect(result.result).toStrictEqual(Cl.error(Cl.uint(404)));
    });

  });

  // ============================================
  // Multiple Proposals
  // ============================================

  describe("multiple proposals", () => {

    it("handles voting on different proposals independently", () => {
      simnet.callPublicFn(
        "ddtrvlr-voting",
        "create-proposal",
        [Cl.stringAscii("Proposal 1")],
        user1
      );

      simnet.callPublicFn(
        "ddtrvlr-voting",
        "create-proposal",
        [Cl.stringAscii("Proposal 2")],
        user2
      );

      simnet.callPublicFn("ddtrvlr-voting", "vote", [Cl.uint(1)], user1);
      simnet.callPublicFn("ddtrvlr-voting", "vote", [Cl.uint(2)], user2);
      simnet.callPublicFn("ddtrvlr-voting", "vote", [Cl.uint(2)], user3);

      const proposal1 = simnet.callReadOnlyFn(
        "ddtrvlr-voting",
        "proposals",
        [Cl.uint(1)],
        deployer
      );

      const proposal2 = simnet.callReadOnlyFn(
        "ddtrvlr-voting",
        "proposals",
        [Cl.uint(2)],
        deployer
      );

      expect(proposal1.result.value.data.votes).toStrictEqual(Cl.uint(1));
      expect(proposal2.result.value.data.votes).toStrictEqual(Cl.uint(2));
    });

  });

  // ============================================
  // Stress Tests
  // ============================================

  describe("stress tests", () => {

    it("handles 100 votes on a proposal", () => {
      simnet.callPublicFn(
        "ddtrvlr-voting",
        "create-proposal",
        [Cl.stringAscii("High Activity Proposal")],
        user1
      );

      for (let i = 0; i < 100; i++) {
        simnet.callPublicFn(
          "ddtrvlr-voting",
          "vote",
          [Cl.uint(1)],
          user1
        );
      }

      const proposal = simnet.callReadOnlyFn(
        "ddtrvlr-voting",
        "proposals",
        [Cl.uint(1)],
        deployer
      );

      expect(proposal.result.value.data.votes).toStrictEqual(Cl.uint(100));
    });

  });

});
