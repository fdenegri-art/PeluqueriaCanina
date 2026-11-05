 "use strict";

// ==========================================
// 1. CONFIGURACIÓN DE SUPABASE
// ==========================================

const API_URL =
    "https://rwzzsamwrjeinqwmfqgj.supabase.co/functions/v1/peluqueria-canina-api";

const SUPABASE_URL = "https://rwzzsamwrjeinqwmfqgj.supabase.co";
const CLAVE_PUBLICA = "sb_publishable_jq2-pGn27Sb15yyI0Zo2VA_mT3sfaZg";

if (!window.supabase) {
    console.error(
        "No se cargó Supabase. Comprueba que la biblioteca de Supabase esté antes de script.js en index.html."
    );
}

const supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, CLAVE_PUBLICA)
    : null;

const $ = id => document.getElementById(id);

// ==========================================
// 2. ELEMENTOS DE LA PÁGINA
// ==========================================

const formulario = $("formulario-reserva");
const mensaje = $("mensaje");
const campoFecha = $("fecha");
const campoServicio = $("servicio");

const botonEmpleados = $("boton-empleados");
const modalEmpleados = $("modal-empleados");
const cerrarLogin = $("cerrar-login");
const formularioLogin = $("formulario-login");
const correoEmpleado = $("correo-empleado");
const claveEmpleado = $("clave-empleado");
const mensajeLogin = $("mensaje-login");
const botonLogin = $("boton-login");

const panelEmpleados = $("panel-empleados");
const saludoEmpleado = $("saludo-empleado");
const botonCerrarSesion = $("boton-cerrar-sesion");
const filtroFecha = $("filtro-fecha");
const botonFiltrar = $("boton-filtrar");
const botonTodas = $("boton-todas");
const mensajePanel = $("mensaje-panel");
const tablaCitas = $("tabla-citas");

let empleadoActual = null;
let serviciosDisponibles = [];
let sesionVerificada = false;

// ==========================================
// 3. FUNCIONES AUXILIARES
// ==========================================

function nombreConTildes(texto) {
    return String(texto || "")
        .replace(/bano/gi, palabra =>
            palabra[0] === palabra[0].toUpperCase() ? "Baño" : "baño"
        )
        .replace(/peluqueria/gi, palabra =>
            palabra[0] === palabra[0].toUpperCase()
                ? "Peluquería"
                : "peluquería"
        )
        .replace(/pequeno/gi, palabra =>
            palabra[0] === palabra[0].toUpperCase()
                ? "Pequeño"
                : "pequeño"
        )
        .replace(/pequena/gi, palabra =>
            palabra[0] === palabra[0].toUpperCase()
                ? "Pequeña"
                : "pequeña"
        );
}

function mostrarMensajeLogin(texto, error = false) {
    if (!mensajeLogin) return;
    mensajeLogin.textContent = texto;
    mensajeLogin.style.color = error ? "#b42318" : "#654b76";
}

function mostrarMensajePanel(texto, error = false) {
    if (!mensajePanel) return;
    mensajePanel.textContent = texto;
    mensajePanel.style.color = error ? "#b42318" : "#654b76";
}

function mostrarMensajeReserva(texto, error = false) {
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.style.color = error ? "#b42318" : "#654b76";
}

function agregarCelda(fila, valor) {
    const celda = document.createElement("td");
    celda.textContent = valor == null ? "" : String(valor);
    fila.appendChild(celda);
    return celda;
}

function mostrarFilaVacia(texto) {
    if (!tablaCitas) return;

    tablaCitas.replaceChildren();
    const fila = document.createElement("tr");
    const celda = document.createElement("td");

    celda.colSpan = 8;
    celda.textContent = texto;
    fila.appendChild(celda);
    tablaCitas.appendChild(fila);
}

// ==========================================
// 4. FECHA MÍNIMA DE RESERVA
// ==========================================

if (campoFecha) {
    const hoy = new Date();
    campoFecha.min = new Date(
        hoy.getTime() - hoy.getTimezoneOffset() * 60000
    ).toISOString().split("T")[0];
}

// ==========================================
// 5. LLAMAR A LA FUNCIÓN DE SUPABASE
// ==========================================

async function llamarAPI(datos) {
    const respuesta = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: CLAVE_PUBLICA,
            Authorization: `Bearer ${CLAVE_PUBLICA}`
        },
        body: JSON.stringify(datos)
    });

    let resultado;

    try {
        resultado = await respuesta.json();
    } catch {
        throw new Error("El servidor no devolvió una respuesta válida.");
    }

    if (!respuesta.ok) {
        throw new Error(
            resultado.error || `Error del servidor: ${respuesta.status}`
        );
    }

    return resultado;
}

// ==========================================
// 6. CARGAR SERVICIOS
// ==========================================

async function cargarServicios() {
    if (!campoServicio) return;

    try {
        const resultado = await llamarAPI({ action: "servicios" });

        if (!Array.isArray(resultado.servicios)) {
            throw new Error("No se recibió la lista de servicios.");
        }

        serviciosDisponibles = resultado.servicios;
        campoServicio.replaceChildren();

        const inicial = document.createElement("option");
        inicial.value = "";
        inicial.textContent = "Selecciona un servicio";
        campoServicio.appendChild(inicial);

        serviciosDisponibles.forEach(servicio => {
            const opcion = document.createElement("option");
            opcion.value = servicio.id;
            opcion.textContent =
                `${nombreConTildes(servicio.nombre)} — S/ ${Number(servicio.precio).toFixed(2)}`;

            campoServicio.appendChild(opcion);
        });

    } catch (error) {
        console.error("Error al cargar servicios:", error);

        campoServicio.replaceChildren();
        const opcion = document.createElement("option");
        opcion.value = "";
        opcion.textContent = "Servicios no disponibles";
        campoServicio.appendChild(opcion);

        mostrarMensajeReserva(
            "No se pudieron cargar los servicios. Inténtalo más tarde.",
            true
        );
    }
}

cargarServicios();

// ==========================================
// 7. RESERVA DE DEMOSTRACIÓN
// ==========================================

// Esta sección NO guarda una cita en Supabase.
// Conserva la demostración mientras se conecta el formulario real.

if (formulario) {
    formulario.addEventListener("submit", evento => {
        evento.preventDefault();

        const datos = new FormData(formulario);
        const dueno = String(datos.get("nombre_cliente") || "").trim();
        const mascota = String(datos.get("nombre_mascota") || "").trim();
        const servicioId = String(datos.get("servicio_id") || "");
        const fecha = String(datos.get("fecha") || "");
        const hora = String(datos.get("hora_inicio") || "");

        if (!dueno || !mascota || !servicioId || !fecha || !hora) {
            mostrarMensajeReserva("Completa todos los campos.", true);
            return;
        }

        if (campoFecha?.min && fecha < campoFecha.min) {
            mostrarMensajeReserva("Selecciona una fecha válida.", true);
            return;
        }

        const servicio = serviciosDisponibles.find(
            item => String(item.id) === servicioId
        );

        mostrarMensajeReserva(
            `Gracias, ${dueno}. La solicitud de demostración para ${mascota}, ` +
            `${servicio ? nombreConTildes(servicio.nombre) : "el servicio seleccionado"}, ` +
            `el ${fecha} a las ${hora}, está completa. Aún falta conectar el guardado real.`
        );
    });
}

// ==========================================
// 8. VENTANA DE ACCESO DE EMPLEADOS
// ==========================================

function abrirModalLogin() {
    if (!modalEmpleados) return;
    modalEmpleados.hidden = false;
    mostrarMensajeLogin("");
    correoEmpleado?.focus();
}

function cerrarModalLogin() {
    if (modalEmpleados) modalEmpleados.hidden = true;
}

if (botonEmpleados) {
    botonEmpleados.addEventListener("click", async () => {
        if (!supabaseClient) {
            abrirModalLogin();
            mostrarMensajeLogin("No se pudo cargar Supabase.", true);
            return;
        }

        try {
            const { data, error } = await supabaseClient.auth.getSession();
            if (error) throw error;

            if (data.session) {
                await verificarEmpleado(data.session.user);
            } else {
                abrirModalLogin();
            }
        } catch (error) {
            console.error(error);
            abrirModalLogin();
            mostrarMensajeLogin("No se pudo comprobar la sesión.", true);
        }
    });
}

cerrarLogin?.addEventListener("click", cerrarModalLogin);

modalEmpleados?.addEventListener("click", evento => {
    if (evento.target === modalEmpleados) cerrarModalLogin();
});

// ==========================================
// 9. INICIAR SESIÓN
// ==========================================

if (formularioLogin) {
    formularioLogin.addEventListener("submit", async evento => {
        evento.preventDefault();

        if (!supabaseClient) {
            mostrarMensajeLogin("Supabase no está disponible.", true);
            return;
        }

        const email = correoEmpleado.value.trim();
        const password = claveEmpleado.value;

        botonLogin.disabled = true;
        mostrarMensajeLogin("Verificando acceso...");

        try {
            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) throw error;

            const autorizado = await verificarEmpleado(data.user);

            if (!autorizado) {
                await supabaseClient.auth.signOut();
            }
        } catch (error) {
            console.error("Error de inicio de sesión:", error);
            mostrarMensajeLogin(
                "No se pudo iniciar sesión. Verifica tus datos y los permisos de Supabase.",
                true
            );
        } finally {
            botonLogin.disabled = false;
        }
    });
}