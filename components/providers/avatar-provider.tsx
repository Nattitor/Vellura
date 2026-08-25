"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "./language-provider";

interface AvatarContextType {
  avatarUrl: string | null;
  uploadAvatar: (file: File) => Promise<boolean>;
  removeAvatar: () => void;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

const STORAGE_KEY = "vellura_avatar";

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setAvatarUrl(saved);
      }
    } catch {
      // localStorage may not be available in some environments
    }
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
        img.onload = () => {
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
              localStorage.setItem(STORAGE_KEY, optimizedBase64);
              setAvatarUrl(optimizedBase64);
              toast.success(t.settings.photoUpdated);
              resolve(true);
            } catch (err) {
              toast.error("Failed to store image in browser storage");
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

  const removeAvatar = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
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
