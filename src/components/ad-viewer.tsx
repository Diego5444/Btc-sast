
"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, get, update } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Play, AlertTriangle, Loader2, Info, ShieldCheck, Zap, MousePointerClick, Timer, Ban, Wallet } from "lucide-react";
import Image from "next/image";

interface AdViewerProps {
  dailyAdsCount: number;
}

const RECOMMENDATIONS = [
  {
    icon: <Timer className="h-8 w-8 text-primary" />,
    title: "Regla de los 15 Segundos",
    text: "Debes permanecer en la pestaña del anuncio al menos 15 segundos reales. Si vuelves antes, la sesión se anulará."
  },
  {
    icon: <MousePointerClick className="h-8 w-8 text-primary" />,
    title: "La Interacción es Clave",
    text: "Hacer clic en el anuncio y navegar un poco aumenta drásticamente las posibilidades de que tus sats sean aprobados."
  },
  {
    icon: <Ban className="h-8 w-8 text-destructive" />,
    title: "Prohibido el uso de VPN",
    text: "El uso de VPN, Proxies o Túneles resultará en el bloqueo inmediato de tu cuenta y la pérdida de tus fondos."
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-secondary" />,
    title: "Adiós al AdBlock",
    text: "Si tienes un bloqueador activo, el sistema no podrá validar tu sesión. Desactívalo para poder generar ganancias."
  },
  {
    icon: <Zap className="h-8 w-8 text-yellow-500" />,
    title: "Límite Diario de 100",
    text: "Tienes 100 oportunidades diarias para ganar. Aprovecharlas todas te acerca más rápido al retiro mínimo."
  },
  {
    icon: <Wallet className="h-8 w-8 text-primary" />,
    title: "Retiro Mínimo: 2000 Sats",
    text: "Una vez alcances los 2000 satoshis, podrás solicitar tu retiro a cualquier Lightning Address."
  },
  {
    icon: <Info className="h-8 w-8 text-blue-500" />,
    title: "Auditoría Manual",
    text: "Todos los pagos se revisan manualmente en 24-48h. Comprobamos que los anuncios hayan generado ingresos reales."
  },
  {
    icon: <AlertTriangle className="h-8 w-8 text-orange-500" />,
    title: "Calidad de Tráfico",
    text: "Si solo abres y cierras anuncios sin interactuar, el administrador podría rechazar tu solicitud por tráfico de baja calidad."
  }
];

export default function AdViewer({ dailyAdsCount }: AdViewerProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % RECOMMENDATIONS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      let adUrl = "https://picsum.photos/seed/ad-promo/1920/1080"; 

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
      <Card className="w-full max-w-2xl overflow-hidden border-primary/10 shadow-xl">
        <CardHeader className="bg-primary/5 text-center">
          <CardTitle className="text-primary text-3xl font-black">Centro de Ganancias</CardTitle>
          <CardDescription className="text-lg font-medium">Sigue los consejos para asegurar tu pago.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-8">
          
          <div className="relative min-h-[220px] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-muted to-background border-2 border-primary/5 flex flex-col items-center justify-center p-8 text-center transition-all duration-500 ease-in-out">
            <div className="absolute top-4 right-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-white/50 px-2 py-1 rounded">
              Tip {currentTip + 1} / {RECOMMENDATIONS.length}
            </div>
            
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
              <div className="mb-6 p-4 rounded-full bg-primary/10 ring-8 ring-primary/5">
                {RECOMMENDATIONS[currentTip].icon}
              </div>
              <h3 className="text-2xl font-black mb-3 text-foreground uppercase tracking-tight">
                {RECOMMENDATIONS[currentTip].title}
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                {RECOMMENDATIONS[currentTip].text}
              </p>
            </div>

            <div className="absolute bottom-4 flex gap-1.5">
              {RECOMMENDATIONS.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === currentTip ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/20'}`} 
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 p-5 border border-amber-200 flex gap-4 items-start shadow-sm">
            <Info className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-black text-amber-800 uppercase">Sistema de Reparto Transparente:</p>
              <p className="text-sm text-amber-700 leading-snug">
                Repartimos el 50% de los ingresos publicitarios. Si los anunciantes no registran tu visita como válida, no podremos acreditarte los sats. ¡Sé un usuario honesto!
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Button 
              size="lg" 
              className="h-20 w-full text-2xl shadow-2xl font-black rounded-2xl border-b-8 border-primary/70 active:border-b-0 active:translate-y-1 transition-all" 
              onClick={handleStartAd} 
              disabled={isStarting || dailyAdsCount >= 100}
            >
              {isStarting ? (
                <><Loader2 className="mr-3 h-8 w-8 animate-spin" /> Conectando...</>
              ) : dailyAdsCount >= 100 ? "Límite Diario Alcanzado" : "VER ANUNCIO AHORA"}
            </Button>
          </div>

          {dailyAdsCount >= 90 && (
            <div className="flex items-center gap-2 justify-center rounded-lg bg-orange-50 p-3 text-sm text-orange-800 border border-orange-100 font-bold">
              <AlertTriangle className="h-5 w-5" />
              <span>Cuidado: Te quedan solo {100 - dailyAdsCount} oportunidades hoy.</span>
            </div>
          )}
        </CardContent>
      </Card>
      
      <p className="text-center text-xs text-muted-foreground max-w-md italic font-medium">
        * Al presionar el botón aceptas que tu actividad sea grabada para fines de auditoría contra fraude. Retiro mínimo obligatorio: 2000 sats.
      </p>
    </div>
  );
}
