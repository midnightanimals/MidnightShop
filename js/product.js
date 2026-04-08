const BUDDY_QUOTES = {
  select: [
    "選得好！(๑•̀ㅂ•́)و✧", 
    "眼光真好！這款超熱門的！", 
    "小精靈也會選這個 (๑•̀ㅂ•́)و✧", 
    "感覺很適合呢！✨",
    "加入成功！小精靈幫你把它放最上面！",
    "好耶！(๑´ڡ`๑)",
    "真不錯！",
    "再來十個！",
    "買買買！",
    "您的品味獲得了小精靈的肯定！",
    "這件確實是極品！",
    "眼光犀利！",
    "真會挑！",
    "小精靈也很喜歡這個！",
    "這個很讚喔！",
    "老闆大器！",
  ],

  deselect: [
    "不要了嗎？小精靈會想它的... (´;ω;`)", 
    "為什麼取消了呢？再考慮看看嘛～", 
    "沒關係，更好的在後面(･ω･` ;)", 
    "真的不要了嗎？(´･ω･`)",
    "只是選錯了對吧？",
    "會想你的...",
    "不要走！！",
    "我們再把它加回來好嗎？(。•́〈•̀。)",
    "看看不用錢，但小精靈還是希望你把它帶回家",
    "哭哭... (。•́〈•̀。)",
    "孤獨地回到冰冷的倉庫",
    "我們無緣了嗎",
    "再會了，我會想你的",
    "嗚嗚... (´-﹏-`；)",
    "小精靈正在努力抹掉剛才紀錄的痕跡... 消、消失吧！",
    "可以再看看其他的",
    "好吧ಥ_ಥ",
    "正在重整您的挑選清單... (📋-ω-)"
  ]
};

function triggerBuddy(type) {
  const $bubble = $("#buddyBubble");
  const quotes = BUDDY_QUOTES[type];
  const text = quotes[Math.floor(Math.random() * quotes.length)];

  $bubble.text(text).addClass("show");

  // 清除舊的計時器
  if (window.buddyTimer) clearTimeout(window.buddyTimer);
  window.buddyTimer = setTimeout(() => {
    $bubble.removeClass("show");
  }, 1000);
}

const CART_KEY = "cart_items";

// === 工具函式 ===
function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function loadProducts() {
  return fetch(`${GAS_ENDPOINT}?action=getProducts`)
    .then(res => res.json())
    .catch(err => {
      console.error("無法讀取產品資料", err);
      throw err;
    });
}

function showToast(message) {
  $(".selection-toast").remove();
  const $toast = $(`<div class="selection-toast">${message}</div>`);
  $("body").append($toast);
  setTimeout(() => $toast.addClass("show"), 100);
  setTimeout(() => {
    $toast.removeClass("show");
    setTimeout(() => $toast.remove(), 500);
  }, 2500);
}

// 核心檢查函式
function isOptionAvailable(item, selected) {
  if (item.status === 'coming_soon') return false;
  if (!item || !item.availableWhen) return true;

  return Object.entries(item.availableWhen).every(([logicKey, allowedValues]) => {
    const currentVal = selected[logicKey];
    if (currentVal === null || currentVal === undefined ||
      (Array.isArray(currentVal) && currentVal.length === 0)) {
      return false;
    }
    return allowedValues.map(String).includes(String(currentVal));
  });
}

function calcPrice(basePrice, selectedOptions, templates) {
  let price = basePrice;
  templates.forEach(t => {
    const val = selectedOptions[t.key];
    if (val && !Array.isArray(val)) {
      const item = t.items.find(i => i.value === String(val));
      if (item?.price) price += item.price;
    }
    if (Array.isArray(val)) {
      val.forEach(v => {
        const item = t.items.find(i => i.value === String(v));
        if (item?.price) price += item.price;
      });
    }
  });
  return price;
}

// === 主渲染函式 ===
function renderProduct(product, templates) {
  const $area = $("#productArea");
  let selected = {};
  const colorKeys = Object.keys(product.images.colors || {});

  // 1. 初始化選擇狀態
  templates.forEach(t => {
    selected[t.key] = (t.type === "multi") ? [] : null;
  });
  selected.color = null;

  // 更新圖片輪播與側邊縮圖
  function updateGallery(triggerSource = null) {
    let activeImages = [product.images.main];
    if (product.images.gallery) activeImages.push(...product.images.gallery);
    if (selected.color && product.images.colors?.[selected.color]) {
      activeImages.push(product.images.colors[selected.color]);
    }

    let newlyAddedImg = null;
    templates.forEach(t => {
      const val = selected[t.key];
      if (!val) return;
      const getImg = (v) => t.items.find(i => i.value === String(v))?.image;

      if (Array.isArray(val)) {
        val.forEach(v => {
          const img = getImg(v);
          if (img) { activeImages.push(img); if (triggerSource === v) newlyAddedImg = img; }
        });
      } else {
        const img = getImg(val);
        if (img) { activeImages.push(img); if (triggerSource === String(val)) newlyAddedImg = img; }
      }
    });

    const $container = $("#galleryThumbnails");
    $container.empty();
    activeImages.forEach(src => {
      const $thumb = $(`<img src="${src}" class="gallery-thumb ${$("#mainImg").attr("src") === src ? 'active' : ''}">`);
      $thumb.on("click", function () {
        $("#mainImg").attr("src", src);
        $container.find("img").removeClass("active");
        $(this).addClass("active")[0].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
      $container.append($thumb);
    });

    if (newlyAddedImg) {
      $("#mainImg").attr("src", newlyAddedImg);
      setTimeout(() => {
        const $target = $container.find(`img[src="${newlyAddedImg}"]`);
        $container.find("img").removeClass("active");
        if ($target.length) $target.addClass("active")[0].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }, 50);
    } else if (triggerSource === 'color' && selected.color) {
      const cImg = product.images.colors[selected.color];
      if (cImg) $("#mainImg").attr("src", cImg);
    }
  }

  // 瀑布流 UI 更新邏輯
  function updateUI(triggerSource = null) {
    let isPreviousStepCompleted = true;
    let conflictMessages = [];

    templates.forEach((t, index) => {
      const $section = $(`#section-${index}`);

      if (!isPreviousStepCompleted) {
        $section.addClass('step-disabled').css('opacity', '0.3');
        $section.find('button, input').prop('disabled', true);
      } else {
        $section.removeClass('step-disabled').css('opacity', '1');
        $section.find('button, input').prop('disabled', false);
      }

      let hasValidSelection = false;

      t.items.forEach(item => {
        const available = isOptionAvailable(item, selected);
        const $el = (t.type === 'multi')
          ? $section.find(`input[value="${item.value}"]`)
          : $section.find(`.optionBtn[data-value="${item.value}"]`);

        if (!available) {
          $el.prop("disabled", true).addClass("disabled-item opacity-30");

          if (t.type === 'single' && String(selected[t.key]) === String(item.value)) {
            selected[t.key] = null;
            conflictMessages.push(`「${item.label}」與規格衝突，已取消選取`);
          }
          if (t.type === 'multi' && selected[t.key].includes(String(item.value))) {
            selected[t.key] = selected[t.key].filter(v => v !== String(item.value));
            conflictMessages.push(`加購項「${item.label}」不適用，已移除`);
          }
        } else {
          if (isPreviousStepCompleted) {
            $el.prop("disabled", false).removeClass("disabled-item opacity-30");
          }
        }

        if (t.type === 'multi') {
          const isChecked = selected[t.key].includes(String(item.value));
          $el.prop("checked", isChecked);
          if (isChecked) hasValidSelection = true;
        } else {
          const isActive = String(selected[t.key]) === String(item.value);
          $el.toggleClass("active ", isActive);
          if (isActive) hasValidSelection = true;
        }
      });

      if (t.required && !hasValidSelection) {
        isPreviousStepCompleted = false;
      }
    });

    $(`.optionBtn[data-key="color"]`).each(function () {
      const isAct = selected.color === $(this).data("value");
      $(this).toggleClass("active ", isAct).toggleClass("btn_sub", !isAct);
    });

    if (conflictMessages.length > 0) showToast(conflictMessages[0]);
    $("#priceValue").text(calcPrice(product.basePrice || 0, selected, templates));
    updateGallery(triggerSource);
  }

  // === 生成 HTML 結構 ===
  const html = `
    <div class="col-md-6">
      <div class="sticky-top" style="top: 20px; z-index: 1;">
          <div class="img-protect-container mb-3">
              <div class="no-save-overlay" id="mainImgOverlay"></div>
              <img id="mainImg" class="img-fluid rounded w-100" 
                   style="object-fit: contain; max-height: 500px; background: #f8f9fa; border: 1px solid #eee;" 
                   src="${product.images.main}" oncontextmenu="return false;">
          </div>
          <div id="galleryThumbnails" class="gallery-scroll-container d-flex overflow-auto pb-2"></div>
      </div>
    </div>
    <div class="col-md-6">
      <h2 class="mt-4 mt-md-0 fw-bold">${product.name}</h2>
      <p class="text-muted">${product.description || ""}</p>
      <div class="h4 mb-4 text_color fw-bold">NT$ <span id="priceValue">${product.basePrice}</span></div>
      
      <div id="optionsArea"></div>

      <hr class="my-4">
      <div class="d-flex align-items-center gap-3 mb-4">
        <label class="fw-bold">數量</label>
        <div class="input-group" style="width: 140px;">
            <button id="minusQty" class="btn btn_sub">-</button>
            <input id="qty" inputmode="numeric" class="form-control text-center" value="1" min="1">
            <button id="plusQty" class="btn btn_sub">+</button>
        </div>
      </div>
      <button id="addToCart" class="btn btn_main btn-lg w-100 py-3 fw-bold">加入購物車</button>
    </div>
  `;
  $area.html(html);

  const $optArea = $("#optionsArea");

  if (colorKeys.length) {
    $optArea.append(`
      <div class="option-section mb-4" id="section-color">
        <div class="mb-2 fw-bold">選擇顏色 <span class="text-danger">*</span></div>
        <div class="d-flex flex-wrap gap-2">
          ${colorKeys.map(c => `<button class="btn btn_sub optionBtn" data-key="color" data-value="${c}">${c}</button>`).join("")}
        </div>
      </div>
    `);
  }

  templates.forEach((t, index) => {
    const req = t.required ? "<span class='text-danger'>*</span>" : "";
    let inputHtml = "";

    if (t.type === 'multi') {
      inputHtml = t.items.map(item => `
        <div class="form-check mb-2">
          <input class="form-check-input addonCheckbox" type="checkbox" value="${item.value}" data-key="${t.key}">
          <label class="form-check-label">${item.label}</label>
        </div>`).join("");
    } else {
      inputHtml = `<div class="d-flex flex-wrap gap-2">
  ${t.items.map(item => {
        const isComingSoon = item.status === 'coming_soon';
        const disabledAttr = isComingSoon ? 'disabled' : '';
        const labelSuffix = isComingSoon ? ' (敬請期待)' : '';
        return `<button class="btn btn_sub optionBtn" data-key="${t.key}" data-value="${item.value}" ${disabledAttr}>${item.label}${labelSuffix}</button>`;
      }).join("")}
</div>`;
    }

    $optArea.append(`
      <div class="option-section mb-4" id="section-${index}" data-step="${index}">
        <div class="fw-bold mb-2">${t.label} ${req}</div>
        <div>${inputHtml}</div>
      </div>
    `);
  });

  // === 加入全域結構 (燈箱與氣泡) ===
  if ($("#fairyLightbox").length === 0) {
    $("body").append(`
        <div id="fairyLightbox">
            <span class="lightbox-close">&times;</span>
            <div class="lightbox-content-wrapper" style="position: relative; display: flex; max-width: 90%; max-height: 85vh;">
                <div class="no-save-overlay" style="cursor:default; z-index: 10;"></div>
                <img src="" id="lightboxImg" style="position: relative; z-index: 5; max-width: 100%; max-height: 100%; object-fit: contain;">
            </div>
        </div>
        <div class="buddy-container">
            <div id="buddyBubble" class="buddy-bubble"></div>
        </div>
    `);
  }

  // === 綁定全域事件 (確保不重複綁定) ===
  $(document).off("click", "#mainImgOverlay").on("click", "#mainImgOverlay", function () {
    const currentSrc = $("#mainImg").attr("src");
    $("#lightboxImg").attr("src", currentSrc);
    $("#fairyLightbox").fadeIn(300).css("display", "flex");
  });

  // 修改這裡！只在點擊「最外層背景」或「叉叉」時才關閉燈箱
  $(document).off("click", "#fairyLightbox").on("click", "#fairyLightbox", function (e) {
    if ($(e.target).is("#fairyLightbox") || $(e.target).is(".lightbox-close")) {
      $(this).fadeOut(300);
    }
  });

  // === 事件綁定 (選項點擊) ===

  $optArea.on("click", ".optionBtn", function () {
    const $sec = $(this).closest('.option-section');
    if ($sec.hasClass('step-disabled')) return;

    const key = $(this).data("key");
    const val = String($(this).data("value"));

    // 1. 判斷現在這個按鈕是不是「已經被選中」的狀態
    const isCurrentlyActive = (key === 'color') ? (selected.color === val) : (selected[key] === val);

    // 2. 觸發氣泡：如果已經選中，點擊就是要「取消」(deselect)；反之就是「選取」(select)
    triggerBuddy(isCurrentlyActive ? "deselect" : "select");

    // 3. 把你不小心刪掉的賦值邏輯補回來！
    if (key === 'color') {
      selected.color = isCurrentlyActive ? null : val;
    } else {
      selected[key] = isCurrentlyActive ? null : val;
    }

    updateUI(val);
  });

  $optArea.on("change", ".addonCheckbox", function () {
    const $sec = $(this).closest('.option-section');
    if ($sec.hasClass('step-disabled')) return;

    const key = $(this).data("key");
    const val = String($(this).val());
    const isChecked = $(this).is(":checked");

    if (!Array.isArray(selected[key])) selected[key] = [];
    
    // 更新資料陣列
    if (isChecked) {
      selected[key].push(val);
    } else {
      selected[key] = selected[key].filter(v => v !== val);
    }
    
    // 觸發氣泡：打勾就是選取，取消打勾就是取消
    triggerBuddy(isChecked ? "select" : "deselect");
    updateUI(val);
  });

  // 數量控制
  $("#minusQty").on("click", () => { const $q = $("#qty"); $q.val(Math.max(1, (parseInt($q.val()) || 1) - 1)); });
  $("#plusQty").on("click", () => { const $q = $("#qty"); $q.val((parseInt($q.val()) || 1) + 1); });

  // 加入購物車
  $("#addToCart").on("click", () => {
    if (colorKeys.length > 0 && !selected.color) {
      showToast("請選擇顏色");
      $("#section-color")[0].scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    for (let i = 0; i < templates.length; i++) {
      const t = templates[i];
      if (t.required) {
        const v = selected[t.key];
        if (!v || (Array.isArray(v) && v.length === 0)) {
          showToast(`請選擇 ${t.label}`);
          $(`#section-${i}`)[0].scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
      }
    }

    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    cart.push({
      productId: product.id,
      name: product.name,
      selected: JSON.parse(JSON.stringify(selected)), 
      unitPrice: calcPrice(product.basePrice, selected, templates),
      qty: parseInt($("#qty").val()) || 1
    });
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    
    // 這裡我借用小精靈順便誇獎一下使用者
    triggerBuddy("select");
    setTimeout(() => {
        fairyModal({
          type: "info",
          message: "商品已在推車裡囉，接下來想去哪裡呢？",
          buttons: [
            { text: "逛其他的", class: "btn_main", onClick: () => location.href = 'catalog.html' },
            { text: "看購物車", class: "btn_main", onClick: () => location.href = 'cart.html' },
            { text: "繼續留在這裡", class: "btn_sub", fullWidth: true } 
          ]
        });
    }, 500); // 稍微延遲讓氣泡先跑出來
  });

  updateUI();
}

// 頁面初始化
$(async () => {
  const rawId = getQueryParam("id");
  const productId = rawId ? String(rawId).trim().toUpperCase() : null;

  toggleLoading(true, "fetching");

  try {
    const data = await loadProducts();
    if (!data || !data.products || !Array.isArray(data.products)) {
      $("#productArea").html("<div class='text-center pt-5'><h3>資料錯誤</h3></div><p class='text-center'>請聯繫管理員<br/>。・゜・(ノД`)・゜・。</p>");
      return;
    }

    if (!productId) {
      $("#productArea").html("<div class='text-center pt-5'><h3>請先選擇商品</h3></div><a class='btn btn_main' href='catalog.html'>回目錄</a>");
      return;
    }

    const product = data.products.find(p => String(p.id).toUpperCase() === productId);

    if (!product) {
      $("#productArea").html(`<div class='text-center pt-5'><h3>找不到商品 (${productId})</h3></div><p class='text-center'>請重新選擇商品</p><a class='btn btn_main' href='catalog.html'>回目錄</a>`);
      return;
    }

    const templateObjects = product.optionTemplateRefs
      .map(ref => data.optionTemplates[ref])
      .filter(Boolean);

    renderProduct(product, templateObjects);

  } catch (error) {
    $("#productArea").html("<div class='text-center py-5'><h3>連線發生錯誤，請重新整理</h3></div>");
  } finally {
    setTimeout(() => toggleLoading(false), 300);
  }
});