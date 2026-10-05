import {
  apiFetch,
} from "@/lib/api";
import { getTrafficSourceForOrder } from "@/lib/traffic-source";

/* =========================================================
   COMMON TYPES
========================================================= */

export type PaymentMethod =
  | "online"
  | "cod";

export type CheckoutAddressType =
  | "home"
  | "work"
  | "other";

type AnyObject =
  Record<string, unknown>;

/* =========================================================
   ADDRESS TYPES
========================================================= */

export type CheckoutAddress = {
  id: string;

  name: string;
  phone: string;

  alternatePhone?: string;

  homeNumber?: string;
  officeNumber?: string;

  addressLine1: string;
  addressLine2: string;

  landmark?: string;

  city: string;
  district: string;

  state: string;
  postalCode: string;

  country: string;
  countryCode?: string;

  addressType:
    CheckoutAddressType;

  isDefault: boolean;

  isShippingAddress?: boolean;
  isBillingAddress?: boolean;

  instructions?: string;
};

/* =========================================================
   CART TYPES
========================================================= */

export type CheckoutCartItem = {
  id: string;

  productId: string;
  colorId: string;
  sizeId: string;

  slug: string;
  name: string;

  colorName: string;
  sizeLabel: string;

  image: string;

  quantity: number;

  price: number;
  originalPrice: number;

  total: number;

  available: boolean;
};

export type CheckoutTaxSummary = {
  active: boolean;

  name: string;

  percentage: number;

  amount: number;
};

export type CheckoutCart = {
  items:
    CheckoutCartItem[];

  subtotal: number;

  offerDiscount: number;

  automaticDiscount: number;

  codeDiscount: number;

  discount: number;

  taxableAmount: number;

  tax: number;

  taxSummary:
    CheckoutTaxSummary | null;

  shipping: number;

  total: number;

  discountCode: string;
};

/* =========================================================
   DELIVERY TYPES
========================================================= */

export type DeliveryChargePreview = {
  charge: number;

  total: number;

  baseAmount: number;

  cartTotalBeforeDelivery: number;

  paymentMethod:
    PaymentMethod;

  matchedRule:
    AnyObject | null;

  raw: unknown;
};

/* =========================================================
   CHECKOUT DRAFT
========================================================= */

export type CheckoutDraft = {
  address:
    CheckoutAddress;

  paymentMethod:
    "online";

  savedAt: number;
};

/* =========================================================
   ORDER TYPES
========================================================= */

export type OrderResult = {
  id: string;

  orderNumber: string;

  total: number;

  paymentMethod: string;

  paymentStatus: string;

  status: string;

  raw: unknown;
};

/* =========================================================
   RAZORPAY TYPES
========================================================= */

export type RazorpayCreateResult = {
  razorpayOrderId: string;

  internalOrderId: string;

  amount: number;

  currency: string;

  key: string;

  orderNumber: string;

  raw: unknown;
};

export type RazorpayVerifyInput = {
  razorpay_order_id: string;

  razorpay_payment_id: string;

  razorpay_signature: string;

  orderId?: string;
};

/* =========================================================
   BASIC HELPERS
========================================================= */

function asObject(
  value: unknown
): AnyObject | null {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as AnyObject;
}

function asArray(
  value: unknown
): unknown[] {
  return Array.isArray(value)
    ? value
    : [];
}

function stringValue(
  ...values: unknown[]
): string {
  for (
    const value of values
  ) {
    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      return value.trim();
    }

    if (
      typeof value ===
      "number"
    ) {
      return String(value);
    }
  }

  return "";
}

function numberValue(
  ...values: unknown[]
): number {
  for (
    const value of values
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      continue;
    }

    const parsed =
      Number(value);

    if (
      Number.isFinite(
        parsed
      )
    ) {
      return parsed;
    }
  }

  return 0;
}

function idValue(
  value: unknown
): string {
  if (
    typeof value ===
    "string"
  ) {
    return value.trim();
  }

  const object =
    asObject(value);

  if (!object) {
    return "";
  }

  return stringValue(
    object._id,
    object.id,
    object.productId,
    object.colorId,
    object.sizeId
  );
}

/* =========================================================
   ADDRESS TYPE HELPER
========================================================= */

function normalizeAddressType(
  value: unknown
): CheckoutAddressType {
  const normalized =
    stringValue(value)
      .toLowerCase();

  if (
    normalized === "work" ||
    normalized === "office"
  ) {
    /*
     * UI can say Office,
     * backend value must be "work".
     */
    return "work";
  }

  if (
    normalized === "other"
  ) {
    return "other";
  }

  return "home";
}

/* =========================================================
   IMAGE HELPERS
========================================================= */

function directImageUrl(
  value: unknown
): string {
  if (
    typeof value ===
    "string"
  ) {
    return value.trim();
  }

  const object =
    asObject(value);

  if (!object) {
    return "";
  }

  return stringValue(
    object.url,
    object.secure_url,
    object.secureUrl,
    object.src,
    object.imageUrl,
    object.image,
    object.thumbnail,
    object.thumbnailUrl
  );
}

function imageFromArray(
  value: unknown
): string {
  const entries =
    asArray(value);

  if (
    entries.length ===
    0
  ) {
    return "";
  }

  /*
   * Support array of direct URLs too.
   */
  for (
    const entry of entries
  ) {
    if (
      typeof entry ===
        "string" &&
      entry.trim()
    ) {
      return entry.trim();
    }
  }

  const images =
    entries
      .map((entry) =>
        asObject(entry)
      )
      .filter(
        (
          entry
        ): entry is AnyObject =>
          Boolean(entry)
      );

  if (
    images.length ===
    0
  ) {
    return "";
  }

  const preferred =
    images.find(
      (image) =>
        image.isDefault ===
        true
    ) ||
    images[0];

  return directImageUrl(
    preferred
  );
}

/* =========================================================
   COLOR HELPERS
========================================================= */

function colorMatches(
  color:
    AnyObject | null,
  colorId: string
): boolean {
  if (
    !color ||
    !colorId
  ) {
    return false;
  }

  const values = [
    stringValue(
      color._id
    ),

    stringValue(
      color.id
    ),

    stringValue(
      color.colorId
    ),

    stringValue(
      color.slugColor
    ),

    stringValue(
      color.slug
    ),
  ].filter(Boolean);

  return values.includes(
    colorId
  );
}

function findColor(
  product:
    AnyObject | null,
  item:
    AnyObject | null,
  colorId: string
): AnyObject | null {
  /*
   * Backend cart already sends selectedColor.
   */
  if (item) {
    const directCandidates = [
      asObject(
        item.selectedColor
      ),

      asObject(
        item.color
      ),

      asObject(
        item.productColor
      ),

      asObject(
        item.variant
      ),

      asObject(
        item.colorVariant
      ),
    ];

    for (
      const candidate of directCandidates
    ) {
      if (!candidate) {
        continue;
      }

      if (
        !colorId ||
        colorMatches(
          candidate,
          colorId
        )
      ) {
        return candidate;
      }
    }

    /*
     * selectedColor can still be correct even
     * if ID field wasn't returned.
     */
    const selectedColor =
      asObject(
        item.selectedColor
      );

    if (selectedColor) {
      return selectedColor;
    }
  }

  if (!product) {
    return null;
  }

  const colors =
    asArray(
      product.colors
    )
      .map((color) =>
        asObject(color)
      )
      .filter(
        (
          color
        ): color is AnyObject =>
          Boolean(color)
      );

  if (
    colors.length ===
    0
  ) {
    return null;
  }

  const exact =
    colors.find(
      (color) =>
        colorMatches(
          color,
          colorId
        )
    );

  if (exact) {
    return exact;
  }

  return (
    colors.find(
      (color) =>
        color.isDefault ===
        true
    ) ||
    colors[0]
  );
}

/* =========================================================
   SIZE HELPERS
========================================================= */

function findSize(
  color:
    AnyObject | null,
  item:
    AnyObject | null,
  sizeId: string
): AnyObject | null {
  if (item) {
    const selected =
      asObject(
        item.selectedSize
      ) ||
      asObject(
        item.size
      ) ||
      asObject(
        item.productSize
      );

    if (selected) {
      return selected;
    }
  }

  if (!color) {
    return null;
  }

  const sizes =
    asArray(
      color.sizes
    )
      .map((size) =>
        asObject(size)
      )
      .filter(
        (
          size
        ): size is AnyObject =>
          Boolean(size)
      );

  return (
    sizes.find(
      (size) =>
        stringValue(
          size._id,
          size.id,
          size.sizeId
        ) ===
        sizeId
    ) ||
    null
  );
}

/* =========================================================
   CART IMAGE RESOLVER
========================================================= */

function resolveCartImage(
  item: AnyObject,
  product:
    AnyObject | null,
  color:
    AnyObject | null
): string {
  /* 1. Direct item image */

  const directItemImage =
    stringValue(
      item.imageUrl,
      item.productImageUrl,
      item.thumbnailUrl
    ) ||
    directImageUrl(
      item.image
    ) ||
    directImageUrl(
      item.productImage
    ) ||
    directImageUrl(
      item.thumbnail
    );

  if (
    directItemImage
  ) {
    return directItemImage;
  }

  /* 2. Item images */

  const itemImages =
    imageFromArray(
      item.images
    );

  if (
    itemImages
  ) {
    return itemImages;
  }

  /* 3. Selected color */

  if (color) {
    const colorDirect =
      stringValue(
        color.imageUrl,
        color.thumbnailUrl
      ) ||
      directImageUrl(
        color.image
      ) ||
      directImageUrl(
        color.thumbnail
      );

    if (
      colorDirect
    ) {
      return colorDirect;
    }

    const colorImages =
      imageFromArray(
        color.images
      );

    if (
      colorImages
    ) {
      return colorImages;
    }
  }

  /* 4. Product */

  if (product) {
    const productDirect =
      stringValue(
        product.imageUrl,
        product.thumbnailUrl
      ) ||
      directImageUrl(
        product.image
      ) ||
      directImageUrl(
        product.thumbnail
      );

    if (
      productDirect
    ) {
      return productDirect;
    }

    /*
     * Backend cart currently returns mainImages.
     */
    const mainImage =
      imageFromArray(
        product.mainImages
      );

    if (
      mainImage
    ) {
      return mainImage;
    }

    const productImages =
      imageFromArray(
        product.images
      );

    if (
      productImages
    ) {
      return productImages;
    }

    const productColors =
      asArray(
        product.colors
      )
        .map((entry) =>
          asObject(entry)
        )
        .filter(
          (
            entry
          ): entry is AnyObject =>
            Boolean(entry)
        );

    const preferredColor =
      productColors.find(
        (entry) =>
          entry.isDefault ===
          true
      ) ||
      productColors[0];

    if (preferredColor) {
      return imageFromArray(
        preferredColor.images
      );
    }
  }

  return "";
}

/* =========================================================
   NORMALIZE ADDRESS
========================================================= */

function normalizeAddress(
  raw: unknown
): CheckoutAddress | null {
  const item =
    asObject(raw);

  if (!item) {
    return null;
  }

  const id =
    stringValue(
      item._id,
      item.id
    );

  if (!id) {
    return null;
  }

  return {
    id,

    /*
     * Backend field is fullName.
     */
    name:
      stringValue(
        item.fullName,
        item.name,
        item.recipientName
      ),

    phone:
      stringValue(
        item.phone,
        item.mobile,
        item.phoneNumber
      ),

    alternatePhone:
      stringValue(
        item.alternatePhone
      ),

    homeNumber:
      stringValue(
        item.homeNumber
      ),

    officeNumber:
      stringValue(
        item.officeNumber
      ),

    addressLine1:
      stringValue(
        item.addressLine1,
        item.line1,
        item.address,
        item.street
      ),

    /*
     * Landmark separate field hai.
     * addressLine2 me landmark mix nahi karna.
     */
    addressLine2:
      stringValue(
        item.addressLine2,
        item.line2
      ),

    landmark:
      stringValue(
        item.landmark
      ),

    city:
      stringValue(
        item.city
      ),

    district:
      stringValue(
        item.district
      ),

    state:
      stringValue(
        item.state
      ),

    postalCode:
      stringValue(
        item.postalCode,
        item.pincode,
        item.zipCode,
        item.zip
      ),

    country:
      stringValue(
        item.country
      ) ||
      "India",

    countryCode:
      stringValue(
        item.countryCode
      ) ||
      "IN",

    addressType:
      normalizeAddressType(
        item.addressType ??
        item.type
      ),

    isDefault:
      item.isDefault ===
      true,

    isShippingAddress:
      item.isShippingAddress !==
      false,

    isBillingAddress:
      item.isBillingAddress !==
      false,

    instructions:
      stringValue(
        item.instructions,
        item.deliveryInstructions
      ),
  };
}

/* =========================================================
   GET ALL ADDRESSES
========================================================= */

export async function getCheckoutAddresses(): Promise<
  CheckoutAddress[]
> {
  const response =
    await apiFetch<unknown>(
      "/api/address",
      {
        method: "GET",
      }
    );

  const root =
    asObject(response);

  const data =
    asObject(
      root?.data
    );

  let rawAddresses:
    unknown[] = [];

  /*
   * Actual backend:
   *
   * {
   *   success: true,
   *   count: 1,
   *   addresses: [...]
   * }
   */

  if (
    Array.isArray(
      root?.addresses
    )
  ) {
    rawAddresses =
      root.addresses;
  } else if (
    Array.isArray(response)
  ) {
    rawAddresses =
      response;
  } else if (
    Array.isArray(
      root?.data
    )
  ) {
    rawAddresses =
      root.data;
  } else if (
    Array.isArray(
      data?.addresses
    )
  ) {
    rawAddresses =
      data.addresses;
  }

  return rawAddresses
    .map((address) =>
      normalizeAddress(
        address
      )
    )
    .filter(
      (
        address
      ): address is CheckoutAddress =>
        Boolean(address)
    )
    .sort(
      (
        first,
        second
      ) => {
        if (
          first.isDefault ===
          second.isDefault
        ) {
          return 0;
        }

        return first.isDefault
          ? -1
          : 1;
      }
    );
}

/* =========================================================
   GET ADDRESS BY ID
========================================================= */

export async function getCheckoutAddressById(
  addressId: string
): Promise<
  CheckoutAddress | null
> {
  const response =
    await apiFetch<unknown>(
      `/api/address/${encodeURIComponent(
        addressId
      )}`,
      {
        method: "GET",
      }
    );

  const root =
    asObject(response);

  return (
    normalizeAddress(
      root?.address
    ) ||
    normalizeAddress(
      root?.data
    ) ||
    normalizeAddress(
      response
    )
  );
}

/* =========================================================
   ADDRESS PAYLOAD
========================================================= */

function addressApiPayload(
  address: Omit<
    CheckoutAddress,
    "id"
  >
) {
  return {
    fullName:
      address.name.trim(),

    phone:
      address.phone.trim(),

    alternatePhone:
      address.alternatePhone
        ?.trim() ||
      "",

    homeNumber:
      address.addressType ===
      "home"
        ? address.homeNumber
            ?.trim() ||
          ""
        : "",

    officeNumber:
      address.addressType ===
      "work"
        ? address.officeNumber
            ?.trim() ||
          ""
        : "",

    addressLine1:
      address.addressLine1
        .trim(),

    addressLine2:
      address.addressLine2
        ?.trim() ||
      "",

    landmark:
      address.landmark
        ?.trim() ||
      "",

    city:
      address.city.trim(),

    district:
      address.district
        ?.trim() ||
      "",

    state:
      address.state.trim(),

    postalCode:
      address.postalCode
        .trim(),

    country:
      address.country
        ?.trim() ||
      "India",

    countryCode:
      (
        address.countryCode ||
        "IN"
      )
        .trim()
        .toUpperCase(),

    addressType:
      normalizeAddressType(
        address.addressType
      ),

    isDefault:
      address.isDefault ===
      true,

    isShippingAddress:
      address.isShippingAddress !==
      false,

    isBillingAddress:
      address.isBillingAddress !==
      false,

    instructions:
      address.instructions
        ?.trim() ||
      "",
  };
}

/* =========================================================
   CREATE ADDRESS
========================================================= */

export async function createCheckoutAddress(
  address: Omit<
    CheckoutAddress,
    "id"
  >
): Promise<
  CheckoutAddress
> {
  const response =
    await apiFetch<unknown>(
      "/api/address",
      {
        method: "POST",

        /*
         * apiFetch already serializes JSON.
         * JSON.stringify() yaha nahi lagana.
         */
        body:
          addressApiPayload(
            address
          ),
      }
    );

  const root =
    asObject(response);

  const createdAddress =
    normalizeAddress(
      root?.address
    ) ||
    normalizeAddress(
      root?.data
    );

  if (
    !createdAddress
  ) {
    /*
     * In case backend saved correctly but
     * response envelope changes later,
     * reload addresses and find newest/default.
     */
    const addresses =
      await getCheckoutAddresses();

    if (
      addresses.length >
      0
    ) {
      return (
        addresses.find(
          (item) =>
            item.name ===
              address.name &&
            item.phone ===
              address.phone &&
            item.postalCode ===
              address.postalCode
        ) ||
        addresses[0]
      );
    }

    throw new Error(
      "Address was saved but returned address data could not be read."
    );
  }

  return createdAddress;
}

/* =========================================================
   UPDATE ADDRESS
========================================================= */

export async function updateCheckoutAddress(
  addressId: string,
  address: Omit<
    CheckoutAddress,
    "id"
  >
): Promise<
  CheckoutAddress
> {
  const response =
    await apiFetch<unknown>(
      `/api/address/${encodeURIComponent(
        addressId
      )}`,
      {
        method: "PUT",

        body:
          addressApiPayload(
            address
          ),
      }
    );

  const root =
    asObject(response);

  const updated =
    normalizeAddress(
      root?.address
    ) ||
    normalizeAddress(
      root?.data
    );

  if (updated) {
    return updated;
  }

  const reloaded =
    await getCheckoutAddressById(
      addressId
    );

  if (!reloaded) {
    throw new Error(
      "Unable to reload updated address."
    );
  }

  return reloaded;
}

/* =========================================================
   SET DEFAULT ADDRESS
========================================================= */

export async function setDefaultCheckoutAddress(
  addressId: string
): Promise<void> {
  await apiFetch(
    `/api/address/${encodeURIComponent(
      addressId
    )}/default`,
    {
      method: "PATCH",
    }
  );
}

/* =========================================================
   DELETE ADDRESS
========================================================= */

export async function deleteCheckoutAddress(
  addressId: string
): Promise<void> {
  await apiFetch(
    `/api/address/${encodeURIComponent(
      addressId
    )}`,
    {
      method: "DELETE",
    }
  );
}

/* =========================================================
   NORMALIZE CART ITEM
========================================================= */

function normalizeCartItem(
  raw: unknown
): CheckoutCartItem | null {
  const item =
    asObject(raw);

  if (!item) {
    return null;
  }

  const product =
    asObject(
      item.product
    ) ||
    asObject(
      item.productId
    );

  const productId =
    idValue(
      item.product
    ) ||
    idValue(
      item.productId
    ) ||
    stringValue(
      item.productId
    );

  const colorId =
    stringValue(
      item.colorId
    ) ||
    idValue(
      item.colorId
    ) ||
    idValue(
      item.selectedColor
    ) ||
    idValue(
      item.color
    );

  const sizeId =
    stringValue(
      item.sizeId
    ) ||
    idValue(
      item.sizeId
    ) ||
    idValue(
      item.selectedSize
    ) ||
    idValue(
      item.size
    );

  const color =
    findColor(
      product,
      item,
      colorId
    );

  const size =
    findSize(
      color,
      item,
      sizeId
    );

  const quantity =
    Math.max(
      1,
      Math.floor(
        numberValue(
          item.quantity,
          1
        )
      )
    );

  /*
   * Backend cart already returns unitPrice.
   */
  const price =
    numberValue(
      item.unitPrice,
      item.showPrice,
      item.sellingPrice,
      item.price,
      size?.showPrice,
      color?.showPrice,
      product?.price,
      product?.showPrice
    );

  const originalPrice =
    numberValue(
      item.originalPrice,
      item.compareAtPrice,
      size?.originalPrice,
      color?.originalPrice,
      product?.compareAtPrice,
      price
    );

  /*
   * Backend cart returns item.subtotal.
   */
  const explicitTotal =
    numberValue(
      item.finalTotal,
      item.lineTotal,
      item.itemTotal,
      item.subtotal,
      item.total,
      item.amount
    );

  const total =
    explicitTotal > 0
      ? explicitTotal
      : price *
        quantity;

  const name =
    stringValue(
      item.name,
      item.productName,
      product?.name,
      color?.nameProduct,
      product?.nameProduct,
      product?.title
    ) ||
    "Product";

  const slug =
    stringValue(
      item.slug,
      item.productSlug,
      product?.slug,
      color?.slugProduct,
      product?.slugProduct
    );

  const image =
    resolveCartImage(
      item,
      product,
      color
    );

  const selectedColor =
    asObject(
      item.selectedColor
    );

  const selectedSize =
    asObject(
      item.selectedSize
    );

  return {
    id:
      idValue(item),

    productId,

    colorId,

    sizeId,

    slug,

    name,

    colorName:
      stringValue(
        selectedColor?.name,
        item.colorName,
        color?.nameColor,
        color?.colorName
      ),

    sizeLabel:
      stringValue(
        selectedSize?.size,
        item.sizeLabel,
        size?.size,
        size?.name,
        size?.label
      ),

    image,

    quantity,

    price,

    originalPrice,

    total,

    available:
      item.available !==
      false,
  };
}

/* =========================================================
   PRODUCT CATALOG FALLBACK
========================================================= */

async function getCatalogFallback(): Promise<
  AnyObject[]
> {
  try {
    const response =
      await apiFetch<unknown>(
        "/api/products/catalog",
        {
          method: "GET",
        }
      );

    const root =
      asObject(response);

    const data =
      asObject(
        root?.data
      );

    let rawProducts:
      unknown[] = [];

    if (
      Array.isArray(response)
    ) {
      rawProducts =
        response;
    } else if (
      Array.isArray(
        root?.products
      )
    ) {
      rawProducts =
        root.products;
    } else if (
      Array.isArray(
        root?.data
      )
    ) {
      rawProducts =
        root.data;
    } else if (
      Array.isArray(
        data?.products
      )
    ) {
      rawProducts =
        data.products;
    } else if (
      Array.isArray(
        root?.catalog
      )
    ) {
      rawProducts =
        root.catalog;
    }

    return rawProducts
      .map((entry) =>
        asObject(entry)
      )
      .filter(
        (
          entry
        ): entry is AnyObject =>
          Boolean(entry)
      );
  } catch {
    return [];
  }
}

function findCatalogProduct(
  catalog:
    AnyObject[],
  cartItem:
    CheckoutCartItem
): AnyObject | null {
  const byId =
    catalog.find(
      (candidate) => {
        const nested =
          asObject(
            candidate.product
          );

        const product =
          nested ||
          candidate;

        return (
          (
            idValue(
              product
            ) ||
            idValue(
              candidate.productId
            )
          ) ===
          cartItem.productId
        );
      }
    );

  if (byId) {
    return byId;
  }

  if (
    cartItem.slug
  ) {
    return (
      catalog.find(
        (candidate) => {
          const nested =
            asObject(
              candidate.product
            );

          const product =
            nested ||
            candidate;

          if (
            stringValue(
              candidate.slug,
              candidate.slugProduct,
              product.slug,
              product.slugProduct
            ) ===
            cartItem.slug
          ) {
            return true;
          }

          return asArray(
            product.colors
          ).some(
            (rawColor) => {
              const color =
                asObject(
                  rawColor
                );

              return (
                stringValue(
                  color?.slugProduct
                ) ===
                cartItem.slug
              );
            }
          );
        }
      ) ||
      null
    );
  }

  return null;
}

async function enrichCartImages(
  items:
    CheckoutCartItem[]
): Promise<
  CheckoutCartItem[]
> {
  if (
    !items.some(
      (item) =>
        !item.image
    )
  ) {
    return items;
  }

  const catalog =
    await getCatalogFallback();

  if (
    catalog.length ===
    0
  ) {
    return items;
  }

  return items.map(
    (item) => {
      if (
        item.image
      ) {
        return item;
      }

      const entry =
        findCatalogProduct(
          catalog,
          item
        );

      if (!entry) {
        return item;
      }

      const product =
        asObject(
          entry.product
        ) ||
        entry;

      const color =
        findColor(
          product,
          null,
          item.colorId
        );

      const image =
        resolveCartImage(
          entry,
          product,
          color
        );

      return {
        ...item,

        image:
          image ||
          item.image,

        slug:
          item.slug ||
          stringValue(
            color?.slugProduct,
            entry.slugProduct,
            entry.slug,
            product.slugProduct,
            product.slug
          ),
      };
    }
  );
}

/* =========================================================
   GET CHECKOUT CART
========================================================= */

export async function getCheckoutCart(): Promise<
  CheckoutCart
> {
  const response =
    await apiFetch<unknown>(
      "/api/cart",
      {
        method: "GET",
      }
    );

  const root =
    asObject(response);

  const data =
    asObject(
      root?.data
    );

  const cart =
    asObject(
      root?.cart
    ) ||
    asObject(
      data?.cart
    ) ||
    data ||
    root ||
    {};

  let items =
    asArray(
      cart.items
    )
      .map((item) =>
        normalizeCartItem(
          item
        )
      )
      .filter(
        (
          item
        ): item is CheckoutCartItem =>
          Boolean(item)
      );

  items =
    await enrichCartImages(
      items
    );

  const pricing =
    asObject(
      cart.pricing
    ) ||
    asObject(
      cart.summary
    ) ||
    {};

  const calculatedSubtotal =
    items.reduce(
      (
        total,
        item
      ) =>
        total +
        item.total,
      0
    );

  const subtotal =
    numberValue(
      cart.subtotal,
      pricing.subtotal,
      calculatedSubtotal
    );

  const offerDiscount =
    numberValue(
      cart.offerDiscount,
      pricing.offerDiscount
    );

  const automaticDiscount =
    numberValue(
      cart.automaticDiscount,
      pricing.automaticDiscount
    );

  const codeDiscount =
    numberValue(
      cart.codeDiscount,
      pricing.codeDiscount
    );

  const directDiscount =
    numberValue(
      cart.discount,
      pricing.discount,
      cart.totalDiscount,
      pricing.totalDiscount
    );

  const discount =
    directDiscount > 0
      ? directDiscount
      : offerDiscount +
        automaticDiscount +
        codeDiscount;

  const taxableAmount =
    numberValue(
      cart.taxableAmount,
      pricing.taxableAmount,
      Math.max(
        0,
        subtotal -
          discount
      )
    );

  const tax =
    numberValue(
      cart.tax,
      pricing.tax
    );

  const rawTaxSummary =
    asObject(
      cart.taxSummary
    ) ||
    asObject(
      pricing.taxSummary
    );

  let taxSummary:
    CheckoutTaxSummary | null =
      null;

  if (
    rawTaxSummary
  ) {
    taxSummary = {
      active:
        rawTaxSummary.active !==
        false,

      name:
        stringValue(
          rawTaxSummary.name
        ) ||
        "GST",

      percentage:
        numberValue(
          rawTaxSummary.percentage
        ),

      amount:
        numberValue(
          rawTaxSummary.amount,
          tax
        ),
    };
  } else if (
    tax > 0
  ) {
    taxSummary = {
      active: true,

      name:
        "GST",

      percentage: 0,

      amount:
        tax,
    };
  }

  const shipping =
    numberValue(
      cart.shipping,
      cart.deliveryCharge,
      cart.shippingCharge,
      pricing.shipping,
      pricing.deliveryCharge,
      pricing.shippingCharge
    );

  const calculatedTotal =
    Math.max(
      0,
      subtotal -
        discount +
        tax +
        shipping
    );

  /*
   * Backend cart total is authoritative.
   */
  const total =
    cart.total !==
      undefined &&
    cart.total !==
      null
      ? numberValue(
          cart.total
        )
      : calculatedTotal;

  return {
    items,

    subtotal,

    offerDiscount,

    automaticDiscount,

    codeDiscount,

    discount,

    taxableAmount,

    tax,

    taxSummary,

    shipping,

    total,

    discountCode:
      stringValue(
        cart.appliedDiscountCode,
        cart.discountCode,
        pricing.appliedDiscountCode,
        pricing.discountCode
      ),
  };
}

/* =========================================================
   DELIVERY PREVIEW HELPERS
========================================================= */

function extractDeliveryPreview(
  response: unknown,
  requestedMethod:
    PaymentMethod
): DeliveryChargePreview {
  const root =
    asObject(response);

  const data =
    asObject(
      root?.data
    );

  /*
   * Actual backend response:
   *
   * {
   *   success: true,
   *   preview: {
   *     paymentMethod,
   *     baseAmount,
   *     cartTotalBeforeDelivery,
   *     deliveryCharge,
   *     payableTotal,
   *     matchedRule
   *   }
   * }
   */

  const preview =
    asObject(
      root?.preview
    ) ||
    asObject(
      data?.preview
    ) ||
    data ||
    root ||
    {};

  const method =
    stringValue(
      preview.paymentMethod
    );

  return {
    charge:
      Math.max(
        0,
        numberValue(
          preview.deliveryCharge,
          preview.shippingCharge,
          preview.codCharge,
          preview.charge
        )
      ),

    total:
      Math.max(
        0,
        numberValue(
          preview.payableTotal,
          preview.total,
          preview.grandTotal
        )
      ),

    baseAmount:
      Math.max(
        0,
        numberValue(
          preview.baseAmount
        )
      ),

    cartTotalBeforeDelivery:
      Math.max(
        0,
        numberValue(
          preview.cartTotalBeforeDelivery
        )
      ),

    paymentMethod:
      method === "cod"
        ? "cod"
        : method ===
            "online"
          ? "online"
          : requestedMethod,

    matchedRule:
      asObject(
        preview.matchedRule
      ),

    raw:
      response,
  };
}

/* =========================================================
   DELIVERY CHARGE PREVIEW
========================================================= */

export async function previewDeliveryCharge(
  paymentMethod:
    PaymentMethod
): Promise<
  DeliveryChargePreview
> {
  const response =
    await apiFetch<unknown>(
      "/api/orders/delivery-charge/preview",
      {
        method: "POST",

        /*
         * IMPORTANT:
         * apiFetch khud JSON stringify karta hai.
         */
        body: {
          paymentMethod,
        },
      }
    );

  return extractDeliveryPreview(
    response,
    paymentMethod
  );
}

/* =========================================================
   SHIPPING ADDRESS PAYLOAD
========================================================= */

export function shippingAddressPayload(
  address:
    CheckoutAddress
) {
  return {
    fullName:
      address.name,

    /*
     * Keep name too for backward compatibility.
     */
    name:
      address.name,

    phone:
      address.phone,

    alternatePhone:
      address.alternatePhone ||
      "",

    homeNumber:
      address.homeNumber ||
      "",

    officeNumber:
      address.officeNumber ||
      "",

    addressLine1:
      address.addressLine1,

    addressLine2:
      address.addressLine2 ||
      "",

    landmark:
      address.landmark ||
      "",

    city:
      address.city,

    district:
      address.district ||
      "",

    state:
      address.state,

    postalCode:
      address.postalCode,

    country:
      address.country ||
      "India",

    countryCode:
      address.countryCode ||
      "IN",

    instructions:
      address.instructions ||
      "",
  };
}

/* =========================================================
   NORMALIZE ORDER
========================================================= */

export function normalizeOrder(
  response: unknown
): OrderResult {
  const root =
    asObject(response);

  const data =
    asObject(
      root?.data
    );

  const order =
    asObject(
      root?.order
    ) ||
    asObject(
      data?.order
    ) ||
    data ||
    root ||
    {};

  return {
    id:
      idValue(order) ||
      stringValue(
        order.orderId
      ),

    orderNumber:
      stringValue(
        order.orderNumber,
        order.invoiceNumber
      ),

    total:
      numberValue(
        order.total,
        order.grandTotal
      ),

    paymentMethod:
      stringValue(
        order.paymentMethod,
        asObject(
          order.payment
        )?.method
      ),

    paymentStatus:
      stringValue(
        order.paymentStatus,
        asObject(
          order.payment
        )?.status
      ),

    status:
      stringValue(
        order.status
      ),

    raw:
      response,
  };
}

/* =========================================================
   CREATE COD ORDER
========================================================= */

export async function createCodOrder(
  address:
    CheckoutAddress
): Promise<
  OrderResult
> {
  /*
   * Saved address ID is preferred.
   * Backend verifies ownership of address.
   */
  const response =
    await apiFetch<unknown>(
      "/api/orders",
      {
        method: "POST",

        body: {
          paymentMethod:
            "cod",

          addressId:
            address.id,

          shippingAddress:
            shippingAddressPayload(
              address
            ),

          origin:
            getTrafficSourceForOrder(),
        },
      }
    );

  return normalizeOrder(
    response
  );
}

/* =========================================================
   CREATE RAZORPAY ORDER
========================================================= */

export async function createRazorpayOrder(
  address:
    CheckoutAddress
): Promise<
  RazorpayCreateResult
> {
  const response =
    await apiFetch<unknown>(
      "/api/orders/razorpay/create",
      {
        method: "POST",

        body: {
          paymentMethod:
            "online",

          addressId:
            address.id,

          shippingAddress:
            shippingAddressPayload(
              address
            ),

          origin:
            getTrafficSourceForOrder(),
        },
      }
    );

  const root =
    asObject(response);

  const data =
    asObject(
      root?.data
    );

  const razorpayOrder =
    asObject(
      root?.razorpayOrder
    ) ||
    asObject(
      data?.razorpayOrder
    );

  const internalOrder =
    asObject(
      root?.order
    ) ||
    asObject(
      data?.order
    );

  return {
    razorpayOrderId:
      stringValue(
        root?.razorpayOrderId,
        data?.razorpayOrderId,
        razorpayOrder?.id,
        root?.razorpay_order_id,
        data?.razorpay_order_id
      ),

    internalOrderId:
      idValue(
        internalOrder
      ) ||
      stringValue(
        root?.internalOrderId,
        data?.internalOrderId,
        root?.orderId,
        data?.orderId
      ),

    amount:
      numberValue(
        root?.amount,
        data?.amount,
        razorpayOrder?.amount
      ),

    currency:
      stringValue(
        root?.currency,
        data?.currency,
        razorpayOrder?.currency
      ) ||
      "INR",

    key:
      stringValue(
        root?.key,
        root?.keyId,
        root?.razorpayKey,
        data?.key,
        data?.keyId,
        data?.razorpayKey
      ),

    orderNumber:
      stringValue(
        internalOrder?.orderNumber,
        root?.orderNumber,
        data?.orderNumber
      ),

    raw:
      response,
  };
}

/* =========================================================
   VERIFY RAZORPAY PAYMENT
========================================================= */

export async function verifyRazorpayPayment(
  payload:
    RazorpayVerifyInput
): Promise<
  OrderResult
> {
  const response =
    await apiFetch<unknown>(
      "/api/orders/razorpay/verify",
      {
        method: "POST",

        body:
          payload,
      }
    );

  return normalizeOrder(
    response
  );
}

/* =========================================================
   GET MY ORDERS
========================================================= */

export async function getMyOrders(): Promise<
  OrderResult[]
> {
  const response =
    await apiFetch<unknown>(
      "/api/orders",
      {
        method: "GET",
      }
    );

  const root =
    asObject(response);

  const data =
    asObject(
      root?.data
    );

  let rawOrders:
    unknown[] = [];

  if (
    Array.isArray(
      root?.orders
    )
  ) {
    rawOrders =
      root.orders;
  } else if (
    Array.isArray(response)
  ) {
    rawOrders =
      response;
  } else if (
    Array.isArray(
      root?.data
    )
  ) {
    rawOrders =
      root.data;
  } else if (
    Array.isArray(
      data?.orders
    )
  ) {
    rawOrders =
      data.orders;
  }

  return rawOrders.map(
    (order) =>
      normalizeOrder(
        order
      )
  );
}

/* =========================================================
   GET ORDER BY ID
========================================================= */

export async function getOrderById(
  orderId: string
): Promise<
  OrderResult
> {
  const response =
    await apiFetch<unknown>(
      `/api/orders/${encodeURIComponent(
        orderId
      )}`,
      {
        method: "GET",
      }
    );

  return normalizeOrder(
    response
  );
}

/* =========================================================
   CANCEL ORDER
========================================================= */

export async function cancelOrder(
  orderId: string,
  reason = ""
): Promise<
  OrderResult
> {
  const response =
    await apiFetch<unknown>(
      `/api/orders/${encodeURIComponent(
        orderId
      )}/cancel`,
      {
        method: "PATCH",

        body: {
          reason,
        },
      }
    );

  return normalizeOrder(
    response
  );
}

/* =========================================================
   INVOICE URL
========================================================= */

export function getInvoicePath(
  orderId: string
): string {
  return `/api/orders/${encodeURIComponent(
    orderId
  )}/invoice`;
}

/* =========================================================
   SESSION STORAGE
========================================================= */

const CHECKOUT_DRAFT_KEY =
  "hivrasoft-checkout-draft";

const LAST_ORDER_KEY =
  "hivrasoft-last-order";

/* =========================================================
   SAVE CHECKOUT DRAFT
========================================================= */

export function saveCheckoutDraft(
  draft:
    CheckoutDraft
): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.sessionStorage.setItem(
    CHECKOUT_DRAFT_KEY,
    JSON.stringify(
      draft
    )
  );
}

/* =========================================================
   GET CHECKOUT DRAFT
========================================================= */

export function getCheckoutDraft(): CheckoutDraft | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    const raw =
      window.sessionStorage.getItem(
        CHECKOUT_DRAFT_KEY
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !==
        "object"
    ) {
      return null;
    }

    return parsed as CheckoutDraft;
  } catch {
    return null;
  }
}

/* =========================================================
   CLEAR CHECKOUT DRAFT
========================================================= */

export function clearCheckoutDraft(): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.sessionStorage.removeItem(
    CHECKOUT_DRAFT_KEY
  );
}

/* =========================================================
   SAVE LAST ORDER
========================================================= */

export function saveLastOrder(
  order:
    OrderResult
): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.sessionStorage.setItem(
    LAST_ORDER_KEY,
    JSON.stringify(
      order
    )
  );
}

/* =========================================================
   GET LAST ORDER
========================================================= */

export function getLastOrder(): OrderResult | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    const raw =
      window.sessionStorage.getItem(
        LAST_ORDER_KEY
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !==
        "object"
    ) {
      return null;
    }

    return parsed as OrderResult;
  } catch {
    return null;
  }
}

/* =========================================================
   CLEAR LAST ORDER
========================================================= */

export function clearLastOrder(): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.sessionStorage.removeItem(
    LAST_ORDER_KEY
  );
}