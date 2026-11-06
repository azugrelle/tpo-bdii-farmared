// Propósito: ABM de clientes: alta con DNI único, modificación de contacto y cobertura, y baja lógica.
// Parámetros: datos, el cliente nuevo; idCliente, el id del cliente; cambios, los campos a modificar.
// Retorno: { ok: true, ... } o { ok: false, motivo }.
// Motor: MongoDB, y Redis para generar el id del alta.
export async function alta(datos) {
  throw new Error("q13 alta sin implementar");
}

export async function modificar(idCliente, cambios) {
  throw new Error("q13 modificar sin implementar");
}

export async function baja(idCliente) {
  throw new Error("q13 baja sin implementar");
}
