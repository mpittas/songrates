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
          <div className="py-12 text-center text-sm text-neutral-400">
            Loading collection...
          </div>
        }
      >
        {children}
      </Suspense>
    </OwnProfileShell>
  );
}
