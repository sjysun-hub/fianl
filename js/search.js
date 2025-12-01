// js/search.js
// 负责：监听顶部搜索框，更新 PlantFilters 的搜索词

window.PlantSearch = {
  init() {
    const input = document.getElementById('plant-search');
    if (!input) {
      console.warn('PlantSearch: #plant-search not found');
      return;
    }

    input.addEventListener('input', () => {
      if (!window.PlantFilters || typeof window.PlantFilters.setSearchTerm !== 'function') {
        return;
      }
      window.PlantFilters.setSearchTerm(input.value);
    });

    // 清空时也触发一次（防止浏览器自动填充）
    if (input.value) {
      window.PlantFilters.setSearchTerm(input.value);
    }

    console.log('PlantSearch.init done');
  }
};
