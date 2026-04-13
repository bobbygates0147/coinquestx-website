import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
  LoaderCircle,
  Upload,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

const defaultAvatars = [
  "https://cdn.pixabay.com/photo/2018/01/18/07/31/bitcoin-3089728_640.jpg",
  "https://cdn.pixabay.com/photo/2022/05/10/15/08/bitcoin-7187347_640.png",
  "https://cdn.pixabay.com/photo/2017/08/14/14/38/bitcoin-2640692_640.png",
  "https://cdn.pixabay.com/photo/2021/05/24/09/15/ethereum-logo-6278329_640.png",
  "https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083379_640.jpg",
  "https://cdn.pixabay.com/photo/2016/11/21/12/42/beard-1845166_640.jpg",
];

const defaultCoverImages = [
  "https://picsum.photos/seed/coinquestx-cover-1/1600/600",
  "https://picsum.photos/seed/coinquestx-cover-2/1600/600",
  "https://picsum.photos/seed/coinquestx-cover-3/1600/600",
  "https://picsum.photos/seed/coinquestx-cover-4/1600/600",
];

const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;
const MAX_COVER_FILE_SIZE = 4 * 1024 * 1024;
const MAX_AVATAR_OUTPUT_SIZE = 700 * 1024;
const MAX_COVER_OUTPUT_SIZE = 2.5 * 1024 * 1024;

const estimateDataUrlSize = (value = "") => {
  const [, base64 = ""] = `${value}`.split(",");
  return Math.ceil((base64.length * 3) / 4);
};

const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Unable to process the selected image."));
    image.src = src;
  });

const optimizeImageDataUrl = async (
  dataUrl,
  { maxWidth, maxHeight, maxOutputSize, initialQuality = 0.84 }
) => {
  const image = await loadImageElement(dataUrl);
  const scale = Math.min(
    1,
    maxWidth / Math.max(image.width, 1),
    maxHeight / Math.max(image.height, 1)
  );
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return dataUrl;
  }

  context.drawImage(image, 0, 0, width, height);

  let quality = initialQuality;
  let optimized = dataUrl;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const webpCandidate = canvas.toDataURL("image/webp", quality);
    optimized =
      webpCandidate && webpCandidate !== "data:,"
        ? webpCandidate
        : canvas.toDataURL("image/jpeg", quality);

    if (
      !maxOutputSize ||
      estimateDataUrlSize(optimized) <= maxOutputSize ||
      quality <= 0.5
    ) {
      break;
    }

    quality = Math.max(0.5, quality - 0.12);
  }

  return optimized;
};

const getMessageTone = (message) => {
  const normalized = `${message || ""}`.toLowerCase();
  if (
    normalized.includes("please") ||
    normalized.includes("unable") ||
    normalized.includes("failed") ||
    normalized.includes("error")
  ) {
    return "error";
  }

  return "success";
};

function UpdatePhotoPage() {
  const navigate = useNavigate();
  const { userData, saveUserProfile } = useUser();
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [selectedCover, setSelectedCover] = useState("");
  const [customImageDataUrl, setCustomImageDataUrl] = useState("");
  const [customCoverDataUrl, setCustomCoverDataUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState(userData?.photoURL || "");
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(
    userData?.coverImageURL || ""
  );
  const [firstName, setFirstName] = useState(userData?.firstName || "");
  const [lastName, setLastName] = useState(userData?.lastName || "");
  const [phoneNumber, setPhoneNumber] = useState(userData?.phoneNumber || "");
  const [country, setCountry] = useState(userData?.country || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setPreviewUrl(userData?.photoURL || "");
    setCoverPreviewUrl(userData?.coverImageURL || "");
    setFirstName(userData?.firstName || "");
    setLastName(userData?.lastName || "");
    setPhoneNumber(userData?.phoneNumber || "");
    setCountry(userData?.country || "");
  }, [userData]);

  const readImageFile = (file, maxFileSize, imageOptions, successHandler) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image file (JPEG, PNG, WEBP, etc.)");
      return;
    }

    if (file.size > maxFileSize) {
      setMessage(
        `Image size should be less than ${Math.round(
          maxFileSize / (1024 * 1024)
        )}MB`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await optimizeImageDataUrl(
          `${reader.result || ""}`,
          imageOptions
        );

        if (
          imageOptions?.maxOutputSize &&
          estimateDataUrlSize(result) > imageOptions.maxOutputSize
        ) {
          setMessage(
            "The selected image is still too large to save. Please choose a smaller image."
          );
          return;
        }

        successHandler(result);
        setMessage("");
      } catch (error) {
        setMessage(error.message || "Unable to process the selected image.");
      }
    };
    reader.onerror = () => {
      setMessage("Unable to read the selected file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0];
    readImageFile(
      file,
      MAX_AVATAR_FILE_SIZE,
      {
        maxWidth: 640,
        maxHeight: 640,
        maxOutputSize: MAX_AVATAR_OUTPUT_SIZE,
        initialQuality: 0.86,
      },
      (result) => {
        setCustomImageDataUrl(result);
        setSelectedAvatar("");
        setPreviewUrl(result);
      }
    );
  };

  const handleCoverFileChange = (event) => {
    const file = event.target.files?.[0];
    readImageFile(
      file,
      MAX_COVER_FILE_SIZE,
      {
        maxWidth: 1600,
        maxHeight: 900,
        maxOutputSize: MAX_COVER_OUTPUT_SIZE,
        initialQuality: 0.84,
      },
      (result) => {
        setCustomCoverDataUrl(result);
        setSelectedCover("");
        setCoverPreviewUrl(result);
      }
    );
  };

  const handleAvatarSelect = (avatarUrl) => {
    setSelectedAvatar(avatarUrl);
    setCustomImageDataUrl("");
    setPreviewUrl(avatarUrl);
    setMessage("");
  };

  const handleCoverSelect = (coverUrl) => {
    setSelectedCover(coverUrl);
    setCustomCoverDataUrl("");
    setCoverPreviewUrl(coverUrl);
    setMessage("");
  };

  const handleSave = async () => {
    if (loading) return;
    if (!userData) {
      setMessage("Your profile is still loading. Please wait a moment.");
      return;
    }

    const photoURL =
      customImageDataUrl || selectedAvatar || userData.photoURL || "";
    const coverImageURL =
      customCoverDataUrl || selectedCover || userData.coverImageURL || "";

    setLoading(true);
    setMessage("");

    try {
      const updates = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        country: country.trim(),
        photoURL,
        coverImageURL,
      };

      await saveUserProfile(updates);
      setPreviewUrl(photoURL);
      setCoverPreviewUrl(coverImageURL);
      setIsSuccess(true);
      setMessage("Profile photo and cover image updated successfully!");
      setTimeout(() => {
        navigate("/Account");
      }, 1800);
    } catch (error) {
      console.error("Profile update failed", error);
      setMessage(error.message || "Unable to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const profileName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    userData?.displayName ||
    userData?.name ||
    "Your profile";

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-10 pt-10 text-slate-900 dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-slate-700 bg-slate-800/55 shadow-2xl backdrop-blur-lg">
        <div className="relative overflow-hidden border-b border-slate-700 bg-gradient-to-r from-teal-600 to-emerald-700 p-6 sm:p-8">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-6 top-6 rounded-full bg-white/15 p-2.5 transition-colors hover:bg-white/25"
          >
            <ArrowLeft className="h-5 w-5 text-white" strokeWidth={2.4} />
          </button>
          <div className="flex justify-center">
            <div className="rounded-full bg-white/20 p-4">
              <ImageIcon className="h-7 w-7 text-white" strokeWidth={2.2} />
            </div>
          </div>
          <h1 className="mt-4 text-center text-2xl font-bold text-white">
            {isSuccess ? "Media Updated!" : "Update Profile Media"}
          </h1>
          <p className="mt-2 text-center text-sm text-white/85">
            Upload both your profile photo and account cover in one place.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {isSuccess ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle2 className="h-8 w-8 text-green-400" strokeWidth={2.2} />
              </div>
              <p className="text-lg font-medium text-white">
                Your profile media has been updated successfully.
              </p>
              <p className="mt-2 text-slate-400">
                You&apos;ll be redirected back to your account shortly.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8 overflow-hidden rounded-[1.6rem] border border-slate-700 bg-slate-900/70">
                <div className="relative h-48 bg-gradient-to-r from-teal-700 via-emerald-700 to-cyan-700 sm:h-56">
                  {coverPreviewUrl ? (
                    <img
                      src={coverPreviewUrl}
                      alt="Cover preview"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/20 via-slate-950/10 to-slate-950/45" />
                  <div className="absolute right-4 top-4 rounded-full border border-white/20 bg-slate-950/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
                    Cover Preview
                  </div>
                </div>

                <div className="relative px-5 pb-6 sm:px-6">
                  <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                      <div className="relative">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Profile preview"
                            className="h-28 w-28 rounded-full border-4 border-slate-900 object-cover shadow-xl sm:h-32 sm:w-32"
                          />
                        ) : (
                          <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-slate-900 bg-slate-800 shadow-xl sm:h-32 sm:w-32">
                            <UserRound
                              className="h-10 w-10 text-slate-500"
                              strokeWidth={2.1}
                            />
                          </div>
                        )}
                      </div>

                      <div className="pb-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-400">
                          Live Preview
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">
                          {profileName}
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                          Avatar and banner updates will be saved to your account profile.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-slate-300">
                      <p className="font-medium text-white">Upload Limits</p>
                      <p className="mt-1">
                        Avatar: 2MB max, Cover: 4MB max
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    First Name
                  </label>
                  <input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-700/60 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Last Name
                  </label>
                  <input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-700/60 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Last name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Phone Number
                  </label>
                  <input
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-700/60 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Country
                  </label>
                  <input
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-700/60 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Country"
                  />
                </div>
              </div>

              <div className="grid gap-8 xl:grid-cols-[0.95fr,1.05fr]">
                <section className="rounded-[1.4rem] border border-slate-700 bg-slate-900/55 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-400">
                    Profile Photo
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Choose your avatar
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Pick a default avatar or upload a square image for your profile.
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {defaultAvatars.map((src, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAvatarSelect(src)}
                        className={`relative overflow-hidden rounded-full transition-all hover:scale-[1.03] ${
                          selectedAvatar === src ? "ring-4 ring-teal-500" : ""
                        }`}
                      >
                        <img
                          src={src}
                          alt={`Avatar ${idx + 1}`}
                          className="aspect-square h-full w-full object-cover"
                        />
                        {selectedAvatar === src ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-teal-500/30">
                            <CheckCircle2
                              className="h-6 w-6 text-white"
                              strokeWidth={2.4}
                            />
                          </div>
                        ) : null}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5">
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-600 bg-slate-800/70 p-6 text-center transition-colors hover:border-teal-500 hover:bg-slate-800">
                      <div className="mb-3 rounded-full bg-teal-600/20 p-3">
                        <Upload className="h-5 w-5 text-teal-400" strokeWidth={2.3} />
                      </div>
                      <p className="font-medium text-white">Upload profile photo</p>
                      <p className="mt-1 text-sm text-slate-400">
                        JPG, PNG, WEBP up to 2MB
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                  </div>
                </section>

                <section className="rounded-[1.4rem] border border-slate-700 bg-slate-900/55 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-400">
                    Cover Image
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Set your profile banner
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Add a wide cover image that appears at the top of your account page.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {defaultCoverImages.map((src, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleCoverSelect(src)}
                        className={`relative overflow-hidden rounded-[1.15rem] border transition-all hover:-translate-y-0.5 ${
                          selectedCover === src
                            ? "border-teal-500 ring-2 ring-teal-500/40"
                            : "border-slate-700"
                        }`}
                      >
                        <img
                          src={src}
                          alt={`Cover ${idx + 1}`}
                          className="aspect-[16/7] h-full w-full object-cover"
                        />
                        {selectedCover === src ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-teal-500/25">
                            <CheckCircle2
                              className="h-7 w-7 text-white"
                              strokeWidth={2.4}
                            />
                          </div>
                        ) : null}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5">
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-600 bg-slate-800/70 p-6 text-center transition-colors hover:border-teal-500 hover:bg-slate-800">
                      <div className="mb-3 rounded-full bg-teal-600/20 p-3">
                        <Upload className="h-5 w-5 text-teal-400" strokeWidth={2.3} />
                      </div>
                      <p className="font-medium text-white">Upload cover image</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Wide JPG, PNG, WEBP up to 4MB
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverFileChange}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                  </div>
                </section>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className={`rounded-lg px-8 py-3 font-medium text-white shadow-lg transition-all ${
                    loading
                      ? "cursor-not-allowed bg-teal-500"
                      : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:-translate-y-0.5 hover:from-teal-500 hover:to-emerald-500 hover:shadow-xl"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <LoaderCircle
                        className="mr-2 h-4 w-4 animate-spin"
                        strokeWidth={2.4}
                      />
                      Saving...
                    </span>
                  ) : (
                    "Save Profile Media"
                  )}
                </button>
              </div>

              {message ? (
                <p
                  className={`mt-4 rounded-lg p-3 text-center ${
                    getMessageTone(message) === "error"
                      ? "bg-red-900/30 text-red-400"
                      : "bg-teal-900/30 text-teal-400"
                  }`}
                >
                  {message}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-slate-500">
        <p>Your profile photo and cover image are saved to your account profile.</p>
      </div>
    </div>
  );
}

export default UpdatePhotoPage;
