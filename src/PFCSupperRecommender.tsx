import React, { useMemo, useState } from "react";
import Papa from "papaparse";

// ===== Types =====
export type Item = {
  id: string;
  name: string;
  chain: "7-Eleven" | "FamilyMart" | "Lawson" | "Any" | string;
  category: "主食" | "主菜/たんぱく源" | "サイド" | "スープ" | "デザート/ドリンク" | string;
  calories: number; // kcal
  protein: number; // g
  fat: number; // g
  carbs: number; // g
  price?: number; // JPY
};

export type Targets = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

// ===== Sample dataset (概算値・目安) =====
const defaultItems: Item[] = [
  { id: "7-1", name: "サラダチキン プレーン", chain: "7-Eleven", category: "主菜/たんぱく源", calories: 115, protein: 25, fat: 1.5, carbs: 1, price: 268 },
  { id: "7-2", name: "玄米おにぎり（鮭）", chain: "7-Eleven", category: "主食", calories: 180, protein: 6, fat: 2.5, carbs: 36, price: 150 },
  { id: "7-3", name: "ゆでたまご", chain: "7-Eleven", category: "サイド", calories: 70, protein: 6, fat: 5, carbs: 0.3, price: 90 },
  { id: "7-4", name: "ギリシャヨーグルト（無脂肪）", chain: "7-Eleven", category: "デザート/ドリンク", calories: 110, protein: 10, fat: 0, carbs: 15, price: 170 },
  { id: "7-5", name: "おでん 大根", chain: "7-Eleven", category: "サイド", calories: 10, protein: 0.3, fat: 0, carbs: 2, price: 100 },
  { id: "7-6", name: "豆腐バー", chain: "7-Eleven", category: "主菜/たんぱく源", calories: 130, protein: 15, fat: 6, carbs: 3, price: 170 },
  { id: "7-7", name: "焼き鮭（塩）", chain: "7-Eleven", category: "主菜/たんぱく源", calories: 200, protein: 22, fat: 12, carbs: 0, price: 320 },
  { id: "7-8", name: "さばの塩焼", chain: "7-Eleven", category: "主菜/たんぱく源", calories: 300, protein: 20, fat: 22, carbs: 0, price: 380 },
  { id: "7-9", name: "玄米ごはんパック（150g）", chain: "7-Eleven", category: "主食", calories: 180, protein: 3, fat: 1, carbs: 38, price: 160 },

  { id: "f-1", name: "グリルチキン", chain: "FamilyMart", category: "主菜/たんぱく源", calories: 140, protein: 23, fat: 4, carbs: 1, price: 258 },
  { id: "f-2", name: "サラダチキン", chain: "FamilyMart", category: "主菜/たんぱく源", calories: 125, protein: 25, fat: 1, carbs: 0, price: 268 },
  { id: "f-3", name: "おにぎり（ツナマヨ）", chain: "FamilyMart", category: "主食", calories: 235, protein: 6, fat: 9, carbs: 34, price: 158 },
  { id: "f-4", name: "もち麦おにぎり", chain: "FamilyMart", category: "主食", calories: 200, protein: 6, fat: 2, carbs: 38, price: 160 },
  { id: "f-5", name: "プロテインヨーグルト", chain: "FamilyMart", category: "デザート/ドリンク", calories: 120, protein: 15, fat: 0, carbs: 12, price: 178 },
  { id: "f-6", name: "プロテインドリンク（200ml）", chain: "FamilyMart", category: "デザート/ドリンク", calories: 100, protein: 15, fat: 0, carbs: 8, price: 210 },

  { id: "l-1", name: "サラダチキン", chain: "Lawson", category: "主菜/たんぱく源", calories: 110, protein: 24, fat: 1, carbs: 0, price: 238 },
  { id: "l-2", name: "ブランパン（2個）", chain: "Lawson", category: "主食", calories: 135, protein: 14, fat: 6, carbs: 13, price: 150 },
  { id: "l-3", name: "豆腐そうめん", chain: "Lawson", category: "主食", calories: 120, protein: 7, fat: 3, carbs: 15, price: 198 },
  { id: "l-4", name: "おにぎり（鮭）", chain: "Lawson", category: "主食", calories: 180, protein: 6, fat: 2, carbs: 36, price: 150 },
  { id: "l-5", name: "グリルサラダチキンバー", chain: "Lawson", category: "主菜/たんぱく源", calories: 90, protein: 15, fat: 1, carbs: 1, price: 170 },

  { id: "a-1", name: "納豆", chain: "Any", category: "主菜/たんぱく源", calories: 100, protein: 8, fat: 5, carbs: 6, price: 90 },
  { id: "a-2", name: "枝豆（塩ゆで）", chain: "Any", category: "サイド", calories: 110, protein: 10, fat: 4, carbs: 8, price: 150 },
  { id: "a-3", name: "冷奴", chain: "Any", category: "サイド", calories: 100, protein: 8, fat: 5, carbs: 3, price: 120 },
  { id: "a-4", name: "味噌汁", chain: "Any", category: "スープ", calories: 35, protein: 3, fat: 1, carbs: 4, price: 120 },
  { id: "a-5", name: "バナナ", chain: "Any", category: "サイド", calories: 90, protein: 1, fat: 0.3, carbs: 23, price: 120 },
  { id: "a-6", name: "焼き芋（中）", chain: "Any", category: "主食", calories: 250, protein: 2, fat: 0.5, carbs: 60, price: 250 },
  { id: "a-7", name: "サバ缶（水煮）", chain: "Any", category: "主菜/たんぱく源", calories: 190, protein: 22, fat: 11, carbs: 0, price: 220 },
  { id: "a-8", name: "プロテインバー", chain: "Any", category: "デザート/ドリンク", calories: 180, protein: 15, fat: 8, carbs: 15, price: 170 },
  { id: "a-9", name: "ミックスサラダ（ドレッシング別）", chain: "Any", category: "サイド", calories: 30, protein: 2, fat: 0.2, carbs: 5, price: 150 },
];

// ===== Utilities =====
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function energyFromMacros(p: number, f: number, c: number) {
  return p * 4 + f * 9 + c * 4;
}

function macroPercents(p: number, f: number, c: number) {
  const e = energyFromMacros(p, f, c);
  if (e <= 0) return { p: 0, f: 0, c: 0 };
  return { p: (p * 4) / e, f: (f * 9) / e, c: (c * 4) / e };
}

function sumItems(items: Item[]) {
  return items.reduce(
    (acc, it) => ({
      calories: acc.calories + it.calories,
      protein: acc.protein + it.protein,
      fat: acc.fat + it.fat,
      carbs: acc.carbs + it.carbs,
      price: (acc.price ?? 0) + (it.price ?? 0),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0, price: 0 }
  );
}

// ===== Main Component =====
export default function PFCSupperRecommender() {
  // Personal default (ユーザーの以前の設定に合わせた初期値)
  const [targets, setTargets] = useState<Targets>({ calories: 3200, protein: 215, fat: 65, carbs: 445 });
  const [consumed, setConsumed] = useState<Targets>({ calories: 0, protein: 0, fat: 0, carbs: 0 });

  const [items, setItems] = useState<Item[]>(defaultItems);

  const [chainFilter, setChainFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState<number | undefined>(undefined);
  const [maxItems, setMaxItems] = useState<number>(3);
  const [overshootPct, setOvershootPct] = useState<number>(10);

  const [priority, setPriority] = useState<"none" | "highP" | "lowF" | "lowC">("none");

  const remaining = useMemo(() => {
    const r = {
      calories: Math.max(0, targets.calories - consumed.calories),
      protein: Math.max(0, targets.protein - consumed.protein),
      fat: Math.max(0, targets.fat - consumed.fat),
      carbs: Math.max(0, targets.carbs - consumed.carbs),
    };
    return r;
  }, [targets, consumed]);

  const remainingPerc = useMemo(() => macroPercents(remaining.protein, remaining.fat, remaining.carbs), [remaining]);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (chainFilter !== "All" && it.chain !== chainFilter && it.chain !== "Any") return false;
      if (categoryFilter !== "All" && it.category !== categoryFilter) return false;
      if (query && !(`${it.name} ${it.chain} ${it.category}`.toLowerCase().includes(query.toLowerCase()))) return false;
      return true;
    });
  }, [items, chainFilter, categoryFilter, query]);

  // Build candidate pool by ratio closeness + optional priorities
  const candidatePool = useMemo(() => {
    const scored = filteredItems.map((it) => {
      const ip = macroPercents(it.protein, it.fat, it.carbs);
      const ratioDiff = Math.abs(ip.p - remainingPerc.p) + Math.abs(ip.f - remainingPerc.f) + Math.abs(ip.c - remainingPerc.c);
      // Priority tweaks
      let tweak = 0;
      if (priority === "highP") tweak -= it.protein / Math.max(1, it.calories) * 2; // favor protein density
      if (priority === "lowF") tweak += it.fat / Math.max(1, it.calories) * 2; // penalize fat density
      if (priority === "lowC") tweak += it.carbs / Math.max(1, it.calories) * 2; // penalize carb density
      return { it, s: ratioDiff + tweak };
    });
    return scored.sort((a, b) => a.s - b.s).slice(0, 22).map((x) => x.it); // small but diverse pool
  }, [filteredItems, remainingPerc, priority]);

  type Combo = { items: Item[]; totals: { calories: number; protein: number; fat: number; carbs: number; price: number }; score: number; over: boolean };

  const combos = useMemo<Combo[]>(() => {
    const pool = candidatePool;
    const res: Combo[] = [];

    const allowOver = overshootPct / 100;

    function evaluate(combo: Item[]) {
      const t = sumItems(combo);
      if (budget !== undefined && t.price > budget) return; // budget filter

      const overCal = t.calories - remaining.calories;
      const overP = t.protein - remaining.protein;
      const overF = t.fat - remaining.fat;
      const overC = t.carbs - remaining.carbs;

      const within =
        overCal <= remaining.calories * allowOver &&
        overP <= remaining.protein * allowOver &&
        overF <= remaining.fat * allowOver &&
        overC <= remaining.carbs * allowOver;

      // === 目的関数: 16*(ΔP)^2 + 81*(ΔF)^2 + 16*(ΔC)^2 を最小化 ===
      const dP = remaining.protein - t.protein;
      const dF = remaining.fat - t.fat;
      const dC = remaining.carbs - t.carbs;

      const s =
        16 * Math.pow(dP, 2) +
        81 * Math.pow(dF, 2) +
        16 * Math.pow(dC, 2) +
        // 許容超過を越えた場合の軽いペナルティ（必要なければ削除可）
        (overCal > remaining.calories * allowOver ? 10 : 0) +
        (overP > remaining.protein * allowOver ? 6 : 0) +
        (overF > remaining.fat * allowOver ? 6 : 0) +
        (overC > remaining.carbs * allowOver ? 6 : 0);

      res.push({ items: combo, totals: t, score: s, over: !within });
    }

    const n = pool.length;
    // size 1..maxItems brute force
    for (let i = 0; i < n; i++) {
      evaluate([pool[i]]);
      if (maxItems < 2) continue;
      for (let j = i + 1; j < n; j++) {
        evaluate([pool[i], pool[j]]);
        if (maxItems < 3) continue;
        for (let k = j + 1; k < n; k++) {
          evaluate([pool[i], pool[j], pool[k]]);
          if (maxItems < 4) continue;
          for (let m = k + 1; m < n; m++) {
            evaluate([pool[i], pool[j], pool[k], pool[m]]);
          }
        }
      }
    }

    return res
      .sort((a, b) => a.score - b.score)
      .slice(0, 20);
  }, [candidatePool, remaining, maxItems, overshootPct, budget]);

  // CSV import/export
  function handleCSVUpload(file: File) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        try {
          const rows: any[] = results.data;
          const parsed: Item[] = rows.map((r, idx) => ({
            id: r.id || `csv-${Date.now()}-${idx}`,
            name: String(r.name),
            chain: (r.chain as any) || "Any",
            category: (r.category as any) || "主菜/たんぱく源",
            calories: Number(r.calories),
            protein: Number(r.protein),
            fat: Number(r.fat),
            carbs: Number(r.carbs),
            price: r.price ? Number(r.price) : undefined,
          }));
          setItems((prev) => [...parsed, ...prev]);
          alert(`商品 ${parsed.length} 件を追加しました。`);
        } catch (e) {
          alert("CSVの読み込みに失敗しました。ヘッダーと数値を確認してください。");
        }
      },
      error: () => alert("CSVの読み込みに失敗しました。"),
    });
  }

  function downloadTemplate() {
    const csv = [
      ["id", "name", "chain", "category", "calories", "protein", "fat", "carbs", "price"],
      ["ex-1", "サラダチキン プレーン", "7-Eleven", "主菜/たんぱく源", 115, 25, 1.5, 1, 268],
      ["ex-2", "おにぎり（鮭）", "Lawson", "主食", 180, 6, 2, 36, 150],
    ]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pfc_conveni_items_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // UI helpers
  function NumberInput({ label, value, onChange, step = 1, min = 0 }: { label: string; value: number; onChange: (n: number) => void; step?: number; min?: number }) {
    return (
      <label className="flex items-center gap-2 text-sm">
        <span className="w-28 text-gray-600">{label}</span>
        <input
          type="number"
          className="w-28 rounded border px-2 py-1"
          step={step}
          min={min}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      </label>
    );
  }

  const remSummary = (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
      <div className="rounded-xl border p-3"><div className="text-gray-500">残り kcal</div><div className="text-xl font-bold">{Math.round(remaining.calories)}</div></div>
      <div className="rounded-xl border p-3"><div className="text-gray-500">残り P</div><div className="text-xl font-bold">{Math.round(remaining.protein)}</div></div>
      <div className="rounded-xl border p-3"><div className="text-gray-500">残り F</div><div className="text-xl font-bold">{Math.round(remaining.fat)}</div></div>
      <div className="rounded-xl border p-3"><div className="text-gray-500">残り C</div><div className="text-xl font-bold">{Math.round(remaining.carbs)}</div></div>
      <div className="rounded-xl border p-3"><div className="text-gray-500">残りエネルギー比</div><div className="text-xs">P{Math.round(remainingPerc.p*100)}% / F{Math.round(remainingPerc.f*100)}% / C{Math.round(remainingPerc.c*100)}%</div></div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">コンビニ夕食レコメンダー（PFCギャップから自動提案）</h1>
        <div className="text-xs text-gray-500">MVP / Client-side only</div>
      </header>

      <section className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">1日の目標</h2>
          <div className="flex flex-col gap-2">
            <NumberInput label="カロリー (kcal)" value={targets.calories} onChange={(n) => setTargets({ ...targets, calories: n })} step={10} />
            <NumberInput label="たんぱく質 (g)" value={targets.protein} onChange={(n) => setTargets({ ...targets, protein: n })} step={1} />
            <NumberInput label="脂質 (g)" value={targets.fat} onChange={(n) => setTargets({ ...targets, fat: n })} step={1} />
            <NumberInput label="炭水化物 (g)" value={targets.carbs} onChange={(n) => setTargets({ ...targets, carbs: n })} step={1} />
          </div>
        </div>
        <div className="rounded-2xl border p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">昼過ぎまでの摂取</h2>
          <div className="flex flex-col gap-2">
            <NumberInput label="カロリー (kcal)" value={consumed.calories} onChange={(n) => setConsumed({ ...consumed, calories: n })} step={10} />
            <NumberInput label="たんぱく質 (g)" value={consumed.protein} onChange={(n) => setConsumed({ ...consumed, protein: n })} step={1} />
            <NumberInput label="脂質 (g)" value={consumed.fat} onChange={(n) => setConsumed({ ...consumed, fat: n })} step={1} />
            <NumberInput label="炭水化物 (g)" value={consumed.carbs} onChange={(n) => setConsumed({ ...consumed, carbs: n })} step={1} />
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">残り目標</h2>
        {remSummary}
      </section>

      <section className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border p-4 shadow-sm">
          <h3 className="mb-2 font-semibold">フィルタ</h3>
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2">
              <span className="w-24 text-gray-600">チェーン</span>
              <select className="w-40 rounded border px-2 py-1" value={chainFilter} onChange={(e) => setChainFilter(e.target.value)}>
                <option>All</option>
                <option>7-Eleven</option>
                <option>FamilyMart</option>
                <option>Lawson</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="w-24 text-gray-600">カテゴリー</span>
              <select className="w-40 rounded border px-2 py-1" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option>All</option>
                <option>主食</option>
                <option>主菜/たんぱく源</option>
                <option>サイド</option>
                <option>スープ</option>
                <option>デザート/ドリンク</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="w-24 text-gray-600">検索</span>
              <input className="flex-1 rounded border px-2 py-1" placeholder="商品名など" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <label className="flex items-center gap-2">
              <span className="w-24 text-gray-600">予算上限</span>
              <input className="w-32 rounded border px-2 py-1" type="number" min={0} placeholder="例: 800" value={budget ?? ""} onChange={(e) => setBudget(e.target.value === "" ? undefined : parseFloat(e.target.value))} />
              <span>円</span>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border p-4 shadow-sm">
          <h3 className="mb-2 font-semibold">組合せ設定</h3>
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2">
              <span className="w-32 text-gray-600">最大品数</span>
              <input className="w-24" type="range" min={1} max={4} value={maxItems} onChange={(e) => setMaxItems(parseInt(e.target.value))} />
              <span className="w-6 text-right">{maxItems}</span>
            </label>
            <label className="flex items-center gap-2">
              <span className="w-32 text-gray-600">許容オーバー</span>
              <input className="w-24" type="range" min={0} max={25} value={overshootPct} onChange={(e) => setOvershootPct(parseInt(e.target.value))} />
              <span className="w-10 text-right">{overshootPct}%</span>
            </label>
            <label className="flex items-center gap-2">
              <span className="w-32 text-gray-600">優先度</span>
              <select className="w-40 rounded border px-2 py-1" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                <option value="none">バランス</option>
                <option value="highP">高たんぱく</option>
                <option value="lowF">低脂質</option>
                <option value="lowC">低炭水化物</option>
              </select>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border p-4 shadow-sm">
          <h3 className="mb-2 font-semibold">データセット</h3>
          <p className="mb-2 text-sm text-gray-600">CSVを追加できます（UTF-8）。ヘッダー: id,name,chain,category,calories,protein,fat,carbs,price</p>
          <div className="flex items-center gap-2 mb-2">
            <input type="file" accept=".csv" onChange={(e) => e.target.files && handleCSVUpload(e.target.files[0])} />
            <button onClick={downloadTemplate} className="rounded-xl border px-3 py-1 text-sm hover:bg-gray-50">テンプレDL</button>
          </div>
          <div className="text-xs text-gray-500">現在の商品数: {items.length}</div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">おすすめ組合せ（上位20）</h2>
        {combos.length === 0 ? (
          <div className="rounded-xl border p-4 text-sm text-gray-600">条件に合う組合せが見つかりませんでした。許容オーバーや最大品数、フィルタを調整してください。</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {combos.map((c, idx) => {
              const remAfter = {
                calories: clamp(remaining.calories - c.totals.calories, -9999, 9999),
                protein: clamp(remaining.protein - c.totals.protein, -9999, 9999),
                fat: clamp(remaining.fat - c.totals.fat, -9999, 9999),
                carbs: clamp(remaining.carbs - c.totals.carbs, -9999, 9999),
              };
              return (
                <div key={idx} className="rounded-2xl border p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm text-gray-500">候補 #{idx + 1}</div>
                    <div className={`text-xs ${c.over ? "text-rose-600" : "text-emerald-600"}`}>{c.over ? "許容超過あり" : "許容内"}</div>
                  </div>
                  <ul className="mb-3 list-disc pl-5 text-sm">
                    {c.items.map((it) => (
                      <li key={it.id}>{it.name}（{it.chain} / {it.category}） — {it.calories}kcal, P{it.protein} F{it.fat} C{it.carbs}{it.price ? ` / ¥${it.price}` : ""}</li>
                    ))}
                  </ul>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl border p-2"><div className="text-gray-500">合計</div><div className="font-semibold">{Math.round(c.totals.calories)}kcal / P{Math.round(c.totals.protein)} F{Math.round(c.totals.fat)} C{Math.round(c.totals.carbs)}{c.totals.price ? ` / ¥${c.totals.price}` : ""}</div></div>
                    <div className="rounded-xl border p-2"><div className="text-gray-500">残りとのズレ</div><div className="font-semibold">Δkcal {Math.round(remAfter.calories)} / ΔP {Math.round(remAfter.protein)} / ΔF {Math.round(remAfter.fat)} / ΔC {Math.round(remAfter.carbs)}</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-lg font-semibold">単品おすすめ（比率の近い順）</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {candidatePool.slice(0, 9).map((it) => (
            <div key={it.id} className="rounded-xl border p-3 text-sm">
              <div className="font-semibold">{it.name}</div>
              <div className="text-xs text-gray-500">{it.chain} / {it.category}</div>
              <div className="mt-1">{it.calories}kcal / P{it.protein} F{it.fat} C{it.carbs}{it.price ? ` / ¥${it.price}` : ""}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-xs text-gray-500">
        栄養価は概算値です。最新の商品仕様は各コンビニの表示をご確認ください。MVPはクライアントのみで動作し、個人情報は保存しません。
      </footer>
    </div>
  );
}