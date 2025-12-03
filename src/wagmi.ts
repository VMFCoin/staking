import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

// Get WalletConnect Project ID from environment variable
const walletConnectProjectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
  "b1647c589ac18a28722c490d2f840895";

export const config = createConfig(
  getDefaultConfig({
    // Your dApp's info
    appName: "VMF Staking DApp",
    appDescription: "VMF Token Staking Platform",

    // WalletConnect configuration
    walletConnectProjectId,

    // Chains configuration
    chains: [base],
    transports: {
      [base.id]: http(
        "https://api.developer.coinbase.com/rpc/v1/base/DBytHtVTEsZ9VhQE0Zx7WvomGHot4hTI"
      ),
    },
  })
);
