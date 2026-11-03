import { DashboardSkeleton } from "@/components/Skeleton";

/** Shown by the App Router while navigating between pages. */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <DashboardSkeleton />
    </div>
  );
}
