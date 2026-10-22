
const formulario = document.getElementById("formulario-reserva");
const mensaje = document.getElementById("mensaje");
const campoFecha = document.getElementById("fecha");

// Evitar que se seleccionen fechas anteriores a hoy.
const hoy = new Date();
const fechaLocal = new Date(
    hoy.getTime() - hoy.getTimezoneOffset() * 60000
).toISOString().split("T")[0];

campoFecha.min = fechaLocal;

formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const datos = new FormData(formulario);
    const dueno = datos.get("dueno").trim();
    const mascota = datos.get("mascota").trim();
    const servicio = datos.get("servicio");
    const fecha = datos.get("fecha");

    mensaje.textContent =
        `¡Gracias, ${dueno}! La solicitud de cita para ${mascota} ` +
        `(${servicio}) para el ${fecha} está lista para demostración. ` +
        "Aún falta conectar el sistema para registrar la reserva.";

    mensaje.style.color = "#654b76";
});
