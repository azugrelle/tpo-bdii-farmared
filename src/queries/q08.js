// Propósito: lotes con menos de 50 unidades, con su producto, su sucursal y el proveedor del producto. Incluye lotes vencidos y de la droguería.
// Parámetros: ninguno.
// Retorno: array de lotes ordenados por id, cada uno con producto, sucursal y proveedor.
// Motor: Redis para los lotes y MongoDB para producto, sucursal y proveedor. Se combinan en la aplicación.
import { mongo, redis } from "../lib/conexiones.js";
import { clave, COL } from "../lib/nombres.js";

const LIMITE = 50;

async function buscarPorId(coleccion, ids, proyeccion) {
  const documentos = await mongo()
    .collection(coleccion)
    .find({ _id: { $in: [...new Set(ids)] } }, { projection: proyeccion })
    .toArray();
  return new Map(documentos.map((documento) => [documento._id, documento]));
}

export async function q08() {
  const idsLote = await redis().zrangebyscore(clave.stockUnidades, "-inf", `(${LIMITE}`);
  const lotes = await Promise.all(idsLote.map((idLote) => redis().hgetall(clave.lote(idLote))));

  const productos = await buscarPorId(
    COL.PRODUCTOS,
    lotes.map((lote) => lote.id_producto),
    { nombre: 1, id_proveedor: 1 },
  );
  const sucursales = await buscarPorId(
    COL.SUCURSALES,
    lotes.map((lote) => lote.id_sucursal),
    { nombre: 1, tipo: 1 },
  );
  const proveedores = await buscarPorId(
    COL.PROVEEDORES,
    [...productos.values()].map((producto) => producto.id_proveedor),
    { razon_social: 1 },
  );

  return idsLote
    .map((idLote, i) => {
      const lote = lotes[i];
      const producto = productos.get(lote.id_producto);
      return {
        id_lote: idLote,
        nro_lote: lote.nro_lote,
        unidades: Number(lote.unidades),
        vencimiento: lote.vencimiento,
        producto: producto ? { _id: producto._id, nombre: producto.nombre } : null,
        sucursal: sucursales.get(lote.id_sucursal) ?? null,
        proveedor: (producto && proveedores.get(producto.id_proveedor)) ?? null,
      };
    })
    .sort((a, b) => a.id_lote.localeCompare(b.id_lote));
}
