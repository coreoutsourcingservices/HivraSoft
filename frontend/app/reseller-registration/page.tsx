"use client";

import Header from "@/src/components/Header/Header";
import AutoHeightCampaignFrame from "@/src/components/Campaign/AutoHeightCampaignFrame";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function ResellerRegistrationPage() {
  return (
    <>
      <Header />
      <main className="w-full bg-white">
        <AutoHeightCampaignFrame
          title="Reseller Registration"
          src={`/campaigns/reseller-registration.html?api=${encodeURIComponent(API_URL)}`}
        />
      </main>
    </>
  );
}
