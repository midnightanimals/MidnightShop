var GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbx3E_yi5sZygUl7hPkJaEvTKhfr-uTAqS1O0UE7AZlrIDBP2J9-7fn3BxlxHsN63txO/exec";

document.addEventListener('DOMContentLoaded', () => {

    const loadComponent = (selector, url, callback) => {
        const element = document.querySelector(selector);
        if (element) {
            fetch(url)
                .then(response => response.ok ? response.text() : Promise.reject('File not found.'))
                .then(data => {
                    element.innerHTML = data;
                    // 當 HTML 成功插入後，執行 callback
                    if (callback) {
                        callback();
                    }
                })
                .catch(error => console.error(`Error loading component from ${url}:`, error));
        }
    };

    // 載入 Header
    loadComponent('#header-placeholder', '_header.html', initNavToggle);

    // 載入 Footer，並在載入完成後初始化 FAB 按鈕
    loadComponent('#footer-placeholder', '_footer.html', () => {
        initFloatingActionButton();
    });
});

function initNavToggle() {
    const toggle = document.querySelector('.nav-toggle');
    const header = document.querySelector('.site-header');
    if (!toggle || !header) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);

    function openNav() {
        header.classList.add('nav-open');
        backdrop.classList.add('active');
        toggle.setAttribute('aria-expanded', 'true');
    }

    function closeNav() {
        header.classList.remove('nav-open');
        backdrop.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', () => {
        header.classList.contains('nav-open') ? closeNav() : openNav();
    });

    backdrop.addEventListener('click', closeNav);

    document.querySelectorAll('.main-nav a').forEach(link => {
        link.addEventListener('click', closeNav);
    });
}

// 將按鈕邏輯包裝成一個函數
function initFloatingActionButton() {
    const fabContainer = document.getElementById('fabContainer');
    const fabMain = document.getElementById('fabMain');

    if (!fabMain || !fabContainer) return; // 安全檢查

    fabMain.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止觸發到 document 的點擊事件
        fabContainer.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!fabContainer.contains(e.target)) {
            fabContainer.classList.remove('active');
        }
    });
}

/* =====================
   擴充版 Loading 語意庫
===================== */
const loadingPhrases = {
    // 【情境：通用 / 準備展示】 - 適合頁面切換或初始載入
    default: [
        "小精靈正在準備展示，請稍後<br/>∠( ᐛ 」∠)＿",
        "正在幫畫面上妝，請美美地等一下...<br/>(💄^ω^)",
        "內容正在趕路中，稍安勿躁...<br/>(っ´ω`c)",
        "努力加載中，休息一下喝口水吧！<br/>🍵(￣▽￣)～",
        "精彩內容即將登場...<br/>✨(✧◡✧)",
        "伺服器正在深呼吸，馬上就好！<br/>_(:3 」∠ )_"
    ],

    // 【情境：搬貨 / 讀取資料】 - 適合 API Fetch 或資料庫查詢
    fetching: [
        "管理員搬貨中，請稍後<br/>_(:з」∠)_",
        "正在從倉庫翻找商品...嘿咻！<br/>(ง๑ •̀_•́)ง",
        "翻箱倒櫃中，箱子堆得有點高...<br/>(･ω･` ;)",
        "小精靈正在準備展示，請稍後<br/>∠( ᐛ 」∠)＿",
        "小精靈摸魚中...起來工作了！<br/>(╯°Д°）╯︵ /(.□ . \)",
        "別急別急，東西馬上到...<br/>♪(´ε｀ )",
        "箱子倒了...請稍後<br/>_(:з」∠)_",
        "管理員不小心弄倒了資料架，整理中...<br/>Σ(っ °Д °;)っ",
        "正在確認貨物清單，請再等一下下...<br/>(📋-ω-)",
        "管理員說這貨太重了，正在呼叫支援...<br/>( ;´Д`)ノ",
        "小精靈正在努力翻箱倒櫃，請稍後<br/>∠( ᐛ 」∠)＿",
        "小精靈們正在玩箱子...<br/>(っ´∀｀)っ📦ｃ(´∀｀ｃ)",
        "小精靈迷路中，快出來了！<br/>(◎_◎;)",
        "小精靈摸魚中...<br/>∠( ᐛ 」∠)＿",
        "小精靈正在幫資料打蠟，準備閃亮登場！<br/>✨(๑•̀ㅂ•́)و✧",
        "管理員監督中，小精靈正拼命搬運中...<br/>(🔨•̀皿•́)ง✧",
        "管理員與小精靈正在與巨大的檔案搏鬥！<br/>o(>_<)o",
        "報告！小精靈正騎著管理員趕過來（咦？）<br/>( ° ▽ °)╯",
        "資料整理中，管理員正在蓋章...<br/>σ(^_^;)",
        "倉庫太大，小精靈騎腳踏車載貨中...<br/>(╯°□°)╯︵",
    ],

    // 【情境：傳送 / 儲存訂單】 - 適合 Submit 或 Save 按鈕
    saving: [
        "訂單紀錄中，請勿關閉視窗<br/>ε=ε=ε=ε=ε=ε=┌(;￣◇￣)┘",
        "正在把資料塞進保險箱，請勿關閉視窗！<br/>(｀･ω･´)ゞ",
        "正在快馬加鞭傳送您的訂單！請勿關閉視窗！<br/>( ^ ^ )/□",
        "正在紀錄您的訂單，請勿關閉視窗...<br/>!?(･_･;?",
        "檢查訂單封條，請勿關閉視窗！<br/>(｀･ω･´)ゞ",
        "正在幫您的資料蓋章，請勿關閉視窗！<br/>( •̀ㅂ•́)و✧",
        "把資料鎖進保險箱，請勿關閉視窗...<br/>🔐(─ω─ )",
        "傳送資料...小精靈不要摸魚了！請勿關閉視窗！<br/>◡ ヽ(`Д´)ﾉ ┻━┻",
        "管理員正全神貫注盯著訂單傳輸進度...請勿關閉視窗<br/>(;´༎ຶД༎ຶ`)",
        "小精靈正在努力把資料塞進資料庫，請勿關閉視窗！<br/>(๑•̀ㅂ•́)و✧",
        "小精靈們正在手牽手組成保護網，請勿關閉視窗...<br/>(っ´∀｀)っ(っ´∀｀)っ",
        "小精靈幫您的資料繫上安全帶...請勿關閉視窗<br/>( ﾟДﾟ)b",
        "小精靈正全速奔向伺服器中，請勿關閉視窗！<br/>ψ(｀∇´)ψ",
        "管理員與小精靈正在進行資料校對..請勿關閉視窗.<br/>( •̀ω•́ )",
        "訂單正在穿越時空隧道，請勿關閉視窗...<br/>☆〜（ゝ。∂）",
        "資料正在排隊進雲端，請勿關閉視窗...<br/>( ´Д`)y━･~~",
        "正在把訂單刻進硬碟裡...請勿關閉視窗<br/>(( _ _ ))..zzzZZ",
        "資料已裝箱，管理員正在貼封箱膠帶...請勿關閉視窗<br/>m(__)m"
    ],

    // 【情境：維修 / 較長等待】 - 適合處理大型運算
    maintenance: [
        "齒輪轉動中，我們正在努力校對...<br/>⚙️(ﾟДﾟ)⚙️",
        "系統正在進行腦袋大風吹...<br/>🧠🌪️",
        "正在排除前方的障礙物...<br/>🚧(👷)"
    ]
};

/**
 * 取得隨機文字的輔助函數
 * @param {string} category - 情境類別 (default, fetching, saving)
 */

function getRandomLoadingText(category = 'default') {
    const list = loadingPhrases[category] || loadingPhrases['default'];
    const text = list[Math.floor(Math.random() * list.length)];
    return text;
}

/* =====================
   Loading 控制
===================== */
let phraseTimer = null;

function toggleLoading(show, context = "default") {
    // 1. 先清除舊的
    $('#loadingOverlay').remove();
    if (phraseTimer) clearInterval(phraseTimer);

    if (show) {
        // 判斷要顯示的初始文字
        const initialText = loadingPhrases[context]
            ? getRandomLoadingText(context)
            : context;

        // 2. 注入 HTML (注意這裡 id="loadingText" 必須存在)
        $('body').append(`
          <div id="loadingOverlay" style="
            position:fixed; top:0; left:0; width:100%; height:100%; 
            background:rgba(0,0,0,0.7); display:flex; justify-content:center; 
            align-items:center; z-index:9999; color:white; flex-direction:column; 
            backdrop-filter: blur(4px); text-align: center; font-family: sans-serif;
          ">
            <div class="spinner-border text-light" role="status" style="width: 3rem; height: 3rem;"></div>
            <div id="loadingText" class="mt-3 fs-5 fw-bold" style="line-height: 1.6; min-height: 3em;">
                ${initialText}
            </div>
          </div>
        `);

        $('body').css('overflow', 'hidden');

        // 3. 如果 context 是一個已知的情境，才啟動自動換字
        if (loadingPhrases[context]) {
            phraseTimer = setInterval(() => {
                $('#loadingText').fadeOut(400, function () {
                    $(this).html(getRandomLoadingText(context)).fadeIn(400);
                });
            }, 2000); // 稍微拉長到 3 秒，讓使用者看完字
        }
    } else {
        $('body').css('overflow', '');
    }
}


/* =====================
   Alert
===================== */
/**
 * 萬用小精靈彈窗
 * @param {Object} options 配置參數
 * @param {string} options.type - 情境 (success, error, warning, fetching, saving)
 * @param {string} options.message - 顯示的訊息
 * @param {Array}  options.buttons - 按鈕配置 [ {text, class, onClick}, ... ]
 */
function fairyModal({ type = "info", message = "", buttons = [] }) {
    $('.fairy-alert-overlay').remove();

    const config = {
        success: { emoji: "✧*｡٩(ˊᗜˋ*)و✧*｡", title: "小精靈回報：成功啦！" },
        error: { emoji: "(ﾟДﾟ≡ﾟДﾟ)!!!", title: "管理員大喊：出錯了！" },
        warning: { emoji: "∑(ι´Дン)ノ", title: "小精靈提醒：" },
        info: { emoji: "∠( ᐛ 」∠)＿", title: "" }
    };

    const scene = config[type] || config.info;

    // 動態生成按鈕 HTML
    let buttonsHtml = '';
    if (buttons.length > 0) {
        buttonsHtml = `<div class="row g-2 mt-4">`; // 使用 Bootstrap g-2 讓間距更漂亮
        buttons.forEach((btn, index) => {
            const btnClass = btn.class || "btn_main";
            const colClass = btn.fullWidth ? "col-12" : "col";
            buttonsHtml += `<div class="${colClass}"><a class="btn w-100 modal-btn-${index} ${btnClass}">${btn.text}</a></div>`;
        });
        buttonsHtml += `</div>`;
    } else {
        // 如果沒傳按鈕，預設給一個「好喔」
        buttonsHtml = `<div class="mt-4"><a class="btn btn_main w-100 modal-close">好喔！</a></div>`;
    }

    const html = `
        <div class="fairy-alert-overlay">
            <div class="fairy-alert-box">
                <div class="fairy-alert-icon">${scene.emoji}</div>
                <h3 style="margin: 0 0 10px 0; color: #333;">${scene.title}</h3>
                <div style="color: #666; line-height: 1.5;">${message}</div>
                ${buttonsHtml}
            </div>
        </div>
    `;

    $('body').append(html);
    setTimeout(() => $('.fairy-alert-box').addClass('show'), 10);

    // 綁定按鈕事件
    buttons.forEach((btn, index) => {
        $(`.modal-btn-${index}`).on('click', function() {
            if (btn.onClick) btn.onClick();
            closeModal();
        });
    });

    // 預設關閉事件
    $('.modal-close, .fairy-alert-overlay').on('click', function(e) {
        if ($(e.target).closest('.fairy-alert-box').length && !$(e.target).hasClass('modal-close')) return;
        closeModal();
    });

    function closeModal() {
        $('.fairy-alert-box').removeClass('show');
        setTimeout(() => $('.fairy-alert-overlay').remove(), 300);
    }
}