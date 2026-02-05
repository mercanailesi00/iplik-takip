"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Item = { id: string; name: string };

// ✅ SENİN DB CHECK constraint ile birebir uyumlu (DEPoya_GIRIS küçük o)
type TxType =
  | "DEPoya_GIRIS"
  | "DEPODAN_CIKIS"
  | "FASONCUYA_CIKIS"
  | "FASONCUDAN_CIKIS";

export default function VeriGirisPage() {
  const [yarnTypes, setYarnTypes] = useState<Item[]>([]);
  const [colors, setColors] = useState<Item[]>([]);
  const [contractors, setContractors] = useState<Item[]>([]);

  const [yarnTypeId, setYarnTypeId] = useState("");
  const [colorId, setColorId] = useState("");

  const [kg, setKg] = useState<string>("0");
  const [bags, setBags] = useState<string>("0");

  // ✅ default da DB’ye uygun
  const [type, setType] = useState<TxType>("DEPoya_GIRIS");

  const [contractorId, setContractorId] = useState("");
  const [note, setNote] = useState("");

  const [msg, setMsg] = useState<string>("");

  const canPickContractor = useMemo(
    () => type === "FASONCUYA_CIKIS" || type === "FASONCUDAN_CIKIS",
    [type]
  );

  const load = async () => {
    const yt = await supabase
      .from("yarn_types")
      .select("id,name")
      .eq("is_active", true)
      .order("name");

    const c = await supabase
      .from("colors")
      .select("id,name")
      .eq("is_active", true)
      .order("name");

    const f = await supabase
      .from("contractors")
      .select("id,name")
      .eq("is_active", true)
      .order("name");

    setYarnTypes(yt.data || []);
    setColors(c.data || []);
    setContractors(f.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!canPickContractor) setContractorId("");
  }, [canPickContractor]);

  const submit = async () => {
    setMsg("");

    if (!yarnTypeId) return setMsg("❌ İplik cinsi seç");
    if (!colorId) return setMsg("❌ Renk seç");

    const kgNum = Number(kg);
    const bagsNum = Number(bags);

    if (!Number.isFinite(kgNum) || kgNum <= 0)
      return setMsg("❌ KG 0'dan büyük olmalı");
    if (!Number.isFinite(bagsNum) || bagsNum < 0)
      return setMsg("❌ Çuval negatif olamaz");

    if (canPickContractor && !contractorId) return setMsg("❌ Fasoncu seç");

    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) return setMsg("❌ Kullanıcı bulunamadı (tekrar giriş yap)");

    const { error } = await supabase.from("stock_transactions").insert({
      user_id: userId,
      yarn_type_id: yarnTypeId,
      color_id: colorId,
      kg: kgNum,
      bags: bagsNum,
      type,
      contractor_id: canPickContractor ? contractorId : null,
      note: note.trim() || null,
    });

    if (error) return setMsg("❌ " + error.message);

    setMsg("✅ Kayıt eklendi");
    setKg("0");
    setBags("0");
    setNote("");
  };

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">İplik Stok İşlemleri</h1>

      <div className="bg-white rounded-2xl shadow p-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">İplik Cinsi</label>
            <select
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={yarnTypeId}
              onChange={(e) => setYarnTypeId(e.target.value)}
            >
              <option value="">Seç</option>
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
              value={colorId}
              onChange={(e) => setColorId(e.target.value)}
            >
              <option value="">Seç</option>
              {colors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Kg</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Çuval Sayısı</label>
            <input
              type="number"
              min={0}
              step="1"
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={bags}
              onChange={(e) => setBags(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="text-sm text-gray-600">İşlem Türü</label>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => setType("DEPoya_GIRIS")}
              className={`px-4 py-2 rounded-lg border ${
                type === "DEPoya_GIRIS" ? "bg-black text-white" : "bg-white"
              }`}
            >
              Depoya Giriş
            </button>

            <button
              onClick={() => setType("DEPODAN_CIKIS")}
              className={`px-4 py-2 rounded-lg border ${
                type === "DEPODAN_CIKIS" ? "bg-black text-white" : "bg-white"
              }`}
            >
              Depodan Çıkış
            </button>

            <button
              onClick={() => setType("FASONCUYA_CIKIS")}
              className={`px-4 py-2 rounded-lg border ${
                type === "FASONCUYA_CIKIS" ? "bg-black text-white" : "bg-white"
              }`}
            >
              Fasoncuya Çıkış
            </button>

            <button
              onClick={() => setType("FASONCUDAN_CIKIS")}
              className={`px-4 py-2 rounded-lg border ${
                type === "FASONCUDAN_CIKIS" ? "bg-black text-white" : "bg-white"
              }`}
            >
              Fasoncudan Çıkış
            </button>
          </div>
        </div>

        {canPickContractor && (
          <div className="mt-5">
            <label className="text-sm text-gray-600">Fasoncu</label>
            <select
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={contractorId}
              onChange={(e) => setContractorId(e.target.value)}
            >
              <option value="">Seç</option>
              {contractors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-5">
          <label className="text-sm text-gray-600">Not</label>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="opsiyonel"
          />
        </div>

        <button
          onClick={submit}
          className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg font-semibold"
        >
          Kaydet
        </button>

        {msg && <p className="mt-4">{msg}</p>}
      </div>
    </main>
  );
}
