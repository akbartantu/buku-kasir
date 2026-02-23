import { Check, X } from "lucide-react";

interface ConfirmScreenProps {
  title: string;
  message: string;
  emoji?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  children?: React.ReactNode;
  confirmDisabled?: boolean;
}

export function ConfirmScreen({
  title,
  message,
  emoji = "❓",
  onConfirm,
  onCancel,
  confirmLabel = "Ya, Benar",
  cancelLabel = "Batal",
  children,
  confirmDisabled = false,
}: ConfirmScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 animate-pop-in">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl animate-slide-up">
        <div className="text-center mb-6">
          <span className="text-elder-3xl block mb-2">{emoji}</span>
          <h2 className="text-elder-xl font-black mb-2">{title}</h2>
          <p className="text-elder-base text-muted-foreground">{message}</p>
          {children}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 touch-target-lg rounded-xl border-2 border-border bg-secondary text-elder-base font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <X className="w-6 h-6" />
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="flex-1 touch-target-lg rounded-xl bg-primary text-primary-foreground text-elder-base font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:pointer-events-none"
          >
            <Check className="w-6 h-6" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
