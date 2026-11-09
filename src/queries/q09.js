// Propósito: ventas libres con total menor a $5.000, sin anuladas.
// Parámetros: ninguno.
// Retorno: array de ventas ordenadas por id, con sus ítems.
// Motor: MongoDB.
import { mongo } from "../lib/conexiones.js";
import { COL, ESTADO_VENTA, TIPO_VENTA } from "../lib/nombres.js";

export async function q09() {
  return mongo()
    .collection(COL.VENTAS)
    .find({
      tipo: TIPO_VENTA.LIBRE,
      total: { $lt: 5000 },
      estado: { $ne: ESTADO_VENTA.ANULADA },
    })
    .sort({ _id: 1 })
    .toArray();
}
