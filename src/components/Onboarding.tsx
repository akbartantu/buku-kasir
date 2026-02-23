import { useState } from "react";

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    emoji: "👋",
    title: "Selamat Datang!",
    subtitle: "Buku Kasir membantu Anda mencatat penjualan dengan mudah",
    description: "Tidak perlu buku catatan lagi!",
  },
  {
    emoji: "🛒",
    title: "Catat Penjualan",
    subtitle: "Cukup pilih produk dan tekan tombol",
    description: "Stok akan berkurang otomatis",
  },
  {
    emoji: "📊",
    title: "Lihat Ringkasan",
    subtitle: "Cek berapa pendapatan hari ini",
    description: "Semua otomatis dihitung!",
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const isLast = step === slides.length - 1;
  const slide = slides[step];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-6">
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-3 rounded-full transition-all ${
              i === step ? "w-8 bg-primary" : "w-3 bg-border"
            }`}
          />
        ))}
      </div>

      <div className="text-center animate-pop-in max-w-sm" key={step}>
        <span className="text-[5rem] block mb-4">{slide.emoji}</span>
        <h1 className="text-elder-2xl font-black mb-3">{slide.title}</h1>
        <p className="text-elder-lg font-bold text-muted-foreground mb-2">
          {slide.subtitle}
        </p>
        <p className="text-elder-base text-muted-foreground">{slide.description}</p>
      </div>

      <div className="mt-auto w-full max-w-sm flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 touch-target-lg rounded-xl border-2 border-border bg-secondary text-elder-base font-bold active:scale-95 transition-transform"
          >
            ← Kembali
          </button>
        )}
        <button
          onClick={() => (isLast ? onComplete() : setStep(step + 1))}
          className="flex-1 touch-target-lg rounded-xl bg-primary text-primary-foreground text-elder-lg font-bold active:scale-95 transition-transform"
        >
          {isLast ? "Mulai! 🚀" : "Lanjut →"}
        </button>
      </div>
    </div>
  );
}
