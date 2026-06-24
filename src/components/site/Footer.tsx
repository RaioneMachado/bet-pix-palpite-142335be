import { Link } from "@tanstack/react-router";
import { Instagram, MessageCircle } from "lucide-react";
import { Logo } from "./Logo";

const WHATSAPP_URL = "https://wa.me/5500000000000";
const INSTAGRAM_URL = "https://instagram.com/";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Bolão online com pagamento via PIX. Acerte o placar e concorra ao prêmio.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <h4 className="mb-3 font-display text-sm font-semibold">Informações</h4>
          <Link to="/regulamento" className="block text-muted-foreground hover:text-foreground">Regulamento</Link>
          <Link to="/regulamento" hash="termos" className="block text-muted-foreground hover:text-foreground">Termos de Uso</Link>
          <Link to="/regulamento" hash="privacidade" className="block text-muted-foreground hover:text-foreground">Política de Privacidade</Link>
          <Link to="/afiliados" className="block text-muted-foreground hover:text-foreground">Seja um afiliado</Link>

        </div>
        <div className="space-y-2 text-sm">
          <h4 className="mb-3 font-display text-sm font-semibold">Contato</h4>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <Instagram className="h-4 w-4" /> Instagram
          </a>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Bolão Premiado. Todos os direitos reservados.
      </div>
    </footer>
  );
}
