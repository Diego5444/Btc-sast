
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, push, set, onValue, remove, update, serverTimestamp } from "firebase/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ExternalLink, Users, LayoutGrid, Ban, ShieldCheck, Search, Info } from "lucide-react";
import { UserData } from "@/app/page";

interface AdLink {
  id: string;
  url: string;
  title: string;
  createdAt: number;
}

export default function AdminPanel() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [ads, setAds] = useState<AdLink[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchUser, setSearchUser] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Escuchar Anuncios
    const adsRef = ref(db, "ads");
    const unsubscribeAds = onValue(adsRef, (snapshot) => {
      const adsList: AdLink[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          adsList.push({
            id: child.key as string,
            ...child.val(),
          });
        });
      }
      setAds(adsList.sort((a, b) => b.createdAt - a.createdAt));
    });

    // Escuchar Usuarios
    const usersRef = ref(db, "users");
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const usersList: UserData[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          usersList.push({
            uid: child.key as string,
            ...child.val(),
          });
        });
      }
      setUsers(usersList.sort((a, b) => b.createdAt - a.createdAt));
    });

    return () => {
      unsubscribeAds();
      unsubscribeUsers();
    };
  }, []);

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.startsWith("http")) {
      toast({
        title: "URL Inválida",
        description: "Debe empezar con http:// o https://",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const newAdRef = push(ref(db, "ads"));
      await set(newAdRef, {
        url,
        title: title || "Anuncio sin título",
        createdAt: serverTimestamp(),
      });
      setUrl("");
      setTitle("");
      toast({
        title: "Anuncio Guardado",
        description: "El enlace ya está disponible en el sistema.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAd = async (id: string) => {
    try {
      await remove(ref(db, `ads/${id}`));
      toast({
        title: "Anuncio Eliminado",
      });
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleBlockUser = async (uid: string, currentStatus: boolean) => {
    try {
      await update(ref(db, `users/${uid}`), {
        isBlocked: !currentStatus
      });
      toast({
        title: currentStatus ? "Usuario Desbloqueado" : "Usuario Bloqueado",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchUser.toLowerCase()) || 
    u.uid.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.lastIp?.includes(searchUser)
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" /> Usuarios y Stats
          </TabsTrigger>
          <TabsTrigger value="ads">
            <LayoutGrid className="mr-2 h-4 w-4" /> Gestión de Enlaces
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Auditoría de Usuarios</CardTitle>
                <CardDescription>Visualiza el comportamiento y bloquea tramposos.</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por email, IP o UID..." 
                  className="pl-10"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email / IP</TableHead>
                      <TableHead>Vistos</TableHead>
                      <TableHead>Fallidos</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No se encontraron usuarios.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((u) => (
                        <TableRow key={u.uid}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-xs">{u.email}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Info className="h-2.5 w-2.5" /> IP: {u.lastIp || 'No registrada'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-green-600">{(u.adsWatched || 0)}</TableCell>
                          <TableCell className="font-medium text-red-500">{(u.adsCancelled || 0)}</TableCell>
                          <TableCell className="font-bold">{(u.balance || 0).toLocaleString()} sats</TableCell>
                          <TableCell>
                            {u.isBlocked ? (
                              <Badge variant="destructive">Bloqueado</Badge>
                            ) : u.isAdmin ? (
                              <Badge className="bg-blue-500">Admin</Badge>
                            ) : (
                              <Badge variant="outline">Activo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!u.isAdmin && (
                              <Button 
                                variant={u.isBlocked ? "outline" : "destructive"} 
                                size="sm"
                                onClick={() => toggleBlockUser(u.uid, !!u.isBlocked)}
                              >
                                {u.isBlocked ? <ShieldCheck className="mr-1 h-3 w-3" /> : <Ban className="mr-1 h-3 w-3" />}
                                {u.isBlocked ? "Desbloquear" : "Bloquear"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" /> Agregar Anuncio
                </CardTitle>
                <CardDescription>Configura un nuevo enlace para que los usuarios lo vean.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddAd} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ad-title">Título Interno</Label>
                    <Input 
                      id="ad-title"
                      placeholder="Ej: Promo de Bitcoin"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ad-url">URL del Anuncio</Label>
                    <Input 
                      id="ad-url"
                      placeholder="https://..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full font-bold" disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Guardar Anuncio"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" /> Info de Rotación
                </CardTitle>
                <CardDescription>Resumen del inventario actual.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-muted p-6 border">
                  <div className="flex items-center gap-3">
                    <LayoutGrid className="h-10 w-10 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Activos</p>
                      <p className="text-4xl font-black">{ads.length}</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  * El sistema elige un anuncio al azar de esta lista cada vez que un usuario inicia una sesión. Cuantos más enlaces pongas, más difícil será predecir el contenido.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inventario de Enlaces</CardTitle>
            </CardHeader>
            <CardContent>
              {ads.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                  No hay anuncios configurados. Usa el formulario de arriba.
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ads.map((ad) => (
                        <TableRow key={ad.id}>
                          <TableCell className="font-bold">{ad.title}</TableCell>
                          <TableCell className="max-w-xs truncate text-xs text-muted-foreground font-mono">
                            {ad.url}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => window.open(ad.url, "_blank")}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteAd(ad.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
