// src/controllers/CartController.ts
import { CartView } from "../views/CartView";
import { getCart, inc, dec, del, clearCart } from "../services/cart.service";
import { loadConfig } from "../services/config.service";
import { auth } from "../services/auth.service";
import { checkout } from "../services/orders.service";
import { toast } from "../core/toast";
import { router } from "../core/router";

export function CartController() {
  const mount = document.getElementById("view")!;

  // Bloquear carrito a admin
  const u = auth.user() as any;
  if (u?.role === "admin") { router.navigate("/admin"); return; }

  async function render() {
    const cart = getCart();
    const cfg = await loadConfig();

    mount.innerHTML = "";
    const view = CartView(cart, undefined, {
      isLoggedIn: () => !!auth.user(),
      taxRate: (cfg.iva ?? 0) / 100,
      requireLoginForCheckout: cfg.requireLoginForCheckout,
      onCheckout: async (currentCart) => {
        try {
          const order = await checkout(currentCart, cfg);
          clearCart();
          toast.success(`Compra realizada · ${order.code}`);
          router.navigate("/profile");
        } catch (e: any) {
          toast.error(e?.message || "No se pudo completar la compra");
        }
      },
    });

    view.addEventListener("click", (e) => {
      const t = e.target as HTMLElement;
      const act = t.getAttribute("data-act");
      const i = +(t.getAttribute("data-i") || "-1");
      if (i >= 0) {
        if (act === "inc") inc(i);
        if (act === "dec") dec(i);
        if (act === "del") del(i);
        render(); // re-pintar con estado actualizado
      }
    });

    mount.appendChild(view);
  }

  render();
}
