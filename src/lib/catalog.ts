export type Product = { id: number; name: string; cat: string; price: number; emoji: string; promo?: number; unit: string };
export const PRODUCTS: Product[] = [
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
