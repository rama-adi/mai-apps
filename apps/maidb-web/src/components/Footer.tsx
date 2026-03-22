export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 text-sm text-muted-foreground sm:flex-row">
        <p className="m-0">&copy; {year} MaiDB. Song data sourced from maimai NET.</p>
        <p className="m-0 text-xs font-medium uppercase tracking-widest">maimai Song Database</p>
      </div>
    </footer>
  );
}
