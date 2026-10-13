"use client";

import {
  useSearchParams,
} from "@/src/components/Admin/navigation";

import BannerForm from "@/src/components/Admin/BannerForm";

export default function NewBannerPage() {
  const searchParams =
    useSearchParams();

  return (
    <BannerForm
      mode="create"
      initialPosition={
        searchParams.get(
          "position"
        )
      }
    />
  );
}
