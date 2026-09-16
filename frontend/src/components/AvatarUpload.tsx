"use client";

import { useState } from "react";
import { usersApi } from "@/lib/api";
import { toast } from "sonner";
import { Camera, Loader2, UserRound } from "lucide-react";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export function AvatarUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("La imagen no puede superar 5MB");
      return;
    }
    setUploading(true);
    try {
      await usersApi.uploadAvatar(file);
      setError(false);
      setVersion((v) => v + 1);
      toast.success("Foto actualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir la foto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <label
      title="Cambiar foto de perfil"
      className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 cursor-pointer shrink-0 flex items-center justify-center hover:border-blue-400 transition-colors group"
    >
      <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {!error ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/proxy/users/me/avatar?v=${version}`}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <UserRound className="h-4 w-4 text-gray-400" />
      )}
      {/* Insignia de cámara siempre visible: sin esto, el círculo se confunde con un simple avatar decorativo */}
      <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center group-hover:bg-blue-700 transition-colors">
        <Camera className="h-2.5 w-2.5 text-white" />
      </div>
      {uploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
        </div>
      )}
    </label>
  );
}
