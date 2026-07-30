const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

//// ***********************ESQUEMA DE EMPLEADOS**********************

const empleadosSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            trim: true
        },

        telefono: {
            type: String,
            required: true,
            trim: true
        },

        puesto: {
            type: String,
            required: true,
            trim: true
        },

        turno: {
            type: String,
            required: true,
            trim: true
        },

        usuario: {
            type: String,
            required: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            trim: true
        },

        salario: {
            type: Number,
            required: true,
            min: 1
        },

        fecha_ingreso: {
            type: Date,
            required: true
        },

        activo: {
            type: Boolean,
            required: true,
            default: true
        }
    },
    {
        timestamps: true
    }
);


// MODELO
const Empleados = mongoose.model(
    "Empleados",
    empleadosSchema,
    "empleados"
);

// OBTENER TODOS LOS EMPLEADOS

app.get("/empleados", async (req, res) => {
    try {

        const empleados = await Empleados.find();

        res.json(empleados);

    } catch (error) {

        res.status(500).json({
            mensaje: "Error al obtener los empleados",
            error: error.message
        });

    }
});

// OBTENER EMPLEADO POR ID
app.get("/empleados/:id", async (req, res) => {
    try {

        const empleado = await Empleados.findById(req.params.id);

        if (!empleado) {
            return res.status(404).json({
                mensaje: "Empleado no encontrado"
            });
        }

        res.json(empleado);

    } catch (error) {

        res.status(500).json({
            mensaje: "Error al obtener el empleado",
            error: error.message
        });

    }
});

// REGISTRAR EMPLEADO
app.post("/empleados", async (req, res) => {
    try {

        const {
            nombre,
            email,
            telefono,
            puesto,
            turno,
            usuario,
            password,
            salario,
            fecha_ingreso,
            activo
        } = req.body;


        // Validar datos obligatorios

        if (
            !nombre ||
            !email ||
            !telefono ||
            !puesto ||
            !turno ||
            !usuario ||
            !password ||
            salario === undefined ||
            !fecha_ingreso ||
            activo === undefined
        ) {

            return res.status(400).json({
                mensaje: "Faltan datos del empleado"
            });

        }


        // Crear empleado

        const nuevoEmpleado = new Empleados({

            nombre,
            email,
            telefono,
            puesto,
            turno,
            usuario,
            password,
            salario,
            fecha_ingreso,
            activo

        });


        // Guardar empleado

        const empleadoGuardado = await nuevoEmpleado.save();


        res.status(201).json({

            mensaje: "Empleado registrado correctamente",

            empleado: empleadoGuardado

        });


    } catch (error) {

        res.status(500).json({

            mensaje: "Error al guardar el empleado",

            error: error.message

        });

    }
});

// ACTUALIZAR EMPLEADO
app.put("/empleados/:id", async (req, res) => {
    try {

        const {
            nombre,
            email,
            telefono,
            puesto,
            turno,
            usuario,
            password,
            salario,
            fecha_ingreso,
            activo
        } = req.body;


        if (
            !nombre ||
            !email ||
            !telefono ||
            !puesto ||
            !turno ||
            !usuario ||
            !password ||
            salario === undefined ||
            !fecha_ingreso ||
            activo === undefined
        ) {

            return res.status(400).json({
                mensaje: "Faltan datos del empleado"
            });

        }


        const empleadoActualizado =
            await Empleados.findByIdAndUpdate(

                req.params.id,

                {
                    nombre,
                    email,
                    telefono,
                    puesto,
                    turno,
                    usuario,
                    password,
                    salario,
                    fecha_ingreso,
                    activo
                },

                {
                    new: true,
                    runValidators: true
                }

            );


        if (!empleadoActualizado) {

            return res.status(404).json({
                mensaje: "Empleado no encontrado"
            });

        }


        res.json({

            mensaje: "Empleado actualizado correctamente",

            empleado: empleadoActualizado

        });


    } catch (error) {

        res.status(500).json({

            mensaje: "Error al actualizar el empleado",

            error: error.message

        });

    }
});

// ELIMINAR EMPLEADO
app.delete("/empleados/:id", async (req, res) => {
    try {

        const empleadoEliminado =
            await Empleados.findByIdAndDelete(req.params.id);


        if (!empleadoEliminado) {

            return res.status(404).json({
                mensaje: "Empleado no encontrado"
            });

        }


        res.json({

            mensaje: "Empleado eliminado correctamente",

            empleado: empleadoEliminado

        });


    } catch (error) {

        res.status(500).json({

            mensaje: "Error al eliminar el empleado",

            error: error.message

        });

    }
});


////***********************ESQUEMA DE  CLIENTES***********************

const clienteSchema = new mongoose.Schema({

    nombre: {
        type: String,
        required: true
    },

    telefono: {
        type: String,
        required: true
    },

    correo: {
        type: String,
        required: true
    },

    direccion: {
        type: String,
        required: true
    },

    fechaRegistro: {
        type: Date,
        default: Date.now
    }

});

const Cliente = mongoose.model("Cliente", clienteSchema);


//*********************** RUTAS DE CLIENTES ***********************


// CONSULTAR TODOS LOS CLIENTES
app.get("/clientes", async (req, res) => {

    try {

        const clientes = await Cliente.find();

        res.json(clientes);

    } catch (error) {

        res.status(500).json({
            mensaje: "Error al obtener los clientes",
            error: error.message
        });

    }

});

// CONSULTAR UN CLIENTE POR ID
app.get("/clientes/:id", async (req, res) => {

    try {

        const cliente = await Cliente.findById(req.params.id);

        if (!cliente) {

            return res.status(404).json({
                mensaje: "Cliente no encontrado"
            });

        }

        res.json(cliente);

    } catch (error) {

        res.status(500).json({
            mensaje: "Error al obtener el cliente",
            error: error.message
        });

    }

});

// AGREGAR CLIENTE
app.post("/clientes", async (req, res) => {

    try {

        const nuevoCliente = new Cliente({

            nombre: req.body.nombre,
            telefono: req.body.telefono,
            correo: req.body.correo,
            direccion: req.body.direccion,
            fechaRegistro: req.body.fechaRegistro

        });

        const clienteGuardado = await nuevoCliente.save();

        res.status(201).json({
            mensaje: "Cliente agregado correctamente",
            cliente: clienteGuardado
        });

    } catch (error) {

        res.status(400).json({
            mensaje: "Error al agregar el cliente",
            error: error.message
        });

    }

});

// ACTUALIZAR CLIENTE
app.put("/clientes/:id", async (req, res) => {

    try {

        const clienteActualizado = await Cliente.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!clienteActualizado) {

            return res.status(404).json({
                mensaje: "Cliente no encontrado"
            });

        }

        res.json({
            mensaje: "Cliente actualizado correctamente",
            cliente: clienteActualizado
        });

    } catch (error) {

        res.status(400).json({
            mensaje: "Error al actualizar el cliente",
            error: error.message
        });

    }

});

// ELIMINAR CLIENTE
app.delete("/clientes/:id", async (req, res) => {

    try {

        const clienteEliminado = await Cliente.findByIdAndDelete(req.params.id);

        if (!clienteEliminado) {

            return res.status(404).json({
                mensaje: "Cliente no encontrado"
            });

        }

        res.json({
            mensaje: "Cliente eliminado correctamente",
            cliente: clienteEliminado
        });

    } catch (error) {

        res.status(500).json({
            mensaje: "Error al eliminar el cliente",
            error: error.message
        });

    }

});

////***********************ESQUEMA DE PROVEEDORES**********************

const proveedorSchema = new mongoose.Schema({

    nombre: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        trim: true
    },

    telefono: {
        type: String,
        required: true,
        trim: true
    },

    direccion: {
        type: String,
        required: true,
        trim: true
    },

    activo: {
        type: Boolean,
        required: true,
        default: true
    }

}, {
    timestamps: true
});

// MODELO
const Proveedor = mongoose.model(
    "Proveedor",
    proveedorSchema,
    "proveedores"
);

// CONSULTAR TODOS LOS PROVEEDORES
app.get("/proveedores", async (req, res) => {

    try {

        const proveedores = await Proveedor.find();

        res.json(proveedores);

    } catch (error) {

        res.status(500).json({
            mensaje: "Error al obtener los proveedores",
            error: error.message
        });

    }

});

// CONSULTAR UN PROVEEDOR POR ID
app.get("/proveedores/:id", async (req, res) => {

    try {

        const proveedor = await Proveedor.findById(req.params.id);

        if (!proveedor) {

            return res.status(404).json({
                mensaje: "Proveedor no encontrado"
            });

        }

        res.json(proveedor);

    } catch (error) {

        res.status(500).json({
            mensaje: "Error al obtener el proveedor",
            error: error.message
        });

    }

});

// AGREGAR PROVEEDOR
app.post("/proveedores", async (req, res) => {

    try {

        const {
            nombre,
            email,
            telefono,
            direccion,
            activo
        } = req.body;

        if (
            !nombre ||
            !email ||
            !telefono ||
            !direccion
        ) {

            return res.status(400).json({
                mensaje: "Faltan datos del proveedor"
            });

        }

        const nuevoProveedor = new Proveedor({
            nombre,
            email,
            telefono,
            direccion,
            activo
        });

        const proveedorGuardado = await nuevoProveedor.save();

        res.status(201).json({
            mensaje: "Proveedor agregado correctamente",
            proveedor: proveedorGuardado
        });

    } catch (error) {

        res.status(400).json({
            mensaje: "Error al agregar el proveedor",
            error: error.message
        });

    }

});

// ACTUALIZAR PROVEEDOR
app.put("/proveedores/:id", async (req, res) => {

    try {

        const {
            nombre,
            email,
            telefono,
            direccion,
            activo
        } = req.body;

        if (
            !nombre ||
            !email ||
            !telefono ||
            !direccion
        ) {

            return res.status(400).json({
                mensaje: "Faltan datos del proveedor"
            });

        }

        const proveedorActualizado = await Proveedor.findByIdAndUpdate(
            req.params.id,
            {
                nombre,
                email,
                telefono,
                direccion,
                activo
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!proveedorActualizado) {

            return res.status(404).json({
                mensaje: "Proveedor no encontrado"
            });

        }

        res.json({
            mensaje: "Proveedor actualizado correctamente",
            proveedor: proveedorActualizado
        });

    } catch (error) {

        res.status(400).json({
            mensaje: "Error al actualizar el proveedor",
            error: error.message
        });

    }

});

// ELIMINAR PROVEEDOR
app.delete("/proveedores/:id", async (req, res) => {

    try {

        const proveedorEliminado = await Proveedor.findByIdAndDelete(req.params.id);

        if (!proveedorEliminado) {

            return res.status(404).json({
                mensaje: "Proveedor no encontrado"
            });

        }

        res.json({
            mensaje: "Proveedor eliminado correctamente",
            proveedor: proveedorEliminado
        });

    } catch (error) {

        res.status(500).json({
            mensaje: "Error al eliminar el proveedor",
            error: error.message
        });

    }

});


///***********************ESQUEMA DE PRODUCTOS************************
     const productosSchema = new mongoose.Schema({
        codigo_barras:{type:String,required:false,trim:true,maxlength:30},
        nombre:{type:String,required:true,trim:true,maxlength:100},
        descripcion:{type:String,required:false,trim:true,maxlength:500},
        categoria:{type:String,required:true,trim:true},
        unidad:{type:String,required:true,enum:['pieza','kg'],default:'pieza'},
        imagen:{type:String,required:false,trim:true,default:''},
        precio_compra:{type:Number,required:true,min:0},
        precio_venta:{type:Number,required:true,min:0},
        stock:{type:Number,required:true,min:0,default:0},
        fecha_caducidad:{type:Date,required:false},
        proveedor_id:{type:mongoose.Schema.Types.ObjectId,ref:'Proveedor',required:true}
    },{
        timestamps: true
    });
    // Modelo
    const Producto=mongoose.model("Producto",productosSchema,"productos");
    //RUTAS 
    // Obtener todos los productos
app.get("/productos", async (req, res) => {
    try {
        const productos = await Producto.find().populate("proveedor_id");// traer informacion dl otro esquema
        res.json(productos);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener los productos",
            error: error.message
        });
    }
});

// Obtener un producto por ID
app.get("/productos/:id", async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id).populate("proveedor_id");

        if (!producto) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        res.json(producto);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener el producto",
            error: error.message
        });
    }
});

// Registrar un producto
app.post("/productos", async (req, res) => {
    try {
        const {
            codigo_barras,
            nombre,
            descripcion,
            categoria,
            unidad,
            imagen,
            precio_compra,
            precio_venta,
            stock,
            fecha_caducidad,
            proveedor_id
        } = req.body;

        if (
            !nombre ||
            !categoria ||
            precio_compra === undefined ||
            precio_venta === undefined ||
            stock === undefined ||
            !proveedor_id
        ) {
            return res.status(400).json({
                mensaje: "Faltan datos obligatorios del producto"
            });
        }

        const nuevoProducto = new Producto({
            codigo_barras,
            nombre,
            descripcion,
            categoria,
            unidad,
            imagen,
            precio_compra,
            precio_venta,
            stock,
            fecha_caducidad,
            proveedor_id
        });

        const productoGuardado = await nuevoProducto.save();

        res.status(201).json({
            mensaje: "Producto registrado correctamente",
            producto: productoGuardado
        });
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al guardar el producto",
            error: error.message
        });
    }
});

// Actualizar un producto
app.put("/productos/:id", async (req, res) => {
    try {
        const {
            codigo_barras,
            nombre,
            descripcion,
            categoria,
            unidad,
            imagen,
            precio_compra,
            precio_venta,
            stock,
            fecha_caducidad,
            proveedor_id
        } = req.body;

        if (
            !nombre ||
            !categoria ||
            precio_compra === undefined ||
            precio_venta === undefined ||
            stock === undefined ||
            !proveedor_id
        ) {
            return res.status(400).json({
                mensaje: "Faltan datos obligatorios del producto"
            });
        }

        const productoActualizado = await Producto.findByIdAndUpdate(
            req.params.id,
            {
                codigo_barras,
                nombre,
                descripcion,
                categoria,
                unidad,
                imagen,
                precio_compra,
                precio_venta,
                stock,
                fecha_caducidad,
                proveedor_id
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!productoActualizado) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        res.json({
            mensaje: "Producto actualizado correctamente",
            producto: productoActualizado
        });
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al actualizar el producto",
            error: error.message
        });
    }
});

// Eliminar un producto
app.delete("/productos/:id", async (req, res) => {
    try {
        const productoEliminado = await Producto.findByIdAndDelete(req.params.id);

        if (!productoEliminado) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        res.json({
            mensaje: "Producto eliminado correctamente",
            producto: productoEliminado
        });
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al eliminar el producto",
            error: error.message
        });
    }
});

///***********************ESQUEMA DE  VENTAS*************************

const itemVentaSchema = new mongoose.Schema({
    producto_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Producto",
        required: true
    },
    nombre: { type: String, required: true, trim: true },
    cantidad: { type: Number, required: true, min: 0.001 },
    precio: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const ventaSchema = new mongoose.Schema({
    folio: { type: String, required: true, unique: true, trim: true },
    fecha: { type: Date, default: Date.now },

    empleado_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Empleados",
        required: true
    },

    // El cliente es opcional: no toda venta tiene un cliente registrado
    cliente_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cliente",
        required: false,
        default: null
    },
    cliente_nombre: { type: String, trim: true, default: "Público general" },

    items: {
        type: [itemVentaSchema],
        required: true,
        validate: {
            validator: (v) => Array.isArray(v) && v.length > 0,
            message: "La venta debe tener al menos un producto"
        }
    },

    total: { type: Number, required: true, min: 0 },

    metodo_pago: {
        type: String,
        required: true,
        enum: ["efectivo", "tarjeta", "transferencia"]
    },

    estatus: {
        type: String,
        required: true,
        enum: ["completada", "cancelada"],
        default: "completada"
    }
}, {
    timestamps: true
});

const Venta = mongoose.model("Venta", ventaSchema, "ventas");


// OBTENER TODAS LAS VENTAS (resumen para el historial)
app.get("/ventas", async (req, res) => {
    try {

        const ventas = await Venta
            .find()
            .select("folio fecha cliente_nombre total metodo_pago estatus")
            .sort({ fecha: -1 });

        res.json(ventas);

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener las ventas",
            error: error.message
        });
    }
});

// OBTENER UNA VENTA POR ID (detalle completo)
app.get("/ventas/:id", async (req, res) => {
    try {

        const venta = await Venta
            .findById(req.params.id)
            .populate("empleado_id", "-password")
            .populate("cliente_id")
            .populate("items.producto_id");

        if (!venta) {
            return res.status(404).json({ mensaje: "Venta no encontrada" });
        }

        res.json(venta);

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener la venta",
            error: error.message
        });
    }
});


// REGISTRAR UNA VENTA
app.post("/ventas", async (req, res) => {
    try {

        const { empleado_id, cliente_id, metodo_pago, items } = req.body;

        if (
            !empleado_id ||
            !metodo_pago ||
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                mensaje: "Faltan datos de la venta"
            });
        }

        const empleado = await Empleados.findById(empleado_id);
        if (!empleado) {
            return res.status(404).json({ mensaje: "Empleado no encontrado" });
        }

        // El cliente es opcional
        let cliente = null;
        if (cliente_id) {
            cliente = await Cliente.findById(cliente_id);
            if (!cliente) {
                return res.status(404).json({ mensaje: "Cliente no encontrado" });
            }
        }

        const itemsProcesados = [];
        let total = 0;

        for (const it of items) {

            if (!it.producto_id || typeof it.cantidad !== "number" || it.cantidad <= 0) {
                return res.status(400).json({
                    mensaje: "Cada item requiere producto_id y cantidad mayor a 0"
                });
            }

            const producto = await Producto.findById(it.producto_id);
            if (!producto) {
                return res.status(404).json({
                    mensaje: "Producto no encontrado: " + it.producto_id
                });
            }

            if (producto.stock < it.cantidad) {
                return res.status(409).json({
                    mensaje: "Stock insuficiente de " + producto.nombre +
                             " (disponible: " + producto.stock + ")"
                });
            }

            const subtotal = producto.precio_venta * it.cantidad;
            total += subtotal;

            itemsProcesados.push({
                producto_id: producto._id,
                nombre: producto.nombre,
                cantidad: it.cantidad,
                precio: producto.precio_venta,
                subtotal: subtotal
            });
        }

        // Descontar stock y revertir si algo falla
        const aplicados = [];
        for (const it of itemsProcesados) {

            const r = await Producto.updateOne(
                { _id: it.producto_id, stock: { $gte: it.cantidad } },
                { $inc: { stock: -it.cantidad } }
            );

            if (r.matchedCount === 0) {
                for (const a of aplicados) {
                    await Producto.updateOne(
                        { _id: a.producto_id },
                        { $inc: { stock: a.cantidad } }
                    );
                }
                return res.status(409).json({
                    mensaje: "No se pudo descontar el stock de " + it.nombre
                });
            }

            aplicados.push(it);
        }

        // Folio consecutivo V-0001
        const ultima = await Venta.findOne().sort({ folio: -1 }).lean();
        let n = 1;
        if (ultima && ultima.folio) {
            const num = parseInt(ultima.folio.replace(/\D/g, ""), 10);
            if (!isNaN(num)) n = num + 1;
        }
        const folio = "V-" + String(n).padStart(4, "0");

        const nuevaVenta = new Venta({
            folio,
            fecha: new Date(),
            empleado_id,
            cliente_id: cliente_id || null,
            cliente_nombre: cliente ? cliente.nombre : "Público general",
            items: itemsProcesados,
            total: Math.round(total * 100) / 100,
            metodo_pago,
            estatus: "completada"
        });

        let ventaGuardada;
        try {
            ventaGuardada = await nuevaVenta.save();
        } catch (e) {
            for (const a of aplicados) {
                await Producto.updateOne(
                    { _id: a.producto_id },
                    { $inc: { stock: a.cantidad } }
                );
            }
            throw e;
        }

        res.status(201).json({
            mensaje: "Venta registrada correctamente",
            venta: ventaGuardada
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al registrar la venta",
            error: error.message
        });
    }
});


// ACTUALIZAR UNA VENTA
app.put("/ventas/:id", async (req, res) => {
    try {

        const { cliente_id, metodo_pago, estatus } = req.body;

        const venta = await Venta.findById(req.params.id);
        if (!venta) {
            return res.status(404).json({ mensaje: "Venta no encontrada" });
        }

        // Si se cancela una venta completada, devolver el stock
        if (estatus === "cancelada" && venta.estatus === "completada") {
            for (const it of venta.items) {
                await Producto.updateOne(
                    { _id: it.producto_id },
                    { $inc: { stock: it.cantidad } }
                );
            }
        }

        if (metodo_pago) {
            venta.metodo_pago = metodo_pago;
        }

        if (estatus) {
            venta.estatus = estatus;
        }

        if (cliente_id) {
            const cliente = await Cliente.findById(cliente_id);
            if (!cliente) {
                return res.status(404).json({ mensaje: "Cliente no encontrado" });
            }
            venta.cliente_id = cliente_id;
            venta.cliente_nombre = cliente.nombre;
        }

        const ventaActualizada = await venta.save();

        res.json({
            mensaje: "Venta actualizada correctamente",
            venta: ventaActualizada
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al actualizar la venta",
            error: error.message
        });
    }
});


// ELIMINAR UNA VENTA
app.delete("/ventas/:id", async (req, res) => {
    try {

        const venta = await Venta.findById(req.params.id);
        if (!venta) {
            return res.status(404).json({ mensaje: "Venta no encontrada" });
        }

        // Devolver stock si la venta seguia completada
        if (venta.estatus === "completada") {
            for (const it of venta.items) {
                await Producto.updateOne(
                    { _id: it.producto_id },
                    { $inc: { stock: it.cantidad } }
                );
            }
        }

        await Venta.findByIdAndDelete(req.params.id);

        res.json({
            mensaje: "Venta eliminada correctamente",
            venta: venta
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al eliminar la venta",
            error: error.message
        });
    }
});

// ==========================================================
//                   RUTA DE LOGIN (CON BCRYPT)
// ==========================================================
app.post("/login", async (req, res) => {
    try {
        const { usuario, password } = req.body;

        if (!usuario || !password) {
            return res.status(400).json({
                mensaje: "Debes ingresar un usuario y una contraseña"
            });
        }

        // 1. Buscar al empleado ignorando mayúsculas/minúsculas
        const usuarioLimpio = usuario.trim();
        const empleado = await Empleados.findOne({
            usuario: { $regex: new RegExp("^" + usuarioLimpio + "$", "i") }
        });

        if (!empleado) {
            return res.status(401).json({
                mensaje: "Usuario o contraseña incorrectos"
            });
        }

        // 2. Comparar la contraseña ingresada con el HASH encriptado de la base de datos
        const esValida = await bcrypt.compare(password, empleado.password);

        if (!esValida) {
            return res.status(401).json({
                mensaje: "Usuario o contraseña incorrectos"
            });
        }

        // 3. Verificar si el empleado está activo
        if (!empleado.activo) {
            return res.status(403).json({
                mensaje: "Esta cuenta de empleado se encuentra desactivada"
            });
        }

        // 4. Login exitoso
        res.json({
            mensaje: "Inicio de sesión exitoso",
            token: "token_simulado_" + empleado._id,
            empleado: {
                id: empleado._id,
                nombre: empleado.nombre,
                usuario: empleado.usuario,
                puesto: empleado.puesto,
                email: empleado.email
            }
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error interno en el servidor al intentar iniciar sesión",
            error: error.message
        });
    }
});

    app.get("/", (req, res) => {
    res.send("API del Proyecto NoSQL");
    });

async function iniciarServidor() {
       try {
           await mongoose.connect(
               "mongodb+srv://root:root@servidorprueba.6wjsj0y.mongodb.net/TiendaDB",
               {
                   serverSelectionTimeoutMS: 10000
               }
           );
   
           console.log("Conectado correctamente a MongoDB");
   
           app.listen(PORT, () => {
               console.log(
                   "Servidor iniciado en http://localhost:" + PORT
               );
           });
       } catch (error) {
           console.error("No se pudo conectar con MongoDB con la base de Datos TiendaDB");
           console.error(error.message);
       }
   }
   
   iniciarServidor();