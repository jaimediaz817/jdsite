export function initLibIntroJS() {
    // API correcta para Intro.js v8.3.2
    const tour = introJs.tour();

    tour.setOptions({
        steps: [
            {
                element: "#welcome-terminal",
                title: "Terminal interactiva",
                intro: `
                    Esta es mi terminal interactiva.<br>
                    Aquí muestro automáticamente los repositorios de mis
                    cuentas de GitHub y proporciono enlaces para abrirlos
                    en una pestaña nueva.
                `,
                position: "auto",
            },
            {
                element: "#acordion-section-skills",
                title: "Acordeones minimalistas personalizados",
                intro: `
                    He integrado estos acordeones minimalistas personalizados para mejorar la experiencia de usuario dado la cantidad de contenido y elementos en mi web personal.
                `,
                position: "auto",
            },
            {
                element: "#formContact",
                title: "Formulario de contacto",
                intro: `
                    Aquí puedes enviarme un mensaje directamente desde la web.<br>
                    Utilizo AWS SES (por ahora modo SANDBOX) para gestionar el envío de correos usando templates personalizados (DJANGO).
                `,
                position: "auto",
            },
        ],
        nextLabel: "Siguiente ›",
        prevLabel: "‹ Anterior",
        doneLabel: "Entendido",
        skipLabel: "Saltar",
        showStepNumbers: false,
        showBullets: false,
        overlayOpacity: 0.75,
    });

    // Botón para lanzar el tour manualmente
    const helpBtn = document.getElementById("btn-terminal-help");
    if (helpBtn) {
        helpBtn.addEventListener("click", () => tour.start());
    }

    // NUEVO: Botón para ir directamente al paso del formulario de contacto (paso 3)
    const contactHelpBtn = document.getElementById("show-contact-help");

    // HTML Y JS: - IR A UNA EXPLICACION DIRECTA
    // <button id="show-contact-help">Ayuda del formulario</button>
    // if (contactHelpBtn) {
    //     contactHelpBtn.addEventListener("click", () => {
    //         tour.start().goToStep(3);
    //     });
    // }
}
