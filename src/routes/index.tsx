import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Super Fresco — Supermercado com entrega e Cartão Fresco" },
      { name: "description", content: "Compre online, agende a entrega, cadastre-se e ganhe descontos com o Cartão Fresco." },
      { property: "og:title", content: "Super Fresco — Supermercado online" },
      { property: "og:description", content: "Ofertas, entrega rápida e benefícios exclusivos no Cartão Fresco." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

type Product = { id: number; name: string; cat: string; price: number; emoji: string; promo?: number; unit: string };
const PRODUCTS: Product[] = [
  { id: 1, name: "Banana Prata", cat: "Hortifruti", price: 6.99, emoji: "🍌", unit: "kg", promo: 4.99 },
  { id: 2, name: "Maçã Gala", cat: "Hortifruti", price: 9.9, emoji: "🍎", unit: "kg" },
  { id: 3, name: "Tomate", cat: "Hortifruti", price: 7.49, emoji: "🍅", unit: "kg" },
  { id: 4, name: "Abacate", cat: "Hortifruti", price: 5.5, emoji: "🥑", unit: "un", promo: 3.99 },
  { id: 5, name: "Leite Integral 1L", cat: "Laticínios", price: 5.49, emoji: "🥛", unit: "un" },
  { id: 6, name: "Queijo Mussarela", cat: "Laticínios", price: 42.9, emoji: "🧀", unit: "kg", promo: 36.9 },
  { id: 7, name: "Ovos (12 un)", cat: "Laticínios", price: 13.9, emoji: "🥚", unit: "dz" },
  { id: 8, name: "Pão Francês", cat: "Padaria", price: 15.9, emoji: "🥖", unit: "kg" },
  { id: 9, name: "Croissant", cat: "Padaria", price: 6.5, emoji: "🥐", unit: "un" },
  { id: 10, name: "Picanha", cat: "Açougue", price: 79.9, emoji: "🥩", unit: "kg", promo: 69.9 },
  { id: 11, name: "Frango Inteiro", cat: "Açougue", price: 14.9, emoji: "🍗", unit: "kg" },
  { id: 12, name: "Arroz 5kg", cat: "Mercearia", price: 27.9, emoji: "🍚", unit: "un" },
  { id: 13, name: "Café 500g", cat: "Mercearia", price: 18.9, emoji: "☕", unit: "un", promo: 15.9 },
  { id: 14, name: "Suco de Laranja", cat: "Bebidas", price: 9.9, emoji: "🧃", unit: "un" },
  { id: 15, name: "Água Mineral 1,5L", cat: "Bebidas", price: 2.99, emoji: "💧", unit: "un" },
  { id: 16, name: "Chocolate 90g", cat: "Mercearia", price: 6.9, emoji: "🍫", unit: "un" },
];
const CATS = ["Todos", "Ofertas", ...Array.from(new Set(PRODUCTS.map((p) => p.cat)))];

const TIERS = [
  { name: "Bronze", min: 0, discount: 0.03, cashback: 0.01, freeShip: 200 },
  { name: "Prata", min: 500, discount: 0.05, cashback: 0.02, freeShip: 120 },
  { name: "Ouro", min: 1500, discount: 0.08, cashback: 0.03, freeShip: 0 },
];
const DELIVERY = [
  { id: "express", label: "Expressa", desc: "Em até 1 hora", fee: 14.9 },
  { id: "agendada", label: "Agendada", desc: "Escolha dia e horário", fee: 7.9 },
  { id: "retirada", label: "Retirar na loja", desc: "Pronto em 30 min", fee: 0 },
];
const SLOTS = ["08h–10h", "10h–12h", "14h–16h", "16h–18h", "18h–20h"];

type Customer = { name: string; cpf: string; email: string; phone: string; cep: string; address: string; spent: number; points: number };
type Order = { id: string; date: string; total: number; delivery: string; slot?: string; status: string; items: number };

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
function useStored<T>(key: string, init: T) {
  const [v, setV] = useState<T>(init);
  useEffect(() => { const s = localStorage.getItem(key); if (s) setV(JSON.parse(s)); }, [key]);
  const set = (x: T) => { setV(x); localStorage.setItem(key, JSON.stringify(x)); };
  return [v, set] as const;
}
const tierOf = (spent: number): (typeof TIERS)[number] => [...TIERS].reverse().find((t) => spent >= t.min) ?? TIERS[0]!;

type Tab = "loja" | "carrinho" | "cartao" | "cadastro" | "pedidos";

function App() {
  const [tab, setTab] = useState<Tab>("loja");
  const [cart, setCart] = useStored<Record<number, number>>("sf-cart", {});
  const [customer, setCustomer] = useStored<Customer | null>("sf-customer", null);
  const [orders, setOrders] = useStored<Order[]>("sf-orders", []);
  const [toast, setToast] = useState("");
  const count = Object.values(cart).reduce((a, b) => a + b, 0);

  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2500); };
  const add = (id: number, d = 1) => {
    const q = (cart[id] || 0) + d;
    const n = { ...cart }; if (q <= 0) delete n[id]; else n[id] = q; setCart(n);
  };

  const nav: [Tab, string][] = [["loja", "Loja"], ["carrinho", `Carrinho (${count})`], ["cartao", "Cartão Fresco"], ["pedidos", "Entregas"], ["cadastro", customer ? "Minha conta" : "Cadastrar"]];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <button onClick={() => setTab("loja")} className="font-display text-2xl font-extrabold text-primary">🥬 Super Fresco</button>
          <nav className="flex flex-wrap gap-1">
            {nav.map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === k ? "bg-primary text-primary-foreground shadow-pop" : "hover:bg-secondary"}`}>{l}</button>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {tab === "loja" && <Store cart={cart} add={add} customer={customer} go={setTab} />}
        {tab === "carrinho" && <Cart cart={cart} add={add} customer={customer} go={setTab} onOrder={(o, spent) => {
          setOrders([o, ...orders]); setCart({});
          if (customer) setCustomer({ ...customer, spent: customer.spent + spent, points: customer.points + Math.floor(spent) });
          notify("Pedido confirmado! 🎉"); setTab("pedidos");
        }} />}
        {tab === "cartao" && <Loyalty customer={customer} go={setTab} />}
        {tab === "cadastro" && <Register customer={customer} onSave={(c) => { setCustomer(c); notify(customer ? "Dados atualizados" : "Cadastro concluído! Cartão Fresco ativado 💳"); }} onLogout={() => setCustomer(null)} />}
        {tab === "pedidos" && <Orders orders={orders} advance={(id) => setOrders(orders.map((o) => o.id === id ? { ...o, status: next(o.status) } : o))} />}
      </main>
      {toast && <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full bg-foreground px-6 py-3 font-semibold text-background shadow-pop animate-in fade-in slide-in-from-bottom-4">{toast}</div>}
    </div>
  );
}

const STATUS = ["Recebido", "Separando", "Saiu para entrega", "Entregue"];
const next = (s: string) => STATUS[Math.min(STATUS.indexOf(s) + 1, STATUS.length - 1)];

function Store({ cart, add, customer, go }: { cart: Record<number, number>; add: (id: number, d?: number) => void; customer: Customer | null; go: (t: Tab) => void }) {
  const [cat, setCat] = useState("Todos");
  const [q, setQ] = useState("");
  const list = PRODUCTS.filter((p) => (cat === "Todos" || (cat === "Ofertas" ? p.promo : p.cat === cat)) && p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <section className="bg-hero mb-8 grid gap-6 overflow-hidden rounded-2xl p-8 text-primary-foreground md:grid-cols-[1.5fr_1fr] md:p-12">
        <div>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase text-accent-foreground">Ofertas da semana</span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">Feira fresquinha na sua porta em até 1 hora.</h1>
          <p className="mt-3 opacity-90">{customer ? `Olá, ${customer.name.split(" ")[0]}! Seu desconto ${tierOf(customer.spent).name} já está aplicado.` : "Cadastre-se e ganhe desconto imediato com o Cartão Fresco."}</p>
          {!customer && <button onClick={() => go("cadastro")} className="mt-5 rounded-full bg-accent px-6 py-3 font-bold text-accent-foreground transition hover:scale-105">Criar meu cadastro</button>}
        </div>
        <div className="flex items-center justify-center text-8xl md:text-9xl">🛒</div>
      </section>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-4 py-1.5 text-sm font-medium ${cat === c ? "border-primary bg-secondary text-secondary-foreground" : "bg-card"} ${c === "Ofertas" ? "text-highlight" : ""}`}>{c === "Ofertas" ? "🔥 Ofertas" : c}</button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto..." className="ml-auto w-full rounded-full border bg-card px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-64" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((p) => (
          <div key={p.id} className="group relative rounded-2xl border bg-card p-4 transition hover:-translate-y-1 hover:shadow-pop">
            {p.promo && <span className="absolute right-3 top-3 rounded-full bg-highlight px-2 py-0.5 text-xs font-bold text-highlight-foreground">-{Math.round((1 - p.promo / p.price) * 100)}%</span>}
            <div className="mb-3 flex h-24 items-center justify-center rounded-xl bg-muted text-6xl transition group-hover:scale-110">{p.emoji}</div>
            <p className="text-xs text-muted-foreground">{p.cat}</p>
            <h3 className="font-semibold">{p.name}</h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-bold text-primary">{brl(p.promo ?? p.price)}</span>
              {p.promo && <span className="text-xs text-muted-foreground line-through">{brl(p.price)}</span>}
              <span className="text-xs text-muted-foreground">/{p.unit}</span>
            </div>
            {cart[p.id] ? (
              <div className="mt-3 flex items-center justify-between rounded-full bg-secondary p-1">
                <button onClick={() => add(p.id, -1)} className="h-8 w-8 rounded-full bg-card font-bold">−</button>
                <span className="font-bold">{cart[p.id]}</span>
                <button onClick={() => add(p.id)} className="h-8 w-8 rounded-full bg-primary font-bold text-primary-foreground">+</button>
              </div>
            ) : (
              <button onClick={() => add(p.id)} className="mt-3 w-full rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Adicionar</button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function Cart({ cart, add, customer, go, onOrder }: { cart: Record<number, number>; add: (id: number, d?: number) => void; customer: Customer | null; go: (t: Tab) => void; onOrder: (o: Order, spent: number) => void }) {
  const [delivery, setDelivery] = useState("express");
  const [slot, setSlot] = useState(SLOTS[0]);
  const [date, setDate] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const items = PRODUCTS.filter((p) => cart[p.id]);
  const tier = customer ? tierOf(customer.spent) : null;
  const t = useMemo(() => {
    const subtotal = items.reduce((s, p) => s + (p.promo ?? p.price) * cart[p.id], 0);
    const discount = tier ? subtotal * tier.discount : 0;
    const d = DELIVERY.find((x) => x.id === delivery)!;
    const fee = tier && d.fee > 0 && subtotal >= tier.freeShip ? 0 : d.fee;
    const points = usePoints && customer ? Math.min(customer.points / 10, subtotal - discount) : 0;
    return { subtotal, discount, fee, points, total: subtotal - discount - points + fee };
  }, [items, cart, tier, delivery, usePoints, customer]);

  if (!items.length) return (
    <div className="rounded-2xl border bg-card p-12 text-center"><div className="text-6xl">🧺</div><h2 className="mt-4 text-2xl font-bold">Seu carrinho está vazio</h2>
      <button onClick={() => go("loja")} className="mt-4 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Ir às compras</button></div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 text-xl font-bold">Itens</h2>
          {items.map((p) => (
            <div key={p.id} className="flex items-center gap-3 border-b py-3 last:border-0">
              <span className="text-3xl">{p.emoji}</span>
              <div className="flex-1"><p className="font-medium">{p.name}</p><p className="text-sm text-muted-foreground">{brl(p.promo ?? p.price)} /{p.unit}</p></div>
              <div className="flex items-center gap-2"><button onClick={() => add(p.id, -1)} className="h-7 w-7 rounded-full bg-secondary">−</button><span className="w-5 text-center font-bold">{cart[p.id]}</span><button onClick={() => add(p.id)} className="h-7 w-7 rounded-full bg-secondary">+</button></div>
              <span className="w-24 text-right font-semibold">{brl((p.promo ?? p.price) * cart[p.id])}</span>
            </div>
          ))}
        </section>
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 text-xl font-bold">🚚 Entrega</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {DELIVERY.map((d) => (
              <button key={d.id} onClick={() => setDelivery(d.id)} className={`rounded-xl border-2 p-4 text-left transition ${delivery === d.id ? "border-primary bg-secondary" : "border-border"}`}>
                <p className="font-bold">{d.label}</p><p className="text-xs text-muted-foreground">{d.desc}</p><p className="mt-2 font-semibold text-primary">{d.fee ? brl(d.fee) : "Grátis"}</p>
              </button>
            ))}
          </div>
          {delivery === "agendada" && (
            <div className="mt-4 space-y-3">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border bg-background px-3 py-2" />
              <div className="flex flex-wrap gap-2">{SLOTS.map((s) => <button key={s} onClick={() => setSlot(s)} className={`rounded-full px-3 py-1.5 text-sm ${slot === s ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{s}</button>)}</div>
            </div>
          )}
          <p className="mt-4 text-sm text-muted-foreground">📍 {customer ? `${customer.address} — CEP ${customer.cep}` : "Faça seu cadastro para informar o endereço de entrega."}</p>
        </section>
      </div>
      <aside className="h-fit space-y-4 rounded-2xl border bg-card p-5 lg:sticky lg:top-24">
        <h2 className="text-xl font-bold">Resumo</h2>
        {tier ? (
          <div className="bg-loyalty rounded-xl p-4 text-primary-foreground">
            <p className="text-xs uppercase opacity-80">Cartão Fresco {tier.name}</p>
            <p className="font-bold">{tier.discount * 100}% off + {tier.cashback * 100}% em pontos</p>
            {customer!.points >= 10 && <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />Usar {customer!.points} pontos ({brl(customer!.points / 10)})</label>}
          </div>
        ) : (
          <button onClick={() => go("cadastro")} className="w-full rounded-xl border-2 border-dashed border-accent bg-accent/20 p-3 text-sm font-semibold">💳 Cadastre-se e ganhe até 8% de desconto</button>
        )}
        <Row l="Subtotal" v={brl(t.subtotal)} />
        {t.discount > 0 && <Row l="Desconto Cartão" v={`− ${brl(t.discount)}`} hl />}
        {t.points > 0 && <Row l="Pontos" v={`− ${brl(t.points)}`} hl />}
        <Row l="Entrega" v={t.fee ? brl(t.fee) : "Grátis"} />
        <div className="flex justify-between border-t pt-3 text-xl font-extrabold"><span>Total</span><span className="text-primary">{brl(t.total)}</span></div>
        <button disabled={!customer || (delivery === "agendada" && !date)} onClick={() => onOrder({
          id: Math.random().toString(36).slice(2, 8).toUpperCase(), date: new Date().toLocaleString("pt-BR"), total: t.total,
          delivery: DELIVERY.find((d) => d.id === delivery)!.label, slot: delivery === "agendada" ? `${date.split("-").reverse().join("/")} ${slot}` : undefined,
          status: "Recebido", items: items.reduce((s, p) => s + cart[p.id], 0),
        }, t.total)} className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground shadow-pop disabled:opacity-40">
          {customer ? "Finalizar pedido" : "Cadastre-se para finalizar"}
        </button>
      </aside>
    </div>
  );
}
const Row = ({ l, v, hl }: { l: string; v: string; hl?: boolean }) => <div className={`flex justify-between text-sm ${hl ? "font-semibold text-primary" : ""}`}><span>{l}</span><span>{v}</span></div>;

function Loyalty({ customer, go }: { customer: Customer | null; go: (t: Tab) => void }) {
  const tier = customer ? tierOf(customer.spent) : TIERS[0]!;
  const nextT = TIERS[TIERS.indexOf(tier) + 1];
  return (
    <div className="space-y-8">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div className="bg-loyalty relative aspect-[1.6] rounded-2xl p-6 text-primary-foreground shadow-pop">
          <p className="font-display text-xl font-bold">🥬 Cartão Fresco</p>
          <p className="absolute right-6 top-6 rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">{tier.name}</p>
          <p className="absolute bottom-16 left-6 font-mono text-lg tracking-widest">•••• •••• •••• {customer ? customer.cpf.replace(/\D/g, "").slice(-4) || "0000" : "0000"}</p>
          <p className="absolute bottom-6 left-6 font-semibold uppercase">{customer?.name || "Seu nome aqui"}</p>
          <p className="absolute bottom-6 right-6 text-right text-sm">{customer?.points ?? 0} pts</p>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold">Benefícios que crescem com você</h1>
          {customer ? (
            <>
              <p className="mt-3 text-muted-foreground">Você já comprou {brl(customer.spent)}. {nextT ? `Faltam ${brl(nextT.min - customer.spent)} para o nível ${nextT.name}.` : "Você está no nível máximo! 🏆"}</p>
              {nextT && <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.min(100, ((customer.spent - tier.min) / (nextT.min - tier.min)) * 100)}%` }} /></div>}
            </>
          ) : (
            <><p className="mt-3 text-muted-foreground">Cadastro gratuito, sem anuidade. Desconto aplicado automaticamente no carrinho.</p>
              <button onClick={() => go("cadastro")} className="mt-5 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground">Quero meu cartão</button></>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {TIERS.map((t) => (
          <div key={t.name} className={`rounded-2xl border-2 bg-card p-6 ${t === tier && customer ? "border-primary shadow-pop" : ""}`}>
            <h3 className="text-2xl font-bold">{t.name}</h3>
            <p className="text-sm text-muted-foreground">{t.min ? `A partir de ${brl(t.min)} em compras` : "Ao se cadastrar"}</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>✅ {t.discount * 100}% de desconto em todas as compras</li>
              <li>✅ {t.cashback * 100}% de volta em pontos (10 pts = R$ 1)</li>
              <li>✅ {t.freeShip ? `Frete grátis acima de ${brl(t.freeShip)}` : "Frete grátis sempre"}</li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function Register({ customer, onSave, onLogout }: { customer: Customer | null; onSave: (c: Customer) => void; onLogout: () => void }) {
  const [f, setF] = useState({ name: "", cpf: "", email: "", phone: "", cep: "", address: "" });
  const [err, setErr] = useState("");
  useEffect(() => { if (customer) setF(customer); }, [customer]);
  const fields: [keyof typeof f, string, string][] = [["name", "Nome completo", "Maria Silva"], ["cpf", "CPF", "000.000.000-00"], ["email", "E-mail", "maria@email.com"], ["phone", "Celular", "(11) 99999-9999"], ["cep", "CEP", "00000-000"], ["address", "Endereço de entrega", "Rua, número, bairro"]];
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(f).some((v) => !v.trim())) return setErr("Preencha todos os campos.");
    if (f.cpf.replace(/\D/g, "").length !== 11) return setErr("CPF deve ter 11 dígitos.");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr("E-mail inválido.");
    setErr(""); onSave({ ...f, spent: customer?.spent ?? 0, points: customer?.points ?? 50 });
  };
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-8">
      <h1 className="text-3xl font-extrabold">{customer ? "Minha conta" : "Cadastro do cliente"}</h1>
      <p className="mt-1 text-muted-foreground">{customer ? `Nível ${tierOf(customer.spent).name} • ${customer.points} pontos` : "Ganhe 50 pontos de boas-vindas e ative o Cartão Fresco."}</p>
      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        {fields.map(([k, l, ph]) => (
          <label key={k} className={k === "address" || k === "name" ? "sm:col-span-2" : ""}>
            <span className="text-sm font-semibold">{l}</span>
            <input value={f[k]} placeholder={ph} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
          </label>
        ))}
        {err && <p className="text-sm font-semibold text-destructive sm:col-span-2">{err}</p>}
        <button className="rounded-full bg-primary py-3 font-bold text-primary-foreground shadow-pop sm:col-span-2">{customer ? "Salvar alterações" : "Criar cadastro"}</button>
        {customer && <button type="button" onClick={onLogout} className="text-sm text-muted-foreground underline sm:col-span-2">Sair da conta</button>}
      </form>
    </div>
  );
}

function Orders({ orders, advance }: { orders: Order[]; advance: (id: string) => void }) {
  if (!orders.length) return <div className="rounded-2xl border bg-card p-12 text-center"><div className="text-6xl">📦</div><h2 className="mt-4 text-2xl font-bold">Nenhuma entrega ainda</h2></div>;
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Acompanhar entregas</h1>
      {orders.map((o) => {
        const i = STATUS.indexOf(o.status);
        return (
          <div key={o.id} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <div><p className="font-bold">Pedido #{o.id}</p><p className="text-sm text-muted-foreground">{o.date} • {o.items} itens • {o.delivery}{o.slot ? ` (${o.slot})` : ""}</p></div>
              <p className="text-xl font-bold text-primary">{brl(o.total)}</p>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {STATUS.map((s, k) => (
                <div key={s}><div className={`h-2 rounded-full ${k <= i ? "bg-primary" : "bg-muted"}`} /><p className={`mt-1 text-xs ${k <= i ? "font-semibold" : "text-muted-foreground"}`}>{s}</p></div>
              ))}
            </div>
            {i < 3 && <button onClick={() => advance(o.id)} className="mt-3 text-sm font-semibold text-primary underline">Atualizar status (simulação)</button>}
          </div>
        );
      })}
    </div>
  );
}
