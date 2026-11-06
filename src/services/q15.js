// Propósito: descontar el stock de una venta registrada con FEFO, sin usar lotes vencidos. Si no alcanza, no cambia ningún lote.
// Parámetros: idVenta, el id de la venta.
// Retorno: { ok: true, ... } o { ok: false, motivo }.
// Motor: Redis para el stock y MongoDB para la venta.
export async function q15(idVenta) {
  throw new Error("q15 sin implementar");
}
