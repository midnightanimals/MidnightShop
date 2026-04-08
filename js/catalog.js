$(async () => {
  let allProducts = []; // 用來儲存原始完整資料

  // === 頁面初始化入口 ===
  async function initCatalog() {
    // 1. 開啟 Loading 畫面
    toggleLoading(true, "fetching");

    try {
      // 2. 取得 GAS 資料
      // 注意：確保你在全域變數中已定義 GAS_ENDPOINT
      const res = await fetch(`${GAS_ENDPOINT}?action=getProducts`);
      const data = await res.json();
      
      // 檢查資料結構
      if (!data || !data.products) {
        throw new Error("資料格式不正確");
      }

      allProducts = data.products;

      // 3. 初始化畫面
      initTabs(allProducts);      // 產生分類按鈕
      renderProducts(allProducts); // 預設渲染全部商品

    } catch (error) {
      console.error("載入產品資料失敗:", error);
      $("#catalogGrid").html('<div class="col-12 text-center py-5">載入失敗，請稍後再試。</div>');
    } finally {
      // 4. 無論成功或失敗，關閉 Loading (延遲一點讓圖片載入更平順)
      setTimeout(() => toggleLoading(false), 300);
    }
  }

  // === 核心功能函式 ===

  /**
   * 自動產生分類 Tab
   */
  function initTabs(products) {
    const $tabContainer = $("#categoryTabs");
    
    // 找出所有不重複的 category
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

    // 分類翻譯對照表
    const categoryNameMap = {
      "eyes": "眼珠",
      "ears": "獸耳",
      "accessory": "配件"
    };

    // 先加入「全部」按鈕
    let tabsHtml = `
      <li class="nav-item">
        <button class="nav-link active" data-category="all">全部</button>
      </li>
    `;

    categories.forEach(cat => {
      const displayName = categoryNameMap[cat] || cat;
      tabsHtml += `
        <li class="nav-item">
          <button class="nav-link" data-category="${cat}">${displayName}</button>
        </li>
      `;
    });

    $tabContainer.html(tabsHtml);

    // 綁定 Tab 點擊事件 (使用事件委派)
    $tabContainer.off("click").on("click", ".nav-link", function() {
      $(".nav-link").removeClass("active");
      $(this).addClass("active");

      const targetCat = $(this).data("category");
      let filteredProducts = (targetCat === "all") 
        ? allProducts 
        : allProducts.filter(p => p.category === targetCat);

      renderProducts(filteredProducts);
    });
  }

  /**
   * 渲染商品卡片
   */
  function renderProducts(products) {
    const $grid = $("#catalogGrid");
    $grid.empty();

    if (products.length === 0) {
      $grid.html('<div class="col-12 text-center text-muted py-5">此分類暫無商品</div>');
      return;
    }

    products.forEach(p => {
      // 確保圖片路徑正確，若沒設定圖片給予預設圖
      const mainImg = p.images?.main || 'img/default-product.jpg';
      const desc = p.description ? p.description.substring(0, 30) + '' : '暫無商品描述';
      
      const html = `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
          <a href="product.html?id=${p.id}" class="text-decoration-none">
            <div class="product-card h-100">
              <div class="card-img-wrapper">
                 <img src="${mainImg}" class="card-img-top" alt="${p.name}" loading="lazy">
              </div>
              <div class="card-body">
                <div class="card-title fw-bold text-dark">${p.name}</div>
                <p class="card-text text-muted small">${desc}</p>
                <div class="card-price text-primary fw-bold">NT$ ${p.basePrice || 0} 起</div>
                <button class="btn btn_main btn-sm w-100 mt-2">查看詳情</button>
              </div>
            </div>
          </a>
        </div>
      `;
      $grid.append(html);
    });

    // 啟動動畫觀察器
    initScrollAnimation();
  }

  /**
   * 絲滑漸入動畫核心邏輯
   */
  function initScrollAnimation() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => observer.observe(card));
  }

  // 啟動頁面
  initCatalog();
});