"use client";

import { useState, useEffect } from "react";
import { AlertCircle, ShieldAlert, RefreshCcw, Globe, ShieldCheck, UserCog } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface AdBlockDetectorProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export default function AdBlockDetector({ children, isAdmin }: AdBlockDetectorProps) {
  const [detectionState, setDetectionState] = useState<{ 
    blocked: boolean; 
    reason: 'adblock' | 'vpn' | null;
    loading: boolean;
  }>({ blocked: false, reason: null, loading: true });
  const [bypassed, setBypassed] = useState(false);

  const checkAnomalies = async () => {
    let isBlocked = false;
    let reason: 'adblock' | 'vpn' | null = null;

    // 1. Detección de AdBlock (DOM)
    const bait = document.createElement('div');
    bait.innerHTML = '&nbsp;';
    bait.className = 'adsbox ad-unit ad-zone google-ads ad-container';
    bait.setAttribute('style', 'position: absolute; left: -9999px; top: -9999px; height: 1px; width: 1px;');
    document.body.appendChild(bait);

    await new Promise(r => setTimeout(r, 100));

    if (bait.offsetParent === null || bait.offsetHeight === 0) {
      isBlocked = true;
      reason = 'adblock';
    }
    document.body.removeChild(bait);

    // 2. Detección por Red (Google Ads)
    if (!isBlocked) {
      try {
        await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
        });
      } catch (e) {
        isBlocked = true;
        reason = 'adblock';
      }
    }

    // 3. Detección Heurística de VPN/Proxy
    if (!isBlocked) {
      if ((navigator as any).brave && await (navigator as any).brave.isBrave()) {
        isBlocked = true;
        reason = 'adblock';
      }
    }

    setDetectionState({ blocked: isBlocked, reason, loading: false });
  };

  useEffect(() => {
    checkAnomalies();
    const interval = setInterval(checkAnomalies, 30000);
    return () => clearInterval(interval);
  }, []);

  if (detectionState.loading || bypassed) {
    return <>{children}</>;
  }

  if (detectionState.blocked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            {detectionState.reason === 'vpn' ? <Globe className="h-14 w-14" /> : <ShieldAlert className="h-14 w-14" />}
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-foreground">
              {detectionState.reason === 'vpn' ? "VPN Detectada" : "Bloqueador Detectado"}
            </h2>
            <p className="text-muted-foreground text-lg">
              {detectionState.reason === 'vpn' 
                ? "El uso de VPNs o Proxies está prohibido en SatAds. Desactívalo para continuar."
                : "Hemos detectado un bloqueador de anuncios activo. Desactívalo para poder generar ganancias."}
            </p>
          </div>
          
          <Alert variant="destructive" className="text-left border-2">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="font-bold">Acción Obligatoria</AlertTitle>
            <AlertDescription className="text-sm mt-2">
              <ul className="list-disc pl-5 space-y-2">
                <li>Desactiva extensiones como uBlock Origin o AdBlock.</li>
                <li>En <strong>Brave</strong>, desactiva los "Escudos" (Icono de león).</li>
                <li>Si usas un DNS filtrado (AdGuard, NextDNS), debes usar uno estándar.</li>
                <li><strong>Prohibido:</strong> VPNs, Opera GX VPN, Proxies y Túneles.</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-3">
            <Button size="lg" className="w-full h-14 text-xl font-black shadow-lg" onClick={() => window.location.reload()}>
              <RefreshCcw className="mr-2 h-6 w-6" /> Verificar de Nuevo
            </Button>

            {isAdmin && (
              <div className="pt-4 border-t mt-4">
                <p className="text-xs font-bold text-primary uppercase mb-3 flex items-center justify-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Eres Administrador
                </p>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full h-12 font-bold border-primary text-primary hover:bg-primary/5"
                  onClick={() => setBypassed(true)}
                >
                  <UserCog className="mr-2 h-5 w-5" /> Ignorar y Entrar como Admin
                </Button>
              </div>
            )}
          </div>
          
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
            Sistema de Auditoría Anti-Fraude v2.0
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
