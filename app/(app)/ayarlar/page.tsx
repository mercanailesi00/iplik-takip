"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Item = { id: string; name: string; is_active: boolean };

function Chip({
  name,
  active,
  onDeactivate,
  onActivate,
}: {
  name: string;
  active: boolean;
  onDeactivate: () => void;
  onActivate: () => void;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm border ${
        active ? "bg-gray-100" : "bg-gray-50 opacity-70"
      }`}
      title={active ? "Aktif" : "Pasif"}
    >
      <span className={active ? "" : "line-through"}>{name}</span>

      {active ? (
        <button
          onClick={onDeactivate}
          className="rounded-full px-2 py-0.5 text-gray-600 hover:bg-gray-200"
          title="Pasife al"
        >
          ✕
        </button>
      ) : (
        <button
          onClick={onActivate}
          className="rounded-full px-2 py-0.5 text-gray-600 hover:bg-gray-200"
          title="Tekrar aktif et"
        >
          ↺
        </button>
      )}
    </div>
  );
}

export default function AyarlarPage() {
  const [yarnTypes, setYarnTypes] = useState<Item[]>([]);
  const [colors, setColors] = useState<Item[]>([]);
  const [contractors, setContractors] = useState<Item[]>([]);

  const [newYarn, setNewYarn] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newContractor, setNewContractor] = useState("");

  const [showInactive, setShowInactive] = useState(false);
  const [msg, setMsg] = useState("");

  const loadTable = async (table: "yarn_types" | "colors" | "contractors") => {
    // ✅ varsayılan: sadece aktifler
    let q = supabase.from(table).select("id,name,is_active").order("name");
    if (!showInactive) q = q.eq("is_active", true);
    const res = await q;
    return (res.data as Item[]) || [];
  };

  const load = async () => {
    setMsg("");

    const yt = await loadTable("yarn_types");
    const c = await loadTable("colors");
    const f = await loadTable("contractors");

    setYarnTypes(yt);
    setColors(c);
    setContractors(f);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  const addRow = async (
    table: "yarn_types" | "colors" | "contractors",
    name: string
  ) => {
    setMsg("");
    const v = name.trim();
    if (!v) return;

    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) return setMsg("❌ Kullanıcı bulunamadı (tekrar giriş yap)");

    // aynı isim daha önce pasife alınmış olabilir -> varsa aktif et
    const existing = await supabase
      .from(table)
      .select("id,is_active")
      .eq("user_id", userId)
      .ilike("name", v)
      .maybeSingle();

    if (existing.data?.id) {
      const { error } = await supabase
        .from(table)
        .update({ is_active: true, name: v })
        .eq("id", existing.data.id);

      if (error) return setMsg("❌ " + error.message);
      setMsg("✅ Aktif edildi");
      await load();
      return;
    }

    const { error } = await supabase
      .from(table)
      .insert({ user_id: userId, name: v, is_active: true });

    if (error) return setMsg("❌ " + error.message);

    setMsg("✅ Eklendi");
    await load();
  };

  const setActive = async (
    table: "yarn_types" | "colors" | "contractors",
    id: string,
    isActive: boolean
  ) => {
    setMsg("");
    const ok = confirm(isActive ? "Aktif edilsin mi?" : "Pasife alınsın mı?");
    if (!ok) return;

    const { error } = await supabase
      .from(table)
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) return setMsg("❌ " + error.message);

    setMsg(isActive ? "✅ Aktif edildi" : "✅ Pasife alındı");
    await load();
  };

  const filterList = (arr: Item[]) =>
    showInactive ? arr : arr.filter((x) => x.is_active);

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tanımlamalar</h1>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Pasifleri göster
        </label>
      </div>

      {msg && (
        <div className="mb-4 rounded-xl border bg-white p-3 text-sm">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* İplik Cinsleri */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="text-lg font-semibold mb-4">İplik Cinsleri</div>

          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2"
              placeholder="Yeni iplik cinsi"
              value={newYarn}
              onChange={(e) => setNewYarn(e.target.value)}
            />
            <button
              className="px-4 py-2 rounded-lg bg-black text-white"
              onClick={async () => {
                await addRow("yarn_types", newYarn);
                setNewYarn("");
              }}
            >
              Ekle
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {filterList(yarnTypes).map((x) => (
              <Chip
                key={x.id}
                name={x.name}
                active={x.is_active}
                onDeactivate={() => setActive("yarn_types", x.id, false)}
                onActivate={() => setActive("yarn_types", x.id, true)}
              />
            ))}
          </div>
        </div>

        {/* Renkler */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="text-lg font-semibold mb-4">Renkler</div>

          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2"
              placeholder="Yeni renk"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
            />
            <button
              className="px-4 py-2 rounded-lg bg-black text-white"
              onClick={async () => {
                await addRow("colors", newColor);
                setNewColor("");
              }}
            >
              Ekle
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {filterList(colors).map((x) => (
              <Chip
                key={x.id}
                name={x.name}
                active={x.is_active}
                onDeactivate={() => setActive("colors", x.id, false)}
                onActivate={() => setActive("colors", x.id, true)}
              />
            ))}
          </div>
        </div>

        {/* Fasoncular */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="text-lg font-semibold mb-4">Fasoncular</div>

          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2"
              placeholder="Yeni fasoncu"
              value={newContractor}
              onChange={(e) => setNewContractor(e.target.value)}
            />
            <button
              className="px-4 py-2 rounded-lg bg-black text-white"
              onClick={async () => {
                await addRow("contractors", newContractor);
                setNewContractor("");
              }}
            >
              Ekle
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {filterList(contractors).map((x) => (
              <Chip
                key={x.id}
                name={x.name}
                active={x.is_active}
                onDeactivate={() => setActive("contractors", x.id, false)}
                onActivate={() => setActive("contractors", x.id, true)}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
