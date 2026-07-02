import OwnProfileShell from "@/components/profile/OwnProfileShell";
import { Suspense } from "react";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OwnProfileShell>
      <Suspense
        fallback={
          <div className="py-12 text-center text-xs font-mono uppercase tracking-widest text-neutral-400">
            Loading profile section...
          </div>
        }
      >
        {children}
      </Suspense>
    </OwnProfileShell>
  );
}
