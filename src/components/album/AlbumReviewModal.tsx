"use client";

import { useState } from "react";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import MainModal, { MainModalHeader } from "@/components/ui/MainModal";
import {
  ALBUM_REVIEW_MAX_LENGTH,
  ALBUM_REVIEW_MIN_LENGTH,
} from "@/lib/albumReviews";

interface AlbumReviewModalProps {
  albumTitle: string;
  albumType: string;
  averageScore: string | number;
  initialBody?: string;
  onClose: () => void;
  onSave: (body: string) => Promise<unknown>;
}

export default function AlbumReviewModal({
  albumTitle,
  albumType,
  averageScore,
  initialBody = "",
  onClose,
  onSave,
}: AlbumReviewModalProps) {
  const [body, setBody] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const trimmed = body.trim();
  const remaining = ALBUM_REVIEW_MAX_LENGTH - body.length;
  const canSubmit =
    trimmed.length >= ALBUM_REVIEW_MIN_LENGTH &&
    trimmed.length <= ALBUM_REVIEW_MAX_LENGTH &&
    !saving;
  const isEditing = Boolean(initialBody);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await onSave(trimmed);
      toast.success(isEditing ? "Review updated" : "Review published");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save review");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainModal onClose={onClose} maxWidthClassName="max-w-lg">
      <MainModalHeader
        title={isEditing ? "Edit your review" : "Write a review"}
        onClose={onClose}
      >
        <p className="text-sm text-neutral-500">
          {albumType} · {albumTitle}
        </p>
      </MainModalHeader>

      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-center justify-between rounded-2xl bg-neutral-900 px-4 py-3">
          <div>
            <p className="text-xs text-neutral-400">Your album score</p>
            <p className="mt-0.5 text-sm text-white">
              Average of every track you rated
            </p>
          </div>
          <div className="rounded-lg bg-neutral-950 px-3 py-2 text-2xl leading-none text-neutral-200">
            {averageScore}
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-800">
            What did this {albumType === "EP" ? "EP" : "album"} leave you with?
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, ALBUM_REVIEW_MAX_LENGTH))}
            rows={7}
            autoFocus
            placeholder="The sequencing, the closer, the stretch you keep returning to…"
            className="w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white"
          />
          <span className="mt-2 flex justify-between font-mono text-[11px] text-neutral-500">
            <span>
              {trimmed.length < ALBUM_REVIEW_MIN_LENGTH
                ? `${ALBUM_REVIEW_MIN_LENGTH - trimmed.length} more characters`
                : "Ready to publish"}
            </span>
            <span>{remaining}</span>
          </span>
        </label>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
          >
            {saving ? "Saving…" : isEditing ? "Update review" : "Publish review"}
          </Button>
        </div>
      </div>
    </MainModal>
  );
}
