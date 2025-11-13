// src/services/cart.service.ts
import type {
  CartItem,
  SearchResult,
  Hotel,
  Car,
  Flight,
  Restaurant,
} from "../models/types";

const KEY = "cart";

export function getCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCart(cart: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent("cart:updated"));
}

// Transforma cualquier SearchResult en un CartItem
export function toCartItem(r: SearchResult): CartItem {
  switch (r.kind) {
    case "hotel": {
      const h = r.item as Hotel;
      return {
        kind: "hotel",
        id: h.id,
        title: h.name,
        subtitle: h.city,
        qty: 1,
        price: h.price,
        photo: h.photo,
      };
    }
    case "car": {
      const c = r.item as Car;
      return {
        kind: "car",
        id: c.id,
        title: `${c.brand} ${c.model}`,
        subtitle: c.city, 
        qty: 1,
        price: c.pricePerDay,
        photo: c.photo,
      };
    }
    case "flight": {
      const f = r.item as Flight;
      return {
        kind: "flight",
        id: f.id,
        title: `${f.from} → ${f.to}`,
        subtitle: f.airline,
        qty: 1,
        price: f.price,
        photo: "/assets/flight.jpg",
      };
    }
    case "restaurant": {
      const res = r.item as Restaurant;
      return {
        kind: "restaurant",
        id: res.id,
        title: res.name,
        subtitle: res.city,
        qty: 1,
        price: res.pricePerPerson,
        photo: res.photo,
      };
    }
    default: {
      // Fallback defensivo por si llega un tipo desconocido
      const anyItem = r.item as any;
      return {
        kind: r.kind as any,
        id: anyItem?.id ?? String(Date.now()),
        title: anyItem?.name ?? "Item",
        qty: 1,
        price: Number(anyItem?.price ?? 0),
        photo: anyItem?.photo,
      };
    }
  }
}

export function addFromResult(r: SearchResult) {
  const cart = getCart();
  const id = (r.item as any).id;
  const found = cart.find((it) => it.kind === r.kind && it.id === id);
  if (found) {
    found.qty += 1;
  } else {
    cart.push(toCartItem(r));
  }
  saveCart(cart);
}

export function inc(i: number) {
  const c = getCart();
  if (c[i]) c[i].qty++;
  saveCart(c);
}

export function dec(i: number) {
  const c = getCart();
  if (c[i]) c[i].qty = Math.max(1, c[i].qty - 1);
  saveCart(c);
}

export function del(i: number) {
  const c = getCart();
  c.splice(i, 1);
  saveCart(c);
}
export function clearCart() {
  localStorage.removeItem("cart");
  window.dispatchEvent(new Event("cart:updated"));
}
