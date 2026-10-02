export function CardSkeleton() {
  return (
    <div className="glass-card rounded-[2.5rem] p-6 border-white/10 overflow-hidden">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-white/10 skeleton" />
        <div className="flex-1">
          <div className="h-3 w-32 bg-white/10 rounded skeleton" />
          <div className="h-2 w-20 mt-2 bg-white/10 rounded skeleton" />
        </div>
      </div>
      <div className="w-full aspect-square rounded-2xl bg-white/10 skeleton" />
      <div className="flex gap-3 mt-4">
        <div className="w-10 h-10 rounded-full bg-white/10 skeleton" />
        <div className="w-10 h-10 rounded-full bg-white/10 skeleton" />
        <div className="w-10 h-10 rounded-full bg-white/10 skeleton" />
      </div>
    </div>
  );
}

export function GridSkeleton({ items = 6 }) {
  return (
    <div className="masonry pb-10 max-w-3xl mx-auto">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="masonry-item">
          <div className="glass-card rounded-[2.5rem] overflow-hidden border-white/10 p-4">
            <div className="w-full aspect-[9/16] rounded-2xl bg-white/10 skeleton" />
            <div className="h-3 w-2/3 mt-3 bg-white/10 rounded skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}
