"use client";

import { useState } from "react";
import { User } from "firebase/auth";
import { UserData } from "@/app/page";
import { auth, db } from "@/lib/firebase";
import { ref, update } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdViewer from "@/components/ad-viewer";
import WithdrawSection from "@/components/withdraw-section";
import AdSessionModal from "@/components/ad-session-modal";
import AdminPanel from "@/components/admin-panel";
import AdBlockDetector from "@/components/ad-block-detector";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Coins, Eye, TrendingUp, Wallet, Zap, ShieldAlert, AlertCircle, Settings } from "lucide-react";

interface DashboardScreenProps {
  user: User;
  userData: UserData;
}

export default function DashboardScreen({ user, userData }: DashboardScreenProps) {
  const { toast } = useToast();
  
  const handleLogout = () => auth.signOut();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 relative">
      <AdSessionModal session={userData.adSession} />
      
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SatAds <span className="text-xs font-normal text-muted-foreground ml-2">Beta Auditoría</span></h1>
            <p className="text-sm text-muted-foreground">{userData.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userData.isAdmin && (
            <div className="hidden md:flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
              <ShieldAlert className="h-3 w-3" /> Admin
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Salir
          </Button>
        </div>
      </header>

      <AdBlockDetector isAdmin={userData.isAdmin}>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-primary text-primary-foreground shadow-xl shadow-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance Estimado</CardTitle>
              <Coins className="h-4 w-4 opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(userData.balance || 0).toLocaleString()} sats</div>
              <p className="text-[10px] opacity-70 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Sujeto a revisión de ingresos publicitarios
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vistos</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(userData.adsWatched || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Sesiones calificadas hoy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meta Diaria</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(userData.dailyAdsCount || 0)} / 100</div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div 
                  className="h-full bg-secondary transition-all" 
                  style={{ width: `${userData.dailyAdsCount || 0}%` }} 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <Tabs defaultValue="earn" className="w-full">
            <TabsList className={`mb-8 grid w-full max-w-2xl ${userData.isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="earn">
                <Coins className="mr-2 h-4 w-4" /> Ganar
              </TabsTrigger>
              <TabsTrigger value="withdraw">
                <Wallet className="mr-2 h-4 w-4" /> Cobrar
              </TabsTrigger>
              {userData.isAdmin && (
                <TabsTrigger value="admin">
                  <Settings className="mr-2 h-4 w-4" /> Panel Admin
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="earn" className="focus-visible:ring-0">
              <AdViewer dailyAdsCount={userData.dailyAdsCount || 0} />
            </TabsContent>
            
            <TabsContent value="withdraw" className="focus-visible:ring-0">
              <WithdrawSection balance={userData.balance || 0} uid={user.uid} />
            </TabsContent>

            {userData.isAdmin && (
              <TabsContent value="admin" className="focus-visible:ring-0">
                <AdminPanel />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </AdBlockDetector>
    </div>
  );
}
