"use client";

import {
  useEffect,
} from "react";

export default function ScrollToTopOnRefresh() {
  useEffect(() => {
    if (
      "scrollRestoration" in
      window.history
    ) {
      window.history.scrollRestoration =
        "manual";
    }

    const goTop =
      () => {
        window.scrollTo(
          0,
          0,
        );

        document.documentElement.scrollTop =
          0;

        document.body.scrollTop =
          0;
      };

    goTop();

    const frame =
      window.requestAnimationFrame(
        goTop,
      );

    const timer1 =
      window.setTimeout(
        goTop,
        50,
      );

    const timer2 =
      window.setTimeout(
        goTop,
        250,
      );

    return () => {
      window.cancelAnimationFrame(
        frame,
      );

      window.clearTimeout(
        timer1,
      );

      window.clearTimeout(
        timer2,
      );
    };
  }, []);

  return null;
}