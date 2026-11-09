// Propósito: clientes atendidos en una sucursal, por el farmacéutico que registró la venta, esté activo o no.
// Parámetros: idSucursal, el id de la sucursal.
// Retorno: array de clientes ordenados por id. Cuenta ventas de cualquier estado.
// Motor: MongoDB.
import { mongo } from "../lib/conexiones.js";
import { COL } from "../lib/nombres.js";

export async function q10(idSucursal) {
  const db = mongo();
  const farmaceuticos = await db
    .collection(COL.FARMACEUTICOS)
    .distinct("_id", { id_sucursal: idSucursal });
  const idsClientes = await db
    .collection(COL.VENTAS)
    .distinct("id_cliente", { id_farmaceutico: { $in: farmaceuticos } });

  return db
    .collection(COL.CLIENTES)
    .find({ _id: { $in: idsClientes } })
    .sort({ _id: 1 })
    .toArray();
}

