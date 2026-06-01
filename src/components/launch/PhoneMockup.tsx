// Mockup grafik iPhone 17 Pro Max (rangka titanium + Dynamic Island).
export default function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative shrink-0" style={{ width: "228px" }}>
      <div
        className="relative rounded-[2.7rem] border-[7px] border-neutral-600 bg-black shadow-2xl"
        style={{ height: "478px", boxShadow: "0 25px 60px rgba(0,0,0,.5)" }}
      >
        {/* Dynamic Island */}
        <div className="absolute left-1/2 top-3 z-20 h-[24px] w-[82px] -translate-x-1/2 rounded-full bg-black ring-1 ring-neutral-800" />
        {/* Skrin */}
        <div className="absolute inset-0 overflow-hidden rounded-[2.1rem] bg-ink">
          {children}
        </div>
      </div>
    </div>
  );
}
