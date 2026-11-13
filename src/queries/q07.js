// Propósito: top 5 de productos más vendidos, solo ventas completadas.
// Parámetros: ninguno.
// Retorno: array de hasta 5 productos con sus unidades vendidas.
// Motor: MongoDB.
import { mongo } from "../lib/conexiones.js";
import { COL, ESTADO_VENTA } from "../lib/nombres.js";

export async function q07() {
  return mongo()
    .collection(COL.VENTAS)
    .aggregate([
      { $match: { estado: ESTADO_VENTA.COMPLETADA } },
      { $unwind: "$items" },
      { $group: { _id: "$items.id_producto", unidades: { $sum: "$items.cantidad" } } },
      { $sort: { unidades: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: COL.PRODUCTOS,
          localField: "_id",
          foreignField: "_id",
          as: "producto",
        },
      },
      { $unwind: "$producto" },
      { $project: { _id: "$producto._id", nombre: "$producto.nombre", unidades: 1 } },
    ])
    .toArray();
}
