import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase recovery link sets a session via the URL hash automatically.
    // Wait for either an existing session or the PASSWORD_RECOVERY event.
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha precisa ter ao menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha redefinida com sucesso!");
      await supabase.auth.signOut();
      navigate({ to: "/afiliados" });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao redefinir a senha");
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
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">Redefinir senha</h1>
              <p className="text-xs text-muted-foreground">Crie uma nova senha de acesso.</p>
            </div>
          </div>

          {!ready ? (
            <div className="space-y-3 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              <p>
                Abra esta página pelo link enviado ao seu e-mail. Se você já clicou no link e ainda vê esta mensagem, peça um novo link em{" "}
                <Link to="/afiliados" className="underline">afiliados</Link>.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="np">Nova senha</Label>
                <Input id="np" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp">Confirmar nova senha</Label>
                <Input id="cp" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" disabled={loading} className="h-11 w-full gradient-bet text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar nova senha"}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/afiliados" className="underline">Voltar para o login</Link>
          </p>
        </div>
      </main>
      <Toaster richColors position="top-center" />
    </div>
  );
}
