"use client";

import Button from "@/components/ui/Button";
import MainModal, { MainModalHeader } from "@/components/ui/MainModal";

interface EditPlaylistModalProps {
  name: string;
  saving?: boolean;
  onNameChange: (name: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function EditPlaylistModal({
  name,
  saving = false,
  onNameChange,
  onClose,
  onSave,
}: EditPlaylistModalProps) {
  return (
    <MainModal onClose={onClose} maxWidthClassName="max-w-md">
      <MainModalHeader title="Edit playlist" onClose={onClose} />
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <div className="text-xs uppercase tracking-widest font-mono text-neutral-400 mb-2">
              Name
            </div>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none"
              placeholder="Playlist name"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="border" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onSave}
              disabled={saving || !name.trim()}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </MainModal>
  );
}
