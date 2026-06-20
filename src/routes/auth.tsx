import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso restrito" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

const ADMIN_WHITELIST = ["raionemachado20@gmail.com", "bso.32.1988@gmail.com"];

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const normalized = email.trim().toLowerCase();
      if (!ADMIN_WHITELIST.includes(normalized)) {
        toast.error("Acesso não autorizado");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: normalized,
        password,
      });
      if (error) throw error;
      navigate({ to: "/admin" });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background gradient-pitch">
      <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
        <div className="w-full rounded-3xl border border-border bg-card p-8 shadow-bet">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl gradient-bet text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">Acesso administrativo</h1>
              <p className="text-xs text-muted-foreground">Área restrita ao gestor do bolão.</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" disabled={loading} className="h-11 w-full gradient-bet text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Cadastro de novos administradores está desabilitado.
          </p>
        </div>
      </main>
      <Toaster richColors position="top-center" />
    </div>
  );
}
