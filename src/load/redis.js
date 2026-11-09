import { redis } from "../lib/conexiones.js";
import { leerDataset } from "../lib/datasets.js";
import { aAAAAMMDD, aISO, resolverFecha } from "../lib/fechas.js";
import { clave, SEQ_INICIAL } from "../lib/nombres.js";

const OBLIGATORIOS = ["id_lote", "id_producto", "id_sucursal", "nro_lote", "vencimiento"];
const SECUENCIAS = ["cliente", "venta", "detalle"];

function aEntero(campo, valor) {
  if (!/^\d+$/.test(valor)) throw new Error(`${campo} no es un entero: "${valor}"`);
  return Number(valor);
}

function aLote(fila) {
  const vacio = OBLIGATORIOS.find((campo) => !fila[campo]);
  if (vacio) throw new Error(`${vacio} está vacío`);

  return {
    id_lote: fila.id_lote,
    id_producto: fila.id_producto,
    id_sucursal: fila.id_sucursal,
    nro_lote: fila.nro_lote,
    unidades: aEntero("unidades", fila.unidades),
    vencimiento: resolverFecha(fila.vencimiento),
  };
}

function leerLotes() {
  const ids = new Set();
  return leerDataset("stock_lotes").map((fila) => {
    try {
      const lote = aLote(fila);
      if (ids.has(lote.id_lote)) throw new Error("id_lote repetido");
      ids.add(lote.id_lote);
      return lote;
    } catch (error) {
      throw new Error(`stock_lotes ${fila.id_lote}: ${error.message}`);
    }
  });
}

export async function cargarRedis() {
  const lotes = leerLotes();
  const clavesFefo = new Set(lotes.map((lote) => clave.fefo(lote.id_producto, lote.id_sucursal)));
  const clavesLote = lotes.map((lote) => clave.lote(lote.id_lote));

  const transaccion = redis().multi();
  transaccion.del(clave.stockUnidades, ...clavesFefo, ...clavesLote);

  for (const lote of lotes) {
    transaccion.hset(clave.lote(lote.id_lote), {
      id_producto: lote.id_producto,
      id_sucursal: lote.id_sucursal,
      nro_lote: lote.nro_lote,
      unidades: lote.unidades,
      vencimiento: aISO(lote.vencimiento),
    });
    transaccion.zadd(
      clave.fefo(lote.id_producto, lote.id_sucursal),
      aAAAAMMDD(lote.vencimiento),
      lote.id_lote,
    );
    transaccion.zadd(clave.stockUnidades, lote.unidades, lote.id_lote);
  }

  for (const tipo of SECUENCIAS) {
    transaccion.set(clave.seq(tipo), SEQ_INICIAL);
  }

  const resultados = await transaccion.exec();
  const fallo = resultados.find(([error]) => error);
  if (fallo) throw fallo[0];

  console.log(`lotes: ${lotes.length}`);
}
