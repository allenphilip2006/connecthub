export default function ThreeBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-20 -left-20 w-[40rem] h-[40rem] bg-purple-600/20 blur-[140px] rounded-full" />
      <div className="absolute -bottom-20 -right-20 w-[40rem] h-[40rem] bg-blue-600/20 blur-[140px] rounded-full" />
    </div>
  );
}
