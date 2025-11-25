import React from "react";

import { WalletConnect } from "./WalletConnect";
import { NetworkSelector } from "./NetworkSelector";
import { StakingForm } from "./StakingForm";
import { LayoutDashboard, Activity, Layers } from "lucide-react";
import { config } from "../wagmi";
import { getAccount } from "@wagmi/core";

export const Dashboard: React.FC = () => {
  const account = getAccount(config);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-[#0A3161] min-h-screen p-4 hidden md:block">
          <div className="flex items-center space-x-2 text-white mb-8">
            <Layers size={24} className="text-blue-200" />
            <h1 className="text-xl font-bold">VMF Staking</h1>
          </div>

          <nav className="space-y-1">
            <a
              href="#"
              className="flex items-center space-x-3 text-white bg-[#123D7D] rounded-lg px-4 py-3"
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-3 text-blue-100 hover:bg-[#123D7D] rounded-lg px-4 py-3 transition-colors"
            >
              <Activity size={20} />
              <span>Transactions</span>
            </a>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center md:hidden">
                  <Layers size={24} className="text-[#0A3161]" />
                  <h1 className="text-xl font-bold text-gray-900 ml-2">
                    VMF Staking
                  </h1>
                </div>
                <div className="flex items-center space-x-4">
                  {account.address && <NetworkSelector />}
                  <WalletConnect />
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {account.address ? (
              <div className="grid grid-cols-1 gap-6">
                <StakingForm />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Layers size={40} className="text-[#0A3161]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Connect Your Wallet
                </h2>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Connect your wallet to access the VMF staking platform and
                  start earning rewards.
                </p>
                <WalletConnect />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
