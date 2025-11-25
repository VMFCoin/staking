import React from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";

export const WalletConnect: React.FC = () => {
  const { isConnected } = useAccount();

  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress, ensName }) => {
        return (
          <button
            onClick={show}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#0A3161] hover:bg-[#123D7D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A3161]"
          >
            {isConnected ? (
              <span>{ensName || truncatedAddress}</span>
            ) : (
              <span>Connect Wallet</span>
            )}
          </button>
        );
      }}
    </ConnectKitButton.Custom>
  );
};
