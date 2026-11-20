"use client";

import { useEffect } from "react";
import { usePlatform } from "@/core/platform-context";
import { AdminPanel } from "@/modules/admin/admin-panel";
import { AgeGateModal, LoginModal, SiteHeader } from "@/modules/public/header";
import { HomePage } from "@/modules/public/home";
import { BankPage, TreePage } from "@/modules/public/bank";
import { ProfilePage } from "@/modules/public/profile";
import { SiteFooter } from "@/modules/public/footer";
import { ContentDetailModal } from "@/modules/media/media-modal";

export function AppRoot() {
  const { view, user, authChecked, setLoginOpen, toast } = usePlatform();
  useEffect(() => {
    if (authChecked && view === "admin" && !user) setLoginOpen(true);
  }, [authChecked, view, user, setLoginOpen]);
  const isAdmin = view === "admin" && user && user.role !== "visitor";
  if (isAdmin) return <><AdminPanel /><ContentDetailModal /><LoginModal />{toast && <div className="toast">{toast}</div>}</>;
  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="public-main">
        {view === "bank" ? <BankPage /> : view === "tree" ? <TreePage /> : view === "profile" ? <ProfilePage /> : <HomePage />}
      </main>
      <SiteFooter />
      <AgeGateModal />
      <LoginModal />
      <ContentDetailModal />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
