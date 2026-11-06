import { cerrarConexiones } from "../lib/conexiones.js";
import { cargarMongo } from "./mongo.js";
import { cargarRedis } from "./redis.js";

try {
  await cargarMongo();
  await cargarRedis();
} finally {
  await cerrarConexiones();
}
