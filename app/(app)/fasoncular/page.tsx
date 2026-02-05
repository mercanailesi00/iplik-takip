"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Item = { id: string; name: string };

type TxRow = {
  contractor_id: string | null;
  yarn_type_id: string;
  color_id: string;
  kg: number;
  bags: number;
  type: "DEPoya_GIRIS" | "DEPODAN_CIKIS" | "FASONCUYA_CIKIS" | "FASONCUDAN_CIKIS";
};

type Line = {
  contractor_id: string;
  contractor_name: string;
  yarn_name: string;
  color_name: string;
  kg: number;
  bags: number;
};

export default function FasoncularPage() {
  const [contractors, setContractors] = useState<Item[]>([]);
  const [yarnTypes, setYarnTypes] = useState<Item[]>([]);
  const [colors, setColors] = useState<Item[]>([]);
  const [rows, setRows] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    setMsg("");

    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) {
      setMsg("❌ Kullanıcı bulunamadı (tekrar giriş yap)");
      setLoading(false);
      return;
    }

    const yt = await supabase.from("yarn_types").select("id,name").order("name");
    const c = await supabase.from("colors").select("id,name").order("name");
    const f = await supabase.from("contractors").select("id,name").order("name");

    setYarnTypes(yt.data || []);
    setColors(c.data || []);
    setContractors(f.data || []);

    const tx = await supabase
      .from("stock_transactions")
      .select("contractor_id,yarn_type_id,color_id,kg,bags,type")
      .eq("user_id", userId);

    if (tx.error) {
      setMsg("❌ " + tx.error.message);
      setLoading(false);
      return;
    }

    setRows((tx.data || []) as TxRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const lines: Line[] = useMemo(() => {
    const yarnMap = new Map(yarnTypes.map((x) => [x.id, x.name]));
    const colorMap = new Map(colors.map((x) => [x.id, x.name]));
    const contractorMap = new Map(contractors.map((x) => [x.id, x.name]));

    // ✅ fasoncuya çıkış (+) / fasoncudan çıkış (-) topla
    const out = new Map<
      string,
      {
        kg: number;
        bags: number;
        contractor_id: string;
        yarn_type_id: string;
        color_id: string;
      }
    >();

    for (const r of rows) {
      if (r.type !== "FASONCUYA_CIKIS" && r.type !== "FASONCUDAN_CIKIS") continue;
      if (!r.contractor_id) continue;

      const key = `${r.contractor_id}__${r.yarn_type_id}__${r.color_id}`;
      const cur =
        out.get(key) || {
          kg: 0,
          bags: 0,
          contractor_id: r.contractor_id,
          yarn_type_id: r.yarn_type_id,
          color_id: r.color_id,
        };

      const sign = r.type === "FASONCUYA_CIKIS" ? 1 : -1;

      cur.kg += sign * (Number(r.kg) || 0);
      cur.bags += sign * (Number(r.bags) || 0);

      out.set(key, cur);
    }

    return Array.from(out.values())
      // 0 olanları gizleyelim
      .filter((x) => x.kg !== 0 || x.bags !== 0)
      .map((x) => ({
        contractor_id: x.contractor_id,
        contractor_name: contractorMap.get(x.contractor_id) || "-",
        yarn_name: yarnMap.get(x.yarn_type_id) || "-",
        color_name: colorMap.get(x.color_id) || "-",
        kg: Number(x.kg.toFixed(2)),
        bags: x.bags,
      }))
      .sort((a, b) =>
        (a.contractor_name + a.yarn_name + a.color_name).localeCompare(
          b.contractor_name + b.yarn_name + b.color_name,
          "tr"
        )
      );
  }, [rows, yarnTypes, colors, contractors]);

  const grouped = useMemo(() => {
    const m = new Map<string, Line[]>();
    for (const l of lines) {
      const arr = m.get(l.contractor_id) || [];
      arr.push(l);
      m.set(l.contractor_id, arr);
    }
    return Array.from(m.entries()).map(([contractor_id, items]) => ({
      contractor_id,
      contractor_name: items[0]?.contractor_name || "-",
      items,
    }));
  }, [lines]);

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Fasoncular</h1>
        <button onClick={load} className="px-4 py-2 rounded-lg bg-black text-white">
          Yenile
        </button>
      </div>

      {loading && <div>Yükleniyor...</div>}
      {msg && <div className="mb-4">{msg}</div>}

      {!loading && !grouped.length && (
        <div className="text-gray-500">Henüz fasoncu işlemi yok.</div>
      )}

      <div className="space-y-6">
        {grouped.map((g) => (
          <div key={g.contractor_id} className="bg-white rounded-2xl shadow p-6">
            <div className="text-lg font-semibold mb-4">{g.contractor_name}</div>

            <div className="space-y-3">
              {g.items.map((x, idx) => (
                <div
                  key={x.contractor_id + x.yarn_name + x.color_name + idx}
                  className="flex items-center justify-between border rounded-xl p-4"
                >
                  <div>
                    <div className="font-medium">{x.yarn_name}</div>
                    <div className="text-sm text-gray-600">{x.color_name}</div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                      {x.kg} kg
                    </span>
                    <span className="px-3 py-1 rounded-full bg-green-50 text-green-700">
                      {x.bags} çuval
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
