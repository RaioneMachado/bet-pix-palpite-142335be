import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";

import { affiliateSignup } from "@/lib/affiliate.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/afiliados")({
  head: () => ({
    meta: [
      { title: "Programa de Afiliados — Bolão" },
      {
        name: "description",
        content:
          "Cadastre-se como afiliado e ganhe 50% de comissão por cada aposta confirmada com seu link.",
      },
    ],
  }),
  component: AffiliatesPage,
});

function AffiliatesPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "login">("signup");

  // signup
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingSignup, setLoadingSignup] = useState(false);

  // login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);

  const signupFn = useServerFn(affiliateSignup);

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSignup(true);
    try {
      await signupFn({
        data: {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          password,
        },
      });
      // login automático
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInErr) throw signInErr;
      toast.success("Cadastro realizado! Bem-vindo(a).");
      navigate({ to: "/afiliado" });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao cadastrar");
    } finally {
      setLoadingSignup(false);
    }
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLogin(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });
      if (error) throw error;
      navigate({ to: "/afiliado" });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao entrar");
    } finally {
      setLoadingLogin(false);
    }
  };

  return (
    <div className="min-h-screen bg-background gradient-pitch">
      <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
        <div className="w-full rounded-3xl border border-border bg-card p-8 shadow-bet">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl gradient-bet text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">Programa de Afiliados</h1>
              <p className="text-xs text-muted-foreground">
                Ganhe 50% por cada aposta confirmada com seu link.
              </p>
            </div>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Quero ser afiliado</TabsTrigger>
              <TabsTrigger value="login">Já sou afiliado</TabsTrigger>
            </TabsList>

            <TabsContent value="signup">
              <form onSubmit={onSignup} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="s-name">Nome completo</Label>
                  <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-phone">Telefone / WhatsApp</Label>
                  <Input id="s-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" required maxLength={20} placeholder="(11) 99999-9999" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-email">E-mail</Label>
                  <Input id="s-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-pass">Senha</Label>
                  <Input id="s-pass" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" disabled={loadingSignup} className="h-11 w-full gradient-bet text-white">
                  {loadingSignup ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta de afiliado"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="login">
              <form onSubmit={onLogin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="l-email">E-mail</Label>
                  <Input id="l-email" type="email" autoComplete="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="l-pass">Senha</Label>
                  <Input id="l-pass" type="password" autoComplete="current-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" disabled={loadingLogin} className="h-11 w-full gradient-bet text-white">
                  {loadingLogin ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="underline">Voltar para a página inicial</Link>
          </p>
        </div>
      </main>
      <Toaster richColors position="top-center" />
    </div>
  );
}
