// js/filters.js
// 负责：
// 1. 监听 Seasons / Category / Favorites 三组 chip 的点击
// 2. 保存当前筛选状态 + 搜索词
// 3. 根据所有条件过滤 window.PlantsData
// 4. 更新右侧列表 + 地图上的 marker

window.PlantFilters = {
  // seasons: all | spring | summer | fall | winter
  currentSeason: 'all',
  // category: all | trees | shrubs | vines | perennials | ferns | grasses
  currentCategory: 'all',
  // favorites: all | fav
  currentFavoritesMode: 'all',
  // 搜索词（小写）
  currentSearchTerm: '',

  init() {
    // Seasons 这组你之前叫 .filter-month，现在 UI 上是 Seasons，所以两种 class 都兼容一下
    this.seasonGroupEl = document.querySelector('.filter-seasons, .filter-month');
    this.categoryGroupEl = document.querySelector('.filter-category');
    this.favGroupEl = document.querySelector('.filter-favorites');

    // ---- Seasons chips ----
    if (this.seasonGroupEl) {
      this.seasonGroupEl.addEventListener('click', (evt) => {
        const btn = evt.target.closest('.filter-chip');
        if (!btn) return;

        this.setActiveChip(this.seasonGroupEl, btn);

        const value = (btn.dataset.month || '').toLowerCase();
        // data-month="all|spring|summer|fall|winter"
        this.currentSeason = value || 'all';
        this.applyFilters();
      });
    }

    // ---- Category chips ----
    if (this.categoryGroupEl) {
      this.categoryGroupEl.addEventListener('click', (evt) => {
        const btn = evt.target.closest('.filter-chip');
        if (!btn) return;

        this.setActiveChip(this.categoryGroupEl, btn);

        const value = (btn.dataset.category || '').toLowerCase();
        // data-category="all|native-tree|native-shrub|..."
        this.currentCategory = this.normalizeCategoryKey(value);
        this.applyFilters();
      });
    }

    // ---- Favorites chips ----
    if (this.favGroupEl) {
      this.favGroupEl.addEventListener('click', (evt) => {
        const btn = evt.target.closest('.filter-chip');
        if (!btn) return;

        this.setActiveChip(this.favGroupEl, btn);

        const value = (btn.dataset.favorites || '').toLowerCase();
        // data-favorites="all|fav"
        this.currentFavoritesMode = value === 'fav' ? 'fav' : 'all';
        this.applyFilters();
      });
    }

    console.log('PlantFilters.init done');
  },

  // 给 search.js 用：更新搜索词
  setSearchTerm(term) {
    this.currentSearchTerm = (term || '').trim().toLowerCase();
    this.applyFilters();
  },

  // 在同一组里切换 .filter-chip-active
  setActiveChip(groupEl, activeBtn) {
    const chips = groupEl.querySelectorAll('.filter-chip');
    chips.forEach((chip) => chip.classList.remove('filter-chip-active'));
    activeBtn.classList.add('filter-chip-active');
  },

  // 把 data-category 映射成内部使用的 key
  normalizeCategoryKey(raw) {
    if (!raw) return 'all';
    if (raw === 'all') return 'all';

    // HTML 里是 native-tree / native-shrub...
    if (raw.includes('tree')) return 'trees';
    if (raw.includes('shrub')) return 'shrubs';
    if (raw.includes('vine')) return 'vines';
    if (raw.includes('perennial')) return 'perennials';
    if (raw.includes('fern')) return 'ferns';
    if (raw.includes('grass')) return 'grasses';

    return 'all';
  },

  // 从 plant 条目推断它属于哪一类，用于 Category 筛选
  inferCategoryFromPlant(plant) {
    const group = (plant.group || '').toLowerCase();
    const type = (plant.type || '').toLowerCase();

    if (group.includes('tree') || type.includes('tree')) return 'trees';
    if (group.includes('shrub') || type.includes('shrub')) return 'shrubs';
    if (group.includes('vine') || type.includes('vine')) return 'vines';
    if (group.includes('perennial')) return 'perennials';
    if (group.includes('fern') || type.includes('fern')) return 'ferns';
    if (group.includes('grass') || type.includes('grass')) return 'grasses';

    return 'other';
  },

  // 统一判断“是不是收藏”
  isFavorite(plantId) {
    // 1）如果 list.js 有自己的 isFavorite，就直接信它
    if (window.PlantList && typeof window.PlantList.isFavorite === 'function') {
      try {
        return window.PlantList.isFavorite(plantId);
      } catch (e) {
        console.warn('PlantFilters: PlantList.isFavorite error', e);
      }
    }

    // 2）否则自己去 localStorage 里找，兼容几种常见 key
    const keysToTry = ['plant_favorites', 'plantFavorites', 'favorite_plants'];

    for (const key of keysToTry) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;

        const data = JSON.parse(raw);

        // 可能是数组：["id1","id2"]
        if (Array.isArray(data)) {
          if (data.includes(plantId)) return true;
        }
        // 也可能是对象：{ "id1": true, "id2": true }
        else if (data && typeof data === 'object') {
          if (data[plantId]) return true;
        }
      } catch (e) {
        // 某个 key 解析失败就忽略
        console.warn('PlantFilters: parse favorites error for key', key, e);
      }
    }

    return false;
  },

  // 判断单个植物是否符合所有条件
  matchesAllFilters(plant) {
    const seasonKey = this.currentSeason;
    const catKey = this.currentCategory;
    const favMode = this.currentFavoritesMode;
    const searchTerm = this.currentSearchTerm;

    // ---- 1. Seasons 过滤 ----
    if (seasonKey !== 'all') {
      let okSeason = true;
      if (Array.isArray(plant.seasons) && plant.seasons.length > 0) {
        okSeason = plant.seasons.includes(seasonKey);
      }
      if (!okSeason) return false;
    }

    // ---- 2. Category 过滤 ----
    if (catKey !== 'all') {
      const plantCat = this.inferCategoryFromPlant(plant);
      if (plantCat !== catKey) return false;
    }

    // ---- 3. Favorites 过滤 ----
    if (favMode === 'fav') {
      if (!this.isFavorite(plant.id)) return false;
    }

    // ---- 4. 搜索词过滤 ----
    if (searchTerm) {
      const haystack = [
        plant.nameEn || '',
        plant.nameZh || '',
        plant.scientificName || '',
        plant.type || '',
        plant.habit || '',
        plant.habitat || '',
        plant.description || ''
      ]
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(searchTerm)) return false;
    }

    return true;
  },

  // 真正做过滤逻辑
  applyFilters() {
    if (!Array.isArray(window.PlantsData)) {
      console.warn('PlantFilters: PlantsData not available');
      return;
    }

    const filtered = window.PlantsData.filter((plant) =>
      this.matchesAllFilters(plant)
    );

    // 更新右侧列表
    if (window.PlantList) {
      window.PlantList.renderList(filtered);
      if (typeof window.PlantList.wireClicks === 'function') {
        window.PlantList.wireClicks();
      }
    }

    // 更新地图 marker 显示
    if (window.PlantMap && typeof window.PlantMap.setVisibleIds === 'function') {
      const ids = filtered
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => p.id);
      window.PlantMap.setVisibleIds(ids);
    }
  }
};
