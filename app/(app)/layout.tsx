"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  // ✅ MOBİL MENÜ
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        router.replace("/login");
        return;
      }

      setEmail(data.user.email ?? null);
      setLoading(false);
    };

    run();
  }, [router]);

  // ✅ sayfa değişince mobil menüyü kapat
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>;
  }

  const NavLinks = () => (
    <nav className="space-y-2">
      <Link className="block hover:underline" href="/veri-giris">
        Veri Giriş
      </Link>
      <Link className="block hover:underline" href="/depo-stok">
        Depo Stok
      </Link>
      <Link className="block hover:underline" href="/gecmis">
        Geçmiş
      </Link>
      <Link className="block hover:underline" href="/fasoncular">
        Fasoncular
      </Link>
      <Link className="block hover:underline" href="/ayarlar">
        Ayarlar
      </Link>
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex bg-gray-50">
      {/* ✅ MOBİL ÜST BAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b p-4 flex items-center justify-between">
        <div>
          <div className="font-bold text-lg">İplik Takip</div>
          <div className="text-xs text-gray-600">{email}</div>
        </div>

        <button
          onClick={() => setMenuOpen((s) => !s)}
          className="border rounded-lg px-3 py-2"
        >
          {menuOpen ? "Kapat" : "Menü"}
        </button>
      </div>

      {/* ✅ MOBİL MENÜ DRAWER */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* arka karartı */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />

          {/* panel */}
          <aside className="absolute left-0 top-0 h-full w-72 bg-white p-4 shadow-lg">
            <div className="font-bold text-lg mb-2">İplik Takip</div>
            <div className="text-sm text-gray-600 mb-6">{email}</div>

            <NavLinks />

            <button
              onClick={logout}
              className="mt-6 w-full border rounded-md py-2 hover:bg-gray-50"
            >
              Çıkış Yap
            </button>
          </aside>
        </div>
      )}

      {/* ✅ DESKTOP SOL MENÜ (Aynı, değişmedi) */}
      <aside className="hidden lg:block w-64 border-r bg-white p-4">
        <div className="font-bold text-lg mb-2">İplik Takip</div>
        <div className="text-sm text-gray-600 mb-6">{email}</div>

        <NavLinks />

        <button
          onClick={logout}
          className="mt-6 w-full border rounded-md py-2 hover:bg-gray-50"
        >
          Çıkış Yap
        </button>
      </aside>

      {/* ✅ İÇERİK (mobilde üst bar olduğu için padding-top) */}
      <section className="flex-1 pt-20 lg:pt-0">{children}</section>
    </div>
  );
}
