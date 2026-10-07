"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";

import Header from "@/src/components/Header/Header";
import AccountSidebar from "../components/AccountSidebar";

import {
  BriefcaseBusiness,
  Edit3,
  Heart,
  Home,
  Leaf,
  MapPin,
  Package,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  Truck,
  X,
  Zap,
} from "lucide-react";

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

/* =========================================================
   TYPES
========================================================= */

type AddressType =
  | "home"
  | "work"
  | "other";

type Address = {
  id: string;

  userId?: string;

  fullName: string;
  phone: string;

  alternatePhone?: string;

  homeNumber?: string;
  officeNumber?: string;

  addressLine1: string;
  addressLine2?: string;
  landmark?: string;

  city: string;
  district?: string;
  state: string;
  postalCode: string;

  country: string;
  countryCode?: string;

  addressType: AddressType;

  isDefault: boolean;

  isShippingAddress?: boolean;
  isBillingAddress?: boolean;

  instructions?: string;

  createdAt?: string;
  updatedAt?: string;
};

type AddressForm = {
  fullName: string;
  phone: string;
  alternatePhone: string;

  homeNumber: string;
  officeNumber: string;

  addressLine1: string;
  addressLine2: string;
  landmark: string;

  city: string;
  district: string;
  state: string;
  postalCode: string;

  country: string;
  countryCode: string;

  addressType: AddressType;

  isShippingAddress: boolean;
  isBillingAddress: boolean;

  instructions: string;
};

/* =========================================================
   DEFAULT FORM
========================================================= */

const emptyForm: AddressForm = {
  fullName: "",
  phone: "",
  alternatePhone: "",

  homeNumber: "",
  officeNumber: "",

  addressLine1: "",
  addressLine2: "",
  landmark: "",

  city: "",
  district: "",
  state: "",
  postalCode: "",

  country: "India",
  countryCode: "IN",

  addressType: "home",

  isShippingAddress: true,
  isBillingAddress: true,

  instructions: "",
};

/* =========================================================
   WINDOW WIDTH
========================================================= */

function useWindowWidth() {
  const [
    width,
    setWidth,
  ] = useState(1440);

  useEffect(() => {
    const updateWidth =
      () => {
        setWidth(
          window.innerWidth,
        );
      };

    updateWidth();

    window.addEventListener(
      "resize",
      updateWidth,
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateWidth,
      );
    };
  }, []);

  return width;
}

/* =========================================================
   PAGE
========================================================= */

export default function AddressesPage() {
  const width =
    useWindowWidth();

  const isMobile =
    width <= 700;

  const isTablet =
    width <= 1023;

  const isSmallDesktop =
    width <= 1250;

  const [
    addresses,
    setAddresses,
  ] =
    useState<Address[]>(
      [],
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingAddress,
    setEditingAddress,
  ] =
    useState<Address | null>(
      null,
    );

  const [
    form,
    setForm,
  ] =
    useState<AddressForm>(
      emptyForm,
    );

  /* =======================================================
     FETCH ALL
  ======================================================= */

  const fetchAddresses =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/api/address/`,
            {
              method:
                "GET",

              credentials:
                "include",

              cache:
                "no-store",
            },
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data?.message ||
              "Unable to fetch addresses.",
          );
        }

        setAddresses(
          Array.isArray(
            data?.addresses,
          )
            ? data.addresses
            : [],
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to fetch addresses.",
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchAddresses();
  }, []);

  /* =======================================================
     SORT DEFAULT FIRST
  ======================================================= */

  const sortedAddresses =
    useMemo(() => {
      return [
        ...addresses,
      ].sort(
        (a, b) => {
          if (
            a.isDefault ===
            b.isDefault
          ) {
            return 0;
          }

          return a.isDefault
            ? -1
            : 1;
        },
      );
    }, [addresses]);

  /* =======================================================
     OPEN ADD
  ======================================================= */

  const openAddModal =
    () => {
      setEditingAddress(
        null,
      );

      setForm({
        ...emptyForm,
      });

      setError("");
      setSuccessMessage(
        "",
      );

      setModalOpen(true);
    };

  /* =======================================================
     OPEN EDIT
  ======================================================= */

  const openEditModal = (
    address: Address,
  ) => {
    setEditingAddress(
      address,
    );

    setForm({
      fullName:
        address.fullName ||
        "",

      phone:
        address.phone ||
        "",

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
        address.addressLine1 ||
        "",

      addressLine2:
        address.addressLine2 ||
        "",

      landmark:
        address.landmark ||
        "",

      city:
        address.city ||
        "",

      district:
        address.district ||
        "",

      state:
        address.state ||
        "",

      postalCode:
        address.postalCode ||
        "",

      country:
        address.country ||
        "India",

      countryCode:
        address.countryCode ||
        "IN",

      addressType:
        address.addressType ||
        "home",

      isShippingAddress:
        address.isShippingAddress ??
        true,

      isBillingAddress:
        address.isBillingAddress ??
        true,

      instructions:
        address.instructions ||
        "",
    });

    setError("");
    setSuccessMessage(
      "",
    );

    setModalOpen(true);
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal =
    () => {
      if (
        submitting
      ) {
        return;
      }

      setModalOpen(false);

      setEditingAddress(
        null,
      );

      setForm({
        ...emptyForm,
      });
    };

  /* =======================================================
     INPUT
  ======================================================= */

  const updateField = <
    K extends keyof AddressForm,
  >(
    key: K,
    value: AddressForm[K],
  ) => {
    setForm(
      (current) => ({
        ...current,
        [key]:
          value,
      }),
    );
  };

  /* =======================================================
     CREATE / UPDATE
  ======================================================= */

  const handleSubmit =
    async (
      event: FormEvent,
    ) => {
      event.preventDefault();

      try {
        setSubmitting(
          true,
        );

        setError("");

        setSuccessMessage(
          "",
        );

        const isEditing =
          Boolean(
            editingAddress?.id,
          );

        const url =
          isEditing
            ? `${API_URL}/api/address/${editingAddress?.id}`
            : `${API_URL}/api/address/`;

        const response =
          await fetch(
            url,
            {
              method:
                isEditing
                  ? "PUT"
                  : "POST",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  {
                    fullName:
                      form.fullName,

                    phone:
                      form.phone,

                    alternatePhone:
                      form.alternatePhone,

                    homeNumber:
                      form.homeNumber,

                    officeNumber:
                      form.officeNumber,

                    addressLine1:
                      form.addressLine1,

                    addressLine2:
                      form.addressLine2,

                    landmark:
                      form.landmark,

                    city:
                      form.city,

                    district:
                      form.district,

                    state:
                      form.state,

                    postalCode:
                      form.postalCode,

                    country:
                      form.country,

                    countryCode:
                      form.countryCode,

                    addressType:
                      form.addressType,

                    isShippingAddress:
                      form.isShippingAddress,

                    isBillingAddress:
                      form.isBillingAddress,

                    instructions:
                      form.instructions,
                  },
                ),
            },
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data?.message ||
              "Unable to save address.",
          );
        }

        setSuccessMessage(
          isEditing
            ? "Address updated successfully."
            : "Address added successfully.",
        );

        setModalOpen(
          false,
        );

        setEditingAddress(
          null,
        );

        setForm({
          ...emptyForm,
        });

        await fetchAddresses();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to save address.",
        );
      } finally {
        setSubmitting(
          false,
        );
      }
    };

  /* =======================================================
     SET DEFAULT
  ======================================================= */

  const handleSetDefault =
    async (
      addressId: string,
    ) => {
      try {
        setError("");

        setSuccessMessage(
          "",
        );

        const response =
          await fetch(
            `${API_URL}/api/address/${addressId}/default`,
            {
              method:
                "PATCH",

              credentials:
                "include",
            },
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data?.message ||
              "Unable to set default address.",
          );
        }

        setSuccessMessage(
          "Default address updated successfully.",
        );

        await fetchAddresses();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to set default address.",
        );
      }
    };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete =
    async (
      address: Address,
    ) => {
      const confirmed =
        window.confirm(
          `Remove ${address.addressType} address?`,
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");

        setSuccessMessage(
          "",
        );

        const response =
          await fetch(
            `${API_URL}/api/address/${address.id}`,
            {
              method:
                "DELETE",

              credentials:
                "include",
            },
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data?.message ||
              "Unable to delete address.",
          );
        }

        setSuccessMessage(
          "Address removed successfully.",
        );

        await fetchAddresses();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to delete address.",
        );
      }
    };

  /* =======================================================
     STYLES
  ======================================================= */

  const pageStyle:
    CSSProperties = {
    width: "100%",

    minHeight:
      "calc(100vh - 105px)",

    display: "flex",

    flexDirection:
      "column",

    background:
      "#FDFCFB",

    color:
      "#2A2321",

    fontFamily:
      "Arial, Helvetica, sans-serif",
  };

  const layoutStyle:
    CSSProperties = {
    width: "100%",

    maxWidth:
      "1600px",

    margin:
      "0 auto",

    display:
      isTablet
        ? "block"
        : "flex",

    alignItems:
      isTablet
        ? "stretch"
        : "flex-start",

    flex: 1,
  };

  const contentStyle:
    CSSProperties = {
    minWidth: 0,

    flex: 1,

    width:
      "100%",

    maxWidth:
      "100%",

    overflowX:
      "hidden",

    padding:
      isMobile
        ? "14px 12px 30px"
        : isSmallDesktop
          ? "18px 20px 35px"
          : "20px 28px 40px",

    boxSizing:
      "border-box",
  };

  const heroStyle:
    CSSProperties = {
    position:
      "relative",

    width:
      "100%",

    minHeight:
      isMobile
        ? "170px"
        : "180px",

    padding:
      isMobile
        ? "24px 20px"
        : "30px 34px",

    boxSizing:
      "border-box",

    overflow:
      "hidden",

    borderRadius:
      "12px",

    background:
      isMobile
        ? "#F7EAE6"
        : `
          linear-gradient(
            90deg,
            rgba(249, 236, 232, 1) 0%,
            rgba(249, 236, 232, 0.96) 42%,
            rgba(249, 236, 232, 0.55) 64%,
            rgba(249, 236, 232, 0.10) 100%
          ),
          url(
            "https://images.unsplash.com/photo-1598301257982-0cf014dabbcd?auto=format&fit=crop&w=1600&q=85"
          )
          right center / 54% 100%
          no-repeat
        `,
  };

  const breadcrumbStyle:
    CSSProperties = {
    fontSize:
      "11px",

    textTransform:
      "uppercase",

    letterSpacing:
      "0.22em",

    color:
      "#8A7C77",
  };

  const heroTitleStyle:
    CSSProperties = {
    margin:
      "16px 0 0",

    fontFamily:
      'Georgia, "Times New Roman", serif',

    fontSize:
      isMobile
        ? "39px"
        : "50px",

    lineHeight: 1,

    fontWeight: 400,

    color:
      "#261F1D",
  };

  const heartStyle:
    CSSProperties = {
    marginLeft:
      "8px",

    color:
      "#C97078",

    verticalAlign:
      "middle",
  };

  const heroSubtitleStyle:
    CSSProperties = {
    margin:
      "14px 0 0",

    fontSize:
      isMobile
        ? "12px"
        : "14px",

    lineHeight:
      1.6,

    color:
      "#6F6662",
  };

  const bodyGridStyle:
    CSSProperties = {
    width:
      "100%",

    marginTop:
      "16px",

    display:
      isSmallDesktop
        ? "block"
        : "grid",

    gridTemplateColumns:
      "minmax(0, 1fr) 320px",

    gap:
      "18px",
  };

  const leftStyle:
    CSSProperties = {
    minWidth: 0,
  };

  const sectionHeaderStyle:
    CSSProperties = {
    width:
      "100%",

    display:
      "flex",

    flexDirection:
      isMobile
        ? "column"
        : "row",

    alignItems:
      isMobile
        ? "stretch"
        : "center",

    justifyContent:
      "space-between",

    gap:
      "14px",

    marginBottom:
      "12px",
  };

  const sectionTitleStyle:
    CSSProperties = {
    margin: 0,

    fontFamily:
      'Georgia, "Times New Roman", serif',

    fontSize:
      isMobile
        ? "26px"
        : "29px",

    fontWeight:
      400,

    color:
      "#2A2321",
  };

  const addButtonStyle:
    CSSProperties = {
    minWidth:
      isMobile
        ? "100%"
        : "255px",

    height:
      "48px",

    border:
      "none",

    borderRadius:
      "10px",

    background:
      "linear-gradient(90deg, #D9858D 0%, #CF727B 100%)",

    color:
      "#FFFFFF",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "10px",

    fontSize:
      "15px",

    cursor:
      "pointer",

    boxShadow:
      "0 7px 20px rgba(181, 91, 103, 0.14)",
  };

  const listStyle:
    CSSProperties = {
    display:
      "flex",

    flexDirection:
      "column",

    gap:
      "12px",
  };

  const sidePanelStyle:
    CSSProperties = {
    display:
      isSmallDesktop
        ? "none"
        : "flex",

    minHeight:
      "470px",

    padding:
      "28px 24px",

    boxSizing:
      "border-box",

    borderRadius:
      "12px",

    background:
      "linear-gradient(155deg, #F8ECE8 0%, #F7E4E0 100%)",

    flexDirection:
      "column",

    alignItems:
      "center",

    textAlign:
      "center",

    color:
      "#5E3F3C",
  };

  const emptyStyle:
    CSSProperties = {
    minHeight:
      "260px",

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",

    justifyContent:
      "center",

    padding:
      "30px",

    border:
      "1px solid #EBE4E0",

    borderRadius:
      "12px",

    background:
      "#FFFFFF",

    color:
      "#8E7F79",

    textAlign:
      "center",
  };

  const footerStyle:
    CSSProperties = {
    width:
      "100%",

    display:
      isMobile
        ? "none"
        : "grid",

    gridTemplateColumns:
      isTablet
        ? "repeat(2, minmax(0, 1fr))"
        : "repeat(5, minmax(0, 1fr))",

    borderTop:
      "1px solid #ECE5E2",

    background:
      "#FFFFFF",
  };

  const footerItemStyle:
    CSSProperties = {
    minHeight:
      "72px",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "12px",

    padding:
      "12px 18px",

    boxSizing:
      "border-box",

    borderRight:
      "1px solid #EEE8E5",
  };

  return (
    <>
      <Header />

      <div
        style={
          pageStyle
        }
      >
        <main
          style={
            layoutStyle
          }
        >
          <AccountSidebar />

          <section
            style={
              contentStyle
            }
          >
            <section
              style={
                heroStyle
              }
            >
              <div
                style={
                  breadcrumbStyle
                }
              >
                MY ACCOUNT
              </div>

              <h1
                style={
                  heroTitleStyle
                }
              >
                My Addresses

                <Heart
                  size={
                    isMobile
                      ? 34
                      : 42
                  }
                  strokeWidth={
                    1.2
                  }
                  style={
                    heartStyle
                  }
                />
              </h1>

              <p
                style={
                  heroSubtitleStyle
                }
              >
                Manage your saved
                addresses for a
                faster and smoother
                checkout.
              </p>
            </section>

            {error && (
              <div
                style={{
                  marginTop:
                    "14px",

                  padding:
                    "11px 14px",

                  borderRadius:
                    "8px",

                  background:
                    "#FFF0F0",

                  border:
                    "1px solid #F1CACA",

                  color:
                    "#A63B45",

                  fontSize:
                    "12px",
                }}
              >
                {error}
              </div>
            )}

            {successMessage && (
              <div
                style={{
                  marginTop:
                    "14px",

                  padding:
                    "11px 14px",

                  borderRadius:
                    "8px",

                  background:
                    "#EEF8F0",

                  border:
                    "1px solid #CBE6D0",

                  color:
                    "#377B4A",

                  fontSize:
                    "12px",
                }}
              >
                {
                  successMessage
                }
              </div>
            )}

            <div
              style={
                bodyGridStyle
              }
            >
              <div
                style={
                  leftStyle
                }
              >
                <div
                  style={
                    sectionHeaderStyle
                  }
                >
                  <h2
                    style={
                      sectionTitleStyle
                    }
                  >
                    Saved Addresses (
                    {
                      addresses.length
                    }
                    )
                  </h2>

                  <button
                    type="button"
                    onClick={
                      openAddModal
                    }
                    style={
                      addButtonStyle
                    }
                  >
                    <Plus
                      size={23}
                      strokeWidth={
                        1.7
                      }
                    />
                    Add New Address
                  </button>
                </div>

                {loading && (
                  <div
                    style={
                      emptyStyle
                    }
                  >
                    <RefreshCcw
                      size={34}
                      strokeWidth={
                        1.3
                      }
                    />

                    <p
                      style={{
                        margin:
                          "13px 0 0",

                        fontSize:
                          "13px",
                      }}
                    >
                      Loading
                      addresses...
                    </p>
                  </div>
                )}

                {!loading &&
                  sortedAddresses.length ===
                    0 && (
                    <div
                      style={
                        emptyStyle
                      }
                    >
                      <MapPin
                        size={44}
                        strokeWidth={
                          1.2
                        }
                      />

                      <h3
                        style={{
                          margin:
                            "15px 0 6px",

                          fontFamily:
                            "Georgia, serif",

                          fontWeight:
                            400,

                          fontSize:
                            "22px",

                          color:
                            "#4D403C",
                        }}
                      >
                        No saved
                        addresses
                      </h3>

                      <p
                        style={{
                          margin:
                            0,

                          maxWidth:
                            "320px",

                          fontSize:
                            "12px",

                          lineHeight:
                            1.6,
                        }}
                      >
                        Add your first
                        delivery
                        address for
                        faster
                        checkout.
                      </p>
                    </div>
                  )}

                {!loading && (
                  <div
                    style={
                      listStyle
                    }
                  >
                    {sortedAddresses.map(
                      (
                        address,
                      ) => (
                        <AddressCard
                          key={
                            address.id
                          }
                          address={
                            address
                          }
                          mobile={
                            isMobile
                          }
                          onEdit={() =>
                            openEditModal(
                              address,
                            )
                          }
                          onDelete={() =>
                            handleDelete(
                              address,
                            )
                          }
                          onSetDefault={() =>
                            handleSetDefault(
                              address.id,
                            )
                          }
                        />
                      ),
                    )}
                  </div>
                )}
              </div>

              <aside
                style={
                  sidePanelStyle
                }
              >
                <div
                  style={{
                    width:
                      "88px",

                    height:
                      "70px",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    marginTop:
                      "5px",

                    color:
                      "#7A4448",
                  }}
                >
                  <Truck
                    size={67}
                    strokeWidth={
                      1.15
                    }
                  />
                </div>

                <div
                  style={{
                    marginTop:
                      "14px",

                    fontFamily:
                      "cursive",

                    fontSize:
                      "31px",

                    lineHeight:
                      1.25,

                    color:
                      "#70403F",
                  }}
                >
                  Faster deliveries
                  <br />
                  to the places
                  <br />
                  you love ♡
                </div>

                <div
                  style={{
                    width:
                      "100%",

                    height:
                      "1px",

                    margin:
                      "24px 0",

                    background:
                      "rgba(111,65,61,0.15)",
                  }}
                />

                <InfoRow
                  icon={
                    <MapPin
                      size={23}
                    />
                  }
                  title="Save multiple addresses"
                  text="Home, work or anywhere else"
                />

                <InfoRow
                  icon={
                    <Package
                      size={23}
                    />
                  }
                  title="Easily manage your addresses"
                  text="Edit, remove or set a default"
                />

                <InfoRow
                  icon={
                    <Zap
                      size={23}
                    />
                  }
                  title="A smoother, faster checkout"
                  text="Get your favorites sooner"
                />
              </aside>
            </div>
          </section>
        </main>

        <footer
          style={
            footerStyle
          }
        >
          <FooterBenefit
            style={
              footerItemStyle
            }
            icon={
              <Truck
                size={27}
                strokeWidth={
                  1.4
                }
              />
            }
            title="Free Shipping"
            text="On orders above ₹1,499"
          />

          <FooterBenefit
            style={
              footerItemStyle
            }
            icon={
              <RefreshCcw
                size={25}
                strokeWidth={
                  1.4
                }
              />
            }
            title="Easy Returns"
            text="Hassle free within 7 days"
          />

          <FooterBenefit
            style={
              footerItemStyle
            }
            icon={
              <ShieldCheck
                size={27}
                strokeWidth={
                  1.4
                }
              />
            }
            title="Secure Payments"
            text="Safe and trusted"
          />

          <FooterBenefit
            style={
              footerItemStyle
            }
            icon={
              <Leaf
                size={27}
                strokeWidth={
                  1.4
                }
              />
            }
            title="Thoughtfully Made"
            text="For a kinder tomorrow"
          />

          <div
            style={{
              ...footerItemStyle,

              borderRight:
                "none",

              fontFamily:
                "cursive",

              fontSize:
                "19px",

              color:
                "#745553",
            }}
          >
            Style a kinder
            tomorrow ♡
          </div>
        </footer>
      </div>

      {modalOpen && (
        <div
          style={{
            position:
              "fixed",

            inset: 0,

            zIndex:
              9999,

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            padding:
              "18px",

            background:
              "rgba(33,26,24,0.48)",

            backdropFilter:
              "blur(4px)",
          }}
        >
          <form
            onSubmit={
              handleSubmit
            }
            style={{
              width:
                "100%",

              maxWidth:
                "720px",

              maxHeight:
                "90vh",

              overflowY:
                "auto",

              padding:
                isMobile
                  ? "20px 16px"
                  : "25px",

              boxSizing:
                "border-box",

              borderRadius:
                "14px",

              background:
                "#FFFFFF",

              boxShadow:
                "0 25px 80px rgba(33,26,24,0.25)",
            }}
          >
            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "space-between",

                gap:
                  "15px",

                marginBottom:
                  "20px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin:
                      0,

                    fontFamily:
                      "Georgia, serif",

                    fontSize:
                      "28px",

                    fontWeight:
                      400,
                  }}
                >
                  {editingAddress
                    ? "Edit Address"
                    : "Add New Address"}
                </h2>

                <p
                  style={{
                    margin:
                      "6px 0 0",

                    fontSize:
                      "11px",

                    color:
                      "#8A817D",
                  }}
                >
                  Enter your
                  delivery address
                  details.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                style={{
                  width:
                    "40px",

                  height:
                    "40px",

                  flexShrink:
                    0,

                  display:
                    "grid",

                  placeItems:
                    "center",

                  border:
                    "1px solid #E8DFDB",

                  borderRadius:
                    "50%",

                  background:
                    "#FFFFFF",

                  color:
                    "#554C48",

                  cursor:
                    "pointer",
                }}
              >
                <X
                  size={20}
                />
              </button>
            </div>

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  isMobile
                    ? "1fr"
                    : "repeat(2, minmax(0, 1fr))",

                gap:
                  "14px",
              }}
            >
              <Field
                label="Full Name"
                required
                value={
                  form.fullName
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "fullName",
                    value,
                  )
                }
              />

              <Field
                label="Phone"
                required
                value={
                  form.phone
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "phone",
                    value,
                  )
                }
              />

              <Field
                label="Alternate Phone"
                value={
                  form.alternatePhone
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "alternatePhone",
                    value,
                  )
                }
              />

              <SelectField
                label="Address Type"
                value={
                  form.addressType
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "addressType",
                    value as AddressType,
                  )
                }
              />

              <Field
                label="Home / House Number"
                value={
                  form.homeNumber
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "homeNumber",
                    value,
                  )
                }
              />

              <Field
                label="Office Number"
                value={
                  form.officeNumber
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "officeNumber",
                    value,
                  )
                }
              />

              <Field
                label="Address Line 1"
                required
                value={
                  form.addressLine1
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "addressLine1",
                    value,
                  )
                }
              />

              <Field
                label="Address Line 2"
                value={
                  form.addressLine2
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "addressLine2",
                    value,
                  )
                }
              />

              <Field
                label="Landmark"
                value={
                  form.landmark
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "landmark",
                    value,
                  )
                }
              />

              <Field
                label="City"
                required
                value={
                  form.city
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "city",
                    value,
                  )
                }
              />

              <Field
                label="District"
                value={
                  form.district
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "district",
                    value,
                  )
                }
              />

              <Field
                label="State"
                required
                value={
                  form.state
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "state",
                    value,
                  )
                }
              />

              <Field
                label="Postal Code"
                required
                value={
                  form.postalCode
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "postalCode",
                    value,
                  )
                }
              />

              <Field
                label="Country"
                required
                value={
                  form.country
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "country",
                    value,
                  )
                }
              />

              <Field
                label="Country Code"
                value={
                  form.countryCode
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "countryCode",
                    value.toUpperCase(),
                  )
                }
              />

              <Field
                label="Delivery Instructions"
                value={
                  form.instructions
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "instructions",
                    value,
                  )
                }
              />
            </div>

            <div
              style={{
                marginTop:
                  "18px",

                display:
                  "flex",

                flexDirection:
                  isMobile
                    ? "column"
                    : "row",

                gap:
                  "14px",
              }}
            >
              <CheckboxField
                label="Shipping Address"
                checked={
                  form.isShippingAddress
                }
                onChange={(
                  checked,
                ) =>
                  updateField(
                    "isShippingAddress",
                    checked,
                  )
                }
              />

              <CheckboxField
                label="Billing Address"
                checked={
                  form.isBillingAddress
                }
                onChange={(
                  checked,
                ) =>
                  updateField(
                    "isBillingAddress",
                    checked,
                  )
                }
              />
            </div>

            <div
              style={{
                marginTop:
                  "24px",

                display:
                  "flex",

                flexDirection:
                  isMobile
                    ? "column-reverse"
                    : "row",

                justifyContent:
                  "flex-end",

                gap:
                  "10px",
              }}
            >
              <button
                type="button"
                onClick={
                  closeModal
                }
                style={{
                  minWidth:
                    "120px",

                  height:
                    "44px",

                  border:
                    "1px solid #C78A8F",

                  borderRadius:
                    "8px",

                  background:
                    "#FFFFFF",

                  color:
                    "#824A50",

                  cursor:
                    "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  submitting
                }
                style={{
                  minWidth:
                    "160px",

                  height:
                    "44px",

                  border:
                    "none",

                  borderRadius:
                    "8px",

                  background:
                    submitting
                      ? "#CDA8AA"
                      : "#CF7880",

                  color:
                    "#FFFFFF",

                  cursor:
                    submitting
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {submitting
                  ? "Saving..."
                  : editingAddress
                    ? "Update Address"
                    : "Save Address"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

/* =========================================================
   ADDRESS CARD
========================================================= */

function AddressCard({
  address,
  mobile,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: Address;
  mobile: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const icon =
    address.addressType ===
    "home" ? (
      <Home
        size={29}
        strokeWidth={
          1.4
        }
      />
    ) : address.addressType ===
      "work" ? (
      <BriefcaseBusiness
        size={28}
        strokeWidth={
          1.4
        }
      />
    ) : (
      <MapPin
        size={29}
        strokeWidth={
          1.4
        }
      />
    );

  const typeLabel =
    address.addressType
      .charAt(0)
      .toUpperCase() +
    address.addressType.slice(
      1,
    );

  const addressNumber =
    address.addressType ===
    "work"
      ? address.officeNumber
        ? `Office No. ${address.officeNumber}`
        : address.homeNumber
          ? `Home No. ${address.homeNumber}`
          : ""
      : address.addressType ===
          "home"
        ? address.homeNumber
          ? `Home No. ${address.homeNumber}`
          : address.officeNumber
            ? `Office No. ${address.officeNumber}`
            : ""
        : address.homeNumber
          ? `Home No. ${address.homeNumber}`
          : address.officeNumber
            ? `Office No. ${address.officeNumber}`
            : "";

  const fullAddress = [
    addressNumber,
    address.addressLine1,
    address.addressLine2,
    address.landmark,
    address.city,
    address.district,
    address.postalCode,
    address.state,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <article
      style={{
        width:
          "100%",

        padding:
          mobile
            ? "16px"
            : "14px 16px",

        boxSizing:
          "border-box",

        display:
          "grid",

        gridTemplateColumns:
          mobile
            ? "1fr"
            : "80px 180px minmax(0,1fr) 210px",

        gap:
          "14px",

        alignItems:
          "center",

        border:
          "1px solid #E9E2DF",

        borderRadius:
          "12px",

        background:
          "#FFFFFF",

        boxShadow:
          "0 2px 8px rgba(45,34,30,0.02)",
      }}
    >
      <div
        style={{
          width:
            "66px",

          height:
            "66px",

          display:
            "grid",

          placeItems:
            "center",

          borderRadius:
            "50%",

          background:
            "#FAEFF0",

          color:
            "#7D2F3A",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          minWidth:
            0,
        }}
      >
        <div
          style={{
            display:
              "flex",

            alignItems:
              "center",

            gap:
              "8px",

            flexWrap:
              "wrap",
          }}
        >
          <strong
            style={{
              fontFamily:
                "Georgia, serif",

              fontSize:
                "17px",

              fontWeight:
                400,

              color:
                "#2F2623",
            }}
          >
            {
              address.fullName
            }
          </strong>

          {address.isDefault && (
            <span
              style={{
                padding:
                  "6px 14px",

                borderRadius:
                  "20px",

                background:
                  "#DDF3E2",

                color:
                  "#318A4E",

                fontSize:
                  "10px",
              }}
            >
              Default
            </span>
          )}

          <span
            style={{
              padding:
                "6px 15px",

              borderRadius:
                "20px",

              background:
                address.addressType ===
                "home"
                  ? "#F9E5E8"
                  : address.addressType ===
                      "work"
                    ? "#FAE8E9"
                    : "#EFE5DE",

              color:
                "#9B444F",

              fontSize:
                "10px",
            }}
          >
            {typeLabel}
          </span>
        </div>

        <div
          style={{
            marginTop:
              "5px",

            fontSize:
              "12px",

            color:
              "#554C48",
          }}
        >
          {address.phone}
        </div>
      </div>

      <div
        style={{
          minWidth:
            0,

          overflowWrap:
            "anywhere",

          fontSize:
            "12px",

          lineHeight:
            1.55,

          color:
            "#756B67",
        }}
      >
        {fullAddress}
      </div>

      <div
        style={{
          display:
            "flex",

          flexDirection:
            "column",

          gap:
            "11px",
        }}
      >
        <div
          style={{
            display:
              "flex",

            alignItems:
              "center",

            gap:
              "16px",

            flexWrap:
              "wrap",
          }}
        >
          <button
            type="button"
            onClick={
              onEdit
            }
            style={{
              border:
                "none",

              padding:
                0,

              display:
                "flex",

              alignItems:
                "center",

              gap:
                "7px",

              background:
                "transparent",

              color:
                "#332B28",

              cursor:
                "pointer",

              fontSize:
                "11px",
            }}
          >
            <Edit3
              size={18}
              strokeWidth={
                1.7
              }
            />
            Edit
          </button>

          <button
            type="button"
            onClick={
              onDelete
            }
            style={{
              border:
                "none",

              padding:
                0,

              display:
                "flex",

              alignItems:
                "center",

              gap:
                "7px",

              background:
                "transparent",

              color:
                "#332B28",

              cursor:
                "pointer",

              fontSize:
                "11px",
            }}
          >
            <Trash2
              size={18}
              strokeWidth={
                1.7
              }
            />
            Remove
          </button>
        </div>

        {!address.isDefault && (
          <button
            type="button"
            onClick={
              onSetDefault
            }
            style={{
              width:
                mobile
                  ? "100%"
                  : "155px",

              maxWidth:
                "100%",

              height:
                "37px",

              border:
                "1px solid #C8757D",

              borderRadius:
                "8px",

              background:
                "#FFFFFF",

              color:
                "#9B3441",

              fontSize:
                "11px",

              cursor:
                "pointer",
            }}
          >
            Set as Default
          </button>
        )}
      </div>
    </article>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  icon,
  title,
  text,
}: {
  icon:
    React.ReactNode;

  title: string;

  text: string;
}) {
  return (
    <div
      style={{
        width:
          "100%",

        display:
          "flex",

        alignItems:
          "center",

        gap:
          "12px",

        marginBottom:
          "18px",

        textAlign:
          "left",
      }}
    >
      <div
        style={{
          width:
            "43px",

          height:
            "43px",

          flexShrink:
            0,

          display:
            "grid",

          placeItems:
            "center",

          borderRadius:
            "50%",

          border:
            "1px solid rgba(112,64,63,0.15)",

          background:
            "rgba(255,255,255,0.34)",

          color:
            "#754846",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontFamily:
              "Georgia, serif",

            fontSize:
              "14px",

            color:
              "#4A3834",
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop:
              "4px",

            fontSize:
              "10px",

            color:
              "#8C7772",
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FOOTER BENEFIT
========================================================= */

function FooterBenefit({
  icon,
  title,
  text,
  style,
}: {
  icon:
    React.ReactNode;

  title: string;

  text: string;

  style:
    CSSProperties;
}) {
  return (
    <div
      style={
        style
      }
    >
      <div
        style={{
          color:
            "#2F2825",
        }}
      >
        {icon}
      </div>

      <div>
        <strong
          style={{
            display:
              "block",

            fontFamily:
              "Georgia, serif",

            fontSize:
              "11px",

            fontWeight:
              400,

            color:
              "#302825",
          }}
        >
          {title}
        </strong>

        <span
          style={{
            display:
              "block",

            marginTop:
              "4px",

            fontSize:
              "8px",

            color:
              "#9B928E",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;

  value: string;

  required?: boolean;

  onChange: (
    value: string,
  ) => void;
}) {
  return (
    <label
      style={{
        display:
          "flex",

        flexDirection:
          "column",

        gap:
          "7px",

        minWidth:
          0,
      }}
    >
      <span
        style={{
          fontSize:
            "10px",

          fontWeight:
            600,

          color:
            "#594C47",
        }}
      >
        {label}

        {required && (
          <span
            style={{
              color:
                "#BC5E67",

              marginLeft:
                "3px",
            }}
          >
            *
          </span>
        )}
      </span>

      <input
        value={
          value
        }
        required={
          required
        }
        onChange={(
          event,
        ) =>
          onChange(
            event.target.value,
          )
        }
        style={{
          width:
            "100%",

          maxWidth:
            "100%",

          minWidth:
            0,

          height:
            "43px",

          padding:
            "0 12px",

          boxSizing:
            "border-box",

          border:
            "1px solid #E2DAD6",

          borderRadius:
            "8px",

          outline:
            "none",

          background:
            "#FFFDFC",

          color:
            "#302825",

          fontSize:
            "12px",
        }}
      />
    </label>
  );
}

/* =========================================================
   SELECT
========================================================= */

function SelectField({
  label,
  value,
  onChange,
}: {
  label: string;

  value: string;

  onChange: (
    value: string,
  ) => void;
}) {
  return (
    <label
      style={{
        display:
          "flex",

        flexDirection:
          "column",

        gap:
          "7px",

        minWidth:
          0,
      }}
    >
      <span
        style={{
          fontSize:
            "10px",

          fontWeight:
            600,

          color:
            "#594C47",
        }}
      >
        {label}
      </span>

      <select
        value={
          value
        }
        onChange={(
          event,
        ) =>
          onChange(
            event.target.value,
          )
        }
        style={{
          width:
            "100%",

          maxWidth:
            "100%",

          minWidth:
            0,

          height:
            "43px",

          padding:
            "0 12px",

          boxSizing:
            "border-box",

          border:
            "1px solid #E2DAD6",

          borderRadius:
            "8px",

          outline:
            "none",

          background:
            "#FFFDFC",

          color:
            "#302825",

          fontSize:
            "12px",
        }}
      >
        <option
          value="home"
        >
          Home
        </option>

        <option
          value="work"
        >
          Work
        </option>

        <option
          value="other"
        >
          Other
        </option>
      </select>
    </label>
  );
}

/* =========================================================
   CHECKBOX
========================================================= */

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;

  checked: boolean;

  onChange: (
    checked: boolean,
  ) => void;
}) {
  return (
    <label
      style={{
        display:
          "flex",

        alignItems:
          "center",

        gap:
          "9px",

        fontSize:
          "11px",

        color:
          "#554944",

        cursor:
          "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={
          checked
        }
        onChange={(
          event,
        ) =>
          onChange(
            event.target.checked,
          )
        }
        style={{
          width:
            "16px",

          height:
            "16px",

          accentColor:
            "#B95F68",
        }}
      />

      {label}
    </label>
  );
}