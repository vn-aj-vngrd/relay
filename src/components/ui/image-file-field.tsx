"use client";

import { ImageSquare, Trash, UploadSimple } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function ImageFileField({
  id,
  name,
  label,
  hint,
  required = false,
  buttonLabel = "Choose screenshot",
}: {
  id: string;
  name: string;
  label: string;
  hint: string;
  required?: boolean;
  buttonLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    []
  );

  function select(nextFile: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const nextPreview = nextFile ? URL.createObjectURL(nextFile) : null;
    previewRef.current = nextPreview;
    setFile(nextFile);
    setPreview(nextPreview);
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    select(null);
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm font-[650]">
        {label}
      </label>
      <p id={`${id}-hint`} className="mt-1 text-xs leading-5 text-muted">
        {hint}
      </p>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        required={required}
        accept="image/jpeg,image/png,image/webp"
        aria-describedby={`${id}-hint`}
        onChange={(event) => select(event.target.files?.[0] ?? null)}
        className="sr-only"
      />
      {file && preview ? (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-line bg-surface p-2.5">
          <Image
            src={preview}
            alt="Selected image preview"
            width={52}
            height={52}
            unoptimized
            className="h-13 w-13 shrink-0 rounded-md bg-canvas object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="mt-0.5 text-xs text-muted">
              {Math.max(1, Math.round(file.size / 1024))} KB
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            aria-label={`Remove ${file.name}`}
            className="pressable grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-strong hover:text-danger"
          >
            <Trash aria-hidden size={17} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="pressable mt-3 flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-line bg-surface px-3.5 hover:border-primary/45 hover:bg-primary-soft/35"
        >
          <span
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-surface-strong text-muted"
          >
            <ImageSquare size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm font-[650]">{buttonLabel}</strong>
            <span className="mt-0.5 block text-xs text-muted">
              JPG, PNG, or WebP
            </span>
          </span>
          <UploadSimple
            aria-hidden
            className="shrink-0 text-primary"
            size={17}
          />
        </label>
      )}
    </div>
  );
}
