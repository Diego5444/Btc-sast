
"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, query, orderByChild, equalTo, onValue, push, set, runTransaction, serverTimestamp } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Send, History, Wallet, AlertCircle, CheckCircle2, Clock, XCircle, Info } from "lucide-react";

interface Withdrawal {
  id: string;
  amount: number;
  lightningAddress: string;
  status: "pending" | "paid" | "rejected";
  createdAt: number;
}

interface WithdrawSectionProps {
  balance: number;
  uid: string;
}

export default function WithdrawSection({ balance, uid }: WithdrawSectionProps) {
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const withdrawalsRef = ref(db, "withdrawals");
    const q = query(withdrawalsRef, orderByChild("uid"), equalTo(uid));

    const unsubscribe = onValue(q, (snapshot) => {
      const history: Withdrawal[] = [];
      snapshot.forEach((child) => {
        history.push({
          id: child.key as string,
          ...child.val(),
        });
      });
      setWithdrawals(history.sort((a, b) => b.createdAt - a.createdAt));
    });

    return () => unsubscribe();
  }, [uid]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    if (balance < 2000) {
      toast({
        title: "Balance Insuficiente",
        description: "El retiro mínimo es de 2000 sats.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const userRef = ref(db, `users/${user.uid}`);
      let amountToWithdraw = 0;

      const result = await runTransaction(userRef, (userData) => {
        if (!userData) return userData;
        const currentBalance = userData.balance || 0;
        if (currentBalance < 2000) return;

        amountToWithdraw = currentBalance;
        return {
          ...userData,
          balance: 0,
        };
      });

      if (result.committed) {
        const withdrawalsRef = ref(db, "withdrawals");
        const newWithdrawalRef = push(withdrawalsRef);
        await set(newWithdrawalRef, {
          uid: user.uid,
          lightningAddress: address,
          amount: amountToWithdraw,
          status: "pending",
          createdAt: serverTimestamp(),
        });

        setAddress("");
        toast({
          title: "Solicitud de Retiro Enviada",
          description: "Tu pago está en revisión manual para verificar ingresos.",
        });
      }
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

  const getStatusBadge = (status: Withdrawal["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50"><Clock className="mr-1 h-3 w-3" /> Pendiente</Badge>;
      case "paid":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200"><CheckCircle2 className="mr-1 h-3 w-3" /> Pagado</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Rechazado</Badge>;
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> Solicitar Retiro
            </CardTitle>
            <CardDescription>Envía tus ganancias estimadas a tu wallet.</CardDescription>
          </CardHeader>
          <form onSubmit={handleWithdraw}>
            <CardContent className="space-y-6">
              <div className="rounded-xl bg-muted p-4 text-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Balance Estimado</span>
                <div className="mt-1 text-3xl font-black text-primary">{balance.toLocaleString()} sats</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Lightning Address</Label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    id="address" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    placeholder="usuario@ln.tips" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-700 leading-tight">
                  <strong>AVISO:</strong> Todos los retiros pasan por una auditoría de 24-48h donde se coteja el balance con las ganancias reales de Monetag/AdNetwork. Si se detecta uso de VPN o falta de clics, el monto será rechazado.
                </p>
              </div>

              {balance < 2000 && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive font-medium border border-destructive/20">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Mínimo 2,000 sats para auditar. Te faltan {(2000 - balance).toLocaleString()}.</span>
                </div>
              )}

              <Button type="submit" className="w-full h-12 font-bold" disabled={isLoading || balance < 2000}>
                {isLoading ? "Validando..." : "Enviar para Revisión"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Historial de Auditoría
            </CardTitle>
            <CardDescription>Estado de tus solicitudes de pago.</CardDescription>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Clock className="mb-2 h-10 w-10 opacity-20" />
                <p>Aún no hay retiros registrados.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell className="text-[10px]">
                        {new Date(withdrawal.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium text-xs">
                        {withdrawal.amount.toLocaleString()} sats
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(withdrawal.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
