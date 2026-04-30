import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface HomeSectionHeaderProps {
  title: string;
  description?: string;
  link?: {
    label: string;
    to: LinkProps["to"];
    search?: LinkProps["search"];
  };
  icon?: ReactNode;
}

export function HomeSectionHeader({ title, description, link, icon }: HomeSectionHeaderProps) {
  return (
    <div className="group/hdr mb-5 flex items-end justify-between gap-4 border-b border-border pb-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          {icon}
          <h2 className="m-0 text-lg font-black uppercase tracking-wide text-foreground sm:text-xl">
            {title}
          </h2>
        </div>
        {description ? (
          <p className="m-0 text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {link ? (
        <Link
          to={link.to}
          search={link.search}
          className="group flex shrink-0 items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary transition-colors hover:text-primary/80"
        >
          {link.label}
          <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      ) : null}
    </div>
  );
}
