/**
 * @description Inicializa todos los acordeones reutilizables de la página.
 * Busca secciones con '.jd-accordion-section' y les añade la funcionalidad.
 */
export function initJdAccordions() {
    const sections = document.querySelectorAll(".jd-accordion-section");

    sections.forEach((section) => {
        const toggleBtn = section.querySelector(".jd-accordion-toggle");
        const contentBody = section.querySelector(".jd-accordion-body");

        if (!toggleBtn || !contentBody) {
            return;
        }

        toggleBtn.addEventListener("click", () => {
            const isCollapsed = section.classList.contains("is-collapsed");
            toggleBtn.classList.toggle("active");
            // Cambia el texto del botón
            const textSpan = toggleBtn.querySelector("span");
            if (textSpan) {
                textSpan.textContent = isCollapsed ? "Ocultar" : "Mostrar";
            }

            // Alterna la clase que controla el estado
            section.classList.toggle("is-collapsed");
        });
    });
}
