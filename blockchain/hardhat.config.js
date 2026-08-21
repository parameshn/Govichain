require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      accounts: {
        // Keep demo wallets funded enough for escrow + payout demos without giant MetaMask USD values.
        accountsBalance: "25000000000000000000",
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
};
