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
  type MutableRefObject,
  type ReactNode,
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
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const LOGIN_IMAGE =
  "/images/auth/account-profile.jpeg";

const SIGNUP_IMAGE =
  "/images/auth/account-profile.jpeg";

const SUCCESS_VIDEO =
  "/images/logos/hivralogin.mp4";

export default function LoginModal({
  open,
  onClose,
}: LoginModalProps) {
  const [
    mounted,
    setMounted,
  ] =
    useState(false);

  const [
    mode,
    setMode,
  ] =
    useState<Mode>(
      "login",
    );

  const [
    step,
    setStep,
  ] =
    useState<Step>(
      "details",
    );

  const [
    name,
    setName,
  ] =
    useState("");

  const [
    phone,
    setPhone,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    otp,
    setOtp,
  ] =
    useState<string[]>([
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const [
    resendSeconds,
    setResendSeconds,
  ] =
    useState(0);

  const [
    videoBlocked,
    setVideoBlocked,
  ] =
    useState(false);

  const otpRefs =
    useRef<
      Array<HTMLInputElement | null>
    >([]);

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null,
    );

  useEffect(() => {
    setMounted(
      true,
    );
  }, []);

  useEffect(() => {
    if (
      !open
    ) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    const handleEscape =
      (
        event:
          KeyboardEvent,
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
      handleEscape,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [
    open,
  ]);

  useEffect(() => {
    if (
      resendSeconds <=
      0
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setResendSeconds(
            (
              value,
            ) =>
              value >
              0
                ? value -
                  1
                : 0,
          );
        },
        1000,
      );

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [
    resendSeconds,
  ]);

  useEffect(() => {
    if (
      step !==
        "success" ||
      !open
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        async () => {
          const video =
            videoRef.current;

          if (
            !video
          ) {
            return;
          }

          video.currentTime =
            0;

          video.muted =
            false;

          video.volume =
            1;

          try {
            await video.play();

            setVideoBlocked(
              false,
            );
          } catch {
            setVideoBlocked(
              true,
            );
          }
        },
        100,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    step,
    open,
  ]);

  function resetOtp() {
    setOtp([
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
  }

  function resetModal() {
    setMode(
      "login",
    );

    setStep(
      "details",
    );

    setName(
      "",
    );

    setPhone(
      "",
    );

    setEmail(
      "",
    );

    resetOtp();

    setError(
      "",
    );

    setIsLoading(
      false,
    );

    setResendSeconds(
      0,
    );

    setVideoBlocked(
      false,
    );
  }

  function handleClose() {
    const video =
      videoRef.current;

    if (
      video
    ) {
      video.pause();

      video.currentTime =
        0;
    }

    resetModal();

    onClose();
  }

  async function readResponse(
    response:
      Response,
  ) {
    const data =
      await response.json();

    if (
      !response.ok
    ) {
      throw new Error(
        data.message ||
          "Something went wrong.",
      );
    }

    return data;
  }

  function validateEmail(
    value:
      string,
  ) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value,
    );
  }

  async function sendOtp() {
    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    if (
      !validateEmail(
        cleanEmail,
      )
    ) {
      throw new Error(
        "Please enter a valid email address.",
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
          "Please enter your full name.",
        );
      }

      const cleanPhone =
        phone.replace(
          /\D/g,
          "",
        );

      if (
        cleanPhone.length !==
        10
      ) {
        throw new Error(
          "Please enter a valid 10 digit mobile number.",
        );
      }

      setPhone(
        cleanPhone,
      );
    }

    setEmail(
      cleanEmail,
    );

    const endpoint =
      mode ===
      "register"
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
        },
      );

    await readResponse(
      response,
    );

    resetOtp();

    setStep(
      "otp",
    );

    setResendSeconds(
      60,
    );

    window.setTimeout(
      () => {
        otpRefs.current[0]?.focus();
      },
      100,
    );
  }

  async function handleDetailsSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      isLoading
    ) {
      return;
    }

    setError(
      "",
    );

    setIsLoading(
      true,
    );

    try {
      await sendOtp();
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Something went wrong.",
      );
    } finally {
      setIsLoading(
        false,
      );
    }
  }

  async function verifyOtp(
    enteredOtp:
      string,
  ) {
    if (
      enteredOtp.length !==
        6 ||
      isLoading
    ) {
      return;
    }

    setError(
      "",
    );

    setIsLoading(
      true,
    );

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
                payload,
              ),
          },
        );

      const data =
        await readResponse(
          response,
        );

      const user =
        data.user as
          AuthUser;

      /*
       * Account.tsx is event ko sunega aur
       * current user refresh karega.
       *
       * Account.tsx modal close NAHI karega,
       * taaki success video visible rahe.
       */
      window.dispatchEvent(
        new CustomEvent(
          "hivrasoft-auth-changed",
          {
            detail:
              user,
          },
        ),
      );

      setStep(
        "success",
      );
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "OTP verification failed.",
      );

      resetOtp();

      window.setTimeout(
        () => {
          otpRefs.current[0]?.focus();
        },
        100,
      );
    } finally {
      setIsLoading(
        false,
      );
    }
  }

  function handleOtpChange(
    index:
      number,
    value:
      string,
  ) {
    if (
      isLoading
    ) {
      return;
    }

    const cleanValue =
      value.replace(
        /\D/g,
        "",
      );

    const nextOtp = [
      ...otp,
    ];

    if (
      !cleanValue
    ) {
      nextOtp[index] =
        "";

      setOtp(
        nextOtp,
      );

      return;
    }

    nextOtp[index] =
      cleanValue.slice(
        -1,
      );

    setOtp(
      nextOtp,
    );

    setError(
      "",
    );

    if (
      index <
      5
    ) {
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
        enteredOtp,
      );
    }
  }

  function handleOtpKeyDown(
    index:
      number,
    event:
      ReactKeyboardEvent<HTMLInputElement>,
  ) {
    if (
      event.key ===
        "Backspace" &&
      otp[index] ===
        "" &&
      index >
        0
    ) {
      otpRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key ===
        "ArrowLeft" &&
      index >
        0
    ) {
      otpRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key ===
        "ArrowRight" &&
      index <
        5
    ) {
      otpRefs.current[
        index + 1
      ]?.focus();
    }
  }

  async function handleResend() {
    if (
      resendSeconds >
        0 ||
      isLoading
    ) {
      return;
    }

    setError(
      "",
    );

    setIsLoading(
      true,
    );

    try {
      await sendOtp();
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Unable to resend OTP.",
      );
    } finally {
      setIsLoading(
        false,
      );
    }
  }

  function switchMode(
    nextMode:
      Mode,
  ) {
    if (
      mode ===
      nextMode
    ) {
      return;
    }

    setMode(
      nextMode,
    );

    setStep(
      "details",
    );

    resetOtp();

    setError(
      "",
    );

    setResendSeconds(
      0,
    );
  }

  async function handleManualVideoPlay() {
    const video =
      videoRef.current;

    if (
      !video
    ) {
      return;
    }

    try {
      video.currentTime =
        0;

      video.muted =
        false;

      video.volume =
        1;

      await video.play();

      setVideoBlocked(
        false,
      );
    } catch {
      setVideoBlocked(
        true,
      );
    }
  }

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

        bg-black/55

        px-3
        py-4

        backdrop-blur-[6px]

        sm:px-5
      "
      onMouseDown={(
        event,
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
            event,
          ) =>
            event.stopPropagation()
          }
        >
          <button
            type="button"
            aria-label="Close"
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

              bg-black/35

              text-xl
              text-white
            "
          >
            ×
          </button>

          <video
            ref={
              videoRef
            }
            src={
              SUCCESS_VIDEO
            }
            preload="auto"
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

          {videoBlocked ? (
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
          ) : null}
        </div>
      ) : step ===
        "otp" ? (
        <section
          className="
            relative

            w-full
            max-w-[470px]

            overflow-hidden

            rounded-[22px]

            bg-white

            px-5
            pb-6
            pt-6

            shadow-[0_30px_100px_rgba(0,0,0,0.36)]

            sm:px-7
            sm:pb-7
            sm:pt-7
          "
          onMouseDown={(
            event,
          ) =>
            event.stopPropagation()
          }
        >
          <button
            type="button"
            aria-label="Close"
            onClick={
              handleClose
            }
            className="
              absolute
              right-3
              top-3
              z-40

              flex
              h-9
              w-9

              items-center
              justify-center

              rounded-full

              bg-white

              text-[20px]
              text-black

              shadow-md
            "
          >
            ×
          </button>

          <OtpPanel
            mode={
              mode
            }
            email={
              email
            }
            otp={
              otp
            }
            otpRefs={
              otpRefs
            }
            error={
              error
            }
            isLoading={
              isLoading
            }
            resendSeconds={
              resendSeconds
            }
            onBack={() => {
              setStep(
                "details",
              );

              resetOtp();

              setError(
                "",
              );
            }}
            onChange={
              handleOtpChange
            }
            onKeyDown={
              handleOtpKeyDown
            }
            onResend={() => {
              void handleResend();
            }}
          />
        </section>
      ) : (
        <section
          className="
            relative
            grid

            w-full
            max-w-[820px]

            overflow-hidden

            rounded-[22px]

            bg-white

            shadow-[0_30px_100px_rgba(0,0,0,0.36)]

            md:h-[540px]
            md:grid-cols-[470px_350px]
          "
          onMouseDown={(
            event,
          ) =>
            event.stopPropagation()
          }
        >
          {/* =================================================
              CLOSE
          ================================================= */}

          <button
            type="button"
            aria-label="Close"
            onClick={
              handleClose
            }
            className="
              absolute
              right-3
              top-3
              z-40

              flex
              h-9
              w-9

              items-center
              justify-center

              rounded-full

              bg-white

              text-[20px]
              text-black

              shadow-md
            "
          >
            ×
          </button>

          {/* =================================================
              LEFT FORM
              Desktop exact width: 470px
          ================================================= */}

          <div
            className="
              min-w-0

              overflow-y-auto

              px-5
              pb-5
              pt-5

              sm:px-7
              sm:pb-6
              sm:pt-6

              md:h-[540px]

              lg:px-8
            "
          >
            <p
              className="
                text-[12px]
                font-bold
                uppercase

                tracking-[0.24em]

                text-[#211A18]
              "
            >
              HIVRASOFT
            </p>

            {/* LOGIN TABS ONLY
                Signup Design 1 me tabs nahi dikhayenge.
            */}

            {mode ===
              "login" &&
            step ===
              "details" ? (
              <div
                className="
                  mt-4

                  grid
                  grid-cols-2

                  rounded-[11px]

                  bg-[#F2ECE7]

                  p-1
                "
              >
                <button
                  type="button"
                  className="
                    h-10

                    rounded-[9px]

                    bg-[#2A1B17]

                    text-[10px]
                    font-semibold
                    uppercase

                    tracking-[0.08em]

                    text-white
                  "
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() =>
                    switchMode(
                      "register",
                    )
                  }
                  className="
                    h-10

                    rounded-[9px]

                    text-[10px]
                    font-semibold
                    uppercase

                    tracking-[0.08em]

                    text-[#211A18]/60

                    transition

                    hover:bg-white/70
                    hover:text-[#211A18]
                  "
                >
                  Create Account
                </button>
              </div>
            ) : null}

            <>
                <div
                  className={
                    mode ===
                    "login"
                      ? "mt-5"
                      : "mt-5"
                  }
                >
                  <h2
                    className="
                      text-[25px]
                      font-semibold

                      leading-[1.08]

                      tracking-[-0.04em]

                      text-[#171415]

                      sm:text-[27px]
                    "
                  >
                    {mode ===
                    "register"
                      ? "Create your account"
                      : "Welcome Back ♡"}
                  </h2>

                  <p
                    className="
                      mt-1.5

                      max-w-[400px]

                      text-[11px]

                      leading-[17px]

                      text-[#211A18]/55

                      sm:text-[12px]
                    "
                  >
                    {mode ===
                    "register"
                      ? "Join HivraSoft and explore premium innerwear with secure OTP verification."
                      : "Login to continue to HivraSoft and explore comfort, confidence and style."}
                  </p>
                </div>

                <form
                  onSubmit={
                    handleDetailsSubmit
                  }
                  className="
                    mt-4
                    space-y-2.5
                  "
                >
                  {mode ===
                  "register" ? (
                    <>
                      <AuthInput
                        icon={
                          <UserFieldIcon />
                        }
                        label="Full Name"
                        hint="Enter your full name"
                        value={
                          name
                        }
                        onChange={
                          setName
                        }
                        autoComplete="name"
                      />

                      <AuthInput
                        icon={
                          <PhoneIcon />
                        }
                        label="Mobile Number"
                        hint="Enter 10 digit mobile number"
                        value={
                          phone
                        }
                        onChange={(
                          value,
                        ) =>
                          setPhone(
                            value
                              .replace(
                                /\D/g,
                                "",
                              )
                              .slice(
                                0,
                                10,
                              ),
                          )
                        }
                        type="tel"
                        autoComplete="tel"
                      />
                    </>
                  ) : null}

                  <AuthInput
                    icon={
                      <MailIcon />
                    }
                    label="Email Address"
                    hint={
                      mode ===
                      "register"
                        ? "you@example.com"
                        : "Enter your email address"
                    }
                    value={
                      email
                    }
                    onChange={
                      setEmail
                    }
                    type="email"
                    autoComplete="email"
                  />

                  {error ? (
                    <ErrorMessage
                      text={
                        error
                      }
                    />
                  ) : null}

                  <button
                    type="submit"
                    disabled={
                      isLoading
                    }
                    className={`
                      flex
                      h-[46px]
                      w-full

                      items-center
                      justify-center

                      rounded-[11px]

                      text-[11px]
                      font-semibold

                      transition

                      disabled:cursor-not-allowed
                      disabled:opacity-60

                      ${
                        mode ===
                        "register"
                          ? `
                            bg-[#171415]
                            text-white

                            hover:bg-[#8C1839]
                          `
                          : `
                            bg-[#D70A4E]
                            text-white

                            hover:bg-[#B31345]
                          `
                      }
                    `}
                  >
                    {isLoading
                      ? "Sending OTP..."
                      : mode ===
                          "register"
                        ? "Create Account →"
                        : "Login with OTP →"}
                  </button>

                  <p
                    className="
                      text-center

                      text-[10px]

                      text-[#211A18]/60
                    "
                  >
                    {mode ===
                    "register"
                      ? "Already have an account? "
                      : "New here? "}

                    <button
                      type="button"
                      onClick={() =>
                        switchMode(
                          mode ===
                            "register"
                            ? "login"
                            : "register",
                        )
                      }
                      className="
                        font-semibold

                        text-[#C20D48]

                        underline
                        underline-offset-2
                      "
                    >
                      {mode ===
                      "register"
                        ? "Login"
                        : "Create account"}
                    </button>
                  </p>

                  <PrivacyText />
                </form>
            </>
          </div>

          {/* =================================================
              RIGHT IMAGE
              Desktop exact size: 350 x 540
              Assets: 700 x 1080 = perfect 2x
              So no crop on desktop.
          ================================================= */}

          <div
            className="
              relative

              hidden

              h-[540px]
              w-[350px]

              overflow-hidden

              bg-[#FBE1E7]

              md:block
            "
          >
            <img
              src={
                mode ===
                "register"
                  ? SIGNUP_IMAGE
                  : LOGIN_IMAGE
              }
              alt={
                mode ===
                "register"
                  ? "HivraSoft create account"
                  : "HivraSoft login"
              }
              className="
                h-full
                w-full

                object-cover
                object-center
              "
            />
          </div>
        </section>
      )}
    </div>,
    document.body,
  );
}

function OtpPanel({
  mode,
  email,
  otp,
  otpRefs,
  error,
  isLoading,
  resendSeconds,
  onBack,
  onChange,
  onKeyDown,
  onResend,
}: {
  mode: Mode;
  email: string;
  otp: string[];
  otpRefs:
    MutableRefObject<
      Array<HTMLInputElement | null>
    >;
  error: string;
  isLoading: boolean;
  resendSeconds: number;
  onBack: () => void;
  onChange: (
    index: number,
    value: string,
  ) => void;
  onKeyDown: (
    index: number,
    event:
      ReactKeyboardEvent<HTMLInputElement>,
  ) => void;
  onResend: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={
          onBack
        }
        className="
          text-[10px]
          font-medium

          text-[#211A18]/50

          hover:text-[#8C1839]
        "
      >
        ← Back
      </button>

      <h2
        className="
          mt-4

          text-[24px]
          font-semibold

          tracking-[-0.04em]

          text-[#171415]
        "
      >
        Verify your email
      </h2>

      <p
        className="
          mt-1.5

          text-[11px]

          leading-[17px]

          text-[#211A18]/55
        "
      >
        OTP sent to{" "}

        <span
          className="
            font-semibold
            text-[#211A18]
          "
        >
          {email}
        </span>
      </p>

      <p
        className="
          mt-1

          text-[10px]

          text-[#C20D48]
        "
      >
        {mode ===
        "register"
          ? "Complete verification to create your account."
          : "Complete verification to login securely."}
      </p>

      <div
        className="
          mt-5

          rounded-[18px]

          bg-[#171415]

          px-3
          py-6
        "
      >
        <div
          className="
            flex
            justify-center

            gap-1.5

            sm:gap-2
          "
        >
          {otp.map(
            (
              digit,
              index,
            ) => (
              <input
                key={
                  index
                }
                ref={(
                  element,
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
                  event,
                ) =>
                  onChange(
                    index,
                    event.target
                      .value,
                  )
                }
                onKeyDown={(
                  event,
                ) =>
                  onKeyDown(
                    index,
                    event,
                  )
                }
                className="
                  h-[52px]
                  w-[38px]

                  rounded-[10px]

                  border
                  border-white/15

                  bg-[#100E0F]

                  text-center
                  text-[20px]
                  font-semibold

                  text-white

                  outline-none

                  focus:border-[#D34352]

                  sm:h-[58px]
                  sm:w-[43px]
                "
              />
            ),
          )}
        </div>

        <div
          className="
            mt-5
            text-center
          "
        >
          {isLoading ? (
            <p
              className="
                text-[11px]
                text-white/55
              "
            >
              Verifying...
            </p>
          ) : resendSeconds >
            0 ? (
            <p
              className="
                text-[11px]
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
                onResend
              }
              className="
                text-[11px]
                font-semibold

                text-white

                hover:text-[#F0658B]
              "
            >
              Resend OTP
            </button>
          )}
        </div>
      </div>

      {error ? (
        <ErrorMessage
          text={
            error
          }
        />
      ) : null}
    </div>
  );
}

function AuthInput({
  icon,
  label,
  hint,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  icon:
    ReactNode;
  label:
    string;
  hint:
    string;
  value:
    string;
  onChange:
    (
      value:
        string,
    ) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label
      className="
        flex

        h-[54px]

        w-full

        items-center

        gap-2.5

        rounded-[11px]

        border
        border-[#211A18]/15

        bg-white

        px-3

        transition

        focus-within:border-[#C20D48]/50
        focus-within:ring-4
        focus-within:ring-[#C20D48]/5
      "
    >
      <span
        className="
          flex
          h-8
          w-8

          shrink-0

          items-center
          justify-center

          text-[#211A18]
        "
      >
        {
          icon
        }
      </span>

      <span
        className="
          min-w-0
          flex-1
        "
      >
        <span
          className="
            block

            text-[10px]
            font-medium

            text-[#211A18]/75
          "
        >
          {
            label
          }
        </span>

        <input
          type={
            type
          }
          value={
            value
          }
          autoComplete={
            autoComplete
          }
          onChange={(
            event,
          ) =>
            onChange(
              event.target
                .value,
            )
          }
          placeholder={
            hint
          }
          className="
            mt-0.5

            block
            w-full

            bg-transparent

            text-[11px]

            text-[#211A18]

            outline-none

            placeholder:text-[#211A18]/35
          "
        />
      </span>
    </label>
  );
}

function ErrorMessage({
  text,
}: {
  text:
    string;
}) {
  return (
    <div
      className="
        rounded-[10px]

        border
        border-red-200

        bg-red-50

        px-3
        py-2

        text-[10px]

        text-red-600
      "
    >
      {
        text
      }
    </div>
  );
}

function PrivacyText() {
  return (
    <p
      className="
        mx-auto

        max-w-[350px]

        text-center

        text-[8px]

        leading-[14px]

        text-[#211A18]/38
      "
    >
      By proceeding, you agree to
      HivraSoft&apos;s Privacy Policy
      and Terms of Use.
    </p>
  );
}

function UserFieldIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3.5"
      />

      <path d="M5 20c1-4 3.4-6 7-6s6 2 7 6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6.6 3.5 9 3l2 5-2.1 1.5a15 15 0 0 0 5.6 5.6L16 13l5 2-.5 2.4c-.3 1.4-1.6 2.4-3 2.2-7-.9-12.2-6.1-13.1-13.1-.2-1.4.8-2.7 2.2-3Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />

      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}
