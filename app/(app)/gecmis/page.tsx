"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TxType = "DEPOYA_GIRIS" | "DEPODAN_CIKIS" | "FASONCUYA_CIKIS";

type Row = {
  id: string;
  created_at: string;
  type: TxType;
  kg: number;
  bags: number;
  yarn_type_id: string;
  color_id: string;
  contractor_id: string | null;
};

type Item = { id: string; name: string };

export default function GecmisPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [yarnTypes, setYarnTypes] = useState<Item[]>([]);
  const [colors, setColors] = useState<Item[]>([]);
  const [contractors, setContractors] = useState<Item[]>([]);
  const [filterType, setFilterType] = useState<TxType | "ALL">("ALL");
  const [loading, setLoading] = useState(false);

  const [msg, setMsg] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setMsg("");

    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) {
      setMsg("❌ Kullanıcı bulunamadı");
      setLoading(false);
      return;
    }

    const tx = await supabase
      .from("stock_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (tx.error) {
      setMsg("❌ " + tx.error.message);
      setLoading(false);
      return;
    }

    const yt = await supabase.from("yarn_types").select("id,name");
    const c = await supabase.from("colors").select("id,name");
    const f = await supabase.from("contractors").select("id,name");

    setRows((tx.data || []) as Row[]);
    setYarnTypes(yt.data || []);
    setColors(c.data || []);
    setContractors(f.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const yarnMap = useMemo(
    () => new Map(yarnTypes.map((x) => [x.id, x.name])),
    [yarnTypes]
  );
  const colorMap = useMemo(
    () => new Map(colors.map((x) => [x.id, x.name])),
    [colors]
  );
  const contractorMap = useMemo(
    () => new Map(contractors.map((x) => [x.id, x.name])),
    [contractors]
  );

  const filtered = useMemo(() => {
    if (filterType === "ALL") return rows;
    return rows.filter((r) => r.type === filterType);
  }, [rows, filterType]);

  const label = (t: TxType) => {
    switch (t) {
      case "DEPOYA_GIRIS":
        return "Depoya Giriş";
      case "DEPODAN_CIKIS":
        return "Depodan Çıkış";
      case "FASONCUYA_CIKIS":
        return "Fasoncuya Çıkış";
    }
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("Bu kaydı silmek istiyor musun?");
    if (!ok) return;

    setMsg("");
    setDeletingId(id);

    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) {
      setMsg("❌ Kullanıcı bulunamadı");
      setDeletingId(null);
      return;
    }

    // ✅ RLS için: kendi kaydını siliyor mu kontrolü (id + user_id)
    const { error } = await supabase
      .from("stock_transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setMsg("❌ " + error.message);
      setDeletingId(null);
      return;
    }

    // ekrandan da kaldır
    setRows((prev) => prev.filter((x) => x.id !== id));
    setMsg("✅ Kayıt silindi");
    setDeletingId(null);
  };

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Geçmiş</h1>
        <button
          onClick={load}
          className="px-4 py-2 rounded-lg bg-black text-white"
        >
          Yenile
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          className="border rounded-lg px-3 py-2"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
        >
          <option value="ALL">Tüm İşlemler</option>
          <option value="DEPOYA_GIRIS">Depoya Giriş</option>
          <option value="DEPODAN_CIKIS">Depodan Çıkış</option>
          <option value="FASONCUYA_CIKIS">Fasoncuya Çıkış</option>
        </select>

        {msg && <div className="text-sm">{msg}</div>}
      </div>

      {loading && <div>Yükleniyor...</div>}

      <div className="space-y-3">
        {!loading && !filtered.length && (
          <div className="text-gray-500">Kayıt yok.</div>
        )}

        {filtered.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-xl border p-4 flex items-start justify-between gap-4"
          >
            <div>
              <div className="font-semibold">{label(r.type)}</div>
              <div className="text-sm text-gray-600">
                {yarnMap.get(r.yarn_type_id) || "-"} /{" "}
                {colorMap.get(r.color_id) || "-"}
              </div>

              {r.contractor_id && (
                <div className="text-sm text-gray-500">
                  Fasoncu: {contractorMap.get(r.contractor_id) || "-"}
                </div>
              )}

              <div className="text-xs text-gray-400">
                {new Date(r.created_at).toLocaleString("tr-TR")}
              </div>
            </div>

            <div className="text-right flex flex-col items-end gap-2">
              <div>
                <div className="font-semibold">{r.kg} kg</div>
                <div className="text-sm text-gray-600">{r.bags} çuval</div>
              </div>

              <button
                onClick={() => handleDelete(r.id)}
                disabled={deletingId === r.id}
                className="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
              >
                {deletingId === r.id ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
