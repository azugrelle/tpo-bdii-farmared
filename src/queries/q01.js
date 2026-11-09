// Propósito: productos activos con todos los datos de su proveedor.
// Parámetros: ninguno.
// Retorno: array de productos ordenados por id, cada uno con sus datos en el campo proveedor.
// Motor: MongoDB.
import { mongo } from "../lib/conexiones.js";
import { COL } from "../lib/nombres.js";

export async function q01() {
  return mongo()
    .collection(COL.PRODUCTOS)
    .aggregate([
      { $match: { activo: true } },
      {
        $lookup: {
          from: COL.PROVEEDORES,
          localField: "id_proveedor",
          foreignField: "_id",
          as: "proveedor",
        },
      },
      { $unwind: "$proveedor" },
      { $sort: { _id: 1 } },
    ])
    .toArray();
}
