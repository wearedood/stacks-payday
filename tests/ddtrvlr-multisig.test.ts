import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;
const user2 = accounts.get("wallet_2")!;
const user3 = accounts.get("wallet_3")!;

describe("DDTRVLR 2-of-2 Multisig Wallet", () => {
  
  // ============================================
  // Initial State
  // ============================================
  describe("initial state", () => {
    it("should initialize balance to 0", () => {
      const balance = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balance).toStrictEqual(Cl.uint(0));
    });
  });

  // ============================================
  // Deposit Function
  // ============================================
  describe("deposit function", () => {
    it("allows any user to deposit funds", () => {
      const depositResult = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(1000)],
        user1
      );

      expect(depositResult.result).toStrictEqual(Cl.ok(Cl.uint(1000)));

      const balance = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balance).toStrictEqual(Cl.uint(1000));
    });

    it("returns the new balance after deposit", () => {
      const depositResult = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(500)],
        user1
      );

      expect(depositResult.result).toStrictEqual(Cl.ok(Cl.uint(500)));
    });

    it("accumulates multiple deposits from same user", () => {
      // First deposit
      simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(300)],
        user1
      );

      // Second deposit
      simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(200)],
        user1
      );

      const balance = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balance).toStrictEqual(Cl.uint(500));
    });

    it("accumulates deposits from multiple users", () => {
      // User1 deposits
      simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(400)],
        user1
      );

      // User2 deposits
      simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(600)],
        user2
      );

      // User3 deposits
      simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(1000)],
        user3
      );

      const balance = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balance).toStrictEqual(Cl.uint(2000));
    });

    it("allows deposit of zero amount", () => {
      const depositResult = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(0)],
        user1
      );

      expect(depositResult.result).toStrictEqual(Cl.ok(Cl.uint(0)));

      const balance = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balance).toStrictEqual(Cl.uint(0));
    });

    it("handles maximum uint value", () => {
      const maxUint = 18446744073709551615n;
      
      const depositResult = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(maxUint)],
        user1
      );

      expect(depositResult.result).toStrictEqual(Cl.ok(Cl.uint(maxUint)));

      const balance = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balance).toStrictEqual(Cl.uint(maxUint));
    });

    it("handles consecutive deposits without errors", () => {
      for (let i = 0; i < 10; i++) {
        const result = simnet.callPublicFn(
          "ddtrvlr-multisig",
          "deposit",
          [Cl.uint(100)],
          user1
        );
        expect(result.result).toStrictEqual(Cl.ok(Cl.uint((i + 1) * 100)));
      }

      const balance = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balance).toStrictEqual(Cl.uint(1000));
    });
  });

  // ============================================
  // Lock Vault Function
  // ============================================
  describe("lock-vault function", () => {
    it("allows any user to lock the vault", () => {
      const lockResult = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "lock-vault",
        [],
        user1
      );

      expect(lockResult.result).toStrictEqual(Cl.ok(Cl.stringAscii("Vault Locked for Security")));
    });

    it("returns correct lock message", () => {
      const lockResult = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "lock-vault",
        [],
        user2
      );

      expect(lockResult.result).toStrictEqual(Cl.ok(Cl.stringAscii("Vault Locked for Security")));
    });

    it("can be called by any user multiple times", () => {
      // First lock
      const lock1 = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "lock-vault",
        [],
        user1
      );
      expect(lock1.result).toStrictEqual(Cl.ok(Cl.stringAscii("Vault Locked for Security")));

      // Second lock by different user
      const lock2 = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "lock-vault",
        [],
        user2
      );
      expect(lock2.result).toStrictEqual(Cl.ok(Cl.stringAscii("Vault Locked for Security")));

      // Third lock by same user
      const lock3 = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "lock-vault",
        [],
        user1
      );
      expect(lock3.result).toStrictEqual(Cl.ok(Cl.stringAscii("Vault Locked for Security")));
    });

    it("does not affect balance when locking", () => {
      // Deposit first
      simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(5000)],
        user1
      );

      const balanceBefore = simnet.getDataVar("ddtrvlr-multisig", "balance");

      // Lock vault
      simnet.callPublicFn(
        "ddtrvlr-multisig",
        "lock-vault",
        [],
        user1
      );

      const balanceAfter = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balanceAfter).toStrictEqual(balanceBefore);
    });

    it("can be called before any deposits", () => {
      const balanceBefore = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balanceBefore).toStrictEqual(Cl.uint(0));

      const lockResult = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "lock-vault",
        [],
        user1
      );

      expect(lockResult.result).toStrictEqual(Cl.ok(Cl.stringAscii("Vault Locked for Security")));

      const balanceAfter = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balanceAfter).toStrictEqual(Cl.uint(0));
    });

    it("can be called after deposits", () => {
      // Deposit
      simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(10000)],
        user1
      );

      // Lock
      const lockResult = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "lock-vault",
        [],
        user2
      );

      expect(lockResult.result).toStrictEqual(Cl.ok(Cl.stringAscii("Vault Locked for Security")));

      const balance = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balance).toStrictEqual(Cl.uint(10000));
    });
  });

  // ============================================
  // Combined Operations
  // ============================================
  describe("combined operations", () => {
    it("allows deposits after locking", () => {
      // Lock first
      simnet.callPublicFn(
        "ddtrvlr-multisig",
        "lock-vault",
        [],
        user1
      );

      // Then deposit
      const depositResult = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(750)],
        user2
      );

      expect(depositResult.result).toStrictEqual(Cl.ok(Cl.uint(750)));

      const balance = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balance).toStrictEqual(Cl.uint(750));
    });

    it("allows interleaved deposits and locks", () => {
      // Deposit
      simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(200)],
        user1
      );

      // Lock
      simnet.callPublicFn(
        "ddtrvlr-multisig",
        "lock-vault",
        [],
        user2
      );

      // Deposit more
      simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(300)],
        user3
      );

      // Lock again
      simnet.callPublicFn(
        "ddtrvlr-multisig",
        "lock-vault",
        [],
        user1
      );

      const balance = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balance).toStrictEqual(Cl.uint(500));
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe("edge cases", () => {
    it("handles very large number of deposits", () => {
      for (let i = 0; i < 100; i++) {
        simnet.callPublicFn(
          "ddtrvlr-multisig",
          "deposit",
          [Cl.uint(1)],
          user1
        );
      }

      const balance = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balance).toStrictEqual(Cl.uint(100));
    });

    it("handles maximum uint after multiple deposits", () => {
      const maxUint = 18446744073709551615n;
      const halfMax = maxUint / 2n;

      // First deposit
      simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(halfMax)],
        user1
      );

      // Second deposit
      const depositResult = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(halfMax + 1n)],
        user2
      );

      expect(depositResult.result).toStrictEqual(Cl.ok(Cl.uint(maxUint)));

      const balance = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balance).toStrictEqual(Cl.uint(maxUint));
    });

    it("handles deposits from many different users", () => {
      const users = [user1, user2, user3];
      const depositAmounts = [100, 200, 300, 400, 500];
      
      let expectedBalance = 0;

      for (let i = 0; i < 5; i++) {
        for (const user of users) {
          const amount = depositAmounts[i % depositAmounts.length];
          simnet.callPublicFn(
            "ddtrvlr-multisig",
            "deposit",
            [Cl.uint(amount)],
            user
          );
          expectedBalance += amount;
        }
      }

      const balance = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balance).toStrictEqual(Cl.uint(expectedBalance));
    });
  });

  // ============================================
  // Stress Tests
  // ============================================
  describe("stress tests", () => {
    it("handles 500 consecutive deposits", () => {
      for (let i = 0; i < 500; i++) {
        const result = simnet.callPublicFn(
          "ddtrvlr-multisig",
          "deposit",
          [Cl.uint(2)],
          user1
        );
        expect(result.result).toStrictEqual(Cl.ok(Cl.uint((i + 1) * 2)));
      }

      const balance = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balance).toStrictEqual(Cl.uint(1000));
    });

    it("handles alternating deposits and locks", () => {
      for (let i = 0; i < 50; i++) {
        // Deposit
        const depositResult = simnet.callPublicFn(
          "ddtrvlr-multisig",
          "deposit",
          [Cl.uint(10)],
          user1
        );
        expect(depositResult.result).toStrictEqual(Cl.ok(Cl.uint((i + 1) * 10)));

        // Lock
        const lockResult = simnet.callPublicFn(
          "ddtrvlr-multisig",
          "lock-vault",
          [],
          user2
        );
        expect(lockResult.result).toStrictEqual(Cl.ok(Cl.stringAscii("Vault Locked for Security")));
      }

      const balance = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balance).toStrictEqual(Cl.uint(500));
    });

    it("handles concurrent-like deposit patterns", () => {
      // Simulate multiple users depositing in sequence
      const operations = [
        { user: user1, amount: 100 },
        { user: user2, amount: 200 },
        { user: user3, amount: 300 },
        { user: user1, amount: 150 },
        { user: user2, amount: 250 },
        { user: user3, amount: 350 },
        { user: user1, amount: 50 },
      ];

      let expectedBalance = 0;

      for (const op of operations) {
        simnet.callPublicFn(
          "ddtrvlr-multisig",
          "deposit",
          [Cl.uint(op.amount)],
          op.user
        );
        expectedBalance += op.amount;

        // Random locks
        if (Math.random() > 0.7) {
          simnet.callPublicFn(
            "ddtrvlr-multisig",
            "lock-vault",
            [],
            op.user
          );
        }
      }

      const balance = simnet.getDataVar("ddtrvlr-multisig", "balance");
      expect(balance).toStrictEqual(Cl.uint(expectedBalance));
    });
  });

  // ============================================
  // Return Value Tests
  // ============================================
  describe("return values", () => {
    it("deposit returns new balance as uint", () => {
      const depositResult = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(777)],
        user1
      );

      expect(depositResult.result).toStrictEqual(Cl.ok(Cl.uint(777)));
      expect(depositResult.result.type).toBe("ok");
      expect((depositResult.result as any).value.type).toBe("uint");
    });

    it("lock-vault returns correct string message", () => {
      const lockResult = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "lock-vault",
        [],
        user1
      );

      expect(lockResult.result).toStrictEqual(Cl.ok(Cl.stringAscii("Vault Locked for Security")));
      expect(lockResult.result.type).toBe("ok");
      expect((lockResult.result as any).value.type).toBe("string-ascii");
      expect((lockResult.result as any).value.value).toBe("Vault Locked for Security");
    });
  });

  // ============================================
  // No Error Cases
  // ============================================
  describe("error handling", () => {
    it("has no error conditions - all calls succeed", () => {
      // Deposit with various users and amounts
      const deposit1 = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(1)],
        user1
      );
      expect(deposit1.result.type).toBe("ok");

      const deposit2 = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(999999)],
        user2
      );
      expect(deposit2.result.type).toBe("ok");

      const deposit3 = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "deposit",
        [Cl.uint(0)],
        user3
      );
      expect(deposit3.result.type).toBe("ok");

      // Lock by various users
      const lock1 = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "lock-vault",
        [],
        user1
      );
      expect(lock1.result.type).toBe("ok");

      const lock2 = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "lock-vault",
        [],
        user2
      );
      expect(lock2.result.type).toBe("ok");

      const lock3 = simnet.callPublicFn(
        "ddtrvlr-multisig",
        "lock-vault",
        [],
        deployer
      );
      expect(lock3.result.type).toBe("ok");
    });
  });
});
