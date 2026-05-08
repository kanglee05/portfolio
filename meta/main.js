import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// --- Step 1.1: Read the CSV File ---
async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line), 
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

// --- Step 1.2: Compute Commit Data ---
function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];

      // Extract properties from the first line
      let { author, date, time, timezone, datetime } = first;

      // Build the new commit object
      let ret = {
        id: commit,
        url: 'https://github.com/kanglee05/portfolio/commit/' + commit, // Make sure to replace YOUR_GITHUB_USERNAME here later!
        author,
        date,
        time,
        timezone,
        datetime,
        // Calculate hour as a decimal (e.g., 2:30 PM = 14.5)
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        // Total lines modified in this commit
        totalLines: lines.length,
      };

      // Hide the original lines array so it doesn't clutter console.logs
      Object.defineProperty(ret, 'lines', {
        value: lines,
        configurable: true,
        writable: true,
        enumerable: false, // This is what hides it!
      });

      return ret;
    });
}

// --- Step 1.3: Display the Stats ---
function renderCommitInfo(data, commits) {
  // Create the dl element
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // 1. Add total LOC
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // 2. Add total commits
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // 3. Number of files in the codebase (using d3.group to find unique values)
  const numFiles = d3.group(data, d => d.file).size;
  dl.append('dt').text('Number of files');
  dl.append('dd').text(numFiles);

  // 4. Maximum file length (in lines)
  const maxLineLength = d3.max(data, d => d.line);
  dl.append('dt').text('Max lines in a file');
  dl.append('dd').text(maxLineLength);

  // 5. Average file length (Grouped Aggregates)
  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (v) => v.line),
    (d) => d.file
  );
  const averageFileLength = d3.mean(fileLengths, (d) => d[1]);
  dl.append('dt').text('Avg file length');
  dl.append('dd').text(Math.round(averageFileLength));

  // 6. Time of day that most work is done (Min/Max Value finding)
  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
  );
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
  dl.append('dt').text('Most active time');
  dl.append('dd').text(maxPeriod);
}

// --- Step 3: Tooltip Helper Functions ---
function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id.slice(0, 7); // Slices the ID to make it look like a standard short Git SHA
  date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
  time.textContent = commit.time;
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  // I added a small offset (15px) so the tooltip doesn't get in the way of your cursor!
  tooltip.style.left = `${event.clientX + 15}px`;
  tooltip.style.top = `${event.clientY + 15}px`;
}

// --- Step 2, 3, 4, & 5: Render Scatterplot with Brushing ---
function renderScatterPlot(commits) {
  // 1. Setup Dimensions and Margins
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // 2. Create the SVG Container
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // 3. Create Scales
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice(); 

  const yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3
    .scaleSqrt() 
    .domain([minLines, maxLines])
    .range([2, 30]);

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  // Add Gridlines
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  gridlines.call(
    d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width)
  );

  // Add Axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  svg.append('g').attr('transform', `translate(0, ${usableArea.bottom})`).call(xAxis);
  svg.append('g').attr('transform', `translate(${usableArea.left}, 0)`).call(yAxis);

  // --- Step 5.1 & 5.4: Initialize Brush ---
  // We do this BEFORE drawing the dots, but then use raise() later to fix the layering
  svg.call(d3.brush().on('start brush end', brushed));

  // --- Draw the Dots ---
  const dots = svg.append('g').attr('class', 'dots');
  
  dots
    .selectAll('circle')
    .data(sortedCommits) 
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines)) 
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7) 
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); 
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7); 
      updateTooltipVisibility(false);
    });

  // --- Step 5.2: Getting Tooltips Back ---
  // Raise dots so they are drawn OVER the brush overlay, allowing hover events to trigger
  svg.selectAll('.dots, .overlay ~ *').raise();

  // --- Step 5.4, 5.5, 5.6: Brushing Logic ---
  // We place these functions inside renderScatterPlot so they have access to xScale and yScale!
  
  function isCommitSelected(selection, commit) {
    if (!selection) return false;
    
    // The selection array looks like [[xMin, yMin], [xMax, yMax]]
    const [[x0, y0], [x1, y1]] = selection;
    
    // Map the commit's data to X/Y coordinates to see if it falls inside the box
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);

    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
  }

  function renderSelectionCount(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];

    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;

    return selectedCommits;
  }

  function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
    const container = document.getElementById('language-breakdown');

    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }

    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);

    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type
    );

    // Update DOM with breakdown
    container.innerHTML = '';

    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);

      container.innerHTML += `
              <dt>${language}</dt>
              <dd>${count} lines (${formatted})</dd>
          `;
    }
  }

  function brushed(event) {
    const selection = event.selection;
    
    // 1. Highlight selected dots
    d3.selectAll('circle').classed('selected', (d) => isCommitSelected(selection, d));
    
    // 2. Update the text counter
    renderSelectionCount(selection);
    
    // 3. Update the language breakdown grid
    renderLanguageBreakdown(selection);
  }
}

// --- Initialize Everything ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
      let data = await loadData();
      let commits = processCommits(data);
      
      renderCommitInfo(data, commits);
      
      // Step 2: Call the new function!
      renderScatterPlot(commits); 
    } catch (error) {
      console.error("Error loading or processing data:", error);
    }
});