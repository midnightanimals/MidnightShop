(function ($) {
  'use strict';

  // ── 模組狀態 ─────────────────────────────────────────────────────
  let galleryData = null;
  let lbPhotos = [];
  let lbIndex = 0;
  let carCurrent = 0;
  let carTimer = null;
  let touchStartX = 0;

  // ── 初始化：載入資料後路由 ────────────────────────────────────────
  $(async function () {
    try {
      const res = await fetch('data/gallery.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      galleryData = await res.json();
    } catch (e) {
      console.error('Gallery: 資料載入失敗', e);
      $('#galleryRoot').html(
        '<div class="container py-5 text-center text-muted">相簿資料載入失敗，請稍後再試</div>'
      );
      return;
    }
    route();
    bindLightboxEvents();
  });

  // ── 路由 ──────────────────────────────────────────────────────────
  function route() {
    const albumId = new URLSearchParams(window.location.search).get('album');
    if (albumId) {
      const album = (galleryData.albums || []).find(a => a.id === albumId);
      album ? renderAlbumDetail(album) : renderNotFound();
    } else {
      renderAlbumList();
    }
  }

  // ── 排序工具 ──────────────────────────────────────────────────────

  // 相簿與照片均依 date 欄位由新到舊排序
  // 若照片沒有 date 欄位，維持 JSON 陣列原始順序（手動最新在前即可）
  function sortByDateDesc(arr) {
    return [...arr].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
  }

  function getSortedPhotos(photos) {
    const hasAnyDate = photos.some(p => p.date);
    return hasAnyDate ? sortByDateDesc(photos) : photos;
  }

  // ════════════════════════════════════════════════════════════════
  // 視圖 1：相簿列表 + 精選輪播
  // ════════════════════════════════════════════════════════════════
  function renderAlbumList() {
    let html = '';

    if (galleryData.featured?.length) {
      html += buildFeaturedCarousel(galleryData.featured);
    }

    const sortedAlbums = sortByDateDesc(galleryData.albums || []);
    const cards = sortedAlbums.map(buildAlbumCard).join('');

    html += `
      <div class="container py-5">
        <h2 class="gallery-section-title mb-4">相簿</h2>
        <div class="gallery-album-grid">${cards}</div>
      </div>
    `;

    $('#galleryRoot').html(html);
    initCarousel();
  }

  function buildFeaturedCarousel(featured) {
    const slides = featured.map(f => `
      <div class="gallery-featured__slide">
        <img src="${esc(f.src)}" alt="${esc(f.caption || '')}" loading="lazy">
        ${f.caption ? `<div class="gallery-featured__caption">${esc(f.caption)}</div>` : ''}
      </div>
    `).join('');

    const hasMultiple = featured.length > 1;
    const dots = hasMultiple
      ? featured.map((_, i) =>
          `<span class="gallery-featured__dot${i === 0 ? ' active' : ''}" data-dot="${i}"></span>`
        ).join('')
      : '';

    const navBtns = hasMultiple ? `
      <button class="gallery-featured__btn gallery-featured__btn--prev" id="carPrev" aria-label="上一張">
        <i class="fa fa-chevron-left"></i>
      </button>
      <button class="gallery-featured__btn gallery-featured__btn--next" id="carNext" aria-label="下一張">
        <i class="fa fa-chevron-right"></i>
      </button>
      <div class="gallery-featured__dots">${dots}</div>
    ` : '';

    return `
      <div class="gallery-featured" id="featuredCarousel">
        <div class="gallery-featured__track" id="carTrack">${slides}</div>
        ${navBtns}
      </div>
    `;
  }

  function buildAlbumCard(album) {
    const count = album.photos?.length || 0;
    return `
      <div class="gallery-album-card">
        <a href="gallery.html?album=${esc(album.id)}">
          <div class="gallery-album-card__cover">
            <img src="${esc(album.cover)}" alt="${esc(album.title)}" loading="lazy">
          </div>
          <div class="gallery-album-card__info">
            <h3>${esc(album.title)}</h3>
            <p>${esc(album.description || '')}${count ? ` · ${count} 張` : ''}</p>
          </div>
        </a>
      </div>
    `;
  }

  // ── 輪播 ──────────────────────────────────────────────────────────
  function initCarousel() {
    const $carousel = $('#featuredCarousel');
    if (!$carousel.length) return;

    const total = $carousel.find('.gallery-featured__slide').length;
    if (total <= 1) return;

    carCurrent = 0;

    function goTo(index) {
      carCurrent = ((index % total) + total) % total;
      $('#carTrack').css('transform', `translateX(-${carCurrent * 100}%)`);
      $carousel.find('.gallery-featured__dot').removeClass('active').eq(carCurrent).addClass('active');
    }

    function startAuto() {
      clearInterval(carTimer);
      carTimer = setInterval(() => goTo(carCurrent + 1), 4500);
    }

    $('#carPrev').on('click', () => { goTo(carCurrent - 1); startAuto(); });
    $('#carNext').on('click', () => { goTo(carCurrent + 1); startAuto(); });

    $carousel.on('click', '.gallery-featured__dot', function () {
      goTo(parseInt($(this).data('dot')));
      startAuto();
    });

    // 觸控滑動（輪播）
    $carousel
      .on('touchstart', e => { touchStartX = e.originalEvent.touches[0].clientX; })
      .on('touchend',   e => {
        const dx = e.originalEvent.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 50) { goTo(dx < 0 ? carCurrent + 1 : carCurrent - 1); startAuto(); }
      });

    startAuto();
  }

  // ════════════════════════════════════════════════════════════════
  // 視圖 2：相簿詳細頁（照片新到舊）
  // ════════════════════════════════════════════════════════════════
  function renderAlbumDetail(album) {
    const photos = getSortedPhotos(album.photos || []);

    const photoItems = photos.map((p, i) => `
      <div class="gallery-photo-item" data-index="${i}">
        <div class="gallery-photo-item__img">
          <img src="${esc(p.src)}" alt="${esc(p.caption || '')}" loading="lazy">
        </div>
        ${p.caption ? `<div class="gallery-photo-item__caption">${esc(p.caption)}</div>` : ''}
      </div>
    `).join('');

    $('#galleryRoot').html(`
      <div class="container py-4 py-md-5">
        <div class="mb-4">
          <a href="gallery.html" class="btn btn_sub btn-sm">
            <i class="fa fa-arrow-left me-2"></i>返回相簿列表
          </a>
        </div>
        <h2 class="gallery-album-title mb-1">${esc(album.title)}</h2>
        ${album.description ? `<p class="text-muted mb-4">${esc(album.description)}</p>` : '<div class="mb-4"></div>'}
        <div class="gallery-photo-grid">${photoItems}</div>
      </div>
    `);

    lbPhotos = photos;

    $('#galleryRoot').on('click', '.gallery-photo-item', function () {
      openLightbox(parseInt($(this).data('index')));
    });
  }

  // ════════════════════════════════════════════════════════════════
  // 燈箱
  // ════════════════════════════════════════════════════════════════
  function bindLightboxEvents() {
    // 點擊暗色背景關閉
    $('#galleryLightbox').on('click', function (e) {
      if (e.target === this) closeLightbox();
    });

    $('.lb-close').on('click', closeLightbox);

    $('#lbPrev').on('click', () => { if (lbIndex > 0)                   { lbIndex--; updateLightbox(); } });
    $('#lbNext').on('click', () => { if (lbIndex < lbPhotos.length - 1) { lbIndex++; updateLightbox(); } });

    // 鍵盤
    $(document).on('keydown.gallery', function (e) {
      if (!$('#galleryLightbox').hasClass('active')) return;
      if (e.key === 'Escape')      closeLightbox();
      if (e.key === 'ArrowLeft'  && lbIndex > 0)                    { lbIndex--; updateLightbox(); }
      if (e.key === 'ArrowRight' && lbIndex < lbPhotos.length - 1)  { lbIndex++; updateLightbox(); }
    });

    // 觸控滑動（燈箱）
    $('#galleryLightbox')
      .on('touchstart', e => { touchStartX = e.originalEvent.touches[0].clientX; })
      .on('touchend',   e => {
        const dx = e.originalEvent.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) < 40) return;
        if (dx < 0 && lbIndex < lbPhotos.length - 1) { lbIndex++; updateLightbox(); }
        if (dx > 0 && lbIndex > 0)                   { lbIndex--; updateLightbox(); }
      });
  }

  function openLightbox(index) {
    lbIndex = index;
    updateLightbox();
    $('#galleryLightbox').addClass('active');
    $('body').css('overflow', 'hidden');
  }

  function closeLightbox() {
    $('#galleryLightbox').removeClass('active');
    $('body').css('overflow', '');
    setTimeout(() => {
      if (!$('#galleryLightbox').hasClass('active')) $('#lbImg').attr('src', '');
    }, 250);
  }

  function updateLightbox() {
    const photo = lbPhotos[lbIndex];
    $('#lbImg').attr({ src: photo.src, alt: photo.caption || '' });
    $('#lbCaption').text(photo.caption || '');
    $('#lbCounter').text(`${lbIndex + 1} / ${lbPhotos.length}`);
    $('#lbPrev').prop('disabled', lbIndex === 0);
    $('#lbNext').prop('disabled', lbIndex === lbPhotos.length - 1);
  }

  // ── 錯誤畫面 ──────────────────────────────────────────────────────
  function renderNotFound() {
    $('#galleryRoot').html(
      '<div class="container py-5 text-center text-muted">找不到此相簿</div>'
    );
  }

  // ── HTML 跳脫防 XSS ───────────────────────────────────────────────
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

}(jQuery));
