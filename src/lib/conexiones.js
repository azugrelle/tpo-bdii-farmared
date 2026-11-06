import { MongoClient } from "mongodb";
import { Redis } from "ioredis";
import { BASE } from "./nombres.js";

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let clienteMongo = null;
let clienteRedis = null;
const conexionesRedis = new Set();

export function mongo() {
  clienteMongo ??= new MongoClient(MONGO_URL);
  return clienteMongo.db(BASE);
}

export function redis() {
  clienteRedis ??= nuevaConexionRedis();
  return clienteRedis;
}

export function nuevaConexionRedis() {
  const conexion = new Redis(REDIS_URL);
  conexionesRedis.add(conexion);
  return conexion;
}

export async function cerrarConexionRedis(conexion) {
  if (!conexionesRedis.delete(conexion)) return;
  if (conexion === clienteRedis) clienteRedis = null;

  if (conexion.status === "ready") await conexion.quit();
  else conexion.disconnect();
}

export async function cerrarConexiones() {
  const cliente = clienteMongo;
  clienteMongo = null;

  await Promise.all([cliente?.close(), ...[...conexionesRedis].map(cerrarConexionRedis)]);
}
