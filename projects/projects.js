import { fetchJSON, renderProjects } from '../global.js';

// Load data
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

// Render projects
if (projectsContainer && projects) {
  renderProjects(projects, projectsContainer, 'h2');
}

// Step 1.6: Update the project count in the header
const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle && projects) {
  projectsTitle.textContent = `${projects.length} Projects`;
}

