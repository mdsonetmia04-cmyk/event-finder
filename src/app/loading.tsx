import BrandLoader from "@/components/BrandLoader";

/** Shown by the App Router while navigating between pages. */
export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-6xl items-center justify-center px-5 py-10">
      <BrandLoader />
    </div>
  );
}
