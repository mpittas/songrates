"use client";

import { BsThreeDotsVertical } from "react-icons/bs";
import { LuPencil, LuTrash2 } from "react-icons/lu";
import ContextDropdown, {
  ContextDropdownDivider,
  ContextDropdownMenuItem,
} from "@/components/ui/ContextDropdown";
import { cn } from "@/lib/utils";

interface StackedCardDropdownProps {
  onEdit: () => void;
  onDelete: () => void;
  onOpenChange?: (open: boolean) => void;
}

export default function StackedCardDropdown({
  onEdit,
  onDelete,
  onOpenChange,
}: StackedCardDropdownProps) {
  return (
    <ContextDropdown
      placement="below"
      align="right"
      onOpenChange={onOpenChange}
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle();
          }}
          className={cn(
            "rounded-md text-neutral-600 hover:text-neutral-900 bg-white/90 hover:bg-white border border-neutral-200 shadow-sm transition-colors p-1.5",
          )}
          aria-label="Playlist options"
        >
          <BsThreeDotsVertical size={14} />
        </button>
      )}
    >
      <ContextDropdownMenuItem
        icon={<LuPencil size={14} />}
        label="Edit playlist"
        onClick={onEdit}
      />
      <ContextDropdownDivider />
      <ContextDropdownMenuItem
        icon={<LuTrash2 size={14} />}
        label="Delete playlist"
        onClick={onDelete}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      />
    </ContextDropdown>
  );
}
