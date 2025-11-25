import { useState } from "react";
import { StakingForm } from "./StakingForm";
import { StakesList } from "./StakesList";

export const StakingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"stake" | "view">("stake");

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 py-12">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-white/85 backdrop-blur shadow-xl ring-1 ring-white/60">
        {/* Navigation Tabs */}
        <div className="border-b border-white/40 bg-white/70 backdrop-blur-sm">
          <nav className="flex space-x-8 px-6 py-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("stake")}
              className={`inline-flex items-center border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                activeTab === "stake"
                  ? "border-[#0A3161] text-[#0A3161]"
                  : "border-transparent text-slate-600 hover:border-[#1E4B9A] hover:text-slate-800"
              }`}
            >
              Stake
            </button>
            <button
              onClick={() => setActiveTab("view")}
              className={`inline-flex items-center border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                activeTab === "view"
                  ? "border-[#0A3161] text-[#0A3161]"
                  : "border-transparent text-slate-600 hover:border-[#1E4B9A] hover:text-slate-800"
              }`}
            >
              View Stakes
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="px-6 py-6 sm:px-8">
          {activeTab === "stake" ? <StakingForm /> : <StakesList />}
        </div>
      </div>
    </section>
  );
};
