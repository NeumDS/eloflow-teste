import { Link } from "@tanstack/react-router";
import logo from "@/assets/eloflow-logo.jpeg.asset.json";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = 40,
  withWordmark = true,
}: {
  className?: string;
  size?: number;
  withWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src={logo.url}
        alt="EloFlow"
        width={size}
        height={size}
        className="rounded-md object-cover"
        style={{ width: size, height: size }}
      />
      {withWordmark ? (
        <span className="text-display text-[1.05rem] leading-none text-primary">eloflow</span>
      ) : null}
    </span>
  );
}

export function LogoLink({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="transition-opacity hover:opacity-80">
      <Logo />
    </Link>
  );
}
