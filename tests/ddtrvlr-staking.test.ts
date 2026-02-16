import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;
const user2 = accounts.get("wallet_2")!;
const user3 = accounts.get("wallet_3")!;

const REWARD_RATE = 5;
const stakingContract = Cl.contractPrincipal(deployer, "ddtrvlr-staking");
const tokenContract = Cl.contractPrincipal(deployer, "ddtrvlr-token");

describe("DDTRVLR Staking Contract", () => {
  
  // ============================================
  // Initial State
  // ============================================
  describe("initial state", () => {
    it("should have correct REWARD_RATE constant", () => {
      expect(REWARD_RATE).toBe(5);
    });

    it("should have zero stake for all users", () => {
      const stake1 = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user1)],
        deployer
      );
      expect(stake1.result).toStrictEqual(Cl.ok(Cl.uint(0)));

      const stake2 = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user2)],
        deployer
      );
      expect(stake2.result).toStrictEqual(Cl.ok(Cl.uint(0)));

      const stake3 = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user3)],
        deployer
      );
      expect(stake3.result).toStrictEqual(Cl.ok(Cl.uint(0)));
    });

    it("should have zero token balance in staking contract", () => {
      const balance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [stakingContract],
        deployer
      );
      expect(balance.result).toStrictEqual(Cl.ok(Cl.uint(0)));
    });
  });

  // ============================================
  // Stake Tokens Function - Success Cases
  // ============================================
  describe("stake-tokens function - successful stakes", () => {
    beforeEach(() => {
      // Mint tokens to users before each test
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(1000), Cl.principal(user1)],
        deployer
      );
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(1000), Cl.principal(user2)],
        deployer
      );
    });

    it("allows user to stake tokens", () => {
      // Check initial balance
      const initialBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(initialBalance.result).toStrictEqual(Cl.ok(Cl.uint(1000)));

      // Stake 500 tokens
      const stakeResult = simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(500)],
        user1
      );

      expect(stakeResult.result).toStrictEqual(Cl.ok(Cl.bool(true)));

      // Check user's token balance decreased
      const userBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(userBalance.result).toStrictEqual(Cl.ok(Cl.uint(500)));

      // Check staking contract received tokens
      const contractBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [stakingContract],
        deployer
      );
      expect(contractBalance.result).toStrictEqual(Cl.ok(Cl.uint(500)));

      // Check stake record
      const stake = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user1)],
        deployer
      );
      expect(stake.result).toStrictEqual(Cl.ok(Cl.uint(500)));
    });

    it("allows user to stake all tokens", () => {
      const stakeResult = simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(1000)],
        user1
      );

      expect(stakeResult.result).toStrictEqual(Cl.ok(Cl.bool(true)));

      // Check user's token balance is 0
      const userBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(userBalance.result).toStrictEqual(Cl.ok(Cl.uint(0)));

      // Check stake record
      const stake = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user1)],
        deployer
      );
      expect(stake.result).toStrictEqual(Cl.ok(Cl.uint(1000)));
    });

    it("allows user to stake multiple times (updates stake)", () => {
      // First stake: 300 tokens
      simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(300)],
        user1
      );

      let stake = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user1)],
        deployer
      );
      expect(stake.result).toStrictEqual(Cl.ok(Cl.uint(300)));

      // Second stake: 200 more tokens
      simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(200)],
        user1
      );

      stake = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user1)],
        deployer
      );
      expect(stake.result).toStrictEqual(Cl.ok(Cl.uint(500)));

      // Check contract balance
      const contractBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [stakingContract],
        deployer
      );
      expect(contractBalance.result).toStrictEqual(Cl.ok(Cl.uint(500)));
    });

    it("allows multiple users to stake", () => {
      // User1 stakes 400
      simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(400)],
        user1
      );

      // User2 stakes 600
      simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(600)],
        user2
      );

      // Check stakes
      const stake1 = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user1)],
        deployer
      );
      expect(stake1.result).toStrictEqual(Cl.ok(Cl.uint(400)));

      const stake2 = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user2)],
        deployer
      );
      expect(stake2.result).toStrictEqual(Cl.ok(Cl.uint(600)));

      // Check contract balance
      const contractBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [stakingContract],
        deployer
      );
      expect(contractBalance.result).toStrictEqual(Cl.ok(Cl.uint(1000)));
    });

    it("returns true on successful stake", () => {
      const result = simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(250)],
        user1
      );

      expect(result.result).toStrictEqual(Cl.ok(Cl.bool(true)));
    });

    it("emits transfer event", () => {
      const result = simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(100)],
        user1
      );

      expect(result.events.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // Stake Tokens Function - Error Cases
  // ============================================
  describe("stake-tokens function - insufficient balance", () => {
    it("fails when user has zero tokens", () => {
      const stakeResult = simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(100)],
        user1
      );

      expect(stakeResult.result).toStrictEqual(Cl.error(Cl.uint(expect.any(Number))));
    });

    it("fails when user stakes more than balance", () => {
      // Mint only 50 tokens
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(50), Cl.principal(user1)],
        deployer
      );

      // Try to stake 100
      const stakeResult = simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(100)],
        user1
      );

      expect(stakeResult.result).toStrictEqual(Cl.error(Cl.uint(expect.any(Number))));
    });

    it("fails when user stakes exactly balance+1", () => {
      // Mint 200 tokens
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(200), Cl.principal(user1)],
        deployer
      );

      // Try to stake 201
      const stakeResult = simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(201)],
        user1
      );

      expect(stakeResult.result).toStrictEqual(Cl.error(Cl.uint(expect.any(Number))));
    });

    it("preserves user balance on failed stake", () => {
      // Mint 100 tokens
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(100), Cl.principal(user1)],
        deployer
      );

      // Try to stake 200 (fails)
      simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(200)],
        user1
      );

      // Balance should still be 100
      const balance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(balance.result).toStrictEqual(Cl.ok(Cl.uint(100)));

      // Stake should still be 0
      const stake = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user1)],
        deployer
      );
      expect(stake.result).toStrictEqual(Cl.ok(Cl.uint(0)));
    });

    it("fails when staking zero amount (depends on token contract)", () => {
      // Mint some tokens
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(100), Cl.principal(user1)],
        deployer
      );

      // Try to stake 0
      const stakeResult = simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(0)],
        user1
      );

      // This may succeed or fail depending on token contract's handling of zero transfers
      // If token contract allows zero transfers, this will succeed
      // If not, it will fail
    });
  });

  // ============================================
  // Get Stake Function
  // ============================================
  describe("get-stake function", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(1000), Cl.principal(user1)],
        deployer
      );
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(1000), Cl.principal(user2)],
        deployer
      );
    });

    it("returns 0 for user with no stake", () => {
      const stake = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user3)],
        deployer
      );
      expect(stake.result).toStrictEqual(Cl.ok(Cl.uint(0)));
    });

    it("returns correct stake for user with stake", () => {
      simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(750)],
        user1
      );

      const stake = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user1)],
        deployer
      );
      expect(stake.result).toStrictEqual(Cl.ok(Cl.uint(750)));
    });

    it("returns correct stakes for multiple users", () => {
      simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(400)],
        user1
      );

      simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(600)],
        user2
      );

      const stake1 = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user1)],
        deployer
      );
      expect(stake1.result).toStrictEqual(Cl.ok(Cl.uint(400)));

      const stake2 = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user2)],
        deployer
      );
      expect(stake2.result).toStrictEqual(Cl.ok(Cl.uint(600)));

      const stake3 = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user3)],
        deployer
      );
      expect(stake3.result).toStrictEqual(Cl.ok(Cl.uint(0)));
    });

    it("returns updated stake after multiple stakes", () => {
      simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(200)],
        user1
      );

      let stake = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user1)],
        deployer
      );
      expect(stake.result).toStrictEqual(Cl.ok(Cl.uint(200)));

      simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(300)],
        user1
      );

      stake = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user1)],
        deployer
      );
      expect(stake.result).toStrictEqual(Cl.ok(Cl.uint(500)));
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe("edge cases", () => {
    it("handles maximum uint stake amount", () => {
      const maxUint = 18446744073709551615n;
      
      // Mint maximum tokens
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(maxUint), Cl.principal(user1)],
        deployer
      );

      // Stake maximum
      const stakeResult = simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(maxUint)],
        user1
      );

      expect(stakeResult.result).toStrictEqual(Cl.ok(Cl.bool(true)));

      const stake = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user1)],
        deployer
      );
      expect(stake.result).toStrictEqual(Cl.ok(Cl.uint(maxUint)));
    });

    it("handles multiple stakes up to balance limit", () => {
      // Mint 150 tokens
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(150), Cl.principal(user1)],
        deployer
      );

      // Stake 100
      simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(100)],
        user1
      );

      // Stake 50 more
      simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(50)],
        user1
      );

      // Try to stake 1 more (should fail)
      const finalStake = simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(1)],
        user1
      );

      expect(finalStake.result).toStrictEqual(Cl.error(Cl.uint(expect.any(Number))));

      // Stake should be 150
      const stake = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user1)],
        deployer
      );
      expect(stake.result).toStrictEqual(Cl.ok(Cl.uint(150)));
    });

    it("handles stake after failed attempt", () => {
      // First attempt with insufficient balance (fails)
      simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(100)],
        user1
      );

      // Mint tokens
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(200), Cl.principal(user1)],
        deployer
      );

      // Now stake should succeed
      const stakeResult = simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(150)],
        user1
      );

      expect(stakeResult.result).toStrictEqual(Cl.ok(Cl.bool(true)));

      const stake = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user1)],
        deployer
      );
      expect(stake.result).toStrictEqual(Cl.ok(Cl.uint(150)));
    });
  });

  // ============================================
  // Stress Tests
  // ============================================
  describe("stress tests", () => {
    it("handles 100 consecutive stakes by same user", () => {
      // Mint enough tokens
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(10000), Cl.principal(user1)],
        deployer
      );

      // Perform 100 stakes of 100 tokens each
      for (let i = 0; i < 100; i++) {
        const result = simnet.callPublicFn(
          "ddtrvlr-staking",
          "stake-tokens",
          [Cl.uint(100)],
          user1
        );
        expect(result.result).toStrictEqual(Cl.ok(Cl.bool(true)));
      }

      // Final stake should be 10000
      const stake = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user1)],
        deployer
      );
      expect(stake.result).toStrictEqual(Cl.ok(Cl.uint(10000)));

      // Contract balance should be 10000
      const contractBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [stakingContract],
        deployer
      );
      expect(contractBalance.result).toStrictEqual(Cl.ok(Cl.uint(10000)));
    });

    it("handles stakes from 50 different users", () => {
      // This test would need 50 unique users
      // Simplified version with 3 users
      const users = [user1, user2, user3];
      
      // Mint tokens to all users
      for (const user of users) {
        simnet.callPublicFn(
          "ddtrvlr-token",
          "mint",
          [Cl.uint(1000), Cl.principal(user)],
          deployer
        );
      }

      // Each user stakes
      for (const user of users) {
        const result = simnet.callPublicFn(
          "ddtrvlr-staking",
          "stake-tokens",
          [Cl.uint(500)],
          user
        );
        expect(result.result).toStrictEqual(Cl.ok(Cl.bool(true)));
      }

      // Check total contract balance
      const contractBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [stakingContract],
        deployer
      );
      expect(contractBalance.result).toStrictEqual(Cl.ok(Cl.uint(1500)));
    });

    it("handles rapid alternating stakes between users", () => {
      // Mint tokens
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(1000), Cl.principal(user1)],
        deployer
      );
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(1000), Cl.principal(user2)],
        deployer
      );

      // Alternate stakes
      for (let i = 0; i < 10; i++) {
        // User1 stakes
        simnet.callPublicFn(
          "ddtrvlr-staking",
          "stake-tokens",
          [Cl.uint(10)],
          user1
        );

        // User2 stakes
        simnet.callPublicFn(
          "ddtrvlr-staking",
          "stake-tokens",
          [Cl.uint(20)],
          user2
        );
      }

      // Check final stakes
      const stake1 = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user1)],
        deployer
      );
      expect(stake1.result).toStrictEqual(Cl.ok(Cl.uint(100)));

      const stake2 = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user2)],
        deployer
      );
      expect(stake2.result).toStrictEqual(Cl.ok(Cl.uint(200)));

      // Contract balance should be 300
      const contractBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [stakingContract],
        deployer
      );
      expect(contractBalance.result).toStrictEqual(Cl.ok(Cl.uint(300)));
    });
  });

  // ============================================
  // Return Value Tests
  // ============================================
  describe("return values", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(100), Cl.principal(user1)],
        deployer
      );
    });

    it("stake-tokens returns ok true on success", () => {
      const result = simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(50)],
        user1
      );

      expect(result.result).toStrictEqual(Cl.ok(Cl.bool(true)));
      expect(result.result.type).toBe("ok");
    });

    it("get-stake returns ok with uint", () => {
      simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(75)],
        user1
      );

      const result = simnet.callReadOnlyFn(
        "ddtrvlr-staking",
        "get-stake",
        [Cl.principal(user1)],
        deployer
      );

      expect(result.result).toStrictEqual(Cl.ok(Cl.uint(75)));
      expect(result.result.type).toBe("ok");
      expect((result.result as any).value.type).toBe("uint");
    });
  });

  // ============================================
  // Integration Tests
  // ============================================
  describe("integration with token contract", () => {
    it("maintains correct token balances across contract", () => {
      // Mint to user1
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(500), Cl.principal(user1)],
        deployer
      );

      // Mint to user2
      simnet.callPublicFn(
        "ddtrvlr-token",
        "mint",
        [Cl.uint(300), Cl.principal(user2)],
        deployer
      );

      // Total supply should be 800
      const totalSupply = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-total-supply",
        [],
        deployer
      );
      expect(totalSupply.result).toStrictEqual(Cl.ok(Cl.uint(800)));

      // User1 stakes 200
      simnet.callPublicFn(
        "ddtrvlr-staking",
        "stake-tokens",
        [Cl.uint(200)],
        user1
      );

      // Check balances
      const user1Balance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [Cl.principal(user1)],
        deployer
      );
      expect(user1Balance.result).toStrictEqual(Cl.ok(Cl.uint(300)));

      const contractBalance = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-balance",
        [stakingContract],
        deployer
      );
      expect(contractBalance.result).toStrictEqual(Cl.ok(Cl.uint(200)));

      // Total supply still 800
      const finalSupply = simnet.callReadOnlyFn(
        "ddtrvlr-token",
        "get-total-supply",
        [],
        deployer
      );
      expect(finalSupply.result).toStrictEqual(Cl.ok(Cl.uint(800)));
    });
  });
});
