// Propósito: descontar el stock de una venta completada, con FEFO y sin usar lotes vencidos, en la sucursal de su farmacéutico. Si algún producto no alcanza, no cambia ningún lote.
// Parámetros: idVenta, el id de la venta.
// Retorno: { ok: true, id_venta, id_sucursal, movimientos } o { ok: false, motivo }, con id_producto si falta stock.
// Motor: Redis para el stock y MongoDB para la venta y el farmacéutico.
import { mongo } from "../lib/conexiones.js";
import { COL, ESTADO_VENTA } from "../lib/nombres.js";
import { descontarStock, revertirStock } from "../stock/stock.js";

async function marcarDescontada(idVenta) {
  const { matchedCount } = await mongo()
    .collection(COL.VENTAS)
    .updateOne({ _id: idVenta, stock_descontado: false }, { $set: { stock_descontado: true } });
  return matchedCount === 1;
}

export async function q15(idVenta) {
  const venta = await mongo().collection(COL.VENTAS).findOne({ _id: idVenta });
  if (!venta) return { ok: false, motivo: "venta_inexistente" };
  if (venta.estado !== ESTADO_VENTA.COMPLETADA) return { ok: false, motivo: "venta_no_completada" };
  if (venta.stock_descontado) return { ok: false, motivo: "stock_ya_descontado" };

  const farmaceutico = await mongo()
    .collection(COL.FARMACEUTICOS)
    .findOne({ _id: venta.id_farmaceutico });
  if (!farmaceutico) return { ok: false, motivo: "farmaceutico_inexistente" };

  const descuento = await descontarStock(farmaceutico.id_sucursal, venta.items);
  if (!descuento.ok) return descuento;

  const marcada = await marcarDescontada(idVenta).catch(async (error) => {
    await revertirStock(descuento.movimientos);
    throw error;
  });
  if (!marcada) {
    await revertirStock(descuento.movimientos);
    return { ok: false, motivo: "stock_ya_descontado" };
  }

  return {
    ok: true,
    id_venta: idVenta,
    id_sucursal: farmaceutico.id_sucursal,
    movimientos: descuento.movimientos,
  };
}
