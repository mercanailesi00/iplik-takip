"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email: `${username}@local.app`,
      password,
    });

    setLoading(false);

    if (error) {
      setMsg("❌ Kullanıcı adı veya şifre hatalı");
      return;
    }

    router.replace("/");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-10">
        <h1 className="text-4xl font-bold text-center mb-2">
          İplik Takip
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Sisteme giriş yap
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-lg mb-2">Kullanıcı Adı</label>
            <input
              className="w-full border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-black"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="örn: noyan"
            />
          </div>

          <div>
            <label className="block text-lg mb-2">Şifre</label>
            <input
              type="password"
              className="w-full border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="şifre"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg text-lg font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>

          {msg && <p className="text-center mt-4">{msg}</p>}
        </form>
      </div>
    </main>
  );
}
