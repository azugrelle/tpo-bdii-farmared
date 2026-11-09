import { cerrarConexionRedis, nuevaConexionRedis } from "../lib/conexiones.js";
import { aAAAAMMDD, hoy } from "../lib/fechas.js";
import { clave } from "../lib/nombres.js";

const INTENTOS = 5;

function sumarPorProducto(items) {
  const cantidades = new Map();
  for (const { id_producto, cantidad } of items) {
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new Error(`Cantidad inválida para ${id_producto}: ${cantidad}`);
    }
    cantidades.set(id_producto, (cantidades.get(id_producto) ?? 0) + cantidad);
  }
  return cantidades;
}

async function lotesVigentes(conexion, idSucursal, idsProducto) {
  const desde = aAAAAMMDD(hoy());
  const lotes = await Promise.all(
    idsProducto.map((idProducto) =>
      conexion.zrangebyscore(clave.fefo(idProducto, idSucursal), desde, "+inf"),
    ),
  );
  return new Map(idsProducto.map((idProducto, i) => [idProducto, lotes[i]]));
}

async function leerUnidades(conexion, idsLote) {
  const valores = await Promise.all(
    idsLote.map((idLote) => conexion.hget(clave.lote(idLote), "unidades")),
  );
  return new Map(idsLote.map((idLote, i) => [idLote, Number(valores[i])]));
}

function armarPlan(cantidades, lotesPorProducto, unidades) {
  const movimientos = [];
  for (const [idProducto, cantidad] of cantidades) {
    let faltan = cantidad;
    for (const idLote of lotesPorProducto.get(idProducto)) {
      const tomar = Math.min(faltan, unidades.get(idLote));
      if (tomar > 0) {
        movimientos.push({ id_lote: idLote, id_producto: idProducto, cantidad: tomar });
        faltan -= tomar;
      }
    }
    if (faltan > 0) return { faltante: idProducto };
  }
  return { movimientos };
}

async function intentarDescuento(conexion, idSucursal, cantidades) {
  const lotesPorProducto = await lotesVigentes(conexion, idSucursal, [...cantidades.keys()]);
  const idsLote = [...lotesPorProducto.values()].flat();

  if (idsLote.length > 0) await conexion.watch(...idsLote.map(clave.lote));
  const unidades = await leerUnidades(conexion, idsLote);

  const plan = armarPlan(cantidades, lotesPorProducto, unidades);
  if (plan.faltante) {
    return { ok: false, motivo: "stock_insuficiente", id_producto: plan.faltante };
  }

  const transaccion = conexion.multi();
  for (const { id_lote, cantidad } of plan.movimientos) {
    transaccion.hincrby(clave.lote(id_lote), "unidades", -cantidad);
    transaccion.zincrby(clave.stockUnidades, -cantidad, id_lote);
  }

  const resultados = await transaccion.exec();
  if (resultados === null) return null;

  const fallo = resultados.find(([error]) => error);
  if (fallo) throw fallo[0];

  return { ok: true, movimientos: plan.movimientos };
}

export async function descontarStock(idSucursal, items) {
  const cantidades = sumarPorProducto(items);
  const conexion = nuevaConexionRedis();

  try {
    for (let intento = 0; intento < INTENTOS; intento++) {
      const resultado = await intentarDescuento(conexion, idSucursal, cantidades);
      if (resultado) return resultado;
    }
    return { ok: false, motivo: "conflicto_concurrencia" };
  } finally {
    await cerrarConexionRedis(conexion);
  }
}
