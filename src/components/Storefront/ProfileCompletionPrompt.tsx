"use client";



import {

  useCallback,

  useEffect,

  useMemo,

  useState,

} from "react";



import {

  usePathname,

} from "next/navigation";



import {

  ApiError,

  apiFetch,

} from "@/lib/api";



/* =========================================================

   TYPES

========================================================= */



type PromptKind =

  | "birthday"

  | "anniversary"

  | "gender";



type Gender =

  | "male"

  | "female"

  | "other";



type Account = {

  id: string;



  name?: string;

  email?: string;

  phone?: string;



  gender?:

    Gender;



  birthday?:

    string | null;



  anniversary?:

    string | null;



  memberSince?:

    string;

};



type AccountResponse = {

  success?: boolean;

  message?: string;



  account?:

    Account;

};



/* =========================================================

   CONSTANTS

========================================================= */



const PROMPT_DELAY_DAYS =

  3;



const DAY_MS =

  24 *

  60 *

  60 *

  1000;



/* =========================================================

   STORAGE

========================================================= */



function deniedKey(

  userId: string,

  kind: PromptKind,

) {

  return `hivrasoft-profile-prompt-denied:${userId}:${kind}`;

}



function completedGenderKey(

  userId: string,

) {

  return `hivrasoft-profile-gender-completed:${userId}`;

}



/* =========================================================

   TODAY

========================================================= */



function todayKey() {

  const now =

    new Date();



  const year =

    now.getFullYear();



  const month =

    String(

      now.getMonth() +

        1,

    ).padStart(

      2,

      "0",

    );



  const day =

    String(

      now.getDate(),

    ).padStart(

      2,

      "0",

    );



  return `${year}-${month}-${day}`;

}



/* =========================================================

   MAIN

========================================================= */



export default function ProfileCompletionPrompt() {

  const pathname =

    usePathname();



  /* =======================================================

     DO NOT SHOW ON THESE PAGES

  ======================================================= */



  const hiddenRoute =
    pathname === "/admin" ||
    pathname.startsWith(
      "/admin/",
    ) ||

    pathname ===

      "/account" ||

    pathname.startsWith(

      "/account/",

    ) ||

    pathname ===

      "/cart" ||

    pathname.startsWith(

      "/cart/",

    ) ||

    pathname ===

      "/wishlist" ||

    pathname.startsWith(

      "/wishlist/",

    ) ||

    pathname ===

      "/checkout" ||

    pathname.startsWith(

      "/checkout/",

    ) ||

    pathname ===

      "/payment" ||

    pathname.startsWith(

      "/payment/",

    ) ||

    pathname ===

      "/thanks" ||

    pathname.startsWith(

      "/thanks/",

    );



  /* =======================================================

     STATE

  ======================================================= */



  const [

    account,

    setAccount,

  ] =

    useState<

      Account | null

    >(

      null,

    );



  const [

    loading,

    setLoading,

  ] =

    useState(

      true,

    );



  const [

    mode,

    setMode,

  ] =

    useState<

      "notice" | "form"

    >(

      "notice",

    );



  const [

    dateValue,

    setDateValue,

  ] =

    useState(

      "",

    );



  const [

    genderValue,

    setGenderValue,

  ] =

    useState<

      Gender | ""

    >(

      "",

    );



  const [

    saving,

    setSaving,

  ] =

    useState(

      false,

    );



  const [

    error,

    setError,

  ] =

    useState(

      "",

    );



  const [

    closedForPage,

    setClosedForPage,

  ] =

    useState(

      false,

    );



  const [

    denied,

    setDenied,

  ] =

    useState<

      Set<PromptKind>

    >(

      () =>

        new Set(),

    );



  const [

    genderCompleted,

    setGenderCompleted,

  ] =

    useState(

      false,

    );



  const [

    successText,

    setSuccessText,

  ] =

    useState(

      "",

    );



  /* =======================================================

     LOAD ACCOUNT

  ======================================================= */



  const loadAccount =

    useCallback(

      async () => {

        try {

          const response =

            await apiFetch<AccountResponse>(

              "/api/auth/account",

              {

                method:

                  "GET",

              },

            );



          const nextAccount =

            response.account ||

            null;



          setAccount(

            nextAccount,

          );



          if (

            nextAccount?.id

          ) {

            const nextDenied =

              new Set<PromptKind>();



            (

              [

                "birthday",

                "anniversary",

                "gender",

              ] as PromptKind[]

            ).forEach(

              (

                kind,

              ) => {

                if (

                  window.localStorage.getItem(

                    deniedKey(

                      nextAccount.id,

                      kind,

                    ),

                  ) ===

                  "1"

                ) {

                  nextDenied.add(

                    kind,

                  );

                }

              },

            );



            setDenied(

              nextDenied,

            );



            setGenderCompleted(

              window.localStorage.getItem(

                completedGenderKey(

                  nextAccount.id,

                ),

              ) ===

                "1",

            );

          }

        } catch (

          fetchError

        ) {

          if (

            fetchError instanceof

              ApiError &&

            (

              fetchError.status ===

                401 ||

              fetchError.status ===

                403

            )

          ) {

            setAccount(

              null,

            );



            return;

          }



          setAccount(

            null,

          );

        } finally {

          setLoading(

            false,

          );

        }

      },

      [],

    );



  /* =======================================================

     INITIAL LOAD

  ======================================================= */



  useEffect(() => {

    void loadAccount();

  }, [

    loadAccount,

  ]);



  /* =======================================================

     AUTH CHANGE

  ======================================================= */



  useEffect(() => {

    const handleAuthChange =

      () => {

        setLoading(

          true,

        );



        void loadAccount();

      };



    window.addEventListener(

      "hivrasoft-auth-changed",

      handleAuthChange,

    );



    return () => {

      window.removeEventListener(

        "hivrasoft-auth-changed",

        handleAuthChange,

      );

    };

  }, [

    loadAccount,

  ]);



  /* =======================================================

     NEW PAGE



     X press kiya ho to next normal storefront page

     par missing prompt fir aa sakta hai.

  ======================================================= */



  useEffect(() => {

    setClosedForPage(

      false,

    );



    setMode(

      "notice",

    );



    setDateValue(

      "",

    );



    setGenderValue(

      "",

    );



    setError(

      "",

    );

  }, [

    pathname,

  ]);



  /* =======================================================

     3 DAY DELAY

  ======================================================= */



  const delayPassed =

    useMemo(

      () => {

        if (

          !account

        ) {

          return false;

        }



        if (

          !account.memberSince

        ) {

          return true;

        }



        const createdAt =

          new Date(

            account.memberSince,

          ).getTime();



        if (

          Number.isNaN(

            createdAt,

          )

        ) {

          return true;

        }



        return (

          Date.now() -

            createdAt >=

          PROMPT_DELAY_DAYS *

            DAY_MS

        );

      },

      [

        account,

      ],

    );



  /* =======================================================

     WHICH PROMPT SHOULD SHOW



     Priority:

     1 Birthday

     2 Anniversary

     3 Gender

  ======================================================= */



  const promptKind =

    useMemo<

      PromptKind | null

    >(

      () => {

        if (

          !account ||

          !delayPassed

        ) {

          return null;

        }



        if (

          !account.birthday &&

          !denied.has(

            "birthday",

          )

        ) {

          return "birthday";

        }



        if (

          !account.anniversary &&

          !denied.has(

            "anniversary",

          )

        ) {

          return "anniversary";

        }



        const genderMissing =

          !account.gender ||

          (

            account.gender ===

              "other" &&

            !genderCompleted

          );



        if (

          genderMissing &&

          !denied.has(

            "gender",

          )

        ) {

          return "gender";

        }



        return null;

      },

      [

        account,

        delayPassed,

        denied,

        genderCompleted,

      ],

    );



  /* =======================================================

     PROMPT COPY

  ======================================================= */



  const promptContent =

    useMemo(

      () => {

        if (

          promptKind ===

          "birthday"

        ) {

          return {

            icon:

              "🎂",



            title:

              "Add your birthday",



            description:

              "Share your birthday and unlock a little surprise from HivraSoft.",



            button:

              "Add Birthday",

          };

        }



        if (

          promptKind ===

          "anniversary"

        ) {

          return {

            icon:

              "💝",



            title:

              "Add your anniversary",



            description:

              "Save your special date so we can make your celebrations more special.",



            button:

              "Add Anniversary",

          };

        }



        return {

          icon:

            "✨",



          title:

            "Complete your profile",



          description:

            "Tell us your gender to help us personalize your HivraSoft experience.",



          button:

            "Add Gender",

        };

      },

      [

        promptKind,

      ],

    );



  /* =======================================================

     OPEN FORM

  ======================================================= */



  function openForm() {

    setMode(

      "form",

    );



    setError(

      "",

    );



    setDateValue(

      "",

    );



    setGenderValue(

      "",

    );

  }



  /* =======================================================

     CLOSE



     Sirf current page/session view close.

     Permanent denial nahi.

  ======================================================= */



  function closePrompt() {

    if (

      saving

    ) {

      return;

    }



    setClosedForPage(

      true,

    );



    setMode(

      "notice",

    );



    setError(

      "",

    );

  }



  /* =======================================================

     DON'T ASK AGAIN

  ======================================================= */



  function denyPrompt() {

    if (

      !account ||

      !promptKind

    ) {

      return;

    }



    window.localStorage.setItem(

      deniedKey(

        account.id,

        promptKind,

      ),

      "1",

    );



    setDenied(

      (

        current,

      ) => {

        const next =

          new Set(

            current,

          );



        next.add(

          promptKind,

        );



        return next;

      },

    );



    setMode(

      "notice",

    );



    setDateValue(

      "",

    );



    setGenderValue(

      "",

    );



    setError(

      "",

    );

  }



  /* =======================================================

     SAVE

  ======================================================= */



  async function saveProfileField() {

    if (

      !account ||

      !promptKind

    ) {

      return;

    }



    let body:

      Record<

        string,

        unknown

      > = {};



    if (

      promptKind ===

        "birthday"

    ) {

      if (

        !dateValue

      ) {

        setError(

          "Please select your birthday.",

        );



        return;

      }



      body = {

        birthday:

          dateValue,

      };

    }



    if (

      promptKind ===

        "anniversary"

    ) {

      if (

        !dateValue

      ) {

        setError(

          "Please select your anniversary date.",

        );



        return;

      }



      body = {

        anniversary:

          dateValue,

      };

    }



    if (

      promptKind ===

        "gender"

    ) {

      if (

        !genderValue

      ) {

        setError(

          "Please select your gender.",

        );



        return;

      }



      body = {

        gender:

          genderValue,

      };

    }



    setSaving(

      true,

    );



    setError(

      "",

    );



    try {

      const response =

        await apiFetch<AccountResponse>(

          "/api/auth/account",

          {

            method:

              "PATCH",



            body,

          },

        );



      const updatedAccount =

        response.account ||

        {

          ...account,

          ...body,

        };



      setAccount(

        updatedAccount as Account,

      );



      /* ===============================================

         Gender "other" backend default ke equal hai.



         Isliye user ne actual form complete kiya hai,

         ye local marker maintain karenge.

      =============================================== */



      if (

        promptKind ===

        "gender"

      ) {

        window.localStorage.setItem(

          completedGenderKey(

            account.id,

          ),

          "1",

        );



        setGenderCompleted(

          true,

        );

      }



      if (

        promptKind ===

        "birthday"

      ) {

        setSuccessText(

          "Birthday saved successfully 🎂",

        );

      } else if (

        promptKind ===

        "anniversary"

      ) {

        setSuccessText(

          "Anniversary saved successfully 💝",

        );

      } else {

        setSuccessText(

          "Profile updated successfully ✨",

        );

      }



      setMode(

        "notice",

      );



      setDateValue(

        "",

      );



      setGenderValue(

        "",

      );



      window.setTimeout(

        () => {

          setSuccessText(

            "",

          );

        },

        1600,

      );

    } catch (

      saveError

    ) {

      if (

        saveError instanceof

          ApiError &&

        (

          saveError.status ===

            401 ||

          saveError.status ===

            403

        )

      ) {

        setAccount(

          null,

        );



        return;

      }



      setError(

        saveError instanceof

          Error

          ? saveError.message

          : "Unable to update your account.",

      );

    } finally {

      setSaving(

        false,

      );

    }

  }



  /* =======================================================

     NOTHING TO SHOW

  ======================================================= */



  if (

    hiddenRoute ||

    loading ||

    !account ||

    !delayPassed

  ) {

    return null;

  }



  /* =======================================================

     SUCCESS

  ======================================================= */



  if (

    successText

  ) {

    return (

      <div

        className="

          fixed



          right-3

          top-[165px]



          z-[9960]



          w-[calc(100vw-24px)]

          max-w-[300px]



          rounded-[16px]



          border

          border-[#BCE8CC]



          bg-white/95



          px-4

          py-4



          shadow-[0_16px_45px_rgba(25,119,61,.18)]



          backdrop-blur-xl



          sm:right-5



          lg:right-7

          lg:top-[180px]

        "

      >

        <div

          className="

            flex



            items-center



            gap-3

          "

        >

          <span

            className="

              flex



              h-10

              w-10



              shrink-0



              items-center

              justify-center



              rounded-full



              bg-[#E3F8EA]



              text-[#178A45]

            "

          >

            ✓

          </span>



          <p

            className="

              text-[11px]



              font-bold



              text-[#185D32]

            "

          >

            {

              successText

            }

          </p>

        </div>

      </div>

    );

  }



  if (

    !promptKind ||

    closedForPage

  ) {

    return null;

  }



  /* =======================================================

     RENDER

  ======================================================= */



  return (

    <div

      className="

        fixed



        right-3

        top-[155px]



        z-[9960]



        w-[calc(100vw-24px)]

        max-w-[320px]



        overflow-hidden



        rounded-[18px]



        border

        border-[#F0D4DD]



        bg-white/95



        shadow-[0_18px_55px_rgba(74,19,39,.20)]



        backdrop-blur-xl



        sm:right-5



        lg:right-7

        lg:top-[175px]

      "

    >

      {/* =================================================

          TOP ACCENT

      ================================================= */}



      <div

        className="

          h-[3px]



          w-full



          bg-gradient-to-r



          from-[#B31345]

          via-[#EC4F83]

          to-[#FF9DBD]

        "

      />



      {/* =================================================

          HEADER

      ================================================= */}



      <div

        className="

          flex



          items-start

          justify-between



          gap-3



          px-4

          pb-3

          pt-4

        "

      >

        <div

          className="

            flex



            min-w-0



            items-start



            gap-3

          "

        >

          <span

            className="

              flex



              h-10

              w-10



              shrink-0



              items-center

              justify-center



              rounded-full



              bg-[#FFF0F4]



              text-[20px]

            "

          >

            {

              promptContent.icon

            }

          </span>



          <div

            className="

              min-w-0

            "

          >

            <p

              className="

                text-[12px]



                font-extrabold



                text-[#2B2023]

              "

            >

              {

                promptContent.title

              }

            </p>



            <p

              className="

                mt-1



                text-[8px]



                leading-4



                text-black/50

              "

            >

              {

                promptContent.description

              }

            </p>

          </div>

        </div>



        {/* CLOSE */}



        <button

          type="button"

          aria-label="Close"

          onClick={

            closePrompt

          }

          className="

            flex



            h-7

            w-7



            shrink-0



            cursor-pointer



            items-center

            justify-center



            rounded-full



            border-0



            bg-[#F7F3F4]



            text-[16px]



            text-black/40



            transition



            hover:bg-[#F2E8EB]

            hover:text-black

          "

        >

          ×

        </button>

      </div>



      {/* =================================================

          NORMAL NOTIFICATION

      ================================================= */}



      {mode ===

      "notice" ? (

        <div

          className="

            px-4

            pb-4

          "

        >

          <button

            type="button"

            onClick={

              openForm

            }

            className="

              h-10

              w-full



              cursor-pointer



              rounded-[9px]



              border-0



              bg-[#D41455]



              text-[9px]



              font-bold



              text-white



              shadow-[0_6px_18px_rgba(212,20,85,.18)]



              transition



              hover:bg-[#B51147]

            "

          >

            {

              promptContent.button

            }

          </button>



          <button

            type="button"

            onClick={

              denyPrompt

            }

            className="

              mt-2



              h-8

              w-full



              cursor-pointer



              border-0



              bg-transparent



              text-[8px]



              font-medium



              text-black/45



              transition



              hover:text-[#B31345]

            "

          >

            Don&apos;t ask me again

          </button>

        </div>

      ) : (

        /* =================================================

           FORM

        ================================================= */



        <div

          className="

            border-t

            border-[#F2E4E8]



            px-4

            pb-4

            pt-3

          "

        >

          {/* =============================================

              BIRTHDAY / ANNIVERSARY

          ============================================= */}



          {promptKind ===

            "birthday" ||

          promptKind ===

            "anniversary" ? (

            <>

              <label

                className="

                  text-[8px]



                  font-bold



                  uppercase



                  tracking-[0.08em]



                  text-[#66575C]

                "

              >

                {promptKind ===

                "birthday"

                  ? "Birthday"

                  : "Anniversary Date"}

              </label>



              <input

                type="date"

                value={

                  dateValue

                }

                max={

                  todayKey()

                }

                onChange={(

                  event,

                ) => {

                  setDateValue(

                    event.target.value,

                  );



                  setError(

                    "",

                  );

                }}

                className="

                  mt-2



                  block



                  h-10

                  w-full



                  rounded-[9px]



                  border

                  border-[#E5D6DB]



                  bg-white



                  px-3



                  text-[10px]



                  font-medium



                  text-[#231B1D]



                  outline-none



                  focus:border-[#DD7396]

                  focus:ring-2

                  focus:ring-[#FBE1E9]

                "

              />

            </>

          ) : null}



          {/* =============================================

              GENDER

          ============================================= */}



          {promptKind ===

          "gender" ? (

            <>

              <p

                className="

                  text-[8px]



                  font-bold



                  uppercase



                  tracking-[0.08em]



                  text-[#66575C]

                "

              >

                Select Gender

              </p>



              <div

                className="

                  mt-2



                  grid



                  grid-cols-3



                  gap-2

                "

              >

                {(

                  [

                    {

                      value:

                        "female",



                      label:

                        "Female",

                    },



                    {

                      value:

                        "male",



                      label:

                        "Male",

                    },



                    {

                      value:

                        "other",



                      label:

                        "Other",

                    },

                  ] as {

                    value:

                      Gender;



                    label:

                      string;

                  }[]

                ).map(

                  (

                    option,

                  ) => (

                    <button

                      key={

                        option.value

                      }

                      type="button"

                      onClick={() => {

                        setGenderValue(

                          option.value,

                        );



                        setError(

                          "",

                        );

                      }}

                      className={`

                        h-9



                        cursor-pointer



                        rounded-[8px]



                        border



                        text-[8px]



                        font-bold



                        transition



                        ${

                          genderValue ===

                          option.value

                            ? `

                              border-[#D41455]

                              bg-[#FFF0F4]

                              text-[#C0144B]

                            `

                            : `

                              border-[#E8DADF]

                              bg-white

                              text-[#55494D]



                              hover:border-[#E38BA7]

                            `

                        }

                      `}

                    >

                      {

                        option.label

                      }

                    </button>

                  ),

                )}

              </div>

            </>

          ) : null}



          {/* =============================================

              ERROR

          ============================================= */}



          {error ? (

            <p

              className="

                mt-2



                text-[8px]



                font-medium



                text-[#CF3544]

              "

            >

              {

                error

              }

            </p>

          ) : null}



          {/* =============================================

              ACTIONS

          ============================================= */}



          <div

            className="

              mt-3



              flex



              gap-2

            "

          >

            <button

              type="button"

              disabled={

                saving

              }

              onClick={() => {

                setMode(

                  "notice",

                );



                setError(

                  "",

                );

              }}

              className="

                h-9



                flex-1



                cursor-pointer



                rounded-[8px]



                border

                border-[#E6D7DC]



                bg-white



                text-[8px]



                font-bold



                text-[#5A4C51]



                disabled:opacity-50

              "

            >

              Back

            </button>



            <button

              type="button"

              disabled={

                saving

              }

              onClick={() =>

                void saveProfileField()

              }

              className="

                h-9



                flex-[1.7]



                cursor-pointer



                rounded-[8px]



                border-0



                bg-[#D41455]



                text-[8px]



                font-bold



                text-white



                transition



                hover:bg-[#B51147]



                disabled:cursor-not-allowed

                disabled:opacity-50

              "

            >

              {saving

                ? "Saving..."

                : "Save"}

            </button>

          </div>



          <button

            type="button"

            onClick={

              denyPrompt

            }

            className="

              mt-2



              h-7

              w-full



              cursor-pointer



              border-0



              bg-transparent



              text-[7px]



              font-medium



              text-black/40



              hover:text-[#B31345]

            "

          >

            Don&apos;t ask me again

          </button>

        </div>

      )}

    </div>

  );

}