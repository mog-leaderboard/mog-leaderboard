"use client";

import { useRef, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Camera, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface PhotoUploadProps {
  uid: string;
  index: number;
  currentUrl?: string;
  onUpload: (url: string) => void;
}

export function PhotoUpload({ uid, index, currentUrl, onUpload }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      const storageRef = ref(storage, `photos/${uid}/${index}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onUpload(url);
    } catch {
      alert("Upload failed. Please try again.");
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={cn(
        "relative aspect-[3/4] rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-all duration-200",
        "hover:border-brand/50 hover:bg-brand/5",
        preview ? "border-transparent" : "border-border/40"
      )}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
      {preview ? (
        <>
          <Image src={preview} alt={`Photo ${index + 1}`} fill className="object-cover" />
          {!uploading && (
            <button
              className="absolute top-2 right-2 rounded-full bg-black/60 backdrop-blur-sm p-1.5 text-white hover:bg-black/80 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
                onUpload("");
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
          <div className="rounded-xl bg-muted/30 p-3">
            <Camera className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium">Photo {index + 1}</span>
        </div>
      )}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      )}
    </div>
  );
}
