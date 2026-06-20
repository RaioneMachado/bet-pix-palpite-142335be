import logoImg from "@/assets/logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoImg}
        alt="Bolão Premiado — Brasil x Escócia"
        className="h-12 w-auto object-contain"
      />
    </div>
  );
}
