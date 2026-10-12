"use client";

import {
  Bell,
  Camera,
  Eye,
  EyeOff,
  KeyRound,
  ChevronRight,
  Heart,
  LoaderCircle,
  Mail,
  Phone,
  Save,
  Star,
  Tag,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  getAdminUserSettings,
  updateAdminUserSettings,
  changeAdminPassword,
  type AdminUserSettings,
} from "@/lib/admin-api";

type Tab =
  | "profile"
  | "personal"
  | "password"
  | "activity";

type Gender =
  | "male"
  | "female"
  | "other";

const BRAND = "#c41245";
const TEXT = "#16191f";
const MUTED = "#747b87";
const BORDER = "#e5e7eb";

const cardStyle: CSSProperties = {
  background: "#ffffff",
  border: `1px solid ${BORDER}`,
  borderRadius: 14,
  boxShadow:
    "0 4px 18px rgba(22,27,38,0.04)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 44,
  boxSizing: "border-box",
  padding: "0 13px",
  border: "1px solid #dfe2e7",
  borderRadius: 9,
  background: "#ffffff",
  outline: "none",
  color: "#252a33",
  fontSize: 13,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] =
    useState<AdminUserSettings | null>(
      null,
    );

  const [tab, setTab] =
    useState<Tab>("profile");

  const [name, setName] =
    useState("");

  const [gender, setGender] =
    useState<Gender>("other");

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const response =
          await getAdminUserSettings();

        if (!active) {
          return;
        }

        setSettings(response);

        setName(
          response.profile.name || "",
        );

        setGender(
          (response.profile.gender ||
            "other") as Gender,
        );
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load user settings.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const previewUrl = useMemo(() => {
    if (!imageFile) {
      return "";
    }

    return URL.createObjectURL(
      imageFile,
    );
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl,
        );
      }
    };
  }, [previewUrl]);

  function chooseImage(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0] ||
      null;

    if (!file) {
      setImageFile(null);
      return;
    }

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    if (!allowed.includes(file.type)) {
      setError(
        "Only JPG, JPEG, PNG, WEBP or AVIF images are allowed.",
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setError(
        "Profile image must be 10 MB or smaller.",
      );

      event.target.value = "";
      return;
    }

    setError("");
    setSuccess("");
    setImageFile(file);
  }

  async function saveProfile(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !settings ||
      !name.trim()
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const result =
        await updateAdminUserSettings({
          name: name.trim(),
          gender,
          profileImage: imageFile,
        });

      setSettings((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          profile: result.profile,
          personalInformation:
            result.personalInformation,
        };
      });

      setName(
        result.profile.name,
      );

      setGender(
        result.profile
          .gender as Gender,
      );

      setImageFile(null);

      setSuccess(
        result.message ||
          "Profile updated successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      style={{
        width: "100%",
        paddingBottom: 35,
        boxSizing: "border-box",
      }}
    >
      {/* TITLE */}

      <section>
        <p
          style={{
            margin: 0,
            color: BRAND,
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1.8px",
          }}
        >
          HivraSoft Admin
        </p>

        <h1
          style={{
            margin: "5px 0 0",
            color: "#111318",
            fontSize: 29,
            fontWeight: 800,
            letterSpacing: "-0.8px",
          }}
        >
          User Settings
        </h1>

        <p
          style={{
            margin: "5px 0 0",
            color: MUTED,
            fontSize: 12,
          }}
        >
          Manage your profile, personal
          information, password and account
          activity.
        </p>
      </section>

      {/* TABS */}

      <section
        style={{
          ...cardStyle,
          marginTop: 22,
          padding: 6,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 5,
          }}
        >
          <SettingsTab
            active={
              tab === "profile"
            }
            onClick={() =>
              setTab("profile")
            }
            icon={
              <UserRound size={17} />
            }
            label="Profile"
          />

          <SettingsTab
            active={
              tab === "personal"
            }
            onClick={() =>
              setTab("personal")
            }
            icon={
              <UsersRound size={17} />
            }
            label="Personal Information"
          />

          <SettingsTab
            active={
              tab === "password"
            }
            onClick={() =>
              setTab("password")
            }
            icon={<KeyRound size={17} />}
            label="Change Password"
          />

          <SettingsTab
            active={
              tab === "activity"
            }
            onClick={() =>
              setTab("activity")
            }
            icon={<Bell size={17} />}
            label="Account Activity"
          />
        </div>
      </section>

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 15px",
            background: "#fef2f2",
            border:
              "1px solid #fecaca",
            borderRadius: 9,
            color: "#b91c1c",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 15px",
            background: "#ecfdf5",
            border:
              "1px solid #a7f3d0",
            borderRadius: 9,
            color: "#047857",
            fontSize: 13,
          }}
        >
          {success}
        </div>
      )}

      {loading ? (
        <LoadingCard />
      ) : !settings ? (
        <div
          style={{
            ...cardStyle,
            marginTop: 18,
            padding: "60px 20px",
            textAlign: "center",
            fontSize: 13,
            color: MUTED,
          }}
        >
          Settings could not be
          loaded.
        </div>
      ) : (
        <>
          {tab === "profile" && (
            <ProfileTab
              settings={settings}
              name={name}
              gender={gender}
              imageFile={imageFile}
              previewUrl={previewUrl}
              saving={saving}
              setName={setName}
              setGender={setGender}
              chooseImage={
                chooseImage
              }
              saveProfile={
                saveProfile
              }
            />
          )}

          {tab === "personal" && (
            <PersonalTab
              settings={settings}
            />
          )}

          {tab === "password" && (
            <PasswordTab />
          )}

          {tab === "activity" && (
            <ActivityTab
              settings={settings}
            />
          )}
        </>
      )}
    </main>
  );
}

function ProfileTab({
  settings,
  name,
  gender,
  imageFile,
  previewUrl,
  saving,
  setName,
  setGender,
  chooseImage,
  saveProfile,
}: {
  settings: AdminUserSettings;
  name: string;
  gender: Gender;
  imageFile: File | null;
  previewUrl: string;
  saving: boolean;

  setName: (
    value: string,
  ) => void;

  setGender: (
    value: Gender,
  ) => void;

  chooseImage: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;

  saveProfile: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
}) {
  return (
    <form
      onSubmit={saveProfile}
      style={{
        marginTop: 18,
        display: "flex",
        flexWrap: "wrap",
        gap: 18,
        alignItems: "flex-start",
      }}
    >
      <section
        style={{
          ...cardStyle,
          flex: "1 1 620px",
          padding: 22,
          boxSizing: "border-box",
        }}
      >
        <SectionTitle
          title="Profile"
          description="Upload or change profile image, name and gender."
        />

        {/* PROFILE IMAGE AREA */}

        <div
          style={{
            marginTop: 20,
            padding: 19,
            border:
              "1px solid #eaebee",
            borderRadius: 12,
            background: "#fafafa",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <ProfileImage
              src={
                previewUrl ||
                settings.profile.image
                  ?.url ||
                ""
              }
              name={name}
              size="large"
            />

            <div
              style={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: "#22262e",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Profile Image
              </h3>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color: "#7b828e",
                  fontSize: 11,
                  lineHeight: 1.6,
                }}
              >
                JPG, JPEG, PNG, WEBP or
                AVIF. Maximum image size
                is 10 MB.
              </p>

              {imageFile && (
                <p
                  style={{
                    margin:
                      "6px 0 0",
                    color: "#059669",
                    fontSize: 10,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow:
                      "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Selected:{" "}
                  {imageFile.name}
                </p>
              )}

              <label
                style={{
                  marginTop: 12,
                  height: 39,
                  display:
                    "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0 15px",
                  borderRadius: 8,
                  background: BRAND,
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxSizing:
                    "border-box",
                }}
              >
                <Camera size={15} />

                {settings.profile.image
                  ?.url || imageFile
                  ? "Change Profile Image"
                  : "Upload Profile Image"}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={
                    chooseImage
                  }
                  style={{
                    display: "none",
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* FORM */}

        <div
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 18,
          }}
        >
          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              required
              maxLength={100}
              placeholder="Enter your name"
              style={inputStyle}
            />
          </Field>

          <Field label="Gender">
            <select
              value={gender}
              onChange={(event) =>
                setGender(
                  event.target
                    .value as Gender,
                )
              }
              style={{
                ...inputStyle,
                cursor: "pointer",
              }}
            >
              <option value="male">
                Male
              </option>

              <option value="female">
                Female
              </option>

              <option value="other">
                Other
              </option>
            </select>
          </Field>
        </div>

        <div
          style={{
            marginTop: 24,
            paddingTop: 18,
            borderTop:
              "1px solid #eceef1",
            display: "flex",
            justifyContent:
              "flex-end",
          }}
        >
          <button
            type="submit"
            disabled={
              saving ||
              !name.trim()
            }
            style={{
              minWidth: 145,
              height: 42,
              padding: "0 18px",
              display: "flex",
              justifyContent:
                "center",
              alignItems: "center",
              gap: 8,
              border: "none",
              borderRadius: 9,
              background: BRAND,
              color: "#ffffff",
              fontSize: 11,
              fontWeight: 600,
              cursor:
                saving ||
                !name.trim()
                  ? "not-allowed"
                  : "pointer",
              opacity:
                saving ||
                !name.trim()
                  ? 0.65
                  : 1,
            }}
          >
            {saving ? (
              <LoaderCircle
                size={16}
              />
            ) : (
              <Save size={16} />
            )}

            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </section>

      <aside
        style={{
          flex: "1 1 300px",
          minWidth: 280,
        }}
      >
        <CurrentUserCard
          settings={settings}
          previewUrl={previewUrl}
          previewName={name}
          previewGender={gender}
        />
      </aside>
    </form>
  );
}

function PersonalTab({
  settings,
}: {
  settings: AdminUserSettings;
}) {
  const info =
    settings.personalInformation;

  return (
    <section
      style={{
        marginTop: 18,
        display: "flex",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 18,
      }}
    >
      <div
        style={{
          ...cardStyle,
          flex: "1 1 620px",
          padding: 22,
          boxSizing: "border-box",
        }}
      >
        <SectionTitle
          title="Personal Information"
          description="Your current account details returned by the admin API."
        />

        <div
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 18,
          }}
        >
          <InfoField
            icon={
              <UserRound size={16} />
            }
            label="Name"
            value={info.name}
          />

          <InfoField
            icon={
              <UsersRound size={16} />
            }
            label="Gender"
            value={capitalize(
              info.gender,
            )}
          />

          <InfoField
            icon={<Mail size={16} />}
            label="Email Address"
            value={info.email}
          />

          <InfoField
            icon={<Phone size={16} />}
            label="Mobile Number"
            value={info.mobile}
          />
        </div>

        <div
          style={{
            marginTop: 20,
            padding: "12px 14px",
            background: "#fff8fa",
            border:
              "1px solid #f2dfe5",
            borderRadius: 9,
            color: "#87314b",
            fontSize: 11,
            lineHeight: 1.6,
          }}
        >
          Name and gender can be changed
          from the Profile tab. Email
          address and mobile number are
          displayed from account
          information returned by the
          API.
        </div>
      </div>

      <aside
        style={{
          flex: "1 1 300px",
          minWidth: 280,
        }}
      >
        <CurrentUserCard
          settings={settings}
        />
      </aside>
    </section>
  );
}

function ActivityTab({
  settings,
}: {
  settings: AdminUserSettings;
}) {
  return (
    <section
      style={{
        ...cardStyle,
        marginTop: 18,
        padding: 22,
      }}
    >
      <SectionTitle
        title="Account Activity"
        description="Your latest account activity returned by the API."
      />

      <div
        style={{
          marginTop: 20,
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 14,
        }}
      >
        <ActivityCard
          icon={<Tag size={20} />}
          label="My Coupons"
          value={
            settings.accountActivity
              .coupons
          }
          description="Available coupons"
        />

        <ActivityCard
          icon={<Star size={20} />}
          label="My Reviews & Ratings"
          value={
            settings.accountActivity
              .reviews
          }
          description="Reviews submitted"
        />

        <ActivityCard
          icon={<Bell size={20} />}
          label="All Notifications"
          value={
            settings.accountActivity
              .notifications
          }
          description="Account notifications"
        />

        <ActivityCard
          icon={<Heart size={20} />}
          label="My Wishlist"
          value={
            settings.accountActivity
              .wishlist
          }
          description="Saved products"
        />
      </div>
    </section>
  );
}

function PasswordTab() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    try {
      setSavingPassword(true);
      const result = await changeAdminPassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(result.message || "Password changed successfully.");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Unable to change password.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  const passwordField = (
    label: string,
    value: string,
    setValue: (value: string) => void,
    visible: boolean,
    setVisible: (value: boolean) => void,
    autoComplete: string,
  ) => (
    <div>
      <label style={{ display: "block", marginBottom: 7, color: TEXT, fontSize: 11, fontWeight: 700 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoComplete={autoComplete}
          required
          minLength={label === "Old Password" ? undefined : 8}
          maxLength={128}
          style={{ ...inputStyle, paddingRight: 46 }}
          placeholder={label}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 44,
            height: 44,
            border: "none",
            background: "transparent",
            color: MUTED,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );

  return (
    <section style={{ ...cardStyle, marginTop: 18, padding: 22, maxWidth: 720 }}>
      <SectionTitle
        title="Change Password"
        description="Enter your old password, then create and confirm a new password."
      />

      <form onSubmit={submitPassword} style={{ marginTop: 20, display: "grid", gap: 16 }}>
        {passwordField("Old Password", oldPassword, setOldPassword, showOld, setShowOld, "current-password")}
        {passwordField("New Password", newPassword, setNewPassword, showNew, setShowNew, "new-password")}
        {passwordField("Confirm Password", confirmPassword, setConfirmPassword, showConfirm, setShowConfirm, "new-password")}

        {passwordError && (
          <div style={{ padding: "11px 13px", borderRadius: 9, border: "1px solid #fecaca", background: "#fef2f2", color: "#b91c1c", fontSize: 12 }}>
            {passwordError}
          </div>
        )}

        {passwordSuccess && (
          <div style={{ padding: "11px 13px", borderRadius: 9, border: "1px solid #a7f3d0", background: "#ecfdf5", color: "#047857", fontSize: 12 }}>
            {passwordSuccess}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={savingPassword}
            style={{
              minHeight: 43,
              padding: "0 18px",
              border: "none",
              borderRadius: 9,
              background: BRAND,
              color: "white",
              fontSize: 11,
              fontWeight: 700,
              cursor: savingPassword ? "default" : "pointer",
              opacity: savingPassword ? 0.65 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {savingPassword ? <LoaderCircle size={16} className="animate-spin" /> : <KeyRound size={16} />}
            {savingPassword ? "Changing..." : "Change Password"}
          </button>
        </div>
      </form>
    </section>
  );
}

function SettingsTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 43,
        padding: "0 15px",
        border: "none",
        borderRadius: 9,
        background: active
          ? BRAND
          : "transparent",
        color: active
          ? "#ffffff"
          : "#3e4550",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: active
          ? "0 2px 7px rgba(196,18,69,0.18)"
          : "none",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2
        style={{
          margin: 0,
          color: TEXT,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "-0.2px",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin: "4px 0 0",
          color: MUTED,
          fontSize: 11,
        }}
      >
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label
      style={{
        display: "block",
      }}
    >
      <span
        style={{
          display: "block",
          marginBottom: 7,
          color: "#303640",
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {label}
      </span>

      {children}
    </label>
  );
}

function InfoField({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p
        style={{
          margin: "0 0 7px",
          color: "#303640",
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {label}
      </p>

      <div
        style={{
          minHeight: 44,
          padding: "0 13px",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          gap: 10,
          border:
            "1px solid #e1e3e7",
          borderRadius: 9,
          background: "#fafafa",
          color: "#515966",
          fontSize: 12,
          overflow: "hidden",
        }}
      >
        <span
          style={{
            display: "flex",
            color: BRAND,
            flexShrink: 0,
          }}
        >
          {icon}
        </span>

        <span
          style={{
            minWidth: 0,
            overflowWrap:
              "anywhere",
          }}
        >
          {value || "-"}
        </span>
      </div>
    </div>
  );
}

function ActivityCard({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <article
      style={{
        padding: 18,
        border:
          "1px solid #e7e9ed",
        borderRadius: 12,
        background: "#fafafa",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent:
            "space-between",
        }}
      >
        <div
          style={{
            width: 41,
            height: 41,
            display: "flex",
            justifyContent:
              "center",
            alignItems: "center",
            borderRadius: 10,
            background: "#f8e7ed",
            color: BRAND,
          }}
        >
          {icon}
        </div>

        <ChevronRight
          size={16}
          color="#a1a6ae"
        />
      </div>

      <p
        style={{
          margin: "17px 0 0",
          color: "#353b46",
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: "3px 0 0",
          color: "#15181e",
          fontSize: 25,
          fontWeight: 800,
        }}
      >
        {value}
      </p>

      <p
        style={{
          margin: "3px 0 0",
          color: "#858b95",
          fontSize: 10,
        }}
      >
        {description}
      </p>
    </article>
  );
}

function CurrentUserCard({
  settings,
  previewUrl = "",
  previewName,
  previewGender,
}: {
  settings: AdminUserSettings;
  previewUrl?: string;
  previewName?: string;
  previewGender?: Gender;
}) {
  const info =
    settings.personalInformation;

  const displayName =
    previewName ||
    info.name ||
    "Administrator";

  const displayGender =
    previewGender ||
    info.gender;

  return (
    <section
      style={{
        ...cardStyle,
        padding: 22,
        boxSizing: "border-box",
      }}
    >
      <SectionTitle
        title="Current User Information"
        description="Preview of your admin account."
      />

      <div
        style={{
          marginTop: 20,
          padding: "25px 18px",
          borderRadius: 12,
          textAlign: "center",
          background:
            "linear-gradient(135deg, #faf7f5 0%, #fff9fb 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "center",
          }}
        >
          <ProfileImage
            src={
              previewUrl ||
              settings.profile.image
                ?.url ||
              ""
            }
            name={displayName}
            size="medium"
          />
        </div>

        <h3
          style={{
            margin: "13px 0 0",
            color: "#171a20",
            fontSize: 17,
            fontWeight: 800,
          }}
        >
          {displayName}
        </h3>

        <p
          style={{
            margin: "4px 0 0",
            color: MUTED,
            fontSize: 11,
            textTransform:
              "capitalize",
          }}
        >
          {displayGender || "-"}
        </p>
      </div>

      <div
        style={{
          marginTop: 15,
        }}
      >
        <PreviewRow
          icon={<Mail size={15} />}
          label="Email"
          value={info.email}
        />

        <PreviewRow
          icon={<Phone size={15} />}
          label="Phone"
          value={info.mobile}
        />

        <PreviewRow
          icon={
            <UsersRound size={15} />
          }
          label="Gender"
          value={capitalize(
            String(
              displayGender || "",
            ),
          )}
          last
        />
      </div>
    </section>
  );
}

function ProfileImage({
  src,
  name,
  size,
}: {
  src: string;
  name: string;
  size:
    | "medium"
    | "large";
}) {
  const dimension =
    size === "large"
      ? 92
      : 76;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${
          name || "Admin"
        } profile`}
        style={{
          width: dimension,
          height: dimension,
          flexShrink: 0,
          borderRadius: "50%",
          border:
            "4px solid #ffffff",
          objectFit: "cover",
          boxShadow:
            "0 4px 13px rgba(0,0,0,0.09)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: dimension,
        height: dimension,
        flexShrink: 0,
        borderRadius: "50%",
        border:
          "4px solid #ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        background:
          "linear-gradient(135deg, #c41245 0%, #931038 100%)",
        fontWeight: 800,
        fontSize:
          size === "large"
            ? 29
            : 23,
        boxShadow:
          "0 4px 13px rgba(0,0,0,0.09)",
      }}
    >
      {name
        ?.trim()
        .charAt(0)
        .toUpperCase() || "A"}
    </div>
  );
}

function PreviewRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "90px minmax(0, 1fr)",
        gap: 10,
        padding: "11px 0",
        borderBottom: last
          ? "none"
          : "1px solid #eceef1",
        fontSize: 11,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          color: "#666d79",
          fontWeight: 500,
        }}
      >
        <span
          style={{
            color: BRAND,
            display: "flex",
          }}
        >
          {icon}
        </span>

        {label}
      </span>

      <span
        style={{
          color: "#303640",
          overflowWrap: "anywhere",
        }}
      >
        {value || "-"}
      </span>
    </div>
  );
}

function LoadingCard() {
  return (
    <div
      style={{
        ...cardStyle,
        marginTop: 18,
        minHeight: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: MUTED,
          fontSize: 13,
        }}
      >
        <LoaderCircle
          size={18}
          color={BRAND}
        />

        Loading settings...
      </div>
    </div>
  );
}

function capitalize(
  value: string,
) {
  if (!value) {
    return "-";
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
} 