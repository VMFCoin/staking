import React from "react";
import { AppProviders } from "./providers/AppProviders";
import { Header } from "./components/Header";
import { StakingDashboard } from "./components/StakingDashboard";

function App() {
  return (
    <AppProviders>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-red-50">
        <div className="absolute inset-0">
          <img
            src="/images/banner-vmf.png"
            alt=""
            role="presentation"
            className="h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white/90 to-red-50/80" />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <StakingDashboard />
          </main>
        </div>
      </div>
    </AppProviders>
  );
}

export default App;
