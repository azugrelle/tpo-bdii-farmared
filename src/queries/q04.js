// Propósito: clientes con más de una receta registrada.
// Parámetros: ninguno.
// Retorno: array de clientes con nombre, apellido, dni y cantidad de recetas, de mayor a menor cantidad.
// Motor: MongoDB.
import { mongo } from "../lib/conexiones.js";
import { COL } from "../lib/nombres.js";

export async function q04() {
  return mongo()
    .collection(COL.RECETAS)
    .aggregate([
      { $group: { _id: "$id_cliente", cantidad_recetas: { $sum: 1 } } },
      { $match: { cantidad_recetas: { $gt: 1 } } },
      {
        $lookup: {
          from: COL.CLIENTES,
          localField: "_id",
          foreignField: "_id",
          as: "cliente",
        },
      },
      { $unwind: "$cliente" },
      {
        $project: {
          nombre: "$cliente.nombre",
          apellido: "$cliente.apellido",
          dni: "$cliente.dni",
          cantidad_recetas: 1,
        },
      },
      { $sort: { cantidad_recetas: -1, _id: 1 } },
    ])
    .toArray();
}

