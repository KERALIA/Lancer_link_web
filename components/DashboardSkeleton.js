import SkeletonCard from "@/components/SkeletonCard";

export default function DashboardSkeleton() {
  return (
    <div>
      <div className="mb-8">
        <div
          className="h-8 w-48 rounded-lg animate-pulse-skeleton mb-2"
          style={{ background: "rgba(42,42,46,0.3)" }}
        />
        <div
          className="h-4 w-72 rounded animate-pulse-skeleton"
          style={{ background: "rgba(42,42,46,0.2)" }}
        />
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <SkeletonCard />
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <SkeletonCard variant="wide" />
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <SkeletonCard />
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-5">
          <SkeletonCard variant="small" />
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-7">
          <SkeletonCard variant="small" />
        </div>
      </div>
    </div>
  );
}
