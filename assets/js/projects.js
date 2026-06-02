// Load projects from JSON and render cards
async function loadProjects() {
    try {
        // Fetch project data
        const response = await fetch(`${pathPrefix}assets/data/projects.json`);
        let projects = await response.json();

        // Sort by ID descending (newest first)
        projects.sort((a, b) => b.id - a.id);

        // Store globally for modal usage
        window.allProjects = projects;

        // DOM references
        const leftCol = document.getElementById('left-column-projects');
        const rightCol = document.getElementById('right-column-projects');
        const featureContainer = document.getElementById('feature-project-container');

        if (leftCol && rightCol) {
            leftCol.innerHTML = '';
            rightCol.innerHTML = '';

            // Handle custom featured project logic
            let featuredProject = projects.find(p => p.featured === true || p.destaque === true);
            let otherProjects;

            if (featureContainer && projects.length > 0) {
                if (!featuredProject) {
                    featuredProject = projects[0];
                }
                renderFeatureCard(featuredProject);
            }

            // Detect if user is on the full projects page
            const isAllProjectsPage = window.location.pathname.includes('projetos.html');

            // Filters out "other projects" to remove the one that was chosen as featured.
            const filteredProjects = projects.filter(p => p.id !== featuredProject?.id);

            // Select which projects should be displayed
            if (isAllProjectsPage) {
                otherProjects = filteredProjects;
            } else {
                // Home page shows only first 6 from the rest
                otherProjects = filteredProjects.slice(0, 6);
            }

            // Distribute project cards between left and right columns
            otherProjects.forEach((project, index) => {
                const cardHTML = generateCardHTML(project);

                if (index % 2 === 0) {
                    leftCol.innerHTML += cardHTML;
                } else {
                    rightCol.innerHTML += cardHTML;
                }
            });
        }
    } catch (error) {
        console.error("Erro ao carregar projetos:", error);
    }
}

// Handle hybrid background (image or HEX color)
function getBackgroundStyle(coverValue, opacity = 0.7) {
    const overlay = `linear-gradient(rgba(0,0,0,${opacity}), rgba(0,0,0,${opacity}))`;

    // If value is a HEX color use background color
    if (coverValue && coverValue.startsWith('#')) {
        return `background: ${overlay}, ${coverValue};`;
    }

    // Otherwise treat as image path
    return `background-image: ${overlay}, url('${pathPrefix}${coverValue}');`;
}

// Generate project card HTML
function generateCardHTML(project) {
    const bgStyle = getBackgroundStyle(project.images?.cover, 0.7);

    return `
        <article onclick="openModal(${project.id})" 
            style="${bgStyle}"
            class="flex items-center justify-between h-[100px] w-[350px] cursor-pointer rounded-[15px] bg-cover bg-center px-[30px] py-[30px] transition-all hover:scale-[1.02] md:w-[326px] xl:w-[416px]">
            <h3 class="text-[14px] font-semibold text-white md:text-[16px]">${project.name}</h3>
            <i class="fa-solid fa-expand text-[16px] text-white md:text-[18px]"></i>
        </article>
    `;
}

// Render featured project card (used on homepage)
function renderFeatureCard(project) {
    const container = document.getElementById('feature-project-container');
    if (!container) return;

    // Apply background style (image or color)
    container.setAttribute('style', getBackgroundStyle(project.images?.cover, 0.8));

    const iconClass = "group flex h-[30px] w-[30px] items-center justify-center rounded-full border border-white transition-all duration-500 hover:scale-110";

    // Helper to generate project links (figma, github, deploy)
    const getLinkHTML = (url, icon, label) => {
        const isValid = url && url !== "#" && url !== "";
        return `
            <li class="${iconClass} ${!isValid ? 'project-link-disabled' : ''}" title="${isValid ? label : 'Não disponível'}">
                <a href="${isValid ? url : 'javascript:void(0)'}" ${isValid ? 'target="_blank"' : ''} style="${!isValid ? 'pointer-events:none' : ''}">
                    <i class="${icon} text-[15px] text-white transition-transform duration-500 group-hover:[transform:rotateY(360deg)]"></i>
                </a>
            </li>`;
    };

    container.innerHTML = `
        <header class="flex items-center justify-between py-[30px]">
            <h3 class="text-[14px] font-semibold text-white md:text-[16px]">${project.name}</h3>
            <span title="Destaque">
                <i class="fa-solid fa-star text-[16px] text-yellow-500 md:text-[20px]"></i>
            </span>
        </header>
        <div class="flex flex-col gap-[30px] py-[30px] md:flex-row md:justify-between">
            <p class="text-[12px] text-justify text-gray-400 md:w-[500px] md:text-[14px]">${project.description}</p>
            <nav aria-label="Links do projeto">
                <ul class="flex justify-center gap-[10px] md:flex-col">
                    ${getLinkHTML(project.links?.figma, 'fa-brands fa-figma', 'Figma')}
                    ${getLinkHTML(project.links?.github, 'fa-brands fa-github', 'GitHub')}
                    ${getLinkHTML(project.links?.deploy, 'fa-solid fa-eye', 'Deploy')}
                </ul>
            </nav>
        </div>
    `;
}

// Initialize project loading
loadProjects();

// Open project modal and populate data
function openModal(projectId) {
    const project = window.allProjects.find(p => p.id === projectId);
    const modal = document.getElementById('project-modal');
    if (!project || !modal) return;

    // Populate modal content
    modal.querySelector('#modal-title').textContent = project.name;
    modal.querySelector('img').src = `${pathPrefix}${project.images?.preview || project.images?.cover || ''}`;
    modal.querySelector('p').textContent = project.description;

    // Update project links
    const links = modal.querySelectorAll('nav a');
    const projectLinks = [project.links?.figma, project.links?.github, project.links?.deploy];

    projectLinks.forEach((url, index) => {
        const anchor = links[index];
        if (!anchor) return;

        const listItem = anchor.parentElement;
        const isValid = url && url !== "#" && url !== "";

        anchor.href = isValid ? url : "javascript:void(0)";
        anchor.style.pointerEvents = isValid ? "auto" : "none";

        if (isValid) {
            anchor.setAttribute('target', '_blank');
        } else {
            anchor.removeAttribute('target');
        }

        if (listItem) {
            listItem.classList.toggle('project-link-disabled', !isValid);
        }
    });

    // Show modal
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

// Close project modal and restore scroll
function closeModal() {
    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }
}

// Global modal interactions
document.addEventListener('click', (e) => {
    // Close if clicking the close button
    if (e.target.closest('[aria-label="Fechar modal"]')) {
        closeModal();
    }

    // Close if clicking overlay
    if (e.target.id === 'overlay' || e.target.id === 'overlay-modal') {
        closeModal();
    }
});