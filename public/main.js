// Home page – fetch clubs to show featured categories
document.addEventListener('DOMContentLoaded', async () => {
  const categoryContainer = document.getElementById('featured-categories');
  const searchInput = document.getElementById('home-search');
  const searchBtn = document.getElementById('search-btn');

  // Search button passes query to clubs page
  searchBtn.addEventListener('click', (e) => {
    const q = searchInput.value.trim();
    if (q) {
      e.preventDefault();
      window.location.href = `clubs.html?q=${encodeURIComponent(q)}`;
    }
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchInput.value.trim();
      window.location.href = q
        ? `clubs.html?q=${encodeURIComponent(q)}`
        : 'clubs.html';
    }
  });

  try {
    const response = await fetch('/clubs');
    if (!response.ok) throw new Error('Failed to load clubs');

    const clubs = await response.json();

    // Build unique categories (up to 8 for display)
    const categories = [...new Set(clubs.map((c) => c.category).filter(Boolean))];
    categories.sort();
    const featured = categories.slice(0, 8);

    categoryContainer.innerHTML = featured
      .map(
        (cat) =>
          `<a class="category-pill" href="clubs.html?category=${encodeURIComponent(cat)}">${cat}</a>`
      )
      .join('');
  } catch (err) {
    console.error(err);
    categoryContainer.innerHTML =
      '<p class="status">Could not load categories. Visit the Clubs page to browse.</p>';
  }
});
