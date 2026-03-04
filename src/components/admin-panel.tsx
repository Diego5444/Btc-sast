
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, push, set, onValue, remove, serverTimestamp } from "firebase/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ExternalLink, Settings, LayoutGrid } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const adsRef = ref(db, "ads");
    const unsubscribe = onValue(adsRef, (snapshot) => {
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

    return () => unsubscribe();
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

  return (
    <div className="space-y-8">
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar Anuncio"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" /> Estadísticas Base
            </CardTitle>
            <CardDescription>Resumen del inventario actual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-muted p-4">
              <div className="flex items-center gap-3">
                <LayoutGrid className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">Anuncios en Rotación</p>
                  <p className="text-2xl font-bold">{ads.length}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              El sistema elige un anuncio al azar de esta lista cada vez que un usuario inicia una sesión.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestionar Enlaces</CardTitle>
        </CardHeader>
        <CardContent>
          {ads.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No hay anuncios configurados. Usa el formulario de arriba.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell className="font-medium">{ad.title}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {ad.url}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => window.open(ad.url, "_blank")}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteAd(ad.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
