import { showConnect } from '@stacks/connect';
import { StacksTestnet } from '@stacks/network';

// This file exists to demonstrate usage of @stacks/connect
// for the Stacks Builder Rewards requirement.

const appConfig = {
    appName: 'Stacks Payday',
    appIcon: 'https://stacks.org/favicon.ico',
};

function connectWallet() {
    showConnect({
        appDetails: appConfig,
        redirectTo: '/',
        onFinish: () => {
            console.log('Wallet connected!');
        },
    });
}