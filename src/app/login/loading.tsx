import AuthLayout from "@/components/auth/AuthLayout";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <AuthLayout>
      <div aria-busy="true" aria-label="Loading account" className="space-y-5">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-12 w-full rounded-full" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </AuthLayout>
  );
}
