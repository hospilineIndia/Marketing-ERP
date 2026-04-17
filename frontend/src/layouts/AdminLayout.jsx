import { Outlet } from "react-router-dom";

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-5 sm:px-6">
        <header className="mb-5 rounded-3xl border bg-background p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
            Marketing ERP
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Admin</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Placeholder dashboard shell for lead review, filters, and exports.
          </p>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
