
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import AuthScreen from "@/components/auth-screen";
import DashboardScreen from "@/components/dashboard-screen";
import { Loader2 } from "lucide-react";

export interface AdSession {
  active: boolean;
  startedAt: number;
  expiresAt: number;
  completed: boolean;
  cancelled: boolean;
  adUrl?: string; // URL dinámica del anuncio
}

export interface UserData {
  email: string;
  balance: number;
  adsWatched: number;
  dailyAdsCount: number;
  lastReset: number;
  createdAt: number;
  isAdmin?: boolean; // Flag para el panel de admin
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
          setUserData(snapshot.val() as UserData);
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
