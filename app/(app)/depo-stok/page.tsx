"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Item = { id: string; name: string };

type Row = {
  id: string;
  yarn_type_id: string;
  color_id: string;
  kg: number;
  bags: number;
  type: "DEPoya_GIRIS" | "DEPODAN_CIKIS" | "FASONCUYA_CIKIS" | "FASONCUDAN_CIKIS";
};

type StockLine = {
  yarn_type_id: string;
  color_id: string;
  yarn_name: string;
  color_name: string;
  kg: number;
  bags: number;
};

export default function DepoStokPage() {
  const [yarnTypes, setYarnTypes] = useState<Item[]>([]);
  const [colors, setColors] = useState<Item[]>([]);

  const [filterYarn, setFilterYarn] = useState<string>("ALL");
  const [filterColor, setFilterColor] = useState<string>("ALL");

  const [lines, setLines] = useState<StockLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const loadMaster = async () => {
    const yt = await supabase.from("yarn_types").select("id,name").order("name");
    const c = await supabase.from("colors").select("id,name").order("name");
    setYarnTypes(yt.data || []);
    setColors(c.data || []);
  };

  const loadStock = async () => {
    setLoading(true);
    setMsg("");

    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) {
      setMsg("❌ Kullanıcı bulunamadı (tekrar giriş yap)");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("stock_transactions")
      .select("id,yarn_type_id,color_id,kg,bags,type")
      .eq("user_id", userId);

    if (error) {
      setMsg("❌ " + error.message);
      setLoading(false);
      return;
    }

    const rows = (data || []) as Row[];

    const yarnMap = new Map(yarnTypes.map((x) => [x.id, x.name]));
    const colorMap = new Map(colors.map((x) => [x.id, x.name]));

    const agg = new Map<
      string,
      { kg: number; bags: number; yarn_type_id: string; color_id: string }
    >();

    for (const r of rows) {
      const key = `${r.yarn_type_id}__${r.color_id}`;
      const cur =
        agg.get(key) || {
          kg: 0,
          bags: 0,
          yarn_type_id: r.yarn_type_id,
          color_id: r.color_id,
        };

      // ✅ Depoyu etkileyenler:
      // DEPoya_GIRIS +1
      // DEPODAN_CIKIS -1
      // FASONCUYA_CIKIS -1
      // FASONCUDAN_CIKIS 0 (depoyu etkilemez)
      const sign =
        r.type === "DEPoya_GIRIS"
          ? 1
          : r.type === "DEPODAN_CIKIS"
          ? -1
          : r.type === "FASONCUYA_CIKIS"
          ? -1
          : 0;

      cur.kg += sign * (Number(r.kg) || 0);
      cur.bags += sign * (Number(r.bags) || 0);

      agg.set(key, cur);
    }

    let out: StockLine[] = Array.from(agg.values())
      .map((x) => ({
        yarn_type_id: x.yarn_type_id,
        color_id: x.color_id,
        yarn_name: yarnMap.get(x.yarn_type_id) || "-",
        color_name: colorMap.get(x.color_id) || "-",
        kg: Number(x.kg.toFixed(2)),
        bags: x.bags,
      }))
      .filter((x) => x.kg !== 0 || x.bags !== 0);

    if (filterYarn !== "ALL") out = out.filter((x) => x.yarn_type_id === filterYarn);
    if (filterColor !== "ALL") out = out.filter((x) => x.color_id === filterColor);

    out.sort((a, b) =>
      (a.yarn_name + a.color_name).localeCompare(b.yarn_name + b.color_name, "tr")
    );

    setLines(out);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await loadMaster();
    })();
  }, []);

  useEffect(() => {
    if (yarnTypes.length || colors.length) loadStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yarnTypes.length, colors.length]);

  const totals = useMemo(() => {
    const totalKg = lines.reduce((s, x) => s + (x.kg || 0), 0);
    const totalBags = lines.reduce((s, x) => s + (x.bags || 0), 0);
    return { totalKg: Number(totalKg.toFixed(2)), totalBags };
  }, [lines]);

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Depo Stok</h1>

      <div className="bg-white rounded-2xl shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">İplik Cinsi</label>
            <select
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={filterYarn}
              onChange={(e) => setFilterYarn(e.target.value)}
            >
              <option value="ALL">Tümü</option>
              {yarnTypes.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Renk</label>
            <select
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value)}
            >
              <option value="ALL">Tümü</option>
              {colors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border bg-gray-50 p-6 flex items-center justify-around">
          <div className="text-center">
            <div className="text-3xl font-bold">{totals.totalKg}</div>
            <div className="text-sm text-gray-600">Toplam KG</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{totals.totalBags}</div>
            <div className="text-sm text-gray-600">Toplam Çuval</div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {loading && <div>Yükleniyor...</div>}
          {msg && <div>{msg}</div>}
          {!loading && !lines.length && (
            <div className="text-gray-500">Kayıt yok.</div>
          )}

          {lines.map((x) => (
            <div
              key={`${x.yarn_type_id}-${x.color_id}`}
              className="rounded-2xl border p-4 bg-white flex items-center justify-between"
            >
              <div>
                <div className="font-semibold">{x.yarn_name}</div>
                <div className="text-sm text-gray-600">{x.color_name}</div>
              </div>
              <div className="flex gap-3">
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

        <button
          onClick={loadStock}
          className="mt-6 w-full bg-black text-white py-3 rounded-lg font-semibold"
        >
          Yenile
        </button>
      </div>
    </main>
  );
}
