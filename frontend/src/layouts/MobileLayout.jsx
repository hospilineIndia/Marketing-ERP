import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components/common/BottomNav";

export function MobileLayout() {
  return (
    <div className="min-h-screen bg-muted/30 overflow-x-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-24 pt-5">
        <header className="mb-5">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Marketing ERP
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Field App
          </h1>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
