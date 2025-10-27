import { AdminConfigView } from "../views/AdminConfigView.ts";
import { getConfig, saveConfig } from "../services/config.service";
import { toast } from "../core/toast";

export async function AdminConfigController() {
  const mount = document.getElementById("view")!;
  mount.innerHTML = "";

  try {
    const cfg = await getConfig();
    mount.appendChild(
      AdminConfigView(cfg, async (newCfg) => {
        try {
          await saveConfig(newCfg);
          toast.success("Configuración guardada");
        } catch (e: any) {
          toast.error(e.message || "No se pudo guardar");
        }
      })
    );
  } catch (e: any) {
    mount.innerHTML = `<div class="alert alert-danger">No se pudo cargar la configuración: ${e.message || ""}</div>`;
  }
}
