
"use client";

import { useState, useEffect } from "react";
import { AlertCircle, ShieldAlert, RefreshCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function AdBlockDetector({ children }: { children: React.ReactNode }) {
  const [isAdBlockDetected, setIsAdBlockDetected] = useState<boolean | null>(null);

  const checkAdBlock = async () => {
    let isBlocked = false;

    // 1. Detección por DOM (Trampa)
    const bait = document.createElement('div');
    bait.innerHTML = '&nbsp;';
    bait.className = 'adsbox ad-unit ad-zone google-ads ad-container';
    bait.setAttribute('style', 'position: absolute; left: -9999px; top: -9999px; height: 1px; width: 1px;');
    document.body.appendChild(bait);

    // Esperar un poco para que el bloqueador actúe
    await new Promise(r => setTimeout(r, 100));

    if (bait.offsetParent === null || bait.offsetHeight === 0 || bait.offsetLeft === 0 || bait.offsetTop === 0 || bait.offsetWidth === 0 || bait.clientHeight === 0 || bait.clientWidth === 0) {
      isBlocked = true;
    }
    document.body.removeChild(bait);

    // 2. Detección por Red (DNS / Network)
    // Intentamos cargar un script común que los DNS de AdGuard o Pi-hole bloquean
    try {
      const response = await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
      });
    } catch (e) {
      // Si hay error de red al intentar conectar a un dominio de anuncios, hay bloqueo por DNS/App
      isBlocked = true;
    }

    // 3. Verificación específica de Brave
    if ((navigator as any).brave && await (navigator as any).brave.isBrave()) {
      isBlocked = true;
    }

    setIsAdBlockDetected(isBlocked);
  };

  useEffect(() => {
    checkAdBlock();
    
    // Re-verificar cada 30 segundos por si el usuario lo activa/desactiva
    const interval = setInterval(checkAdBlock, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isAdBlockDetected === null) {
    return <>{children}</>;
  }

  if (isAdBlockDetected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-foreground">Bloqueador Detectado</h2>
            <p className="text-muted-foreground">
              Hemos detectado un bloqueador de anuncios activo (Browser, DNS o App). 
              Esta aplicación requiere que los anuncios se carguen correctamente para generar tus recompensas.
            </p>
          </div>
          
          <Alert variant="destructive" className="text-left">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Acción Requerida</AlertTitle>
            <AlertDescription className="text-xs">
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Desactiva extensiones como uBlock Origin, AdBlock o similares.</li>
                <li>Si usas <strong>Brave</strong>, desactiva los "Escudos" para este sitio.</li>
                <li>Si usas un DNS como <strong>AdGuard</strong> o Pi-hole, debes permitir este dominio.</li>
                <li>Desactiva VPNs que tengan filtrado de publicidad incorporado.</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button size="lg" className="w-full font-bold" onClick={() => window.location.reload()}>
            <RefreshCcw className="mr-2 h-5 w-5" /> Ya lo he desactivado, recargar
          </Button>
          
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            Sin anuncios no hay ganancias
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
