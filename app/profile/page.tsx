"use client";

import { useEffect, useState, useRef } from "react";
import Header from "../components/Header";
import Image from "next/image";
import { Pencil, LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import Cropper from "react-easy-crop";

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: any) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  // กำหนดขนาด Canvas เท่ากับขนาดรูปจริง
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  // ดึงข้อมูลจากส่วนที่ Crop
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.putImageData(data, 0, 0);

  return new Promise<string>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
      }
    }, "image/jpeg");
  });
}

// Main Component
export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [cropImage, setCropImage] = useState<string | null>(null);
  const [openCrop, setOpenCrop] = useState(false);

  // State สำหรับ Cropper
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [hasUnsavedAvatarChanges, setHasUnsavedAvatarChanges] = useState(false);
  const [hasUnsavedInfoChanges, setHasUnsavedInfoChanges] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editedUser, setEditedUser] = useState<any>(null);
  const [openSuccess, setOpenSuccess] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setEditedUser(parsedUser);
      setAvatar(parsedUser.avatar);
    }
  }, []);

  if (!user) return null;

  const roleLabel =
    user.role === "admin"
      ? "Merchant Owner"
      : user.role === "manager"
      ? "Manager"
      : "Viewer";

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset crop states
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    const imageUrl = URL.createObjectURL(file);
    setCropImage(imageUrl);
    setOpenCrop(true);

    e.target.value = "";
  };

  const onCropSave = async () => {
    try {
      if (cropImage && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(cropImage, croppedAreaPixels);
        if (croppedImage) {
          setAvatar(croppedImage);
          setHasUnsavedAvatarChanges(true);
          setOpenCrop(false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 mx-4 md:mx-8 pb-10">
      <Header title="Profile" />

      {/* Avatar Section */}
      <div
        className={`
          p-6 rounded-xl max-w-full transition-all duration-300
          ${
            hasUnsavedAvatarChanges
              ? "border-2 border-[#DDAD51] shadow-md bg-yellow-50/10"
              : "bg-white shadow-sm border border-gray-100"
          }
        `}
      >
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
          <div className="relative group">
            <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full ring-4 ring-white shadow-sm overflow-hidden bg-gray-100">
              <Image
                src={avatar || "/avatar-placeholder.png"}
                alt={`${user.first_name} avatar`}
                fill
                className="object-cover"
              />
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0
                w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#DDAD51]
                flex items-center justify-center
                shadow-md hover:bg-[#c49a46] active:scale-95
                transition border-2 border-white z-10"
            >
              <Pencil size={18} className="text-white" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="text-center md:text-left pt-2">
            <h2 className="text-2xl font-bold text-gray-800">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-[#275066] font-medium">{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div
        className={`
          p-6 rounded-xl max-w-full relative transition-all duration-300
          ${
            hasUnsavedInfoChanges
              ? "border-2 border-[#DDAD51] shadow-md bg-yellow-50/10"
              : "bg-white shadow-sm border border-gray-100"
          }
        `}
      >
        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">
            Personal Information
          </h2>

          <button
            onClick={() => {
              if (isEditingInfo) {
                setEditedUser(user);
                setIsEditingInfo(false);
                setHasUnsavedInfoChanges(false);
              } else {
                setEditedUser(user);
                setIsEditingInfo(true);
              }
            }}
            className={`
    p-2 transition-colors
    ${
      isEditingInfo
        ? "text-gray-400 hover:text-gray-600"
        : "text-[#275066] hover:text-[#1f3b4d]"
    }
  `}
            title={isEditingInfo ? "Cancel editing" : "Edit information"}
          >
            {isEditingInfo ? (
              <span className="text-lg font-bold">
                <X />
              </span>
            ) : (
              <Pencil size={20} />
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
          <InfoField
            label="First Name"
            value={user.first_name}
            isEditing={isEditingInfo}
            editValue={editedUser.first_name}
            onChange={(val: string) => {
              setEditedUser({ ...editedUser, first_name: val });
              setHasUnsavedInfoChanges(true);
            }}
          />

          <InfoField
            label="Last Name"
            value={user.last_name}
            isEditing={isEditingInfo}
            editValue={editedUser.last_name}
            onChange={(val: string) => {
              setEditedUser({ ...editedUser, last_name: val });
              setHasUnsavedInfoChanges(true);
            }}
          />

          <InfoField
            label="Email Address"
            value={user.email}
            isEditing={isEditingInfo}
            editValue={editedUser.email}
            type="email"
            onChange={(val: string) => {
              setEditedUser({ ...editedUser, email: val });
              setHasUnsavedInfoChanges(true);
            }}
          />

          <InfoField
            label="Phone"
            value={user.phone_number}
            isEditing={isEditingInfo}
            editValue={editedUser.phone_number}
            type="tel"
            onChange={(val: string) => {
              setEditedUser({ ...editedUser, phone_number: val });
              setHasUnsavedInfoChanges(true);
            }}
          />

          <div className="space-y-1.5 pt-2 border-t md:border-t-0 border-dashed border-gray-200">
            <h3 className="text-gray-500 text-xs uppercase tracking-wide">
              Role
            </h3>
            <p className="font-medium text-gray-800 bg-gray-50 px-3 py-2 rounded-md inline-block w-full md:w-auto">
              {roleLabel}
            </p>
          </div>

          <div className="space-y-1.5 pt-2 border-t md:border-t-0 border-dashed border-gray-200">
            <h3 className="text-gray-500 text-xs uppercase tracking-wide">
              Merchant ID
            </h3>
            <p className="font-medium text-gray-800 bg-gray-50 px-3 py-2 rounded-md inline-block w-full md:w-auto">
              {user.merchant_id}
            </p>
          </div>

          <div className="space-y-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-dashed border-gray-200">
            <h3 className="text-gray-500 text-xs uppercase tracking-wide">
              Store Access
            </h3>
            <p className="font-medium text-gray-800 bg-gray-50 px-3 py-2 rounded-md inline-block w-full md:w-auto">
              {user.store_branches.join(", ")}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col-reverse md:flex-row justify-end gap-3 md:gap-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5
              bg-[#DC2626] text-white border border-red-100 font-semibold rounded-lg
              transition-all duration-300 shadow-sm
              hover:shadow-md hover:-translate-y-[1px] hover:bg-[#B91C1C]
          active:translate-y-[1px]"
            >
              <LogOut size={18} />
              <span>Log out</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="w-[90%] md:w-full rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm log out</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to log out? You will need to sign in again
                to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700"
              >
                Log out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {(hasUnsavedAvatarChanges || hasUnsavedInfoChanges) && (
          <button
            className="w-full md:w-auto px-6 py-2.5 rounded-lg
            bg-[#275066] text-white font-semibold shadow-lg shadow-[#275066]/20
            hover:bg-[#1f3b4d] active:scale-[0.98] transition-all"
            onClick={() => {
              const updatedUser = { ...editedUser, avatar };
              localStorage.setItem("user", JSON.stringify(updatedUser));
              setUser(updatedUser);
              setEditedUser(updatedUser);
              setHasUnsavedAvatarChanges(false);
              setHasUnsavedInfoChanges(false);
              setIsEditingInfo(false);
              setOpenSuccess(true);
            }}
          >
            Save Changes
          </button>
        )}
      </div>

      {/* Cropper Modal */}
      {openCrop && cropImage && (
        <AlertDialog open={openCrop} onOpenChange={setOpenCrop}>
          <AlertDialogContent className="max-w-md w-[90%] rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Adjust Photo</AlertDialogTitle>
              <AlertDialogDescription>
                Drag to position your photo.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden my-2">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(croppedArea, croppedAreaPixels) => {
                  setCroppedAreaPixels(croppedAreaPixels);
                }}
              />
            </div>

            {/* Slider Zoom pic */}
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs text-gray-500">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#275066]"
              />
            </div>

            <AlertDialogFooter className="mt-4 gap-2">
              <AlertDialogCancel
                onClick={() => setOpenCrop(false)}
                className="mt-0"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={onCropSave} className="bg-[#275066]">
                Apply
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Success Modal */}
      <AlertDialog open={openSuccess} onOpenChange={setOpenSuccess}>
        <AlertDialogContent className="max-w-sm w-[85%] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-600 flex items-center gap-2">
              Success
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your profile information has been updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setOpenSuccess(false)}
              className="bg-green-600 hover:bg-green-700 w-full"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoField({
  label,
  value,
  isEditing,
  editValue,
  onChange,
  type = "text",
}: any) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-gray-500 text-xs uppercase tracking-wide">{label}</h3>
      {isEditing ? (
        <input
          type={type}
          value={editValue || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900
            focus:outline-none focus:ring-2 focus:ring-[#DDAD51] focus:border-transparent transition-all"
        />
      ) : (
        <p className="font-medium text-gray-800 py-2 border-b border-transparent">
          {value}
        </p>
      )}
    </div>
  );
}
