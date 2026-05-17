// Clubs directory – fetch all clubs from backend and filter client-side
let allClubs = [];

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('clubs-container');
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const resultCount = document.getElementById('result-count');

  // Read query params from home page links
  const params = new URLSearchParams(window.location.search);
  if (params.get('q')) searchInput.value = params.get('q');
  if (params.get('category')) categoryFilter.value = params.get('category');

  try {
    const response = await fetch('/clubs');
    if (!response.ok) throw new Error('Failed to load clubs');

    allClubs = await response.json();
    populateCategories(allClubs);
    renderClubs();
  } catch (err) {
    console.error(err);
    container.innerHTML =
      '<p class="status error">Could not load clubs. Make sure the server is running.</p>';
  }

  searchInput.addEventListener('input', renderClubs);
  categoryFilter.addEventListener('change', renderClubs);

  function populateCategories(clubs) {
    const categories = [...new Set(clubs.map((c) => c.category).filter(Boolean))];
    categories.sort();
    categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });
    if (params.get('category')) {
      categoryFilter.value = params.get('category');
    }
  }

  function renderClubs() {
    const query = searchInput.value.toLowerCase().trim();
    const category = categoryFilter.value;

    const filtered = allClubs.filter((club) => {
      const matchesCategory = !category || club.category === category;
      const text =
        `${club.clubName} ${club.category} ${club.description}`.toLowerCase();
      const matchesSearch = !query || text.includes(query);
      return matchesCategory && matchesSearch;
    });

    resultCount.textContent = `${filtered.length} club${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
      container.innerHTML = '<p class="status">No clubs match your search.</p>';
      return;
    }

    container.innerHTML = filtered
      .map(
        (club) => `
      <article class="club-card">
        <span class="category">${escapeHtml(club.category || 'General')}</span>
        <h3>${escapeHtml(club.clubName)}</h3>
        <p>${escapeHtml(truncate(club.description, 120))}</p>
        <a href="club.html?id=${club.id}">View details &rarr;</a>
      </article>
    `
      )
      .join('');
  }
});

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function truncate(text, len) {
  if (!text) return '';
  return text.length > len ? text.slice(0, len) + '…' : text;
}
