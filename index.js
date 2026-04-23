import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

// --- Part 1: Load Latest Projects ---
const projects = await fetchJSON('./lib/projects.json');
const projectsContainer = document.querySelector('.projects');

if (projectsContainer && projects) {
    const latestProjects = projects.slice(0, 3);
    renderProjects(latestProjects, projectsContainer, 'h2');
}

// --- Part 2: Fetch and Display GitHub Stats ---
const githubData = await fetchGitHubData('kanglee05');
const profileStats = document.querySelector('#profile-stats');

if (profileStats && githubData) {
    profileStats.innerHTML = `
          <dl>
            <dt>Public Repos</dt><dd>${githubData.public_repos}</dd>
            <dt>Public Gists</dt><dd>${githubData.public_gists}</dd>
            <dt>Followers</dt><dd>${githubData.followers}</dd>
            <dt>Following</dt><dd>${githubData.following}</dd>
          </dl>
      `;
}