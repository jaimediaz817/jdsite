// github.js - Lógica para consumir la API de GitHub de Django.
// Depende de jQuery ($) y asume que window.JD_API.GITHUB_REPOS_URL está definida.

// Selectores del DOM para contadores (Asegúrate de que estos IDs existan en home.html)
const $personalCountSpan = $("#personal-repos-count");
const $profesionalCountSpan = $("#profesional-repos-count");
const $projectsContainer = $("#github-projects-container");
const LOADER_HTML = `
    <div class="col-12 text-center py-5">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando repositorios...</span>
        </div>
    </div>`;

/**
 * ── GITHUB REPOS CARRUSEL ──
 * Construye slides con los repositorios y lanza el Swiper de scroll infinito.
 */
function renderGitHubCarousel(repos) {
    const $wrapper = $('#github-carousel-wrapper');
    if (!$wrapper.length) return;

    $wrapper.empty();

    // Duplicar repos para que el loop infinito se sienta natural
    var carouselItems = repos; // ← solo los originales

    carouselItems.forEach(function(repo) {
        // 1. Convertimos el string en un objeto URL para poder descomponerlo
        const urlObj = new URL(repo.html_url);
        // 2. urlObj.pathname nos da "/jaimediaz817/jdsite"
        // 3. Al hacer split('/') obtenemos ['', 'jaimediaz817', 'jdsite']
        const username = urlObj.pathname.split('/')[1];
        console.log(username); // Resultado: jaimediaz817

        var lang = (repo.language || 'default').toLowerCase();
        var iconClass = 'lang-default';
        var deviconClass = 'fas fa-code';

        // Mapear lenguaje a icono devicon + clase de color
        if (lang === 'python' || lang === 'py') {
            iconClass = 'lang-python';
            deviconClass = 'fab fa-python';
        } else if (lang === 'javascript' || lang === 'js') {
            iconClass = 'lang-javascript';
            deviconClass = 'fab fa-js';
        } else if (lang === 'typescript' || lang === 'ts') {
            iconClass = 'lang-typescript';
            deviconClass = 'fab fa-js';
        } else if (lang === 'html') {
            iconClass = 'lang-html';
            deviconClass = 'fab fa-html5';
        } else if (lang === 'css') {
            iconClass = 'lang-css';
            deviconClass = 'fab fa-css3-alt';
        } else if (lang === 'java') {
            iconClass = 'lang-java';
            deviconClass = 'fab fa-java';
        } else if (lang === 'php') {
            iconClass = 'lang-default';
            deviconClass = 'fab fa-php';
        } else if (lang === 'ruby' || lang === 'rb') {
            iconClass = 'lang-default';
            deviconClass = 'fas fa-gem';
        }

        var ownerTag = repo.owner_tag || 'personal';
        var stars = repo.stars || 0;
        var desc = repo.description || 'Sin descripción';
        if (desc.length > 100) desc = desc.substring(0, 97) + '...';

        const slideHtml = `
            <div class="swiper-slide github-repo-slide">
                <div class="github-repo-card">
                    <div class="repo-card-header">
                        <div class="repo-card-icon ${iconClass}"><i class="${deviconClass}"></i></div>
                        <div class="repo-card-name">
                            <a href="${repo.html_url}" target="_blank" rel="noopener">${repo.name}</a>
                        </div>
                    </div>
                    <div class="repo-card-desc">${desc}</div>
                    <div class="repo-card-footer">
                        <span class="repo-card-badge ${ownerTag}">
                            <i class="fas fa-circle" style="font-size:0.4rem;"></i> 
                            ${ownerTag === 'personal' ? 'Personal' : 'Profesional'}
                        </span>
                        <span class="repo-card-stars"><i class="fas fa-star"></i> ${stars}</span>
                        <a href="${repo.html_url}" target="_blank" rel="noopener" class="repo-card-link">
                            <i class="fas fa-external-link-alt"></i> Repo
                        </a>
                    </div>
                    <div class="repo-card-footer username">
                        <span class="repo-card-username">${username}</span>
                    </div>
                </div>
            </div>
        `;

        $wrapper.append(slideHtml);
    });
}

/**
 * @description Renderiza dinámicamente la lista de proyectos y actualiza contadores.
 * @param {object} data - Objeto JSON con las propiedades total_counts y projects_grouped.
 */
function renderGitHubRepos(data) {
    const counts = data.total_counts;
    const groups = data.projects_grouped;

    // 1. Actualizar los conteos
    if ($personalCountSpan.length) {
        $personalCountSpan.text(counts.personal || 0);
    }
    if ($profesionalCountSpan.length) {
        $profesionalCountSpan.text(counts.profesional || 0);
    }

    // 2. Limpiar y renderizar
    $projectsContainer.empty();
    let totalProjectsRendered = 0;

    // Lista temporal para combinar y ordenar todos los repositorios para la vista web
    let allRepos = [];
    for (const ownerTag in groups) {
        if (groups.hasOwnProperty(ownerTag)) {
            allRepos = allRepos.concat(groups[ownerTag]);
        }
    }

    // Ordenar por fecha de actualización (el más reciente primero)
    allRepos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    console.log("Repositorios ordenados por fecha de actualización:", allRepos);

    // ── INYECTAR SLIDES DEL CARRUSEL ──
    renderGitHubCarousel(allRepos);

    allRepos.forEach((repo) => {
        const ownerLabel =
            repo.owner_tag.charAt(0).toUpperCase() + repo.owner_tag.slice(1);
        const ownerColor = repo.owner_tag === "personal" ? "info" : "success";

        const repoHtml = `
            <div class="col-md-4 mb-4" data-aos="fade-up">
                <div class="card h-100 shadow-sm">
                    <div class="card-body">                        
                        <span class="badge bg-${ownerColor} mb-2">${ownerLabel}</span>
                        <h5 class="card-title text-primary">${repo.name}</h5>
                        <p class="card-text">${
                            repo.description || "Sin descripción."
                        }</p>
                        <p class="text-muted small">Lenguaje: ${
                            repo.language || "N/A"
                        }</p>
                        <a href="${
                            repo.html_url
                        }" target="_blank" class="btn btn-outline-primary btn-sm">
                            Ver Código <i class="fa-solid fa-code"></i>
                        </a>
                    </div>
                    <div class="card-footer bg-light border-0 small">
                        <span><i class="fas fa-star text-warning"></i> ${
                            repo.stars
                        }</span>
                    </div>
                </div>
            </div>
        `;
        $projectsContainer.append(repoHtml);
        totalProjectsRendered++;
    });

    if (totalProjectsRendered === 0) {
        $projectsContainer.html(
            '<p class="col-12 text-muted text-center py-5">No se encontraron repositorios destacados.</p>'
        );
    }

    if (typeof AOS !== "undefined") {
        AOS.refresh();
    }
}

/**
 * @description Llama a la API de Django para obtener los repositorios de GitHub.
 * @returns {Promise<Array>} Resuelve con una lista PLANA y FORMATEADA para la terminal.
 */
// github.js (función window.loadGitHubData modificada)

window.loadGitHubData = function () {
    return new Promise((resolve, reject) => {
        $projectsContainer.html(LOADER_HTML);
        const apiUrl = window.JD_API.GITHUB_REPOS_URL;
        if (!apiUrl) {
            reject("API URL no definida");
            return;
        }

        $.ajax({
            url: apiUrl,
            method: "GET",
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    renderGitHubRepos(response); // Renderiza la sección web

                    // --- PREPARACIÓN PARA LA TERMINAL ---
                    const MAX_NAME_LENGTH = 55; // Longitud fija para la columna del nombre
                    let terminalGroups = {}; // Objeto que contendrá los repos agrupados

                    for (const ownerTag in response.projects_grouped) {
                        if (
                            response.projects_grouped.hasOwnProperty(ownerTag)
                        ) {
                            const ownerPrefix =
                                ownerTag === "personal" ? "P" : "PRO";

                            // Mapeamos el array de repositorios para formatear el 'label'
                            const formattedRepos = response.projects_grouped[
                                ownerTag
                            ].map((repo, index) => {
                                // 1. LÓGICA DE NUMERACIÓN
                                const repoNumber = index + 1 + ".";
                                const paddedNumber = repoNumber.padEnd(4);

                                // 🔑 CLAVE: Envolver paddedNumber en un <span>
                                // Usamos una clase para que puedas darle estilo en SCSS
                                const numberedPrefix = `<span class="jd-repo-number">${paddedNumber}</span>`;

                                // 2. TRUNCADO y PADDING para la alineación del nombre
                                let repoNameDisplay = repo.name;
                                if (repoNameDisplay.length > MAX_NAME_LENGTH) {
                                    repoNameDisplay =
                                        repoNameDisplay.substring(
                                            0,
                                            MAX_NAME_LENGTH - 3
                                        ) + "...";
                                }
                                const name =
                                    repoNameDisplay.padEnd(MAX_NAME_LENGTH);

                                const language = repo.language || "N/A";
                                const description = repo.description
                                    ? repo.description
                                    : "Sin descripción....";

                                return {
                                    name: repo.name,
                                    // 🔑 CONSTRUIR el label AÑADIENDO el SPAN con el número
                                    // ¡Importante!: Esto ahora contiene código HTML no escapado
                                    label: `${numberedPrefix}${name} · ${language.padEnd(
                                        10
                                    )} · ${description}`,
                                    url: repo.html_url,
                                    html_url: repo.html_url,
                                };
                            });

                            // Llenamos el objeto de grupos para la terminal
                            terminalGroups[ownerTag] = formattedRepos;
                        }
                    }

                    // 🔑 LÍNEA CLAVE: Devolver el objeto AGRUPADO que espera jdController.js
                    resolve({
                        groups: terminalGroups,
                        counts: response.total_counts,
                    });
                } else {
                    reject("Fallo en la respuesta de la API");
                }
            },
            error: function (xhr, status, error) {
                // Manejo de error en el DOM
                $projectsContainer.html(
                    '<p class="text-danger col-12 text-center py-5">Error al conectar con la API.</p>'
                );
                reject("Fallo en la conexión AJAX");
            },
        });
    });
};
