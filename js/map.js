// js/map.js

window.PlantMap = {
  map: null,
  markers: {},           // id -> marker 实例
  activeMarkerId: null,

  init() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.warn('Map container #map not found.');
      return;
    }

    const MAPTILER_KEY = 'jLonpm0xNpIC9eNx6T3d';

    this.map = new maplibregl.Map({
      container: 'map',
      style: `https://api.maptiler.com/maps/aquarelle/style.json?key=${MAPTILER_KEY}`,
      center: [-83.7430, 42.2808],
      zoom: 13
    });

    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');

    if (!Array.isArray(window.PlantsData)) {
      console.warn('PlantsData not available.');
      return;
    }

    this.map.on('load', () => {
      window.PlantsData.forEach((plant) => {
        if (plant.lat == null || plant.lng == null) return; // 没坐标就不画点
        this.addPlantMarker(plant);
      });

      console.log('PlantMap: markers added =', Object.keys(this.markers).length);
    });
  },

  addPlantMarker(plant) {
    const { id, lat, lng, nameEn, nameZh } = plant;
    const label = nameZh ? `${nameEn} (${nameZh})` : nameEn;

    // 自定义 DOM 元素当 marker
    const el = document.createElement('div');
    el.className = 'plant-marker';
    el.dataset.plantId = id;

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat]) // [lng, lat]
      .setPopup(new maplibregl.Popup().setText(label))
      .addTo(this.map);

    // 点击地图上的点：点高亮 + 列表高亮
    el.addEventListener('click', () => {
      this.setActiveMarkerById(id);

      if (window.PlantList && typeof window.PlantList.setActiveItemById === 'function') {
        window.PlantList.setActiveItemById(id);
      }
    });

    this.markers[id] = marker;
  },

  // 从列表那边调用：把地图飞到这个植物并高亮 mark
  focusOnPlant(id) {
    const marker = this.markers[id];

    if (marker && this.map) {
      const lngLat = marker.getLngLat();
      this.map.flyTo({
        center: [lngLat.lng, lngLat.lat],
        zoom: 15,
        essential: true
      });

      if (marker.getPopup()) {
        marker.getPopup().addTo(this.map);
      }
    }

    this.setActiveMarkerById(id);
  },

  // 只负责改 marker 样式（橙色 / 取消）
  setActiveMarkerById(id) {
    // 清掉旧的 active
    const prev = document.querySelector('.plant-marker.plant-marker--active');
    if (prev) {
      prev.classList.remove('plant-marker--active');
    }

    const current = document.querySelector(`.plant-marker[data-plant-id="${id}"]`);
    if (current) {
      current.classList.add('plant-marker--active');
      this.activeMarkerId = id;
    } else {
      this.activeMarkerId = null;
    }
  },

  // ========= 新增：根据过滤结果控制哪些 marker 显示 =========
  // visibleIds: 要“保留显示”的植物 id 数组（例如 ['aspen-trembling', 'beech-american']）
  // 如果传空数组或 null，就当「全部显示」
  setVisibleIds(visibleIds) {
    const visibleSet = new Set(visibleIds || []);

    Object.entries(this.markers).forEach(([id, marker]) => {
      if (!marker || typeof marker.getElement !== 'function') return;
      const el = marker.getElement();
      if (!el) return;

      if (visibleSet.size === 0 || visibleSet.has(id)) {
        el.style.display = '';       // 显示
      } else {
        el.style.display = 'none';   // 隐藏
      }
    });
  }

};
