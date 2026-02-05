"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

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

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen lg:flex">
      {/* ✅ MOBİL ÜST BAR (sadece mobilde görünür) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b p-4">
        <div className="font-bold text-lg">İplik Takip</div>
        <div className="text-xs text-gray-600">{email}</div>
      </div>

      {/* ✅ Sol Menü (mobilde gizli, desktopta aynı) */}
      <aside className="hidden lg:block w-64 border-r p-4">
        <div className="font-bold text-lg mb-2">İplik Takip</div>
        <div className="text-sm text-gray-600 mb-6">{email}</div>

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

          {/* ✅ EKLENDİ */}
          <Link className="block hover:underline" href="/fasoncular">
            Fasoncular
          </Link>

          <Link className="block hover:underline" href="/ayarlar">
            Ayarlar
          </Link>
        </nav>

        <button
          onClick={logout}
          className="mt-6 w-full border rounded-md py-2 hover:bg-gray-50"
        >
          Çıkış Yap
        </button>
      </aside>

      {/* ✅ İçerik (mobilde üst bardan dolayı padding-top ekledik) */}
      <section className="flex-1 pt-20 lg:pt-0">{children}</section>
    </div>
  );
}
