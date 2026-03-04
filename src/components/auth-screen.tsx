"use client";

import { useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence 
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { ref, set, serverTimestamp } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Zap, LogIn, UserPlus } from "lucide-react";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        // Inicializar nodo del usuario en RTDB
        await set(ref(db, `users/${user.uid}`), {
          email,
          balance: 0,
          adsWatched: 0,
          dailyAdsCount: 0,
          lastReset: 0,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20">
            <Zap className="h-10 w-10 fill-current" />
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-foreground">SatAds</h1>
          <p className="mt-2 text-muted-foreground">Mira anuncios, gana Satoshis.</p>
        </div>

        <Card className="border-none shadow-2xl">
          <CardHeader>
            <CardTitle>{isLogin ? "Bienvenido de nuevo" : "Crea una cuenta"}</CardTitle>
            <CardDescription>
              {isLogin ? "Inicia sesión para ver tus ganancias." : "Empieza a ganar Satoshis hoy."}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAuth}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <input 
                  id="email" 
                  type="email" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  placeholder="nombre@ejemplo.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <input 
                  id="password" 
                  type="password" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Procesando..." : (isLogin ? (
                  <><LogIn className="mr-2 h-4 w-4" /> Entrar</>
                ) : (
                  <><UserPlus className="mr-2 h-4 w-4" /> Registrarse</>
                ))}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Entra"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
