// js/list.js
// 负责：
// 1. 根据 window.PlantsData 生成右侧列表
// 2. 列表项点击 -> 通知 PlantMap 聚焦
// 3. 维护收藏状态（localStorage），控制爱心图标
// 4. 提供 setActiveItemById 给地图回调

window.PlantList = {
  listEl: null,
  // 收藏的 id 集合
  favorites: new Set(),

  init() {
    this.listEl = document.querySelector('#plant-list');
    if (!this.listEl) {
      console.warn('PlantList: #plant-list not found');
      return;
    }

    if (!Array.isArray(window.PlantsData)) {
      console.warn('PlantList: PlantsData not available');
      return;
    }

    // 从 localStorage 读收藏
    this.loadFavorites();

    // 先渲染一次完整列表
    this.renderList(window.PlantsData);

    console.log(
      'PlantList: initialized with',
      this.listEl.querySelectorAll('.plant-item').length,
      'items'
    );
  },

  loadFavorites() {
    try {
      const raw = localStorage.getItem('plantFavorites');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          this.favorites = new Set(arr);
        }
      }
    } catch (e) {
      console.warn('PlantList: failed to load favorites', e);
    }
  },

  saveFavorites() {
    try {
      localStorage.setItem(
        'plantFavorites',
        JSON.stringify([...this.favorites])
      );
    } catch (e) {
      console.warn('PlantList: failed to save favorites', e);
    }
  },

  // 对外：给过滤器用
  isFavorite(id) {
    return this.favorites.has(id);
  },

  // 从数据渲染列表（供过滤器复用）
  renderList(plants) {
    const fragments = document.createDocumentFragment();

    plants.forEach((plant) => {
      const li = document.createElement('li');
      li.className = 'plant-item';
      li.dataset.plantId = plant.id;

      li.tabIndex = 0;

      const isFav = this.favorites.has(plant.id);
      li.dataset.favorite = isFav ? 'true' : 'false';

      const nameZh = plant.nameZh
        ? `<span class="plant-name-zh">${plant.nameZh}</span>`
        : '';

      const favIcon = isFav ? 'marked' : 'unmark';
      const favAria = isFav
        ? 'Remove from My plants'
        : 'Add to My plants';

      li.innerHTML = `
        <div class="plant-item-inner">
          ${
            plant.imageUrl
              ? `<img class="plant-thumb"
                       src="${plant.imageUrl}"
                       alt="${plant.imageAlt || plant.nameEn}">`
              : ''
          }
          <div class="plant-text">
            <div class="plant-title-row">
              <h3 class="plant-name">
                <span class="plant-name-en">${plant.nameEn}</span>
                ${nameZh}
              </h3>
              <button
                type="button"
                class="plant-fav-btn"
                aria-label="${favAria}"
              >
                <img
                  class="plant-fav-icon"
                  src="images/icons/${favIcon}.png"
                  alt=""
                >
              </button>
            </div>
            <p class="plant-meta">
              ${plant.scientificName || ''} · ${plant.type || ''}
            </p>
          </div>
        </div>
      `;

      // 整个卡片点击 -> 聚焦地图
      const plantId = plant.id;
      li.addEventListener('click', () => {
        this.setActiveItem(li);

        if (
          window.PlantMap &&
          typeof window.PlantMap.focusOnPlant === 'function'
        ) {
          window.PlantMap.focusOnPlant(plantId);
        }
      });

      // 爱心按钮点击 -> 切换收藏
      const favBtn = li.querySelector('.plant-fav-btn');
      if (favBtn) {
        favBtn.addEventListener('click', (evt) => {
          // 阻止触发上面的 li click
          evt.stopPropagation();
          this.toggleFavorite(plantId, li, favBtn);
        });
      }

      fragments.appendChild(li);
    });

    this.listEl.innerHTML = '';
    this.listEl.appendChild(fragments);
  },

  // 收藏 / 取消收藏
  toggleFavorite(id, li, favBtn) {
    const currentlyFav = this.favorites.has(id);
    if (currentlyFav) {
      this.favorites.delete(id);
    } else {
      this.favorites.add(id);
    }
    this.saveFavorites();

    const nowFav = !currentlyFav;
    if (li) {
      li.dataset.favorite = nowFav ? 'true' : 'false';
    }

    if (favBtn) {
      const img = favBtn.querySelector('.plant-fav-icon');
      if (img) {
        img.src = `images/icons/${nowFav ? 'marked' : 'unmark'}.png`;
      }
      favBtn.setAttribute(
        'aria-label',
        nowFav ? 'Remove from My plants' : 'Add to My plants'
      );
    }

    // 如果以后 Favorites 过滤器在使用，可以让它重新应用一次
    if (
      window.PlantFilters &&
      typeof window.PlantFilters.reapply === 'function'
    ) {
      window.PlantFilters.reapply();
    }
  },

  // 高亮一个列表项
  setActiveItem(activeLi) {
    const allItems = this.listEl.querySelectorAll('.plant-item');
    allItems.forEach((item) =>
      item.classList.remove('plant-item-active')
    );
    activeLi.classList.add('plant-item-active');
  },

  // 给地图回调用：根据 id 高亮并滚动到可见
  setActiveItemById(id) {
    if (!this.listEl) return;
    const li = this.listEl.querySelector(
      `.plant-item[data-plant-id="${id}"]`
    );
    if (li) {
      this.setActiveItem(li);
      li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
};
