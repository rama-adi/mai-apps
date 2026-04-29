import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, Search } from "lucide-react";
import { CATEGORIES, VERSIONS } from "maidb-data";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@packages/ui/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@packages/ui/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@packages/ui/components/ui/collapsible";
import { useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";
import { useOmnisearch } from "./omnisearch/useOmnisearch";

const RECENT_VERSIONS = [...VERSIONS]
  .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
  .slice(0, 6);

// Make NavigationMenuTrigger require an explicit click instead of opening on hover.
const blockHover = (event: PointerEvent) => {
  event.preventDefault();
};

const ACCENT_LINK_CLASS = "!no-underline relative flex min-w-0 items-center gap-3 overflow-hidden";

function accentLinkStyle(color: string): CSSProperties {
  return {
    ["--accent-tint" as string]: `color-mix(in oklch, ${color} 12%, transparent)`,
  } as CSSProperties;
}

function AccentBody({
  color,
  title,
  description,
}: {
  color: string;
  title: string;
  description: string;
}) {
  return (
    <>
      <span
        aria-hidden
        className="absolute top-1 bottom-1 left-0 w-1 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pl-3">
        <span className="truncate text-sm font-medium leading-none text-foreground">{title}</span>
        <span className="truncate text-xs text-muted-foreground">{description}</span>
      </div>
    </>
  );
}

export default function Header() {
  const omnisearch = useOmnisearch();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-foreground no-underline"
        >
          <img src="/assets/logo.png" alt="MaiDB logo" className="h-7 w-7" />
          MaiDB
        </Link>

        <NavigationMenu viewport={false} className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link to="/songs" className="!no-underline">
                  Songs
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger onPointerMove={blockHover} onPointerLeave={blockHover}>
                Categories
              </NavigationMenuTrigger>
              <NavigationMenuContent onPointerEnter={blockHover} onPointerLeave={blockHover}>
                <ul className="grid w-[460px] grid-cols-2 gap-1 p-1">
                  {CATEGORIES.filter((c) => c.slug !== "utage").map((category) => (
                    <li key={category.slug}>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/songs"
                          search={{ category: category.slug }}
                          className={ACCENT_LINK_CLASS}
                          style={accentLinkStyle(category.color)}
                        >
                          <AccentBody
                            color={category.color}
                            title={category.category}
                            description={`Browse ${category.category}`}
                          />
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                  {(() => {
                    const utage = CATEGORIES.find((c) => c.slug === "utage");
                    if (!utage) return null;
                    return (
                      <li className="col-span-2">
                        <NavigationMenuLink asChild>
                          <Link
                            to="/songs"
                            search={{ type: "utage" }}
                            className={ACCENT_LINK_CLASS}
                            style={accentLinkStyle(utage.color)}
                          >
                            <AccentBody
                              color={utage.color}
                              title={utage.category}
                              description="Browse utage charts"
                            />
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    );
                  })()}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger onPointerMove={blockHover} onPointerLeave={blockHover}>
                Versions
              </NavigationMenuTrigger>
              <NavigationMenuContent onPointerEnter={blockHover} onPointerLeave={blockHover}>
                <ul className="grid w-[420px] grid-cols-2 gap-1 p-1">
                  {RECENT_VERSIONS.map((version) => (
                    <li key={version.slug}>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/version/$slug"
                          params={{ slug: version.slug }}
                          className={ACCENT_LINK_CLASS}
                          style={accentLinkStyle("var(--primary)")}
                        >
                          <AccentBody
                            color="var(--primary)"
                            title={version.version}
                            description={version.abbr}
                          />
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                  <li className="col-span-2 mt-1 border-t border-border/60 pt-1">
                    <NavigationMenuLink asChild>
                      <Link
                        to="/version"
                        className="!no-underline text-sm font-medium text-primary"
                      >
                        View all versions →
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link to="/songs" search={{ isNew: true }} className="!no-underline">
                  What&rsquo;s new
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link to="/about" className="!no-underline">
                  About
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => omnisearch.open()}
            className="group inline-flex h-9 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/70 hover:text-foreground sm:w-56 md:w-64"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="hidden flex-1 text-left sm:inline">Search songs...</span>
            <span className="sr-only sm:hidden">Search songs</span>
            <kbd className="ml-auto hidden shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-muted-foreground sm:inline-block">
              ⌘K
            </kbd>
          </button>
          <ThemeToggle />

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] max-w-sm p-0">
              <SheetHeader className="border-b border-border px-5 py-4">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-3">
                <Link
                  to="/songs"
                  onClick={closeMobile}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-foreground !no-underline hover:bg-muted"
                >
                  Songs
                </Link>

                <MobileSection title="Categories">
                  {CATEGORIES.filter((c) => c.slug !== "utage").map((category) => (
                    <Link
                      key={category.slug}
                      to="/songs"
                      search={{ category: category.slug }}
                      onClick={closeMobile}
                      className="relative flex min-w-0 items-center gap-3 overflow-hidden rounded-md px-3 py-2 !no-underline hover:bg-muted"
                    >
                      <AccentBody
                        color={category.color}
                        title={category.category}
                        description={`Browse ${category.category}`}
                      />
                    </Link>
                  ))}
                  {(() => {
                    const utage = CATEGORIES.find((c) => c.slug === "utage");
                    if (!utage) return null;
                    return (
                      <Link
                        to="/songs"
                        search={{ type: "utage" }}
                        onClick={closeMobile}
                        className="relative flex min-w-0 items-center gap-3 overflow-hidden rounded-md px-3 py-2 !no-underline hover:bg-muted"
                      >
                        <AccentBody
                          color={utage.color}
                          title={utage.category}
                          description="Browse utage charts"
                        />
                      </Link>
                    );
                  })()}
                </MobileSection>

                <MobileSection title="Versions">
                  {RECENT_VERSIONS.map((version) => (
                    <Link
                      key={version.slug}
                      to="/version/$slug"
                      params={{ slug: version.slug }}
                      onClick={closeMobile}
                      className="relative flex min-w-0 items-center gap-3 overflow-hidden rounded-md px-3 py-2 !no-underline hover:bg-muted"
                    >
                      <AccentBody
                        color="var(--primary)"
                        title={version.version}
                        description={version.abbr}
                      />
                    </Link>
                  ))}
                  <Link
                    to="/version"
                    onClick={closeMobile}
                    className="mt-1 block border-t border-border/60 px-3 pt-3 pb-2.5 text-sm font-medium text-primary !no-underline"
                  >
                    View all versions →
                  </Link>
                </MobileSection>

                <Link
                  to="/songs"
                  search={{ isNew: true }}
                  onClick={closeMobile}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-foreground !no-underline hover:bg-muted"
                >
                  What&rsquo;s new
                </Link>
                <Link
                  to="/about"
                  onClick={closeMobile}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-foreground !no-underline hover:bg-muted"
                >
                  About
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}

function MobileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Collapsible className="my-1">
      <CollapsibleTrigger className="group/section flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
        {title}
        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/section:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 space-y-1 pl-1">{children}</CollapsibleContent>
    </Collapsible>
  );
}
