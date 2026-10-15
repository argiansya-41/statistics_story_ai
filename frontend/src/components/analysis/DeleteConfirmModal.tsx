"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  analysisTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  analysisTitle,
  onConfirm,
  onCancel,
  isDeleting,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-md border-2 border-black bg-white shadow-[8px_8px_0px_0px_#000000] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-black bg-[#FF2E2E] px-5 py-3 text-white">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-mono-tech text-xs font-bold tracking-wider uppercase">
              KONFIRMASI PENGHAPUSAN
            </span>
          </div>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="text-white hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="font-sans text-sm text-black/80 leading-relaxed">
            Apakah Anda yakin ingin menghapus analisis{" "}
            <strong className="text-black font-bold font-mono-tech">&quot;{analysisTitle}&quot;</strong>?
          </p>
          <p className="font-mono-tech text-xs text-[#FF2E2E] bg-[#FF2E2E]/10 p-3 border border-[#FF2E2E]/30">
            Tindakan ini permanen. Seluruh data hasil perhitungan statistik, narasi AI, dan visualisasi grafik terkait akan dihapus (ON DELETE CASCADE).
          </p>
        </div>

        {/* Modal Footer Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-black bg-[#F8F8F8] px-5 py-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="px-4 py-2 border border-black font-mono-tech text-xs font-bold hover:bg-white transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-5 py-2 bg-[#FF2E2E] text-white font-mono-tech text-xs font-bold hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? "Menghapus..." : "Ya, Hapus Analisis"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
