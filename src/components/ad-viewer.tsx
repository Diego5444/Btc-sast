
"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, get, update } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Play, AlertTriangle, Loader2, Info } from "lucide-react";
import Image from "next/image";

interface AdViewerProps {
  dailyAdsCount: number;
}

export default function AdViewer({ dailyAdsCount }: AdViewerProps) {
  const [isStarting, setIsStarting] = useState(false);
  const { toast } = useToast();

  const handleStartAd = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (dailyAdsCount >= 100) {
      toast({
        title: "Límite diario alcanzado",
        description: "Has visto tus 100 anuncios de hoy. ¡Vuelve mañana!",
        variant: "destructive",
      });
      return;
    }

    setIsStarting(true);
    try {
      const adsRef = ref(db, "ads");
      const adsSnapshot = await get(adsRef);
      let adUrl = "https://picsum.photos/seed/ad-promo/1920/1080"; // Fallback

      if (adsSnapshot.exists()) {
        const adsData = adsSnapshot.val();
        const adsKeys = Object.keys(adsData);
        if (adsKeys.length > 0) {
          const randomKey = adsKeys[Math.floor(Math.random() * adsKeys.length)];
          adUrl = adsData[randomKey].url;
        }
      }

      const now = Date.now();
      const expiresAt = now + 15000;
      const userRef = ref(db, `users/${user.uid}`);
      
      await update(userRef, {
        adSession: {
          active: true,
          startedAt: now,
          expiresAt: expiresAt,
          completed: false,
          cancelled: false,
          adUrl: adUrl
        }
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <Card className="w-full max-w-2xl overflow-hidden border-primary/10">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-primary">Gana hasta 10 Sats por sesión</CardTitle>
          <CardDescription>La recompensa final se calcula en base a la calidad de tu interacción.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted shadow-inner">
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <Image 
                src="https://picsum.photos/seed/bitcoin/800/450" 
                alt="SatAds Promotion" 
                width={800} 
                height={450} 
                className="absolute inset-0 h-full w-full object-cover opacity-20 grayscale"
                data-ai-hint="bitcoin money"
              />
              <div className="z-10 flex flex-col items-center">
                <Play className="mb-4 h-16 w-16 text-primary opacity-80" />
                <h3 className="text-xl font-bold">Interacción Obligatoria</h3>
                <p className="mt-2 text-sm text-muted-foreground">Debes abrir el anuncio y permanecer 15 segundos para calificar.</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 p-4 border border-amber-100 flex gap-3 items-start shadow-sm">
            <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-800">POLÍTICA DE RECOMPENSAS:</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                El balance mostrado es un estimado basado en un reparto del 50% de los ingresos publicitarios. 
                Sesiones sin clics o con bloqueadores de anuncios resultarán en 0 sats acreditados tras la revisión manual.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Button 
              size="lg" 
              className="h-14 w-full text-lg shadow-lg font-black" 
              onClick={handleStartAd} 
              disabled={isStarting || dailyAdsCount >= 100}
            >
              {isStarting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparando enlace...</>
              ) : dailyAdsCount >= 100 ? "Límite Diario Alcanzado" : "Ver Anuncio y Calificar"}
            </Button>
          </div>

          {dailyAdsCount >= 90 && (
            <div className="flex items-center gap-2 rounded-lg bg-orange-50 p-4 text-sm text-orange-800 border border-orange-100">
              <AlertTriangle className="h-5 w-5" />
              <span>Te quedan {100 - dailyAdsCount} oportunidades hoy.</span>
            </div>
          )}
        </CardContent>
      </Card>
      
      <p className="text-center text-xs text-muted-foreground max-w-md italic">
        * Los anuncios rotan aleatoriamente según disponibilidad. Retiro mínimo: 2000 sats (Sujeto a verificación de ingresos por el administrador).
      </p>
    </div>
  );
}
