export function initJdTooltips(testMode = false) {
    const wrappers = document.querySelectorAll(".jd-tooltip-wrapper");
    if (!wrappers.length) return;

    const isTouch = window.matchMedia("(hover: none)").matches;

    wrappers.forEach((wrapper) => {
        const trigger = wrapper.querySelector(".jd-tooltip-trigger");
        const panel = wrapper.querySelector(".jd-tooltip-panel");
        const closeBtn = panel.querySelector(".jd-tooltip-close");

        if (!trigger || !panel) return;

        function positionTooltip() {
            const rect = trigger.getBoundingClientRect();
            const panelRect = panel.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            let top, left, posClass;

            if (rect.bottom + panelRect.height + 12 < vh) {
                top = rect.bottom + 10;
                left = rect.left + rect.width / 2 - panelRect.width / 2;
                posClass = "jd-pos-bottom";
            } else if (rect.top - panelRect.height - 12 > 0) {
                top = rect.top - panelRect.height - 10;
                left = rect.left + rect.width / 2 - panelRect.width / 2;
                posClass = "jd-pos-top";
            } else if (rect.left - panelRect.width - 12 > 0) {
                top = rect.top + rect.height / 2 - panelRect.height / 2;
                left = rect.left - panelRect.width - 12;
                posClass = "jd-pos-left";
            } else {
                top = rect.top + rect.height / 2 - panelRect.height / 2;
                left = rect.right + 12;
                posClass = "jd-pos-right";
            }

            if (left < 10) left = 10;
            if (left + panelRect.width > vw - 10)
                left = vw - panelRect.width - 10;

            panel.style.top = `${top}px`;
            panel.style.left = `${left}px`;

            panel.classList.remove(
                "jd-pos-top",
                "jd-pos-bottom",
                "jd-pos-left",
                "jd-pos-right"
            );
            panel.classList.add(posClass);

            const arrow = panel.querySelector(".jd-tooltip-arrow");
            if (!arrow) return;

            const newPanelRect = panel.getBoundingClientRect();
            let arrowOffset;

            if (posClass === "jd-pos-bottom" || posClass === "jd-pos-top") {
                arrowOffset =
                    rect.left + rect.width / 2 - newPanelRect.left - 6;
                arrow.style.left = `${arrowOffset}px`;
                arrow.style.top = "";
                arrow.style.bottom = "";
            } else if (
                posClass === "jd-pos-left" ||
                posClass === "jd-pos-right"
            ) {
                arrowOffset = rect.top + rect.height / 2 - newPanelRect.top - 6;
                arrow.style.top = `${arrowOffset}px`;
                arrow.style.left = "";
                arrow.style.right = "";
            }
        }

        function show() {
            panel.classList.add("jd-tooltip-visible");
            positionTooltip();
        }

        function hide() {
            panel.classList.remove("jd-tooltip-visible");
        }

        if (testMode) {
            show();
            window.addEventListener("resize", positionTooltip);
            return; // No agregar eventos normales
        }

        if (!isTouch) {
            let overTrigger = false;
            let overPanel = false;

            trigger.addEventListener("mouseenter", () => {
                overTrigger = true;
                show();
            });
            trigger.addEventListener("mouseleave", () => {
                overTrigger = false;
                setTimeout(() => {
                    if (!overPanel) hide();
                }, 80);
            });

            panel.addEventListener("mouseenter", () => (overPanel = true));
            panel.addEventListener("mouseleave", () => {
                overPanel = false;
                if (!overTrigger) hide();
            });
        }

        if (isTouch) {
            trigger.addEventListener("click", (e) => {
                e.stopPropagation();
                if (panel.classList.contains("jd-tooltip-visible")) hide();
                else show();
            });

            closeBtn.addEventListener("click", hide);
            document.addEventListener("click", hide);
        } else {
            closeBtn.addEventListener("click", hide);
        }
    });

    window.addEventListener("resize", () => {
        document
            .querySelectorAll(".jd-tooltip-panel.jd-tooltip-visible")
            .forEach((p) => (p.style.left = p.style.top = ""));
    });
}
