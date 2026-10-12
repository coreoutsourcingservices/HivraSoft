"use client";

import {
  useParams,
} from "next/navigation";

import BannerForm from "@/src/components/Admin/BannerForm";

export default function EditBannerPage() {
  const params =
    useParams();

  const bannerId =
    Array.isArray(
      params.id
    )
      ? params.id[0]
      : String(
          params.id || ""
        );

  return (
    <BannerForm
      mode="edit"
      bannerId={bannerId}
    />
  );
}
