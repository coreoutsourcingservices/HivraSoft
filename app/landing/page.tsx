"use client";

import { useState } from "react";

import Loader from "@/src/components/Loader/Loader";
import IntroExperience from "@/src/components/IntroExperience/IntroExperience";
import DivaStory from "@/src/components/DivaStory/DivaStory";

export default function LandingPage() {
  const [loaderFinished, setLoaderFinished] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  return (
    <main className="min-h-screen bg-[#F7F3EF]">
      {!loaderFinished && (
        <Loader
          onComplete={() => {
            setLoaderFinished(true);
          }}
        />
      )}

      {loaderFinished && !introFinished && (
        <IntroExperience
          onComplete={() => {
            setIntroFinished(true);
          }}
        />
      )}

      {introFinished && (
        <>
          <DivaStory />

          {/* Next website section later yahan add karenge */}

          <section className="flex min-h-screen items-center justify-center bg-[#F7F3EF]">
            <p className="text-xs uppercase tracking-[0.4em] text-[#8C6A52]">
              Hivra Soft Collection
            </p>
          </section>
        </>
      )}
    </main>
  );
}