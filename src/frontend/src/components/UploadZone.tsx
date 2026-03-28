import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, CloudUpload, ImageIcon, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  imagePreview: string | null;
  onClear: () => void;
  error: string | null;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

export function UploadZone({
  onFileSelect,
  selectedFile,
  imagePreview,
  onClear,
  error,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleClickZone = () => {
    if (!selectedFile) inputRef.current?.click();
  };

  const handleKeyZone = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !selectedFile) {
      inputRef.current?.click();
    }
  };

  return (
    <div className="space-y-3">
      <div
        data-ocid="upload.dropzone"
        aria-label="Upload food image by clicking or dragging"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClickZone}
        onKeyDown={handleKeyZone}
        className={cn(
          "relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer",
          "min-h-[280px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/50",
          isDragging ? "scale-[1.01]" : "",
          !selectedFile ? "dropzone-border" : "border-2 border-neon-cyan/30",
        )}
        style={{
          background: isDragging
            ? "rgba(34, 211, 238, 0.08)"
            : "rgba(20, 28, 45, 0.4)",
          boxShadow: isDragging
            ? "0 0 30px oklch(0.78 0.12 210 / 0.3), inset 0 0 30px oklch(0.78 0.12 210 / 0.05)"
            : undefined,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={handleInputChange}
          data-ocid="upload.input"
        />

        <AnimatePresence mode="wait">
          {selectedFile && imagePreview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full h-full p-4"
            >
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-60 object-contain rounded-xl image-glow"
              />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1 text-xs text-muted-foreground border border-border">
                {selectedFile.name} &middot;{" "}
                {(selectedFile.size / 1024).toFixed(0)} KB
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 p-8 text-center"
            >
              <div className="relative">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "oklch(0.78 0.12 210 / 0.1)",
                    border: "1px solid oklch(0.78 0.12 210 / 0.3)",
                  }}
                >
                  <CloudUpload className="w-8 h-8 neon-text-cyan" />
                </div>
                {isDragging && (
                  <div className="absolute inset-0 rounded-2xl animate-pulse-glow" />
                )}
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">
                  {isDragging
                    ? "Drop your image here"
                    : "Drag & drop food image"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse &middot; JPG, PNG, WEBP up to {MAX_SIZE_MB}
                  MB
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Supports MobileNetV2 224&times;224 processing</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            data-ocid="upload.error_state"
            className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        <Button
          data-ocid="upload.button"
          type="button"
          variant="outline"
          className="flex-1 border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10 hover:border-neon-cyan/60"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          {selectedFile ? "Change Image" : "Browse Files"}
        </Button>
        {selectedFile && (
          <Button
            data-ocid="upload.clear.button"
            type="button"
            variant="outline"
            size="icon"
            onClick={onClear}
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
