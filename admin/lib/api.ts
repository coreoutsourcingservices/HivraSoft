export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

/* =========================================================
   API ERROR
========================================================= */

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(
    message: string,
    status: number,
    payload?: unknown
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

/* =========================================================
   TYPES
========================================================= */

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

/* =========================================================
   GET MESSAGE
========================================================= */

function getMessage(
  payload: unknown,
  fallback: string
): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload
  ) {
    const message = (
      payload as {
        message?: unknown;
      }
    ).message;

    if (typeof message === "string") {
      return message;
    }
  }

  return fallback;
}

/* =========================================================
   API FETCH
========================================================= */

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const headers = new Headers(
    options.headers
  );

  headers.set(
    "Accept",
    "application/json"
  );

  let body: BodyInit | undefined;

  /* =======================================================
     REQUEST BODY
  ======================================================= */

  if (
    options.body !== undefined &&
    options.body !== null
  ) {
    if (
      options.body instanceof FormData
    ) {
      /*
       * FormData me Content-Type manually set
       * nahi karna.
       *
       * Browser boundary khud add karega.
       */
      body = options.body;
    } else {
      headers.set(
        "Content-Type",
        "application/json"
      );

      body = JSON.stringify(
        options.body
      );
    }
  }

  /* =======================================================
     FETCH
  ======================================================= */

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,

      headers,

      body,

      credentials:
        options.credentials ??
        "include",

      cache:
        options.cache ??
        "no-store",
    }
  );

  /* =======================================================
     RESPONSE
  ======================================================= */

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  let payload: unknown = null;

  if (response.status === 204) {
    payload = null;
  } else if (
    contentType.includes(
      "application/json"
    )
  ) {
    payload = await response
      .json()
      .catch(() => null);
  } else {
    const text = await response
      .text()
      .catch(() => "");

    payload = text
      ? {
          message: text,
        }
      : null;
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (!response.ok) {
    throw new ApiError(
      getMessage(
        payload,
        `Request failed with status ${response.status}.`
      ),
      response.status,
      payload
    );
  }

  return payload as T;
}

/* =========================================================
   AUTH REQUIRED EVENT
========================================================= */

export function requestLogin() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new Event(
      "hivrasoft-auth-required"
    )
  );
}