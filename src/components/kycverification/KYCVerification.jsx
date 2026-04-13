import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Camera,
  FileBadge2,
  Globe2,
  IdCard,
  ShieldCheck,
  UploadCloud,
  UserCircle2,
} from "lucide-react";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../config/api";
import { normalizeKycStatus } from "../../utils/kycAccess";
import countryData from "../auth/sign-up/CountryData.json";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png"];
const ID_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "residence_permit", label: "Residence Permit" },
];
const NOTES = [
  "Use your legal name exactly as shown on the document.",
  "Upload a clear, uncropped, valid government ID.",
  "Your selfie must show your face and the same document.",
  "JPEG and PNG images only, up to 5MB each.",
];
const REQUIRED_FIELDS = [
  "firstName",
  "lastName",
  "phoneNumber",
  "country",
  "issuingCountry",
  "idType",
  "idNumber",
  "dateOfBirth",
  "addressLine1",
  "city",
  "stateProvince",
  "postalCode",
];

const fieldSurfaceClassName = (hasError, isDark) => {
  if (hasError) {
    return isDark
      ? "w-full min-w-0 rounded-2xl border border-rose-400/45 bg-rose-500/8 px-4 py-3 text-sm text-white placeholder:text-rose-200/70 focus:outline-none"
      : "w-full min-w-0 rounded-2xl border border-rose-300 bg-rose-50/70 px-4 py-3 text-sm text-slate-900 placeholder:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200";
  }

  return isDark
    ? "w-full min-w-0 rounded-2xl border border-slate-800 bg-slate-950/88 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/35 focus:outline-none"
    : "w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/15";
};

const buildInitialForm = (userData = {}) => ({
  firstName: userData?.firstName || "",
  lastName: userData?.lastName || "",
  middleName: userData?.middleName || "",
  phoneNumber: userData?.phoneNumber || "",
  country: userData?.country || "",
  nationality: userData?.nationality || userData?.country || "",
  issuingCountry:
    userData?.issuingCountry || userData?.nationality || userData?.country || "",
  idType: userData?.kycIdType || "",
  idNumber: userData?.kycDocumentNumber || "",
  dateOfBirth: userData?.dateOfBirth || "",
  expiryDate: userData?.kycDocumentExpiry || "",
  addressLine1: userData?.addressLine1 || "",
  city: userData?.city || "",
  stateProvince: userData?.stateProvince || "",
  postalCode: userData?.postalCode || "",
});

const buildFormFromSubmission = (submission, userData = {}) => {
  const initial = buildInitialForm(userData);
  if (!submission) return initial;

  const country = submission.countryOfResidence || initial.country;

  return {
    ...initial,
    firstName: submission.legalFirstName || initial.firstName,
    lastName: submission.legalLastName || initial.lastName,
    middleName: submission.legalMiddleName || initial.middleName,
    phoneNumber: submission.phoneNumber || initial.phoneNumber,
    country,
    nationality: initial.nationality || country,
    issuingCountry: submission.issuingCountry || initial.issuingCountry || country,
    idType: submission.idType || initial.idType,
    idNumber: submission.idNumber || initial.idNumber,
    dateOfBirth: submission.dateOfBirth || initial.dateOfBirth,
    expiryDate: initial.expiryDate,
    addressLine1: submission.addressLine1 || initial.addressLine1,
    city: submission.city || initial.city,
    stateProvince: submission.stateProvince || initial.stateProvince,
    postalCode: submission.postalCode || initial.postalCode,
  };
};

const getSubmissionDocuments = (submission = null) => ({
  front: submission?.documents?.front || submission?.governmentId || "",
  back: submission?.documents?.back || submission?.governmentIdBack || "",
  selfie: submission?.documents?.selfie || submission?.selfie || "",
});

const getStatusCopy = (status, isDark) => {
  if (status === "verified") {
    return {
      label: "Verified",
      badge: isDark
        ? "border-emerald-400/25 bg-emerald-500/12 text-emerald-100"
        : "border-emerald-200 bg-emerald-50 text-emerald-700",
      hero: "Your identity review is complete and protected features are available.",
    };
  }
  if (status === "pending") {
    return {
      label: "In Review",
      badge: isDark
        ? "border-amber-400/25 bg-amber-500/12 text-amber-100"
        : "border-amber-200 bg-amber-50 text-amber-700",
      hero: "Your documents are under review. You can still refresh and improve details here.",
    };
  }
  if (status === "rejected") {
    return {
      label: "Needs Update",
      badge: isDark
        ? "border-rose-400/25 bg-rose-500/12 text-rose-100"
        : "border-rose-200 bg-rose-50 text-rose-700",
      hero: "Some details need correction. Review the form carefully and resubmit clear images.",
    };
  }
  return {
    label: "Not Started",
    badge: isDark
      ? "border-teal-400/25 bg-teal-500/12 text-teal-100"
      : "border-teal-200 bg-teal-50 text-teal-700",
    hero: "Complete KYC to unlock deposits, withdrawals, trading tools, and other protected features.",
  };
};

const formatDate = (value) => {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const fileError = (file, label, hasExisting = false) => {
  if (!file) return hasExisting ? "" : `Upload your ${label}.`;
  if (!ACCEPTED.includes(file.type)) return `${label} must be a JPEG or PNG image.`;
  if (file.size > MAX_FILE_SIZE) return `${label} must be smaller than 5MB.`;
  return "";
};

const toBase64 = (file, keepPrefix = false) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result || "";
      resolve(keepPrefix ? result : result.split(",")[1]);
    };
    reader.onerror = reject;
  });

const SERVER_FIELD_MAP = {
  legalFirstName: "firstName",
  legalMiddleName: "middleName",
  legalLastName: "lastName",
  countryOfResidence: "country",
  governmentId: "idFile",
  selfie: "selfieFile",
};

const normalizeServerErrors = (errors = {}) =>
  Object.entries(errors).reduce((acc, [key, value]) => {
    if (!value) return acc;
    acc[SERVER_FIELD_MAP[key] || key] = value;
    return acc;
  }, {});

function FormField({
  label,
  name,
  type = "text",
  optional = false,
  value,
  error,
  onChange,
  children,
  isDark,
}) {
  return (
    <label className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className={`min-w-0 text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
          {label}
        </span>
        <span className="shrink-0 text-[11px] uppercase tracking-[0.16em] text-slate-500">
          {optional ? "Optional" : "Required"}
        </span>
      </div>
      {children || (
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className={fieldSurfaceClassName(Boolean(error), isDark)}
        />
      )}
      {error && (
        <p className={`break-words text-xs ${isDark ? "text-rose-300" : "text-rose-600"}`}>
          {error}
        </p>
      )}
    </label>
  );
}

function UploadCard({
  title,
  description,
  file,
  preview,
  selectedLabel,
  inputRef,
  onPick,
  error,
  icon: Icon,
  isDark,
}) {
  const fileLabel = file ? file.name : selectedLabel || "Choose image";
  const helperText =
    file || !selectedLabel
      ? "JPEG or PNG, max 5MB"
      : "Existing image on file. Choose a new one to replace it.";

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-[1.5rem] border p-5 ${
        isDark
          ? "border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))]"
          : "border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
      }`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div
          className={`shrink-0 rounded-2xl p-3 ${
            isDark ? "bg-slate-900 text-teal-200" : "bg-teal-50 text-teal-700"
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
            {title}
          </h3>
          <p
            className={`mt-1 break-words text-sm leading-6 ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            {description}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`flex w-full min-w-0 items-center justify-between gap-4 rounded-[1.25rem] border px-4 py-4 text-left transition ${
          isDark
            ? "border-dashed border-teal-400/24 bg-slate-950/90 hover:border-teal-300/40"
            : "border-dashed border-teal-300 bg-slate-50/90 hover:border-teal-400 hover:bg-white"
        }`}
      >
        <div className="min-w-0">
          <p className={`break-all text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
            {fileLabel}
          </p>
          <p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
            {helperText}
          </p>
        </div>
        <UploadCloud
          className={`h-5 w-5 shrink-0 ${isDark ? "text-teal-200" : "text-teal-700"}`}
          strokeWidth={2.2}
        />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={onPick}
        className="hidden"
      />
      {error && (
        <p className={`mt-3 break-words text-xs ${isDark ? "text-rose-300" : "text-rose-600"}`}>
          {error}
        </p>
      )}
      {preview && (
        <img
          src={preview}
          alt={title}
          className={`mt-4 h-40 w-full rounded-[1.2rem] border object-cover ${
            isDark ? "border-slate-800" : "border-slate-200"
          }`}
        />
      )}
    </div>
  );
}

function StaticField({ label, value, isDark }) {
  return (
    <div
      className={`min-w-0 rounded-[1.25rem] border p-4 ${
        isDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 break-words text-sm font-semibold leading-6 ${isDark ? "text-white" : "text-slate-900"}`}>
        {value || "Not provided"}
      </p>
    </div>
  );
}

function DocumentPreviewCard({ title, image, icon: Icon, isDark }) {
  return (
    <div
      className={`min-w-0 overflow-hidden rounded-[1.5rem] border p-5 ${
        isDark
          ? "border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))]"
          : "border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
      }`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div
          className={`shrink-0 rounded-2xl p-3 ${
            isDark ? "bg-slate-900 text-teal-200" : "bg-teal-50 text-teal-700"
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
            {title}
          </h3>
          <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Approved image on file
          </p>
        </div>
      </div>
      {image ? (
        <>
          <img
            src={image}
            alt={title}
            className={`h-48 w-full rounded-[1.2rem] border object-cover ${
              isDark ? "border-slate-800" : "border-slate-200"
            }`}
          />
          <a
            href={image}
            target="_blank"
            rel="noreferrer"
            className={`mt-4 inline-flex text-sm font-medium ${
              isDark ? "text-teal-200" : "text-teal-700"
            }`}
          >
            Open full image
          </a>
        </>
      ) : (
        <div
          className={`flex h-48 items-center justify-center rounded-[1.2rem] border border-dashed text-sm ${
            isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"
          }`}
        >
          No image available
        </div>
      )}
    </div>
  );
}

export default function KycVerification() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const {
    userData,
    isAuthenticated,
    getAuthToken,
    refreshKYCStatus,
    updateUserProfile,
    saveUserProfile,
  } = useUser();
  const [formData, setFormData] = useState(() => buildInitialForm(userData));
  const [idFile, setIdFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [idPreview, setIdPreview] = useState("");
  const [selfiePreview, setSelfiePreview] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [submissionDocuments, setSubmissionDocuments] = useState(() =>
    getSubmissionDocuments()
  );
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [submissionVerified, setSubmissionVerified] = useState(false);
  const [submissionLoading, setSubmissionLoading] = useState(true);
  const [submissionLoaded, setSubmissionLoaded] = useState(false);
  const idInputRef = useRef(null);
  const selfieInputRef = useRef(null);
  const isDark = theme === "dark";
  const userKey =
    userData?.uid || userData?.userId || userData?.id || userData?.email || "";

  const currentStatus = normalizeKycStatus({
    kycStatus: submission?.status || submissionStatus || userData?.kycStatus,
    kycVerified:
      submission?.verified !== undefined
        ? submission.verified
        : submissionVerified || userData?.kycVerified,
  });
  const statusCopy = getStatusCopy(currentStatus, isDark);
  const isVerifiedView = currentStatus === "verified";
  const hasExistingId = Boolean(submissionDocuments.front);
  const hasExistingSelfie = Boolean(submissionDocuments.selfie);
  const idPreviewSrc = idPreview || submissionDocuments.front;
  const selfiePreviewSrc = selfiePreview || submissionDocuments.selfie;
  const documentTypeLabel =
    ID_TYPES.find((item) => item.value === formData.idType)?.label || "Not selected yet";
  const countries = useMemo(() => {
    const seen = new Set();
    return (countryData || []).filter((item) => {
      if (!item?.name || seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    });
  }, []);
  const profileDefaults = useMemo(
    () => buildInitialForm(userData),
    [
      userData?.firstName,
      userData?.lastName,
      userData?.middleName,
      userData?.phoneNumber,
      userData?.country,
      userData?.nationality,
      userData?.issuingCountry,
      userData?.kycIdType,
      userData?.kycDocumentNumber,
      userData?.dateOfBirth,
      userData?.kycDocumentExpiry,
      userData?.addressLine1,
      userData?.city,
      userData?.stateProvince,
      userData?.postalCode,
    ]
  );
  const progress = useMemo(() => {
    if (currentStatus === "verified") return 100;

    const checks = [
      ...REQUIRED_FIELDS.map((field) => `${formData[field] || ""}`.trim()),
      hasExistingId || idFile,
      hasExistingSelfie || selfieFile,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [currentStatus, formData, hasExistingId, hasExistingSelfie, idFile, selfieFile]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token || !isAuthenticated) {
      setSubmissionLoading(false);
      setSubmissionLoaded(true);
      setError("You must be logged in to submit KYC. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1800);
      return;
    }

    let isCancelled = false;

    const loadSubmission = async () => {
      setSubmissionLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/Kyc/Submission?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-cache",
        });

        if (!response.ok) {
          throw new Error(`Failed to load KYC submission (${response.status})`);
        }

        const result = await response.json().catch(() => null);
        if (isCancelled) return;

        const nextSubmission = result?.data || null;
        setSubmission(nextSubmission);
        setSubmissionDocuments(getSubmissionDocuments(nextSubmission));
        setSubmissionStatus(result?.status || nextSubmission?.status || "");
        setSubmissionVerified(Boolean(result?.verified || nextSubmission?.verified));

        if (nextSubmission) {
          setFormData(buildFormFromSubmission(nextSubmission, userData));
        }
      } catch (loadError) {
        if (!isCancelled) {
          console.warn("Unable to load existing KYC submission:", loadError);
        }
      } finally {
        if (!isCancelled) {
          setSubmissionLoading(false);
          setSubmissionLoaded(true);
        }
      }
    };

    loadSubmission();

    return () => {
      isCancelled = true;
    };
  }, [getAuthToken, isAuthenticated, navigate, userKey]);

  useEffect(() => {
    if (submission) return;

    setFormData((prev) => {
      let changed = false;
      const next = { ...prev };

      Object.entries(profileDefaults).forEach(([key, value]) => {
        if (!next[key] && value) {
          next[key] = value;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [profileDefaults, submission]);

  useEffect(() => {
    if (!idFile) {
      setIdPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(idFile);
    setIdPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [idFile]);

  useEffect(() => {
    if (!selfieFile) {
      setSelfiePreview("");
      return undefined;
    }
    const url = URL.createObjectURL(selfieFile);
    setSelfiePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selfieFile]);

  const validateField = (name, value) => {
    if (REQUIRED_FIELDS.includes(name) && !`${value || ""}`.trim()) {
      return "This field is required.";
    }
    if (name === "idNumber" && `${value || ""}`.trim().length < 4) {
      return "Enter a valid document number.";
    }
    if (name === "dateOfBirth" && value) {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const hadBirthday =
        today.getMonth() > birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() &&
          today.getDate() >= birthDate.getDate());
      if (!(age > 18 || (age === 18 && hadBirthday))) {
        return "You must be at least 18 years old.";
      }
    }
    if (name === "expiryDate" && value && new Date(value) <= new Date()) {
      return "Document must still be valid.";
    }
    return "";
  };

  const onFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccess("");
    setError("");
    setErrors((prev) => {
      const next = { ...prev };
      const nextError = validateField(name, value);
      if (nextError) next[name] = nextError;
      else delete next[name];
      return next;
    });
  };

  const onFileChange = (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const nextError = fileError(
      file,
      type === "id" ? "government ID" : "selfie with ID",
      type === "id" ? hasExistingId : hasExistingSelfie
    );
    if (nextError) {
      setErrors((prev) => ({
        ...prev,
        [type === "id" ? "idFile" : "selfieFile"]: nextError,
      }));
      toast.error(nextError);
      return;
    }
    if (type === "id") {
      setIdFile(file);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.idFile;
        return next;
      });
    } else {
      setSelfieFile(file);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.selfieFile;
        return next;
      });
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    REQUIRED_FIELDS.forEach((field) => {
      const nextError = validateField(field, formData[field]);
      if (nextError) nextErrors[field] = nextError;
    });
    const expiryIssue = validateField("expiryDate", formData.expiryDate);
    if (expiryIssue) nextErrors.expiryDate = expiryIssue;
    const idIssue = fileError(idFile, "government ID", hasExistingId);
    const selfieIssue = fileError(selfieFile, "selfie with ID", hasExistingSelfie);
    if (idIssue) nextErrors.idFile = idIssue;
    if (selfieIssue) nextErrors.selfieFile = selfieIssue;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const payload = (submittedAt) => ({
    UserId: userData?.uid || userData?.userId || userData?.id || "",
    Email: userData?.email || "",
    legalFirstName: formData.firstName.trim(),
    legalLastName: formData.lastName.trim(),
    legalMiddleName: formData.middleName.trim(),
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    middleName: formData.middleName.trim(),
    FirstName: formData.firstName.trim(),
    LastName: formData.lastName.trim(),
    MiddleName: formData.middleName.trim(),
    phoneNumber: formData.phoneNumber.trim(),
    PhoneNumber: formData.phoneNumber.trim(),
    country: formData.country,
    countryOfResidence: formData.country,
    Country: formData.country,
    CountryOfResidence: formData.country,
    Nationality: formData.nationality || formData.country,
    issuingCountry: formData.issuingCountry || formData.nationality || formData.country,
    IssuingCountry:
      formData.issuingCountry || formData.nationality || formData.country,
    idType: formData.idType,
    IdType: formData.idType,
    DocumentType: formData.idType,
    idNumber: formData.idNumber.trim(),
    DocumentNumber: formData.idNumber.trim(),
    IdNumber: formData.idNumber.trim(),
    dateOfBirth: formData.dateOfBirth,
    DateOfBirth: formData.dateOfBirth,
    ExpiryDate: formData.expiryDate,
    addressLine1: formData.addressLine1.trim(),
    AddressLine1: formData.addressLine1.trim(),
    ResidentialAddress: formData.addressLine1.trim(),
    city: formData.city.trim(),
    City: formData.city.trim(),
    stateProvince: formData.stateProvince.trim(),
    StateProvince: formData.stateProvince.trim(),
    postalCode: formData.postalCode.trim(),
    PostalCode: formData.postalCode.trim(),
    SubmittedAt: submittedAt,
  });

  const submitKyc = async (token, basePayload) => {
    const formPayload = new FormData();
    Object.entries(basePayload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && `${value}`.trim() !== "") {
        formPayload.append(key, value);
      }
    });
    if (idFile) formPayload.append("GovernmentIssuedId", idFile);
    if (selfieFile) formPayload.append("SelfieWithId", selfieFile);

    let response = await fetch(`${API_BASE_URL}/Kyc/Submit?t=${Date.now()}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formPayload,
      cache: "no-cache",
    });

    if (response.status === 415) {
      response = await fetch(`${API_BASE_URL}/Kyc/Submit?t=${Date.now()}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...basePayload,
          ...(idFile ? { GovernmentIssuedId: await toBase64(idFile, true) } : {}),
          ...(selfieFile ? { SelfieWithId: await toBase64(selfieFile, true) } : {}),
        }),
        cache: "no-cache",
      });
    }

    if (response.status === 415) {
      response = await fetch(`${API_BASE_URL}/Kyc/Submit?t=${Date.now()}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...basePayload,
          ...(idFile ? { GovernmentIssuedId: await toBase64(idFile) } : {}),
          ...(selfieFile ? { SelfieWithId: await toBase64(selfieFile) } : {}),
        }),
        cache: "no-cache",
      });
    }

    if (!response.ok) {
      const text = await response.text();
      let payloadError = null;

      try {
        payloadError = text ? JSON.parse(text) : null;
      } catch (parseError) {
        payloadError = null;
      }

      const error = new Error(
        payloadError?.message || text || `KYC submission failed (${response.status})`
      );
      error.fieldErrors = normalizeServerErrors(payloadError?.errors || {});
      throw error;
    }
    return response.json().catch(() => null);
  };

  const handleSubmit = async () => {
    const token = getAuthToken();
    if (!token || !isAuthenticated) {
      setError("You must be logged in to submit KYC.");
      return;
    }
    if (!validateForm()) {
      setError(
        "Complete all required fields and provide the required images before submitting."
      );
      toast.error("Complete the KYC form before submitting.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    const submittedAt = new Date().toISOString();
    const basePayload = payload(submittedAt);

    try {
      const result = await submitKyc(token, basePayload);
      const nextStatus = result?.data?.status || "pending";
      const nextSubmission = result?.data?.submission || null;

      setSubmission(nextSubmission);
      setSubmissionDocuments(getSubmissionDocuments(nextSubmission));
      setSubmissionStatus(nextStatus);
      setSubmissionVerified(Boolean(result?.data?.verified));
      updateUserProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        middleName: formData.middleName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        country: formData.country,
        nationality: formData.nationality || formData.country,
        issuingCountry:
          formData.issuingCountry || formData.nationality || formData.country,
        addressLine1: formData.addressLine1.trim(),
        city: formData.city.trim(),
        stateProvince: formData.stateProvince.trim(),
        postalCode: formData.postalCode.trim(),
        dateOfBirth: formData.dateOfBirth,
        kycIdType: formData.idType,
        kycDocumentNumber: formData.idNumber.trim(),
        kycDocumentExpiry: formData.expiryDate,
        kycSubmittedAt: submittedAt,
        kycStatus: nextStatus,
        kycVerified: Boolean(result?.data?.verified),
      });
      localStorage.setItem(
        "kycSubmission",
        JSON.stringify({ ...basePayload, kycStatus: nextStatus })
      );
      try {
        await saveUserProfile({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          country: formData.country,
        });
      } catch (profileError) {
        console.warn(
          "Profile update skipped after KYC submission:",
          profileError?.message || profileError
        );
      }
      await refreshKYCStatus();
      setSuccess("Verification submitted successfully. Review has started.");
      toast.success("KYC submitted successfully.");
      setIdFile(null);
      setSelfieFile(null);
      setErrors({});
      setTimeout(() => navigate("/dashboard"), 1800);
    } catch (submitError) {
      const message = submitError?.message || "Failed to submit KYC.";
      if (submitError?.fieldErrors && Object.keys(submitError.fieldErrors).length > 0) {
        setErrors(submitError.fieldErrors);
      }
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const pageShellClass = isDark
    ? "bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),linear-gradient(180deg,#020617_0%,#020617_44%,#0f172a_100%)] text-slate-100"
    : "bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.10),transparent_28%),radial-gradient(circle_at_84%_14%,rgba(14,165,233,0.08),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] text-slate-900";
  const heroPanelClass = isDark
    ? "border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_34%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.96))] shadow-[0_28px_90px_rgba(2,8,23,0.38)]"
    : "border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.12),_transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.96))] shadow-[0_26px_80px_rgba(15,23,42,0.10)]";
  const heroChipClass = isDark
    ? "border-white/10 bg-white/5 text-slate-300"
    : "border-teal-200 bg-teal-50 text-teal-700";
  const heroSummaryCardClass = isDark
    ? "border-white/8 bg-white/5"
    : "border-slate-200 bg-white/82 backdrop-blur-sm";
  const notePanelClass = isDark
    ? "border-white/10 bg-white/5"
    : "border-slate-200 bg-white/84 shadow-[0_16px_44px_rgba(15,23,42,0.06)]";
  const tipCardClass = isDark
    ? "border-white/8 bg-slate-950/35"
    : "border-slate-200 bg-slate-50";
  const panelClass = isDark
    ? "border-slate-800 bg-slate-950/96"
    : "border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]";
  const snapshotCardClass = isDark
    ? "border-slate-800 bg-slate-900/70"
    : "border-slate-200 bg-slate-50";
  const infoStripClass = isDark
    ? "border-slate-800 bg-slate-900/55"
    : "border-slate-200 bg-slate-50";
  const iconPanelClass = isDark
    ? "bg-slate-900 text-teal-200"
    : "bg-teal-50 text-teal-700";
  const secondaryIconPanelClass = isDark
    ? "bg-slate-950 text-cyan-200"
    : "bg-cyan-50 text-cyan-700";
  const bodyMutedClass = isDark ? "text-slate-400" : "text-slate-600";
  const surfaceTextClass = isDark ? "text-white" : "text-slate-900";
  const liveFormBadgeClass = isDark
    ? "border-teal-400/16 bg-teal-500/10 text-teal-100"
    : "border-teal-200 bg-teal-50 text-teal-700";
  const alertClass = error
    ? isDark
      ? "border-rose-400/20 bg-rose-500/10 text-rose-200"
      : "border-rose-200 bg-rose-50 text-rose-700"
    : isDark
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  const progressTrackClass = isDark ? "bg-white/8" : "bg-slate-200";
  const selectOptionClass = isDark ? "bg-slate-950 text-white" : "bg-white text-slate-900";
  const unauthPanelClass = isDark
    ? "border-slate-800 bg-slate-950/96"
    : "border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]";
  const verifiedStripText = isVerifiedView
    ? "Protected wallet and trading flows are active."
    : "Protected wallet and trading flows open after approval.";

  if (!isAuthenticated) {
    return (
      <div className={`w-full px-4 py-10 sm:px-6 lg:px-8 ${pageShellClass}`}>
        <div className={`mx-auto max-w-4xl rounded-[1.75rem] border p-8 text-center ${unauthPanelClass}`}>
          <div
            className={`mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-t-teal-400 ${
              isDark ? "border-slate-700" : "border-slate-200"
            }`}
          />
          <p className={bodyMutedClass}>
            Checking your session and verification access...
          </p>
          {error && (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                isDark
                  ? "border-rose-400/18 bg-rose-500/10 text-rose-200"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <section
      className={`min-h-screen w-full overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8 ${pageShellClass}`}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <section className={`overflow-hidden rounded-[2rem] border p-6 ${heroPanelClass}`}>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.45fr)]">
            <div className="min-w-0">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.24em] ${heroChipClass}`}
              >
                <ShieldCheck
                  className={`h-3.5 w-3.5 ${isDark ? "text-teal-200" : "text-teal-700"}`}
                  strokeWidth={2.4}
                />
                Identity Verification
              </div>
              <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <h1 className={`max-w-3xl text-3xl font-bold leading-tight sm:text-[2.35rem] ${surfaceTextClass}`}>
                    Standard KYC review for your account
                  </h1>
                  <p className={`mt-3 max-w-2xl break-words text-sm leading-7 ${bodyMutedClass}`}>
                    {statusCopy.hero}
                  </p>
                </div>
                <span
                  className={`self-start rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] ${statusCopy.badge}`}
                >
                  {statusCopy.label}
                </span>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className={`min-w-0 rounded-[1.35rem] border p-4 ${heroSummaryCardClass}`}>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Account
                  </p>
                  <p className={`mt-2 break-all text-sm font-semibold leading-6 ${surfaceTextClass}`}>
                    {userData?.email}
                  </p>
                </div>
                <div className={`min-w-0 rounded-[1.35rem] border p-4 ${heroSummaryCardClass}`}>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Progress
                  </p>
                  <p className={`mt-2 text-sm font-semibold ${surfaceTextClass}`}>
                    {progress}% complete
                  </p>
                  <div className={`mt-3 h-2 rounded-full ${progressTrackClass}`}>
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className={`min-w-0 rounded-[1.35rem] border p-4 ${heroSummaryCardClass}`}>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Ready state
                  </p>
                  <p className={`mt-2 break-words text-sm font-semibold leading-6 ${surfaceTextClass}`}>
                    {currentStatus === "verified"
                      ? "All protected features ready"
                      : "Funding and protected tools unlock after approval"}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className={`min-w-0 rounded-[1.5rem] border p-5 ${notePanelClass}`}>
                <div className="mb-3 flex items-center gap-3">
                  <FileBadge2
                    className={`h-5 w-5 ${isDark ? "text-teal-200" : "text-teal-700"}`}
                    strokeWidth={2.4}
                  />
                  <h2 className={`text-base font-semibold ${surfaceTextClass}`}>
                    What you need
                  </h2>
                </div>
                <ul className="space-y-3">
                  {NOTES.map((item) => (
                    <li
                      key={item}
                      className={`flex gap-3 text-sm leading-6 ${bodyMutedClass}`}
                    >
                      <BadgeCheck
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${isDark ? "text-teal-200" : "text-teal-700"}`}
                        strokeWidth={2.5}
                      />
                      <span className="min-w-0 break-words">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`min-w-0 rounded-[1.5rem] border p-5 ${notePanelClass}`}>
                <div className="mb-3 flex items-center gap-3">
                  <AlertCircle
                    className={`h-5 w-5 ${isDark ? "text-cyan-200" : "text-cyan-700"}`}
                    strokeWidth={2.4}
                  />
                  <h2 className={`text-base font-semibold ${surfaceTextClass}`}>
                    Review tips
                  </h2>
                </div>
                <div className={`space-y-3 text-sm ${bodyMutedClass}`}>
                  <div className={`rounded-2xl border p-3 ${tipCardClass}`}>
                    Legal identity details should match the uploaded document
                    exactly.
                  </div>
                  <div className={`rounded-2xl border p-3 ${tipCardClass}`}>
                    Blurry or expired documents usually delay approval.
                  </div>
                  <div className={`rounded-2xl border p-3 ${tipCardClass}`}>
                    Your dashboard status updates after the submission is
                    reviewed.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,1.45fr)]">
          <div className="min-w-0 space-y-6">
            <div className={`min-w-0 rounded-[1.75rem] border p-6 ${panelClass}`}>
              <div className="flex items-center gap-3">
                <div className={`rounded-2xl p-3 ${iconPanelClass}`}>
                  <UserCircle2 className="h-5 w-5" strokeWidth={2.4} />
                </div>
                <div className="min-w-0">
                  <h2 className={`text-lg font-semibold ${surfaceTextClass}`}>
                    Verification snapshot
                  </h2>
                  <p className={`text-sm ${bodyMutedClass}`}>
                    These details sync back into your account profile.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <div className={`min-w-0 rounded-[1.25rem] border p-4 ${snapshotCardClass}`}>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    Current country
                  </p>
                  <p className={`mt-2 break-words text-sm font-semibold leading-6 ${surfaceTextClass}`}>
                    {formData.country || "Not selected yet"}
                  </p>
                </div>
                <div className={`min-w-0 rounded-[1.25rem] border p-4 ${snapshotCardClass}`}>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    Document type
                  </p>
                  <p className={`mt-2 break-words text-sm font-semibold leading-6 ${surfaceTextClass}`}>
                    {documentTypeLabel}
                  </p>
                </div>
                <div className={`min-w-0 rounded-[1.25rem] border p-4 ${snapshotCardClass}`}>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    Review mode
                  </p>
                  <p className={`mt-2 break-words text-sm font-semibold leading-6 ${surfaceTextClass}`}>
                    Standard compliance check with image verification
                  </p>
                </div>
              </div>
            </div>

            {isVerifiedView ? (
              submissionLoading && !submissionLoaded ? (
                <>
                  <div className={`min-w-0 rounded-[1.5rem] border p-5 ${panelClass}`}>
                    <p className={`text-sm ${bodyMutedClass}`}>Loading verified ID image...</p>
                  </div>
                  <div className={`min-w-0 rounded-[1.5rem] border p-5 ${panelClass}`}>
                    <p className={`text-sm ${bodyMutedClass}`}>Loading verified selfie...</p>
                  </div>
                </>
              ) : (
                <>
                  <DocumentPreviewCard
                    title="Government-issued ID"
                    image={submissionDocuments.front}
                    icon={IdCard}
                    isDark={isDark}
                  />

                  <DocumentPreviewCard
                    title="Selfie with ID"
                    image={submissionDocuments.selfie}
                    icon={Camera}
                    isDark={isDark}
                  />
                </>
              )
            ) : (
              <>
                <UploadCard
                  title="Government-issued ID"
                  description="Upload the same valid ID you are verifying with."
                  file={idFile}
                  preview={idPreviewSrc}
                  selectedLabel={hasExistingId ? "Existing document on file" : ""}
                  inputRef={idInputRef}
                  onPick={(event) => onFileChange(event, "id")}
                  error={errors.idFile}
                  icon={IdCard}
                  isDark={isDark}
                />

                <UploadCard
                  title="Selfie with ID"
                  description="Take a clear selfie while holding the same document near your face."
                  file={selfieFile}
                  preview={selfiePreviewSrc}
                  selectedLabel={hasExistingSelfie ? "Existing selfie on file" : ""}
                  inputRef={selfieInputRef}
                  onPick={(event) => onFileChange(event, "selfie")}
                  error={errors.selfieFile}
                  icon={Camera}
                  isDark={isDark}
                />
              </>
            )}
          </div>

          <div className={`min-w-0 rounded-[1.75rem] border p-6 ${panelClass}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className={`text-xl font-semibold ${surfaceTextClass}`}>
                  Verification details
                </h2>
                <p className={`mt-2 break-words text-sm ${bodyMutedClass}`}>
                  {isVerifiedView
                    ? "Your approved identity record is shown below."
                    : "Fill every required field exactly as it appears on your document."}
                </p>
              </div>
              <div
                className={`self-start rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] ${liveFormBadgeClass}`}
              >
                {isVerifiedView ? "Verified record" : "Live form"}
              </div>
            </div>

            {(error || success) && (
              <div className={`mt-6 rounded-[1.35rem] border px-4 py-3 text-sm ${alertClass}`}>
                {error || success}
              </div>
            )}

            {submissionLoading && isVerifiedView && !submissionLoaded ? (
              <div className={`mt-6 rounded-[1.35rem] border p-6 ${infoStripClass}`}>
                <p className={`text-sm ${bodyMutedClass}`}>Loading your verified KYC record...</p>
              </div>
            ) : isVerifiedView ? (
              <div className="mt-6 grid items-start gap-5 md:grid-cols-2">
                <StaticField label="Legal first name" value={formData.firstName} isDark={isDark} />
                <StaticField label="Legal last name" value={formData.lastName} isDark={isDark} />
                <StaticField label="Middle name" value={formData.middleName} isDark={isDark} />
                <StaticField label="Phone number" value={formData.phoneNumber} isDark={isDark} />
                <StaticField label="Country of residence" value={formData.country} isDark={isDark} />
                <StaticField label="Nationality" value={formData.nationality} isDark={isDark} />
                <StaticField label="Issuing country" value={formData.issuingCountry} isDark={isDark} />
                <StaticField label="ID type" value={documentTypeLabel} isDark={isDark} />
                <StaticField label="Document number" value={formData.idNumber} isDark={isDark} />
                <StaticField label="Date of birth" value={formatDate(formData.dateOfBirth)} isDark={isDark} />
                <StaticField label="Residential address" value={formData.addressLine1} isDark={isDark} />
                <StaticField label="City" value={formData.city} isDark={isDark} />
                <StaticField label="State / Province" value={formData.stateProvince} isDark={isDark} />
                <StaticField label="Postal code" value={formData.postalCode} isDark={isDark} />
                <StaticField
                  label="Submitted"
                  value={formatDate(submission?.submittedAt || userData?.kycSubmittedAt)}
                  isDark={isDark}
                />
                <StaticField
                  label="Reviewed"
                  value={formatDate(submission?.reviewedAt)}
                  isDark={isDark}
                />
              </div>
            ) : (
              <div className="mt-6 grid items-start gap-5 md:grid-cols-2">
                <FormField label="Legal first name" name="firstName" value={formData.firstName} error={errors.firstName} onChange={onFieldChange} isDark={isDark} />
                <FormField label="Legal last name" name="lastName" value={formData.lastName} error={errors.lastName} onChange={onFieldChange} isDark={isDark} />
                <FormField label="Middle name" name="middleName" optional value={formData.middleName} error={errors.middleName} onChange={onFieldChange} isDark={isDark} />
                <FormField label="Phone number" name="phoneNumber" value={formData.phoneNumber} error={errors.phoneNumber} onChange={onFieldChange} isDark={isDark} />
                <FormField
                  label="Country of residence"
                  name="country"
                  value={formData.country}
                  error={errors.country}
                  onChange={onFieldChange}
                  isDark={isDark}
                  children={
                    <select
                      name="country"
                      value={formData.country}
                      onChange={onFieldChange}
                      className={fieldSurfaceClassName(Boolean(errors.country), isDark)}
                    >
                      <option value="" className={selectOptionClass}>Select your country</option>
                      {countries.map((country) => (
                        <option key={country.name} value={country.name} className={selectOptionClass}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  }
                />
                <FormField label="Nationality" name="nationality" optional value={formData.nationality} error={errors.nationality} onChange={onFieldChange} isDark={isDark} />
                <FormField
                  label="Issuing country"
                  name="issuingCountry"
                  value={formData.issuingCountry}
                  error={errors.issuingCountry}
                  onChange={onFieldChange}
                  isDark={isDark}
                  children={
                    <select
                      name="issuingCountry"
                      value={formData.issuingCountry}
                      onChange={onFieldChange}
                      className={fieldSurfaceClassName(Boolean(errors.issuingCountry), isDark)}
                    >
                      <option value="" className={selectOptionClass}>Select issuing country</option>
                      {countries.map((country) => (
                        <option key={`issuing-${country.name}`} value={country.name} className={selectOptionClass}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  }
                />
                <FormField
                  label="ID type"
                  name="idType"
                  value={formData.idType}
                  error={errors.idType}
                  onChange={onFieldChange}
                  isDark={isDark}
                  children={
                    <select
                      name="idType"
                      value={formData.idType}
                      onChange={onFieldChange}
                      className={fieldSurfaceClassName(Boolean(errors.idType), isDark)}
                    >
                      <option value="" className={selectOptionClass}>Select an ID type</option>
                      {ID_TYPES.map((item) => (
                        <option key={item.value} value={item.value} className={selectOptionClass}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  }
                />
                <FormField label="Document number" name="idNumber" value={formData.idNumber} error={errors.idNumber} onChange={onFieldChange} isDark={isDark} />
                <FormField label="Date of birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} error={errors.dateOfBirth} onChange={onFieldChange} isDark={isDark} />
                <FormField label="Document expiry date" name="expiryDate" type="date" optional value={formData.expiryDate} error={errors.expiryDate} onChange={onFieldChange} isDark={isDark} />
                <FormField label="Residential address" name="addressLine1" value={formData.addressLine1} error={errors.addressLine1} onChange={onFieldChange} isDark={isDark} />
                <FormField label="City" name="city" value={formData.city} error={errors.city} onChange={onFieldChange} isDark={isDark} />
                <FormField label="State / Province" name="stateProvince" value={formData.stateProvince} error={errors.stateProvince} onChange={onFieldChange} isDark={isDark} />
                <FormField label="Postal code" name="postalCode" value={formData.postalCode} error={errors.postalCode} onChange={onFieldChange} isDark={isDark} />
              </div>
            )}

            <div className={`mt-8 flex flex-col gap-3 rounded-[1.35rem] border p-4 sm:flex-row sm:items-center sm:justify-between ${infoStripClass}`}>
              <div className={`flex min-w-0 items-center gap-3 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                <div className={`rounded-2xl p-2 ${iconPanelClass}`}>
                  <Globe2 className="h-4 w-4" strokeWidth={2.4} />
                </div>
                <span className="break-words">
                  Country, document type, and identity fields should match your
                  record.
                </span>
              </div>
              <div className={`flex min-w-0 items-center gap-3 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                <div className={`rounded-2xl p-2 ${secondaryIconPanelClass}`}>
                  <ShieldCheck className="h-4 w-4" strokeWidth={2.4} />
                </div>
                <span className="break-words">
                  {verifiedStripText}
                </span>
              </div>
            </div>

            {!isVerifiedView && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-[1.35rem] bg-[linear-gradient(135deg,rgba(45,212,191,1),rgba(6,182,212,0.95))] px-5 py-4 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(45,212,191,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Submitting verification..." : "Submit KYC verification"}
                {!loading && <ArrowRight className="h-4 w-4" strokeWidth={2.6} />}
              </button>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
