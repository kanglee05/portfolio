import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// --- 1. Load Initial Data ---
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');

if (projectsTitle && projects) {
  projectsTitle.textContent = `${projects.length} Projects`;
}

// --- 2. D3 Global Setup ---
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);

// ==========================================
// --- 3. THE EXTRA CREDIT FIX: STATE MANAGEMENT ---
// ==========================================
// We store the current state of both filters globally
let query = '';
let selectedYear = '';

// This function acts as a "Single Source of Truth"
function filterData() {
  // 1. Filter the project grid based on BOTH the search query AND the clicked year
  let filteredProjects = projects.filter((project) => {
    let matchesQuery = Object.values(project).join('\n').toLowerCase().includes(query);
    let matchesYear = selectedYear ? project.year === selectedYear : true;
    return matchesQuery && matchesYear;
  });

  // 2. The pie chart should only reflect the search query (so we can still see the year distribution)
  let projectsByYear = projects.filter((project) => {
    let matchesQuery = Object.values(project).join('\n').toLowerCase().includes(query);
    return matchesQuery;
  });

  // 3. Re-render both components with the new data
  if (projectsContainer) {
    renderProjects(filteredProjects, projectsContainer, 'h2');
  }
  renderPieChart(projectsByYear);
}
// ==========================================


// --- 4. Render Pie Chart ---
function renderPieChart(projectsGiven) {
  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();

  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  // Check if the globally selected year is in the current data to preserve highlights
  let selectedIndex = newData.findIndex((d) => d.label === selectedYear);

  newArcs.forEach((arc, i) => {
    svg.append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      // Add the 'selected' class if it matches the global state
      .attr('class', i === selectedIndex ? 'selected' : '') 
      .on('click', () => {
        // Toggle the global state variable
        selectedYear = selectedYear === newData[i].label ? '' : newData[i].label;
        // Run the unified filter function
        filterData(); 
      });
  });

  newData.forEach((d, idx) => {
    legend.append('li')
      .attr('style', `--color:${colors(idx)}`)
      // Add the 'selected' class to the legend if it matches
      .attr('class', idx === selectedIndex ? 'legend-item selected' : 'legend-item') 
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

// --- 5. Search Bar Listener ---
let searchInput = document.querySelector('.searchBar');

if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    // Update the global query state
    query = event.target.value.toLowerCase();
    // Run the unified filter function
    filterData(); 
  });
}

// --- 6. Initial Render ---
// Call filterData on load so it draws the initial grid and pie chart
filterData();