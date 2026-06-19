import { Trophy } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative grid h-9 w-9 place-items-center rounded-xl gradient-bet shadow-soft">
        <Trophy className="h-5 w-5 text-white" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-display text-base font-bold tracking-tight">Bolão Premiado</span>
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Brasil x Escócia
        </span>
      </div>
    </div>
  );
}
