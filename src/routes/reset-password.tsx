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

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const code = url.searchParams.get("code");
        const tokenHash = url.searchParams.get("token_hash") ?? hash.get("token_hash");
        const type = (url.searchParams.get("type") ?? hash.get("type")) as
          | "recovery"
          | null;
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        const errDesc = url.searchParams.get("error_description") ?? hash.get("error_description");

        if (errDesc) throw new Error(errDesc);

        // PKCE flow: ?code=...
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        // OTP token_hash flow
        else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            type: type ?? "recovery",
            token_hash: tokenHash,
          });
          if (error) throw error;
        }
        // Legacy implicit flow with access_token in hash
        else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        }

        // Clean URL so refresh doesn't try to re-consume the code
        if (code || tokenHash || accessToken) {
          window.history.replaceState({}, "", window.location.pathname);
        }

        const { data } = await supabase.auth.getSession();
        if (mounted && data.session) setReady(true);
        else if (mounted) setError("Link inválido ou expirado. Solicite um novo link.");
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Link inválido ou expirado.");
      }
    };

    void init();

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
              {error ? (
                <p className="text-destructive">{error}</p>
              ) : (
                <>
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  <p>Validando link de redefinição…</p>
                </>
              )}
              <p>
                Solicite um novo link em{" "}
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
