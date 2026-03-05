
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import AuthScreen from "@/components/auth-screen";
import DashboardScreen from "@/components/dashboard-screen";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AdSession {
  active: boolean;
  startedAt: number;
  expiresAt: number;
  completed: boolean;
  cancelled: boolean;
  adUrl?: string;
}

export interface UserData {
  uid: string;
  email: string;
  balance: number;
  adsWatched: number;
  adsCancelled?: number;
  dailyAdsCount: number;
  lastReset: number;
  createdAt: number;
  isAdmin?: boolean;
  isBlocked?: boolean;
  lastIp?: string;
  adSession?: AdSession;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const userRef = ref(db, `users/${user.uid}`);
      const unsubscribeData = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          setUserData({ uid: user.uid, ...snapshot.val() } as UserData);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error al leer RTDB:", error);
        setLoading(false);
      });
      return () => unsubscribeData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (userData?.isBlocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-background">
        <div className="mb-6 rounded-full bg-destructive/10 p-6 text-destructive">
          <ShieldAlert className="h-20 w-20" />
        </div>
        <h1 className="text-4xl font-black mb-2">Cuenta Suspendida</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Tu cuenta ha sido bloqueada por violar los términos de servicio o detectar actividad sospechosa (VPN, Bloqueador de anuncios o Fraude).
        </p>
        <Button onClick={() => auth.signOut()}>Cerrar Sesión</Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background font-body">
      {user && userData ? (
        <DashboardScreen user={user} userData={userData} />
      ) : (
        <AuthScreen />
      )}
    </main>
  );
}
