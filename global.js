console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title: 'Resume' },
  { url: 'contact/', title: 'Contact' },
  { url: 'https://github.com/kanglee05', title: 'GitHub' } 
];

let nav = document.createElement('nav');
document.body.prepend(nav);

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  
  : "/portfolio/";         

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  if (!url.startsWith('http')) {
    url = BASE_PATH + url;
  }

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  if (a.host !== location.host) {
    a.target = "_blank";
  }

  nav.append(a);
}

// --- Step 4.2: Add Dark Mode Switcher HTML ---
document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

// --- Step 4.4 & 4.5: Handle Theme Switching and LocalStorage ---
let select = document.querySelector('.color-scheme select');

// Function to apply the theme and update the dropdown UI
function setColorScheme(colorScheme) {
  document.documentElement.style.setProperty('color-scheme', colorScheme);
  select.value = colorScheme;
}

// Listen for user changes
select.addEventListener('input', function (event) {
  console.log('Color scheme changed to', event.target.value);
  setColorScheme(event.target.value);
  
  // Save preference to localStorage
  localStorage.colorScheme = event.target.value;
});

// On page load, check if the user has a saved preference
if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
}

// --- Step 5: Better Contact Form Interception ---
let form = document.querySelector('form');

// Use optional chaining (?.) so this script doesn't crash on pages without a form
form?.addEventListener('submit', function (event) {
  // 1. Stop the browser from doing its default ugly submission
  event.preventDefault();

  // 2. Gather all the data the user typed in
  let data = new FormData(form);

  // 3. Start building the URL using the form's action attribute (mailto:your@email.com)
  // We add the '?' to start the URL parameters
  let url = form.action + '?'; 

  // 4. Iterate over the data and add it to the URL
  for (let [name, value] of data) {
    // encodeURIComponent converts spaces to %20 and handles special characters safely
    url += `${name}=${encodeURIComponent(value)}&`;
    
    // Example of what the loop is building:
    // 1st pass: "mailto:your@email.com?subject=Hello%20World&"
    // 2nd pass: "mailto:your@email.com?subject=Hello%20World&body=How%20are%20you&"
  }

  // 5. Clean up the trailing '&' at the very end of the string
  // This is a subtle bug-fix to make the URL perfectly formatted!
  url = url.slice(0, -1);

  // 6. Open the mail client with the perfectly formatted URL
  location.href = url;
});