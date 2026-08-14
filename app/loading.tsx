export default function Loading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-32">
      <div
        role="status"
        aria-label="Loading"
        className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-emerald-400"
      />
    </div>
  );
}
