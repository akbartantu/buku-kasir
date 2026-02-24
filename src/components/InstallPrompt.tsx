import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const DISMISS_STORAGE_KEY = "buku-kasir-install-dismissed";
const DISMISS_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const nav = window.navigator as { standalone?: boolean };
  if (nav.standalone === true) return true;
  return false;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return false;
    const t = Number(raw);
    if (Number.isNaN(t)) return false;
    return Date.now() - t < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function setDismissed(): void {
  try {
    localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasDismissedRecently()) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    if (isIOS()) {
      setShowIOSHint(true);
      setVisible(true);
    } else {
      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    setInstalling(true);
    try {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      if (outcome === "accepted") setVisible(false);
      setInstallEvent(null);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed();
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Tambahkan ke layar utama"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80 safe-area-pb"
    >
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="min-w-0 flex-1">
          {installEvent ? (
            <>
              <p className="text-sm font-medium text-foreground">Pasang Buku Kasir di layar utama</p>
              <p className="text-xs text-muted-foreground">Akses cepat seperti aplikasi</p>
            </>
          ) : showIOSHint ? (
            <>
              <p className="text-sm font-medium text-foreground">Tambahkan ke Layar Utama</p>
              <p className="text-xs text-muted-foreground">
                Ketuk ikon Bagikan (□↑) lalu pilih &quot;Tambahkan ke Layar Utama&quot;
              </p>
            </>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {installEvent && (
            <Button
              size="sm"
              onClick={handleInstall}
              disabled={installing}
              className="touch-target"
            >
              {installing ? "Memasang..." : "Tambah"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-8 w-8 touch-target shrink-0"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
