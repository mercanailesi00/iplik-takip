"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Item = { id: string; name: string };

function Chip({ name, onDelete }: { name: string; onDelete: () => void }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm">
      <span>{name}</span>
      <button
        onClick={onDelete}
        className="rounded-full px-2 py-0.5 text-gray-600 hover:bg-gray-200"
        title="Sil"
      >
        ✕
      </button>
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

  const [msg, setMsg] = useState("");

  const load = async () => {
    setMsg("");

    const yt = await supabase.from("yarn_types").select("id,name").order("name");
    const c = await supabase.from("colors").select("id,name").order("name");
    const f = await supabase.from("contractors").select("id,name").order("name");

    setYarnTypes((yt.data as Item[]) || []);
    setColors((c.data as Item[]) || []);
    setContractors((f.data as Item[]) || []);
  };

  useEffect(() => {
    load();
  }, []);

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

    const { error } = await supabase.from(table).insert({ user_id: userId, name: v });
    if (error) return setMsg("❌ " + error.message);

    setMsg("✅ Eklendi");
    await load();
  };

  const deleteRow = async (
    table: "yarn_types" | "colors" | "contractors",
    id: string
  ) => {
    setMsg("");
    const ok = confirm("Silmek istediğine emin misin?");
    if (!ok) return;

    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) {
      // Not: Eğer bu öğe daha önce işlemlerde kullanıldıysa (FK varsa) Supabase silmeye izin vermeyebilir.
      return setMsg("❌ " + error.message);
    }

    setMsg("✅ Silindi");
    await load();
  };

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Tanımlamalar</h1>

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
            {yarnTypes.map((x) => (
              <Chip key={x.id} name={x.name} onDelete={() => deleteRow("yarn_types", x.id)} />
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
            {colors.map((x) => (
              <Chip key={x.id} name={x.name} onDelete={() => deleteRow("colors", x.id)} />
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
            {contractors.map((x) => (
              <Chip key={x.id} name={x.name} onDelete={() => deleteRow("contractors", x.id)} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
