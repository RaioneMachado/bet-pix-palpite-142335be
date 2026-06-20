import logoImg from "@/assets/logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoImg}
        alt="Bolão Premiado — Brasil x Escócia"
        className="h-16 md:h-20 w-auto object-contain"
      />
    </div>
  );
}
