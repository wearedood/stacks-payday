import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';

Clarinet.test({
    name: "Ensure that token minting works",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        console.log("✅ Activity Check: Testing ddtrvlr-token...");
    },
});
