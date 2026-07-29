require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;

// Clave para firmar los tokens. Siempre viene del entorno: si no esta
// definida no se arranca, para no firmar con un secreto conocido.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("Falta la variable de entorno JWT_SECRET (revisa tu archivo .env)");
    process.exit(1);
}
const JWT_EXPIRACION = "8h"; // dura un turno de trabajo

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ==========================================================
// MIDDLEWARE DE AUTENTICACION
// Protege todas las rutas salvo las publicas (/ y POST /login).
// El cliente debe mandar la cabecera: Authorization: Bearer <token>
// ==========================================================
function verificarToken(req, res, next) {

    // Dejar pasar preflight de CORS
    if (req.method === "OPTIONS") {
        return next();
    }

    // Rutas publicas: raiz y login
    if (req.path === "/" || (req.path === "/login" && req.method === "POST")) {
        return next();
    }

    const cabecera = req.headers.authorization || "";
    const token = cabecera.startsWith("Bearer ") ? cabecera.slice(7) : null;

    if (!token) {
        return res.status(401).json({
            mensaje: "Acceso denegado: falta el token de autenticacion"
        });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.usuario = payload; // { id, usuario, puesto } disponible en las rutas
        next();
    } catch (error) {
        return res.status(401).json({
            mensaje: "Token invalido o expirado, inicia sesion nuevamente"
        });
    }
}

app.use(verificarToken);

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

// LOGIN DE EMPLEADOS
app.post("/login", async (req, res) => {
    try {

        const { usuario, password } = req.body;

        if (!usuario || !password) {
            return res.status(400).json({
                mensaje: "Usuario y contrasena son obligatorios"
            });
        }

        // Buscar por usuario. Se incluye el password para poder compararlo.
        const empleado = await Empleados.findOne({ usuario });

        // Mismo mensaje para usuario inexistente o password incorrecta,
        // para no revelar cual de los dos fallo.
        const credencialesInvalidas = () =>
            res.status(401).json({ mensaje: "Usuario o contrasena incorrectos" });

        if (!empleado) {
            return credencialesInvalidas();
        }

        const coincide = await bcrypt.compare(password, empleado.password);
        if (!coincide) {
            return credencialesInvalidas();
        }

        if (empleado.activo === false) {
            return res.status(403).json({
                mensaje: "La cuenta esta desactivada, contacta al administrador"
            });
        }

        // Login correcto: generar token de sesion
        const token = jwt.sign(
            {
                id: empleado._id,
                usuario: empleado.usuario,
                puesto: empleado.puesto
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRACION }
        );

        // Devolver datos del empleado SIN la contrasena
        const datos = empleado.toObject();
        delete datos.password;

        res.json({
            mensaje: "Inicio de sesion correcto",
            token: token,
            empleado: datos
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al iniciar sesion",
            error: error.message
        });
    }
});

// OBTENER TODOS LOS EMPLEADOS

app.get("/empleados", async (req, res) => {
    try {

        const empleados = await Empleados.find().select("-password");

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

        const empleado = await Empleados.findById(req.params.id).select("-password");

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


        // Hashear la contrasena antes de guardar (nunca en texto plano)

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);


        // Crear empleado

        const nuevoEmpleado = new Empleados({

            nombre,
            email,
            telefono,
            puesto,
            turno,
            usuario,
            password: passwordHash,
            salario,
            fecha_ingreso,
            activo

        });


        // Guardar empleado

        const empleadoGuardado = await nuevoEmpleado.save();

        // No devolver la contrasena en la respuesta
        const empleadoSinPassword = empleadoGuardado.toObject();
        delete empleadoSinPassword.password;


        res.status(201).json({

            mensaje: "Empleado registrado correctamente",

            empleado: empleadoSinPassword

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


        // password es OPCIONAL al editar: si no llega, se conserva la actual
        if (
            !nombre ||
            !email ||
            !telefono ||
            !puesto ||
            !turno ||
            !usuario ||
            salario === undefined ||
            !fecha_ingreso ||
            activo === undefined
        ) {

            return res.status(400).json({
                mensaje: "Faltan datos del empleado"
            });

        }


        const datosActualizados = {
            nombre,
            email,
            telefono,
            puesto,
            turno,
            usuario,
            salario,
            fecha_ingreso,
            activo
        };

        // Solo re-hashear si mandan una contrasena nueva
        if (password) {
            datosActualizados.password = await bcrypt.hash(password, SALT_ROUNDS);
        }


        const empleadoActualizado =
            await Empleados.findByIdAndUpdate(

                req.params.id,

                datosActualizados,

                {
                    new: true,
                    runValidators: true,
                    select: "-password"
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
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        trim: true,
        match: [/^.+@.+\..+$/, "El correo no tiene un formato valido"]
    },

    telefono: {
        type: String,
        required: true,
        trim: true
    },

    direccion: {
        type: String,
        required: false,
        trim: true
    },

    fecha_registro: {
        type: Date,
        required: true,
        default: Date.now
    },

    activo: {
        type: Boolean,
        required: true,
        default: true
    }

});

const Cliente = mongoose.model("Cliente", clienteSchema, "clientes");


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

        const {
            nombre,
            email,
            telefono,
            direccion,
            fecha_registro,
            activo
        } = req.body;

        if (!nombre || !email || !telefono) {
            return res.status(400).json({
                mensaje: "Faltan datos del cliente (nombre, email y telefono son obligatorios)"
            });
        }

        const nuevoCliente = new Cliente({

            nombre,
            email,
            telefono,
            direccion,
            fecha_registro: fecha_registro || new Date(),
            activo: activo === undefined ? true : activo

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
        precio_compra:{type:Number,required:true,min:0},
        precio_venta:{type:Number,required:true,min:0},
        stock:{type:Number,required:true,min:0,default:0},
        unidad:{type:String,required:true,enum:{values:["pieza","kg"],message:"La unidad debe ser 'pieza' o 'kg'"},default:"pieza"},
        fecha_caducidad:{type:Date,required:false},
        imagen:{type:String,required:false,trim:true,match:[/^https?:\/\//,"La imagen debe ser una URL que empiece con http:// o https://"]},
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
            precio_compra,
            precio_venta,
            stock,
            unidad,
            fecha_caducidad,
            imagen,
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
            codigo_barras: codigo_barras && codigo_barras.trim() ? codigo_barras.trim() : undefined,
            nombre,
            descripcion,
            categoria,
            precio_compra,
            precio_venta,
            stock,
            unidad: unidad || "pieza",
            fecha_caducidad,
            imagen: imagen && imagen.trim() ? imagen.trim() : undefined,
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
            precio_compra,
            precio_venta,
            stock,
            unidad,
            fecha_caducidad,
            imagen,
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
                codigo_barras: codigo_barras && codigo_barras.trim() ? codigo_barras.trim() : undefined,
                nombre,
                descripcion,
                categoria,
                precio_compra,
                precio_venta,
                stock,
                unidad,
                fecha_caducidad,
                imagen: imagen && imagen.trim() ? imagen.trim() : undefined,
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

// Subdocumento de cada renglon de la venta
const itemSchema = new mongoose.Schema(
    {
        producto_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Producto",
            required: true
        },
        nombre: {
            type: String,
            required: true,
            trim: true
        },
        cantidad: {
            type: Number,
            required: true,
            min: [0.001, "La cantidad debe ser mayor a 0"]
        },
        unidad: {
            type: String,
            required: true,
            enum: ["pieza", "kg"],
            default: "pieza"
        },
        precio: {
            type: Number,
            required: true,
            min: 0
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0
        }
    },
    { _id: false }
);

const ventaSchema = new mongoose.Schema(
    {
        folio: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        fecha: {
            type: Date,
            required: true,
            default: Date.now
        },
        empleado_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Empleados",
            required: true
        },
        cliente_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Cliente",
            required: true
        },
        cliente_nombre: {
            type: String,
            required: true,
            trim: true
        },
        items: {
            type: [itemSchema],
            required: true
        },
        total: {
            type: Number,
            required: true,
            min: 0
        },
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
    },
    {
        timestamps: true
    }
);

// MODELO
const Venta = mongoose.model("Venta", ventaSchema, "ventas");


// OBTENER TODAS LAS VENTAS
app.get("/ventas", async (req, res) => {
    try {

        const ventas = await Venta.find()
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


// OBTENER UNA VENTA POR ID
app.get("/ventas/:id", async (req, res) => {
    try {

        const venta = await Venta.findById(req.params.id)
            .populate("empleado_id", "nombre puesto")
            .populate("cliente_id", "nombre email");

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
            !cliente_id ||
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

        const cliente = await Cliente.findById(cliente_id);
        if (!cliente) {
            return res.status(404).json({ mensaje: "Cliente no encontrado" });
        }

        const itemsProcesados = [];
        let total = 0;

        for (const it of items) {

            if (!it.producto_id || typeof it.cantidad !== "number" ||
                !isFinite(it.cantidad) || it.cantidad <= 0) {
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

            // La unidad del producto define si admite decimales
            const porKilo = producto.unidad === "kg";

            if (!porKilo && !Number.isInteger(it.cantidad)) {
                return res.status(400).json({
                    mensaje: producto.nombre + " se vende por pieza: la cantidad debe ser un numero entero"
                });
            }

            // Al granel se le permiten hasta 3 decimales (gramos)
            const cantidad = porKilo
                ? Math.round(it.cantidad * 1000) / 1000
                : it.cantidad;

            if (producto.stock < cantidad) {
                return res.status(409).json({
                    mensaje: "Stock insuficiente de " + producto.nombre +
                             " (disponible: " + producto.stock +
                             (porKilo ? " kg)" : ")")
                });
            }

            const subtotal = Math.round(producto.precio_venta * cantidad * 100) / 100;
            total += subtotal;

            itemsProcesados.push({
                producto_id: producto._id,
                nombre: producto.nombre,
                cantidad: cantidad,
                unidad: producto.unidad || "pieza",
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
            cliente_id,
            cliente_nombre: cliente.nombre,
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



    app.get("/", (req, res) => {
    res.send("API del Proyecto NoSQL");
    });

async function iniciarServidor() {
       const MONGODB_URI = process.env.MONGODB_URI;
       if (!MONGODB_URI) {
           console.error("Falta la variable de entorno MONGODB_URI (revisa tu archivo .env)");
           process.exit(1);
       }

       try {
           await mongoose.connect(
               MONGODB_URI,
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