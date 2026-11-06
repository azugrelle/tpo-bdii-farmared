# FarmaRed

TPO de Base de Datos II. Backoffice de una red de farmacias con persistencia políglota: MongoDB para clientes, recetas, productos y ventas, y Redis para el stock por lote.

**Estado:** por ahora el repo tiene solo la estructura. Las consultas fallan con `qNN sin implementar`, y `npm run load` y `npm run check-data` avisan que están pendientes.

## Entorno

Hace falta Node 24 y Docker. La configuración para Codespaces todavía no está.

```bash
npm install
docker run -d --name farmared-mongo -p 27017:27017 mongo:7
docker run -d --name farmared-redis -p 6379:6379 redis:7 redis-server --appendonly yes
```

Para usar otros servidores están las variables `MONGO_URL` y `REDIS_URL`. Sin ellas, se conecta a localhost.

## Datos

```bash
npm run load         # borra y recarga todo
npm run check-data   # valida los datos
```

Los CSV de la cátedra están en `data/dataset_provisto/`, sin modificar, y los registros propios en `data/extra/p1` a `p4`.

Por defecto se cargan todas las carpetas de `data/extra/`. La variable `EXTRAS` elige cuáles:

```bash
EXTRAS=p1,p3 npm run load   # solo p1 y p3
EXTRAS= npm run load        # solo los CSV de la cátedra
```

## Consultas

Cada consulta se ejecuta con `npm run q -- <número> [argumentos]`, y el resultado se imprime como JSON.

| # | Tipo | Qué hace | Motor | Comando |
|---:|---|---|---|---|
| 1 | Lectura | Productos activos con todos los datos de su proveedor | MongoDB | `npm run q -- 01` |
| 2 | Lectura | Ventas pendientes con el farmacéutico (nombre, matrícula y sucursal) y el total | MongoDB | `npm run q -- 02` |
| 3 | Lectura | Historial de un cliente: ventas y recetas ordenadas por fecha | MongoDB | `npm run q -- 03 C001` |
| 4 | Agregación | Clientes con más de una receta, con la cantidad | MongoDB | `npm run q -- 04` |
| 5 | Agregación | Farmacéuticos activos y sus ventas de los últimos 60 días, sin anuladas. Incluye a los que tienen cero | MongoDB | `npm run q -- 05` |
| 6 | Lectura | Recetas de tratamiento prolongado vigentes con la próxima dispensa anterior a hoy, con los datos del cliente | MongoDB | `npm run q -- 06` |
| 7 | Agregación | Top 5 de productos por unidades vendidas, solo ventas completadas | MongoDB | `npm run q -- 07` |
| 8 | Lectura | Lotes con menos de 50 unidades, con producto, sucursal y proveedor | Redis y MongoDB | `npm run q -- 08` |
| 9 | Lectura | Ventas libres con total menor a $5.000, sin anuladas | MongoDB | `npm run q -- 09` |
| 10 | Lectura | Clientes atendidos en una sucursal, por el farmacéutico que registró la venta, esté activo o no | MongoDB | `npm run q -- 10 S001` |
| 11 | Agregación | Vista con los ingresos por farmacéutico en el mes actual, solo ventas completadas | MongoDB | `npm run q -- 11` |
| 12 | Lectura | Clientes sin ventas registradas en el último año | MongoDB | `npm run q -- 12` |
| 13 | Servicio | ABM de clientes: alta con DNI único, modificación de contacto y cobertura, y baja lógica | MongoDB y Redis | Ver abajo |
| 14 | Servicio | Registra una venta completada con sus validaciones, descuenta el stock y actualiza la receta | MongoDB y Redis | Ver abajo |
| 15 | Servicio | Descuenta el stock de una venta con FEFO, sin usar lotes vencidos. Si no alcanza, no cambia ningún lote | Redis y MongoDB | `npm run q -- 15 V501` |

Las consultas 13 y 14 reciben sus datos como JSON:

```bash
npm run q -- 13 alta '{"nombre":"Ana","apellido":"Paz","dni":"30111222","email":"ana.paz@gmail.com","telefono":"1144556677","ciudad":"Rosario","provincia":"Santa Fe","obra_social":"OSDE","nro_afiliado":"OS-123456"}'
npm run q -- 13 modificar C001 '{"telefono":"1144556677"}'
npm run q -- 13 baja C001
npm run q -- 14 '{"id_cliente":"C001","id_farmaceutico":"F001","medio_pago":"Efectivo","items":[{"id_producto":"PRD001","cantidad":1}]}'
```

La consulta 15 rechaza las ventas que ya descontaron stock. Eso incluye a las creadas por la 14, como `V501`.

Las consultas y los servicios están en `src/queries/` y `src/services/`, con un archivo por consulta.
