/* =====================
   基本設定
===================== */
const CART_KEY = "cart_items";

const SHIPPING_OPTIONS = [
  { id: "cod_711", label: "7-11 賣貨便/取貨付款－依平台運費為準", fee: 0 },
  { id: "pickup_711", label: "7-11 純取貨－保值寄送請另外提出", fee: 60 },
  { id: "cod_family", label: "全家好賣家/取貨付款－依平台運費為準", fee: 0 },
  { id: "pickup_family", label: "全家純取貨－小物袋", fee: 42 },
  { id: "home", label: "宅配－運費到付", fee: 0 }
];

/* =====================
   工具函式
===================== */

// 改為讀取 GAS 資料，確保能拿到最新的 optionTemplates 來做翻譯
function loadProducts() {
  // return fetch("data/products.json")
  return fetch(`${GAS_ENDPOINT}?action=getProducts`)
    .then(r => r.json())
    .catch(err => {
      console.error("載入失敗", err);
      return null;
    });
}

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function calcTotal(cart) {
  return cart.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
}

/**
 * ★ 新增功能：合併購物車中重複的商品
 * 判斷標準：ID 相同 且 所有選擇的規格(selected) 都相同
 */
function compactCart(cartItems) {
  const merged = [];

  cartItems.forEach(item => {
    // 尋找 merged 陣列中是否已經有「長得一模一樣」的商品
    const existingItem = merged.find(m =>
      m.productId === item.productId &&
      JSON.stringify(m.selected) === JSON.stringify(item.selected)
    );

    if (existingItem) {
      // 如果有，就疊加數量
      existingItem.qty += parseInt(item.qty || 1);
    } else {
      // 如果沒有，就加入新的一行
      merged.push(item);
    }
  });

  return merged;
}

/**
 * ★ 核心功能：將規格代碼 (Value) 轉為顯示名稱 (Label)
 */
function getOptionLabel(key, val, data) {
  if (!val) return "";
  if (key === 'color') return val; // 顏色通常直接顯示值，除非另外定義翻譯

  // 1. 遍歷所有的 Templates 尋找符合 logical_key (例如 "size") 的設定檔
  // data.optionTemplates 是物件，我們用 Object.values 轉成陣列來找
  const template = Object.values(data.optionTemplates || {}).find(t => t.key === key);

  // 找不到設定檔就直接回傳原始值 (容錯)
  if (!template) return val;

  // 2. 內部轉換函式：給定 value 找出 item.label
  const findLabel = (v) => {
    const item = template.items.find(i => String(i.value) === String(v));
    return item ? item.label : v;
  };

  // 3. 處理陣列 (多選) 或 單一值
  if (Array.isArray(val)) {
    return val.map(findLabel).join("、");
  }
  return findLabel(val);
}

/* =====================
   寄送方式
===================== */
function initShippingOptions() {
  const $sel = $("#shippingMethod");
  $sel.empty(); // 清空避免重複
  $sel.append('<option value="" disabled selected>請選擇寄送方式</option>'); // 加入預設選項
  SHIPPING_OPTIONS.forEach(o => {
    $sel.append(
      `<option value="${o.id}">
        ${o.label}（NT$${o.fee}）
      </option>`
    );
  });
}

/* =====================
   規格文字產生 (用於畫面與訂單)
===================== */
function formatSpecs(item, productData) {
  if (!item.selected) return "";

  const specs = [];

  // 遍歷每一個已選的規格 (key: "size", val: "regular")
  for (const [key, val] of Object.entries(item.selected)) {
    // 忽略空值
    if (val === null || val === undefined || (Array.isArray(val) && val.length === 0)) continue;

    // 1. 取得該規格的標題 (例如 "選擇尺寸")
    const template = Object.values(productData.optionTemplates || {}).find(t => t.key === key);
    const title = template ? template.label : key;

    // 2. 取得該選項的顯示名稱 (例如 "一般尺寸")
    const displayValue = getOptionLabel(key, val, productData);

    specs.push(`${title}：${displayValue}`);
  }
  return specs.join(" | ");
}

/* =====================
   訂單文字產生
===================== */
function buildOrderText(cart, productData, shipping) {
  const now = new Date();
  const orderNo = `ORD-${now.getTime().toString().slice(-6)}`;

  let text = `【客製商品訂單】\n`;
  text += `━━━━━━━━━━━━━━━━━━\n`;
  text += `訂單編號：${orderNo}\n`;
  text += `訂單時間：${now.toLocaleString("zh-TW")}\n`;
  text += `寄送方式：${shipping.label}（NT$${shipping.fee}）\n\n`;

  cart.forEach((item, i) => {
    text += `${i + 1}. ${item.name}\n`;
    text += `   規格：${formatSpecs(item, productData)}\n`; // 這裡會自動用到 label 轉換
    text += `   單價：NT$ ${item.unitPrice}\n`;
    text += `   數量：${item.qty}\n`;
    text += `   小計：NT$ ${item.unitPrice * item.qty}\n`;
    text += `----------------------------------\n`;
  });

  const total = calcTotal(cart) + shipping.fee;
  text += `商品小計：NT$ ${calcTotal(cart)}\n`;
  text += `運費：NT$ ${shipping.fee}\n`;
  text += `━━━━━━━━━━━━━━━━━━\n`;
  text += `訂單總金額：NT$ ${total}\n`;

  return { orderNo, text, total };
}

/* =====================
   畫面渲染
===================== */
function renderCart(productData) {
  const cart = getCart(); // 此時的 cart 應該已經是合併過的
  const $area = $("#cartArea");
  $area.empty();

  if (!cart.length) {
    $area.html(`<div class="py-5 text-center text-muted">購物車目前沒有東西，等你挑選心儀的商品喔！<br/>*･゜ﾟ･*:.｡..｡.:*･'(*ﾟ▽ﾟ*)'･*:.｡. .｡.:*･゜ﾟ･*</div>`);
    $("#sendOrder").prop("disabled", true);
    $("#buildOrder").prop("disabled", true);
    // 更新總計為 0
    $(".cart-total-area").remove();
    return;
  }

  $("#sendOrder").prop("disabled", false);
  $("#buildOrder").prop("disabled", false);

  cart.forEach((item, idx) => {
    // 這裡使用 formatSpecs，確保畫面顯示的是 Label
    const specHtml = formatSpecs(item, productData);

    $area.append(`
      <div class="card mb-3 shadow-sm border-0 bg-light">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div class="me-3">
              <h5 class="fw-bold mb-1">${item.name}</h5>
              <div class="small text-muted mb-2">${specHtml}</div>
            </div>
            <button class="btn-close remove" data-i="${idx}" aria-label="移除"></button>
          </div>

          <div class="d-flex justify-content-between align-items-center mt-2">
            <div class="input-group input-group-sm" style="width: 110px;">
              <button class="btn btn-outline-secondary minus" data-i="${idx}">-</button>
              <input class="form-control text-center qty-input" data-i="${idx}" inputmode="numeric" value="${item.qty}" min="1">
              <button class="btn btn-outline-secondary plus" data-i="${idx}">+</button>
            </div>
            <div class="fw-bold">
              NT$ ${(item.unitPrice * item.qty).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    `);
  });

  // 總計區域
  $area.append(`
    <div class="cart-total-area text-end mt-4 pt-3 border-top">
      <h4 class="fw-bold">商品總計：NT$ ${calcTotal(cart).toLocaleString()}</h4>
      <small>(不含運費)</small>
    </div>
  `);
}

/* =====================
   初始化與事件
===================== */
$(async function () {
  toggleLoading(true, "fetching");

  const productData = await loadProducts();

  if (!productData) {
    toggleLoading(false);
    return $("#cartArea").html('<div class="text-center py-5">資料載入錯誤，請重新整理頁面。</div>');
  }

  // ★ 關鍵：載入頁面時，立刻對購物車進行「合併整理」並存回 LocalStorage
  // 這樣之後的操作都能基於整潔的資料進行
  let rawCart = getCart();
  let cleanCart = compactCart(rawCart);
  saveCart(cleanCart);

  initShippingOptions();
  renderCart(productData);

  toggleLoading(false);

  let latestOrder = null;

  // 數量加減與移除事件 (使用 delegate)
  $("#cartArea")
    .on("click", ".plus, .minus", function () {
      const idx = $(this).data("i");
      const cart = getCart();
      cart[idx].qty += $(this).hasClass("plus") ? 1 : -1;
      if (cart[idx].qty < 1) cart[idx].qty = 1;
      saveCart(cart);
      renderCart(productData);
    })
    .on("change", ".qty-input", function () {
      const idx = $(this).data("i");
      const cart = getCart();
      const newQty = parseInt(this.value);
      cart[idx].qty = (isNaN(newQty) || newQty < 1) ? 1 : newQty; // 防止輸入 0 或負數
      saveCart(cart);
      renderCart(productData);
    })
    .on("click", ".remove", function () {
      // 1. 先把 index 存起來，因為進入 callback 後 $(this) 會抓不到
      const targetIndex = $(this).data("i");

      // 2. 呼叫小精靈彈窗
      fairyModal({
        type: "warning",
        message: "確定要將此商品移出購物車嗎？<br/>小精靈會捨不得的( ;´Д`)ノ",
        buttons: [
          {
            text: "考慮一下",
            class: "btn_sub"
          },
          {
            text: "我就是要刪",
            class: "btn_main",
            onClick: function () {
              // 原本寫在 confirm 下方的邏輯全部搬到這裡
              const cart = getCart();
              cart.splice(targetIndex, 1);
              saveCart(cart);
              renderCart(productData);

              // (加碼) 移除後的成功通知
              fairyModal({ type: "success", message: "商品已成功移出購物車囉！小精靈會想它的(；´Д`A" });
            }
          }
        ]
      });
    });

  // 產生訂單預覽
  $("#buildOrder").on("click", () => {
    const cart = getCart();
    const shipId = $("#shippingMethod").val();
    if (!shipId) {
      fairyModal({
        type: "info",
        message: "請先選擇寄送方式，小精靈才不會迷路喔！<br/>( ;´Д`)ノ",
        buttons: [{
          text: "這就去選",
          class: "btn_main",
          onClick: function () {
            // 當使用者按下彈窗按鈕時，自動聚焦到該欄位
            $("#shippingMethod").focus();
          }
        }]
      });

      // 雖然彈窗是異步的，但我們必須在這裡 return 
      // 這樣下方的「送出訂單 API」才不會被執行
      return;
    }

    const shipping = SHIPPING_OPTIONS.find(s => s.id === shipId);
    latestOrder = buildOrderText(cart, productData, shipping);

    $("#orderText").text(latestOrder.text);
    $("#orderPreview").removeClass("d-none");

    // 捲動到預覽區
    $("#orderPreview")[0].scrollIntoView({ behavior: 'smooth' });
  });

  // 複製訂單
  $("#copyOrder").on("click", async () => {
    if (!latestOrder) return;
    try {
      await navigator.clipboard.writeText(latestOrder.text);
      // 簡單的視覺回饋
      const $btn = $("#copyOrder");
      const originalText = $btn.text();
      $btn.text("已複製！").addClass("btn-success").removeClass("btn-secondary");
      setTimeout(() => {
        $btn.text(originalText).addClass("btn-secondary").removeClass("btn-success");
      }, 2000);
    } catch (err) {
      alert("複製失敗，請手動選取文字複製");
    }
  });

  // 送出訂單
  $("#sendOrder").on("click", async function () {
    const cart = getCart();
    const shipId = $("#shippingMethod").val();
    const email = $("#ccEmail").val().trim();

    // 1. 基本檢查
    // 情境：購物車為空、未選寄送方式、未填 Email
    if (cart.length === 0) {
      fairyModal({ type: "warning", message: "購物車空空的，小精靈沒東西可以搬呀！╮(￣▽￣)╭" });
      return; // 記得還是要 return，防止後續程式執行
    }
    if (!shipId) {
      fairyModal({ type: "info", message: "請先選擇寄送方式，小精靈才不會迷路喔！（；゜０゜）" });
      return;
    }

    if (!email) {
      fairyModal({ type: "info", message: "請填寫 Email，以便小精靈把確認信飛鴿傳書給您！(=ﾟωﾟ)ﾉ" });
      return;
    }

    // 2. 顯示 Loading
    toggleLoading(true, "saving");

    try {
      // 3. 取得寄送設定
      const shipping = SHIPPING_OPTIONS.find(s => s.id === shipId);

      // 4. 產生訂單資料
      // 注意：這裡傳入 productData，確保產生的文字包含正確的 Label
      const orderData = buildOrderText(cart, productData, shipping);

      // 5. 封裝 Payload
      const payload = {
        orderNo: orderData.orderNo,
        createdAt: new Date().toLocaleString("zh-TW"),
        customerEmail: email,
        shipping: `${shipping.label}（NT$${shipping.fee}）`,
        total: orderData.total,
        itemsText: orderData.text,
        itemsJson: JSON.stringify(cart) // 備份原始資料
      };

      // 6. 發送至 GAS
      await fetch(GAS_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload)
      });

      // 7. 成功處理
      // 先清除購物車並更新畫面（購物車變空，但 modal 仍會顯示）
      localStorage.removeItem(CART_KEY);
      renderCart(productData); // 重新渲染空購物車

      // 顯示成功通知，並將回首頁的跳轉寫在按鈕回呼中
      fairyModal({
        type: "success",
        message: "訂單已送出，感謝您的購買！<br/>小精靈正全速處理中(￣^￣)ゞ",
        buttons: [
          {
            text: "回首頁",
            class: "btn_main",
            onClick: () => location.href = 'index.html'
          }
        ]
      });

    } catch (err) {
      console.error("發送錯誤：", err);
      // 錯誤通知
      console.error("發送錯誤：", err);
      fairyModal({
        type: "error",
        message: `訂單送出時發生意外...<br/>管理員回報：${err.message}`,
        buttons: [{ text: "我再試試", class: "btn_main" }]
      });
    } finally {
      toggleLoading(false);
    }
  });
});