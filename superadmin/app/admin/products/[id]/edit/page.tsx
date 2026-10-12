"use client";

import { useParams } from "next/navigation";
import ProductForm from "@/src/components/Admin/ProductForm";

export default function EditProductPage() {
  const params = useParams();

  const productId =
    typeof params.id === "string"
      ? params.id
      : "";

  return (
    <ProductForm
      mode="edit"
      productId={productId}
    />
  );
}
