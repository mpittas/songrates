"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import MainModal, { MainModalHeader } from "@/components/ui/MainModal";
import LevelProgressionPage from "@/components/profile/LevelProgressionPage";

export default function LevelProgressionModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const pathname = usePathname();
  const openedOnPath = useRef(pathname);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (pathname !== openedOnPath.current) onClose();
  }, [pathname, onClose]);

  if (!mounted) return null;

  return createPortal(
    <MainModal onClose={onClose} maxWidthClassName="max-w-2xl">
      <MainModalHeader title="Your rank" onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
        <LevelProgressionPage compact />
      </div>
    </MainModal>,
    document.body,
  );
}

