import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Shield, SquarePlus, SquareArrowUp, Download } from "lucide-react";

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

function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  if (isIOS()) return false;
  return /Android/.test(navigator.userAgent);
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

const LOGIN_PATH = "/signin";

export function InstallPrompt() {
  const { pathname } = useLocation();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (pathname !== LOGIN_PATH) return;
    if (isStandalone() || wasDismissedRecently()) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    if (isIOS()) {
      setShowIOSHint(true);
      setVisible(true);
    } else if (isAndroid()) {
      setVisible(true);
      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    } else {
      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [pathname]);

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

  if (pathname !== LOGIN_PATH) return null;
  if (!visible) return null;

  if (isAndroid()) {
    return (
      <Dialog open={visible} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader className="flex flex-row items-start gap-3 space-y-0 text-left">
            <div className="rounded-full border-2 border-green-600 p-2 shrink-0" aria-hidden>
              <Shield className="h-6 w-6 text-green-600" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <DialogTitle className="text-lg font-bold">100% Aman & Tersinkronisasi</DialogTitle>
              <DialogDescription id="install-dialog-desc">Akses di Banyak Device</DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2 sm:gap-2 mt-4">
            <Button variant="outline" onClick={handleDismiss} className="flex-1 sm:flex-initial touch-target">
              Nanti Saja
            </Button>
            <Button onClick={handleInstall} disabled={installing} className="flex-1 sm:flex-initial touch-target bg-green-700 hover:bg-green-800">
              <Download className="h-4 w-4 mr-2 shrink-0" />
              {installing ? "Memasang..." : "Install Aplikasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (showIOSHint) {
    return (
      <div
        role="region"
        aria-label="Tambahkan ke layar utama"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80 safe-area-pb"
      >
        <div className="mx-auto max-w-md space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Tambahkan ke Layar Utama</p>
              <p className="text-xs text-muted-foreground mt-0.5">Akses cepat seperti aplikasi</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8 shrink-0" aria-label="Tutup">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ol className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold text-foreground">1</span>
              <SquareArrowUp className="h-5 w-5 shrink-0 text-foreground stroke-[2.5]" aria-hidden />
              <span>Tekan tombol Share di bawah browser</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold text-foreground">2</span>
              <SquarePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>Pilih &quot;Add to Home Screen&quot;</span>
            </li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Tambahkan ke layar utama"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80 safe-area-pb"
    >
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Pasang Buku Kasir di layar utama</p>
          <p className="text-xs text-muted-foreground">Akses cepat seperti aplikasi</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" onClick={handleInstall} disabled={installing} className="touch-target">
            {installing ? "Memasang..." : "Tambah"}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8 touch-target shrink-0" aria-label="Tutup">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
