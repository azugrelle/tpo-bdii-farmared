// ---------- MongoDB ----------

export const BASE = "farmared";

export const COL = {
  CLIENTES: "clientes",
  SUCURSALES: "sucursales",
  FARMACEUTICOS: "farmaceuticos",
  PROVEEDORES: "proveedores",
  PRODUCTOS: "productos",
  RECETAS: "recetas",
  VENTAS: "ventas",
};

export const VISTA_VENTAS_COMPLETADAS = "vw_ventas_completadas";

// ---------- Redis ----------

export const clave = {
  lote: (idLote) => `lote:${idLote}`,
  fefo: (idProducto, idSucursal) => `fefo:${idProducto}:${idSucursal}`,
  stockUnidades: "stock:unidades",
  seq: (tipo) => `seq:${tipo}`,
};

// Los contadores seq:* arrancan acá, así el primer id generado es C501, V501 o D501.
export const SEQ_INICIAL = 500;

// ---------- Strings ----------
export const ESTADO_VENTA = {
  COMPLETADA: "Completada",
  PENDIENTE: "Pendiente",
  ANULADA: "Anulada",
};

export const TIPO_VENTA = {
  LIBRE: "Venta libre",
  CON_RECETA: "Con receta",
};

export const MEDIO_PAGO = {
  EFECTIVO: "Efectivo",
  DEBITO: "Débito",
  CREDITO: "Crédito",
  TRANSFERENCIA: "Transferencia",
  OBRA_SOCIAL: "Obra social",
};

export const TIPO_RECETA = {
  SIMPLE: "Simple",
  ARCHIVADA: "Archivada",
  PROLONGADO: "Tratamiento prolongado",
};

export const ESTADO_RECETA = {
  VIGENTE: "Vigente",
  COMPLETADA: "Completada",
  VENCIDA: "Vencida",
};

export const CONDICION_VENTA = {
  LIBRE: "Venta libre",
  BAJO_RECETA: "Bajo receta",
  BAJO_RECETA_ARCHIVADA: "Bajo receta archivada",
};

export const TIPO_SUCURSAL = {
  FARMACIA: "Farmacia",
  DROGUERIA: "Droguería",
};

export const TIPO_PROVEEDOR = {
  LABORATORIO: "Laboratorio",
  DROGUERIA: "Droguería",
};

export const OBRA_SOCIAL = {
  OSDE: "OSDE",
  SWISS_MEDICAL: "Swiss Medical",
  PAMI: "PAMI",
  IOMA: "IOMA",
  GALENO: "Galeno",
  SIN_COBERTURA: "Sin cobertura",
};
