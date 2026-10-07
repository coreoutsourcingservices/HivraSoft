/** @type {import('next').NextConfig} */

const nextConfig = {
  async rewrites() {
    const backend =
      process.env.API_URL?.replace(
        /\/$/,
        "",
      );

    return {
      /*
       * IMPORTANT:
       *
       * Offer rewrite BEFORE dynamic category routes.
       *
       * Browser:
       * /buy-3-get-1-free
       *
       * Internally:
       * /offers/buy-3-get-1-free
       */

      beforeFiles: [
        /*
         * =========================================
         * BUY X GET Y FREE
         *
         * Examples:
         *
         * /buy-3-get-1-free
         * /buy-4-get-1-free
         * /buy-6-get-3-free
         * =========================================
         */

        {
          source:
            "/:slug(buy-[0-9]+-get-[0-9]+-free)",

          destination:
            "/offers/:slug",
        },

        /*
         * =========================================
         * BUY X GET Y
         *
         * Examples:
         *
         * /buy-3-get-1
         * /buy-4-get-2
         * /buy-6-get-3
         * =========================================
         */

        {
          source:
            "/:slug(buy-[0-9]+-get-[0-9]+)",

          destination:
            "/offers/:slug",
        },

        /*
         * =========================================
         * EXISTING BACKEND API PROXY
         * =========================================
         */

        ...(backend
          ? [
              {
                source:
                  "/api/:path*",

                destination:
                  `${backend}/api/:path*`,
              },
            ]
          : []),
      ],

      afterFiles: [],

      fallback: [],
    };
  },

  images: {
    remotePatterns: [
      {
        protocol:
          "https",

        hostname:
          "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;