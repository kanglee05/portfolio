console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Step 3.1: Define the pages
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title: 'Resume' },
  { url: 'contact/', title: 'Contact' },
  { url: 'https://github.com/kanglee05', title: 'GitHub' } // Your actual GitHub profile
];

// Create the <nav> element and prepend it to the top of the body
let nav = document.createElement('nav');
document.body.prepend(nav);

// Are we on the local machine or GitHub Pages?
// IMPORTANT: Change "/website/" to exactly match your GitHub repository name 
// (e.g., "/portfolio/" or "/kanglee05.github.io/")
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  
  : "/portfolio/";         

// Step 3.2: Iterate over the pages to generate the links
for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Prefix relative URLs with the correct base path
  if (!url.startsWith('http')) {
    url = BASE_PATH + url;
  }

  // Create the link element
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  // Add the 'current' class if it matches the current page
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links (like GitHub) in a new tab
  if (a.host !== location.host) {
    a.target = "_blank";
  }

  // Append the fully configured link to the <nav>
  nav.append(a);
}