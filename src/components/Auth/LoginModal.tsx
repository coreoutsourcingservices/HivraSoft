"use client";

import {
  createPortal,
} from "react-dom";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";


type Mode =
  | "login"
  | "register";

type Step =
  | "details"
  | "otp"
  | "success";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
};


const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";


export default function LoginModal({
  open,
  onClose,
}: LoginModalProps) {
  const [mounted, setMounted] =
    useState(false);

  const [mode, setMode] =
    useState<Mode>("login");

  const [step, setStep] =
    useState<Step>("details");

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [otp, setOtp] =
    useState<string[]>([
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

  const [error, setError] =
    useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    resendSeconds,
    setResendSeconds,
  ] = useState(0);

  const [
    videoBlocked,
    setVideoBlocked,
  ] = useState(false);

  const otpRefs =
    useRef<
      Array<HTMLInputElement | null>
    >([]);

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );


  useEffect(() => {
    setMounted(true);
  }, []);


  useEffect(() => {
    if (
      resendSeconds <= 0
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setResendSeconds(
            (value) =>
              value > 0
                ? value - 1
                : 0
          );
        },
        1000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [resendSeconds]);


  const resetModal = () => {
    setMode("login");
    setStep("details");

    setName("");
    setPhone("");
    setEmail("");

    setOtp([
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    setError("");
    setIsLoading(false);

    setResendSeconds(0);
    setVideoBlocked(false);
  };


  const handleClose = () => {
    const video =
      videoRef.current;

    if (video) {
      video.pause();
      video.currentTime = 0;
    }

    resetModal();
    onClose();
  };


  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow = "hidden";

    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        handleClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style
        .overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [open]);


  useEffect(() => {
    if (
      step !== "success" ||
      !open
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        async () => {
          const video =
            videoRef.current;

          if (!video) {
            return;
          }

          video.currentTime = 0;
          video.muted = false;
          video.volume = 1;

          try {
            await video.play();

            setVideoBlocked(
              false
            );
          } catch {
            setVideoBlocked(
              true
            );
          }
        },
        100
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [step, open]);


  const readResponse =
    async (
      response: Response
    ) => {
      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Something went wrong."
        );
      }

      return data;
    };


  const validateEmail = (
    value: string
  ) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value
    );
  };


  const sendOtp =
    async () => {
      const cleanEmail =
        email
          .trim()
          .toLowerCase();

      if (
        !validateEmail(
          cleanEmail
        )
      ) {
        throw new Error(
          "Please enter a valid email address."
        );
      }

      if (
        mode ===
        "register"
      ) {
        if (
          name.trim().length <
          2
        ) {
          throw new Error(
            "Please enter your name."
          );
        }

        const cleanPhone =
          phone.replace(
            /\D/g,
            ""
          );

        if (
          cleanPhone.length !==
          10
        ) {
          throw new Error(
            "Please enter a valid 10 digit mobile number."
          );
        }

        setPhone(
          cleanPhone
        );
      }

      setEmail(
        cleanEmail
      );

      const endpoint =
        mode === "register"
          ? "/api/auth/register/send-otp"
          : "/api/auth/login/send-otp";

      const response =
        await fetch(
          `${API_URL}${endpoint}`,
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                email:
                  cleanEmail,
              }),
          }
        );

      await readResponse(
        response
      );

      setOtp([
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      setStep("otp");
      setResendSeconds(60);

      window.setTimeout(
        () => {
          otpRefs.current[0]?.focus();
        },
        100
      );
    };


  const handleDetailsSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (isLoading) {
        return;
      }

      setError("");
      setIsLoading(true);

      try {
        await sendOtp();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
      } finally {
        setIsLoading(false);
      }
    };


  const verifyOtp =
    async (
      enteredOtp: string
    ) => {
      if (
        enteredOtp.length !==
          6 ||
        isLoading
      ) {
        return;
      }

      setError("");
      setIsLoading(true);

      try {
        const endpoint =
          mode ===
          "register"
            ? "/api/auth/register/verify-otp"
            : "/api/auth/login/verify-otp";

        const payload =
          mode ===
          "register"
            ? {
                name:
                  name.trim(),

                phone,

                email,

                otp:
                  enteredOtp,
              }
            : {
                email,
                otp:
                  enteredOtp,
              };

        const response =
          await fetch(
            `${API_URL}${endpoint}`,
            {
              method:
                "POST",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        const data =
          await readResponse(
            response
          );

        const user =
          data.user as AuthUser;

        window.dispatchEvent(
          new CustomEvent(
            "hivrasoft-auth-changed",
            {
              detail: user,
            }
          )
        );

        setStep("success");
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "OTP verification failed."
        );

        setOtp([
          "",
          "",
          "",
          "",
          "",
          "",
        ]);

        window.setTimeout(
          () => {
            otpRefs.current[0]?.focus();
          },
          100
        );
      } finally {
        setIsLoading(false);
      }
    };


  const handleOtpChange = (
    index: number,
    value: string
  ) => {
    if (isLoading) {
      return;
    }

    const cleanValue =
      value.replace(
        /\D/g,
        ""
      );

    const nextOtp =
      [...otp];

    if (!cleanValue) {
      nextOtp[index] =
        "";

      setOtp(
        nextOtp
      );

      return;
    }

    nextOtp[index] =
      cleanValue.slice(
        -1
      );

    setOtp(nextOtp);
    setError("");

    if (index < 5) {
      otpRefs.current[
        index + 1
      ]?.focus();
    }

    const enteredOtp =
      nextOtp.join("");

    if (
      enteredOtp.length ===
      6
    ) {
      void verifyOtp(
        enteredOtp
      );
    }
  };


  const handleOtpKeyDown = (
    index: number,
    event:
      ReactKeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key ===
        "Backspace" &&
      otp[index] ===
        "" &&
      index > 0
    ) {
      otpRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key ===
        "ArrowLeft" &&
      index > 0
    ) {
      otpRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key ===
        "ArrowRight" &&
      index < 5
    ) {
      otpRefs.current[
        index + 1
      ]?.focus();
    }
  };


  const handleResend =
    async () => {
      if (
        resendSeconds > 0 ||
        isLoading
      ) {
        return;
      }

      setError("");
      setIsLoading(true);

      try {
        await sendOtp();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to resend OTP."
        );
      } finally {
        setIsLoading(false);
      }
    };


  const switchMode = (
    nextMode: Mode
  ) => {
    if (
      mode === nextMode
    ) {
      return;
    }

    setMode(nextMode);
    setStep("details");

    setOtp([
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    setError("");
    setResendSeconds(0);
  };


  const handleManualVideoPlay =
    async () => {
      const video =
        videoRef.current;

      if (!video) {
        return;
      }

      try {
        video.currentTime = 0;
        video.muted = false;
        video.volume = 1;

        await video.play();

        setVideoBlocked(
          false
        );
      } catch {
        setVideoBlocked(
          true
        );
      }
    };


  if (
    !mounted ||
    !open
  ) {
    return null;
  }


  return createPortal(
    <div
      className="
        fixed
        inset-0
        z-[99999]
        flex
        items-center
        justify-center
        overflow-y-auto
        bg-black/50
        px-4
        py-6
        backdrop-blur-[5px]
      "
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      {step ===
      "success" ? (
        <div
          className="
            relative
            flex
            w-full
            max-w-[430px]
            items-center
            justify-center
          "
          onMouseDown={(
            event
          ) =>
            event.stopPropagation()
          }
        >
          <button
            type="button"
            onClick={
              handleClose
            }
            className="
              absolute
              right-2
              top-2
              z-30
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-black/30
              text-xl
              text-white
            "
          >
            ×
          </button>

          <video
            ref={videoRef}
            src="/images/logos/hivralogin.mp4"
            preload="auto"
            autoPlay
            playsInline
            onEnded={
              handleClose
            }
            className="
              max-h-[78vh]
              w-full
              object-contain
            "
          />

          {videoBlocked && (
            <button
              type="button"
              onClick={
                handleManualVideoPlay
              }
              className="
                absolute
                inset-0
                z-20
                flex
                items-center
                justify-center
                bg-black/35
                text-white
              "
            >
              ▶ Tap to play
            </button>
          )}
        </div>
      ) : (
        <section
          className="
            relative
            w-full
            max-w-[470px]
            overflow-hidden
            rounded-[30px]
            bg-white
            shadow-[0_35px_100px_rgba(0,0,0,0.32)]
          "
          onMouseDown={(
            event
          ) =>
            event.stopPropagation()
          }
        >
          <div
            className="
              relative
              bg-[#211A18]
              px-7
              pb-6
              pt-6
              text-center
              text-white
            "
          >
            <button
              type="button"
              onClick={
                handleClose
              }
              className="
                absolute
                right-5
                top-5
                h-10
                w-10
                rounded-full
                bg-white/10
                text-xl
              "
            >
              ×
            </button>

            <div
              className="
                text-[24px]
                font-semibold
                tracking-[0.12em]
              "
            >
              HIVRASOFT
            </div>
          </div>

          <div
            className="
              px-6
              pb-8
              pt-6
              sm:px-9
            "
          >
            {step ===
              "details" && (
              <>
                <div
                  className="
                    mb-6
                    grid
                    grid-cols-2
                    rounded-[14px]
                    bg-[#F3EEE8]
                    p-1
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      switchMode(
                        "login"
                      )
                    }
                    className={`
                      h-11
                      rounded-[11px]
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-[0.1em]
                      transition
                      ${
                        mode ===
                        "login"
                          ? "bg-[#211A18] text-white"
                          : "text-[#211A18]/55"
                      }
                    `}
                  >
                    Login
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      switchMode(
                        "register"
                      )
                    }
                    className={`
                      h-11
                      rounded-[11px]
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-[0.1em]
                      transition
                      ${
                        mode ===
                        "register"
                          ? "bg-[#211A18] text-white"
                          : "text-[#211A18]/55"
                      }
                    `}
                  >
                    Create Account
                  </button>
                </div>

                <form
                  onSubmit={
                    handleDetailsSubmit
                  }
                  className="space-y-4"
                >
                  {mode ===
                    "register" && (
                    <>
                      <InputField
                        label="Full Name"
                        value={name}
                        onChange={
                          setName
                        }
                        placeholder="Enter your name"
                        autoComplete="name"
                      />

                      <InputField
                        label="Mobile Number"
                        value={phone}
                        onChange={(
                          value
                        ) =>
                          setPhone(
                            value
                              .replace(
                                /\D/g,
                                ""
                              )
                              .slice(
                                0,
                                10
                              )
                          )
                        }
                        placeholder="Enter 10 digit mobile number"
                        type="tel"
                        autoComplete="tel"
                      />
                    </>
                  )}

                  <InputField
                    label="Email Address"
                    value={email}
                    onChange={
                      setEmail
                    }
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                  />

                  {error && (
                    <ErrorMessage
                      text={
                        error
                      }
                    />
                  )}

                  <button
                    type="submit"
                    disabled={
                      isLoading
                    }
                    className="
                      flex
                      h-[52px]
                      w-full
                      items-center
                      justify-center
                      rounded-[14px]
                      bg-[#211A18]
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-[0.16em]
                      text-white
                      transition
                      hover:bg-[#8C1839]
                      disabled:opacity-60
                    "
                  >
                    {isLoading
                      ? "Sending..."
                      : "Send OTP"}
                  </button>

                  <PrivacyText />
                </form>
              </>
            )}

            {step ===
              "otp" && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(
                      "details"
                    );

                    setOtp([
                      "",
                      "",
                      "",
                      "",
                      "",
                      "",
                    ]);

                    setError(
                      ""
                    );
                  }}
                  className="
                    mb-4
                    text-[11px]
                    font-medium
                    text-[#211A18]/50
                    hover:text-[#8C1839]
                  "
                >
                  ← Change details
                </button>

                <div
                  className="
                    mb-5
                    text-center
                  "
                >
                  <p
                    className="
                      text-[12px]
                      text-[#211A18]/50
                    "
                  >
                    OTP sent to
                  </p>

                  <p
                    className="
                      mt-1
                      text-[13px]
                      font-semibold
                      text-[#211A18]
                    "
                  >
                    {email}
                  </p>
                </div>

                <div
                  className="
                    rounded-[28px]
                    bg-[#171415]
                    px-3
                    py-9
                    sm:px-5
                  "
                >
                  <div
                    className="
                      flex
                      justify-center
                      gap-1.5
                      sm:gap-2.5
                    "
                  >
                    {otp.map(
                      (
                        digit,
                        index
                      ) => (
                        <input
                          key={
                            index
                          }
                          ref={(
                            element
                          ) => {
                            otpRefs.current[
                              index
                            ] =
                              element;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={
                            1
                          }
                          value={
                            digit
                          }
                          disabled={
                            isLoading
                          }
                          onChange={(
                            event
                          ) =>
                            handleOtpChange(
                              index,
                              event
                                .target
                                .value
                            )
                          }
                          onKeyDown={(
                            event
                          ) =>
                            handleOtpKeyDown(
                              index,
                              event
                            )
                          }
                          className="
                            h-[62px]
                            w-[44px]
                            rounded-[13px]
                            border
                            border-white/15
                            bg-[#100E0F]
                            text-center
                            text-[23px]
                            font-semibold
                            text-white
                            outline-none
                            transition
                            focus:border-[#D34352]
                            sm:h-[70px]
                            sm:w-[52px]
                          "
                        />
                      )
                    )}
                  </div>

                  <div
                    className="
                      mt-7
                      text-center
                    "
                  >
                    {isLoading ? (
                      <p
                        className="
                          text-[12px]
                          text-white/55
                        "
                      >
                        Verifying...
                      </p>
                    ) : resendSeconds >
                      0 ? (
                      <p
                        className="
                          text-[12px]
                          text-white/40
                        "
                      >
                        Resend OTP in{" "}
                        {
                          resendSeconds
                        }
                        s
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={
                          handleResend
                        }
                        className="
                          text-[12px]
                          font-semibold
                          text-white
                          hover:text-[#D34352]
                        "
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                {error && (
                  <ErrorMessage
                    text={
                      error
                    }
                  />
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>,
    document.body
  );
}


function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        className="
          mb-2
          block
          text-[10px]
          font-semibold
          uppercase
          tracking-[0.15em]
          text-[#211A18]/60
        "
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        autoComplete={
          autoComplete
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="
          h-[56px]
          w-full
          rounded-[14px]
          border
          border-[#211A18]/20
          bg-[#FAF8F6]
          px-4
          text-[14px]
          text-[#211A18]
          outline-none
          transition
          placeholder:text-[#211A18]/30
          focus:border-[#8C1839]
          focus:ring-4
          focus:ring-[#8C1839]/5
        "
      />
    </div>
  );
}


function ErrorMessage({
  text,
}: {
  text: string;
}) {
  return (
    <div
      className="
        mt-4
        rounded-[12px]
        border
        border-red-200
        bg-red-50
        px-4
        py-3
        text-[11px]
        text-red-600
      "
    >
      {text}
    </div>
  );
}


function PrivacyText() {
  return (
    <p
      className="
        mx-auto
        mt-5
        max-w-[340px]
        text-center
        text-[10px]
        leading-[18px]
        text-[#211A18]/40
      "
    >
      By proceeding, you agree
      to HivraSoft&apos;s Privacy
      Policy and Terms of Use.
    </p>
  );
}