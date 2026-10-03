import {
  apiFetch,
} from "./api";

/* =========================================================
   REVIEW TYPES
========================================================= */

export type ReviewMedia = {
  type:
    | "image"
    | "video";

  url: string;

  publicId?: string;
};

export type ReviewConversationMessage = {
  _id?: string;

  sender:
    | "user"
    | "admin";

  message: string;

  questionNumber?: number;

  createdAt?: string;
};

export type ProductReview = {
  _id: string;

  user?: {
    _id?: string;

    name?: string;
  };

  productId?: string;

  rating: number;

  title?: string;

  comment: string;

  media?: ReviewMedia[];

  isVerified?: boolean;

  conversation?: ReviewConversationMessage[];

  userQuestionCount?: number;

  maxUserQuestions?: number;

  createdAt?: string;

  updatedAt?: string;
};

export type ProductReviewsResponse = {
  success?: boolean;

  total: number;

  page: number;

  limit: number;

  ratings: {
    average: number;

    count: number;
  };

  reviews: ProductReview[];
};

/* =========================================================
   ORDER TYPES

   Reviews require productId + purchased orderId.
========================================================= */

export type ReviewOrderItem = {
  productId?:
    | string
    | {
        _id?: string;
        id?: string;
      };

  product?:
    | string
    | {
        _id?: string;
        id?: string;
      };

  name?: string;
};

export type ReviewOrder = {
  _id?: string;

  id?: string;

  orderNumber?: string;

  status?: string;

  createdAt?: string;

  items?: ReviewOrderItem[];
};

type OrdersResponse =
  | ReviewOrder[]
  | {
      success?: boolean;

      orders?: ReviewOrder[];

      data?:
        | ReviewOrder[]
        | {
            orders?: ReviewOrder[];
          };
    };

/* =========================================================
   GET PRODUCT REVIEWS
========================================================= */

export async function getProductReviews(
  productId: string,
  page = 1,
  limit = 20
): Promise<ProductReviewsResponse> {
  const response =
    await apiFetch<ProductReviewsResponse>(
      `/api/reviews/product/${encodeURIComponent(
        productId
      )}?page=${page}&limit=${limit}`,
      {
        method: "GET",
      }
    );

  return {
    success:
      response.success,

    total:
      Number(
        response.total ||
          0
      ),

    page:
      Number(
        response.page ||
          page
      ),

    limit:
      Number(
        response.limit ||
          limit
      ),

    ratings: {
      average:
        Number(
          response.ratings
            ?.average ||
            0
        ),

      count:
        Number(
          response.ratings
            ?.count ||
            0
        ),
    },

    reviews:
      Array.isArray(
        response.reviews
      )
        ? response.reviews
        : [],
  };
}

/* =========================================================
   GET USER ORDERS
========================================================= */

export async function getReviewOrders(): Promise<
  ReviewOrder[]
> {
  const response =
    await apiFetch<OrdersResponse>(
      "/api/orders",
      {
        method: "GET",
      }
    );

  if (
    Array.isArray(
      response
    )
  ) {
    return response;
  }

  if (
    Array.isArray(
      response.orders
    )
  ) {
    return response.orders;
  }

  if (
    Array.isArray(
      response.data
    )
  ) {
    return response.data;
  }

  if (
    response.data &&
    !Array.isArray(
      response.data
    ) &&
    Array.isArray(
      response.data.orders
    )
  ) {
    return response.data
      .orders;
  }

  return [];
}

/* =========================================================
   CREATE REVIEW
========================================================= */

export type CreateReviewInput = {
  productId: string;

  orderId: string;

  rating: number;

  title?: string;

  comment: string;

  files?: File[];
};

export async function createProductReview(
  input: CreateReviewInput
) {
  const formData =
    new FormData();

  formData.append(
    "productId",
    input.productId
  );

  formData.append(
    "orderId",
    input.orderId
  );

  formData.append(
    "rating",
    String(
      input.rating
    )
  );

  if (
    input.title?.trim()
  ) {
    formData.append(
      "title",
      input.title.trim()
    );
  }

  formData.append(
    "comment",
    input.comment.trim()
  );

  for (
    const file of
    input.files || []
  ) {
    if (
      file.type.startsWith(
        "image/"
      )
    ) {
      formData.append(
        "images",
        file
      );
    }

    if (
      file.type.startsWith(
        "video/"
      )
    ) {
      formData.append(
        "videos",
        file
      );
    }
  }

  return apiFetch(
    "/api/reviews",
    {
      method: "POST",

      body: formData,
    }
  );
}