// js/main.js
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded, starting app...');

  if (window.PlantMap && typeof window.PlantMap.init === 'function') {
    window.PlantMap.init();
  }

  if (window.PlantFilters && typeof window.PlantFilters.init === 'function') {
    window.PlantFilters.init();
  }

  if (window.PlantList && typeof window.PlantList.init === 'function') {
    window.PlantList.init();
  }

  // ⭐ 这一段一定要有
  if (window.PlantSearch && typeof window.PlantSearch.init === 'function') {
    window.PlantSearch.init();
  }
});
