import { Check } from "lucide-react";

interface SuccessScreenProps {
  title: string;
  message: string;
  onDone: () => void;
}

export function SuccessScreen({ title, message, onDone }: SuccessScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-2xl text-center animate-slide-up">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success animate-check-bounce">
          <Check className="h-10 w-10 text-success-foreground" strokeWidth={3} />
        </div>
        <h2 className="text-elder-xl font-black mb-2">{title}</h2>
        <p className="text-elder-base text-muted-foreground mb-6">{message}</p>
        <button
          onClick={onDone}
          className="w-full touch-target-lg rounded-xl bg-primary text-primary-foreground text-elder-lg font-bold active:scale-95 transition-transform"
        >
          👍 Selesai
        </button>
      </div>
    </div>
  );
}
