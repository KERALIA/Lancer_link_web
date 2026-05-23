export default function DashboardSkeleton() {
  return (
    <div>
      <div className="mb-8">
        <div className="skeleton h-7 w-48 mb-2" />
        <div className="skeleton h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-[88px] w-full rounded-md" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
