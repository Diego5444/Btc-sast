
"use client";

import { useEffect, useState, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, runTransaction, update } from "firebase/database";
import { AdSession } from "@/app/page";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ExternalLink, Timer, CheckCircle2, AlertCircle } from "lucide-react";

interface AdSessionModalProps {
  session?: AdSession;
}

export default function AdSessionModal({ session }: AdSessionModalProps) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFocused, setIsFocused] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    if (session?.active && !isFocused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.active, isFocused, timeLeft]);

  const handleOpenAd = () => {
    if (session?.adUrl) {
      window.open(session.adUrl, "_blank");
      toast({
        title: "Anuncio abierto",
        description: "Permanece 15 segundos en la pestaña del anuncio para calificar.",
      });
    }
  };

  const handleClaimReward = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setIsClaiming(true);
    try {
      const userRef = ref(db, `users/${user.uid}`);
      
      const result = await runTransaction(userRef, (currentData) => {
        if (!currentData) return currentData;

        const session = currentData.adSession;
        const now = Date.now();
        
        if (!session || !session.active || session.completed || session.cancelled) {
          throw new Error("Sesión no válida.");
        }

        if (now < (session.expiresAt || 0)) {
          throw new Error("Aún no han pasado los 15 segundos mínimos.");
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartTime = todayStart.getTime();

        let dailyAdsCount = currentData.dailyAdsCount || 0;
        const lastReset = currentData.lastReset || 0;

        if (lastReset < todayStartTime) {
          dailyAdsCount = 0;
        }

        if (dailyAdsCount >= 100) {
          throw new Error("Límite diario alcanzado.");
        }

        return {
          ...currentData,
          balance: (currentData.balance || 0) + 10,
          adsWatched: (currentData.adsWatched || 0) + 1,
          dailyAdsCount: dailyAdsCount + 1,
          lastReset: now,
          adSession: {
            ...session,
            active: false,
            completed: true
          }
        };
      });

      if (result.committed) {
        toast({
          title: "¡Sesión Registrada!",
          description: "Se han pre-acreditado hasta 10 sats sujetos a revisión manual.",
        });
        setTimeLeft(15); 
      }
    } catch (error: any) {
      toast({
        title: "Error al procesar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleCancel = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setIsCancelling(true);
    try {
      const sessionRef = ref(db, `users/${user.uid}/adSession`);
      await update(sessionRef, {
        active: false,
        cancelled: true
      });
      setTimeLeft(15);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsCancelling(false);
    }
  };

  if (!session?.active) return null;

  const progress = ((15 - timeLeft) / 15) * 100;

  return (
    <Dialog open={true}>
      <DialogContent 
        className="sm:max-w-[425px] border-primary/20 shadow-2xl" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-black flex items-center justify-center gap-2">
            <Timer className="h-6 w-6 text-primary" /> Sesión de Ganancia
          </DialogTitle>
          <DialogDescription className="text-base font-medium text-foreground">
            Interactúa con el anuncio para calificar por tu recompensa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="rounded-xl bg-muted p-6 text-center border-2 border-dashed border-primary/20">
            {timeLeft > 0 ? (
              <div className="space-y-4">
                <span className="text-5xl font-black text-primary">{timeLeft}s</span>
                <p className="text-sm font-semibold text-muted-foreground">
                  {isFocused 
                    ? "⚠️ Abre el anuncio para que el tiempo avance." 
                    : "✅ ¡Excelente! Quédate en el anuncio viendo el contenido..."}
                </p>
                <Progress value={progress} className="h-3" />
              </div>
            ) : (
              <div className="space-y-2 py-4">
                <CheckCircle2 className="mx-auto h-16 w-16 text-secondary animate-bounce" />
                <h3 className="text-xl font-bold">¡Tiempo Completado!</h3>
                <p className="text-sm text-muted-foreground">Ya puedes reclamar tu acreditación provisional.</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-orange-50 p-2 rounded border border-orange-100">
            <AlertCircle className="h-3 w-3 text-orange-600 shrink-0" />
            <span>Recuerda: Si el anuncio no genera ingresos por falta de interacción, la recompensa será anulada en el retiro.</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {timeLeft > 0 ? (
              <Button onClick={handleOpenAd} className="h-12 text-lg font-bold" variant="default">
                <ExternalLink className="mr-2 h-5 w-5" /> Abrir Anuncio
              </Button>
            ) : (
              <Button onClick={handleClaimReward} disabled={isClaiming} className="h-12 text-lg font-bold bg-secondary hover:bg-secondary/90 text-white">
                {isClaiming ? <Loader2 className="animate-spin" /> : "Registrar Recompensa"}
              </Button>
            )}
            
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isCancelling || isClaiming} className="text-muted-foreground hover:text-destructive">
              {isCancelling ? "Cancelando..." : "Cancelar sesión"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
