"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "./language-provider";
import { updateAvatar as saveAvatarToCloud } from "@/app/actions/profile";

interface AvatarContextType {
  avatarUrl: string | null;
  uploadAvatar: (file: File) => Promise<boolean>;
  removeAvatar: () => Promise<void>;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

// Legacy key from when the avatar was cached globally in localStorage — shared
// across accounts on the same browser, so switching users showed the previous
// photo. No longer read; removed once below if present.
const LEGACY_STORAGE_KEY = "vellura_avatar";

export function AvatarProvider({
  children,
  initialAvatar = null
}: {
  children: React.ReactNode;
  initialAvatar?: string | null;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar);
  const { t } = useLanguage();

  // The avatar is server-rendered per account (initialAvatar): following it —
  // including back to null — means an account switch can never leak the
  // previous user's photo. No client-side cache by design.
  useEffect(() => {
    setAvatarUrl(initialAvatar ?? null);
  }, [initialAvatar]);

  // One-time cleanup of the legacy global cache, if present.
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {}
  }, []);

  const uploadAvatar = useCallback(async (file: File): Promise<boolean> => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error(t.settings.invalidImage);
      return false;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          // Resize and compress image using HTML Canvas to 256x256 max
          const canvas = document.createElement("canvas");
          const maxDim = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedBase64 = canvas.toDataURL("image/jpeg", 0.85);

            try {
              // Persist to Cloud in Supabase (User Metadata + Profiles)
              await saveAvatarToCloud(optimizedBase64);
              setAvatarUrl(optimizedBase64);

              toast.success(t.settings.photoUpdated);
              resolve(true);
            } catch {
              toast.error("Error al guardar la imagen en la nube");
              resolve(false);
            }
          } else {
            resolve(false);
          }
        };
        img.onerror = () => {
          toast.error(t.settings.invalidImage);
          resolve(false);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        toast.error(t.settings.invalidImage);
        resolve(false);
      };
      reader.readAsDataURL(file);
    });
  }, [t]);

  const removeAvatar = useCallback(async () => {
    try {
      await saveAvatarToCloud(null);
      setAvatarUrl(null);
      toast.info(t.settings.photoRemoved);
    } catch {
      // Ignore
    }
  }, [t]);

  return (
    <AvatarContext.Provider value={{ avatarUrl, uploadAvatar, removeAvatar }}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error("useAvatar must be used within an AvatarProvider");
  }
  return context;
}
