class SenaTheme {
  constructor() {
    this.bindQuantityButtons();
    this.bindVariantSelectors();
    this.bindAutoSubmit();
    this.bindProductRecommendations();
    this.bindDesktopNavHover();
    this.bindFilterDrawers();
    this.syncHeaderHeight();
  }

  bindQuantityButtons() {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-quantity-button]');
      if (!button) return;

      const wrapper = button.closest('[data-quantity]');
      const input = wrapper?.querySelector('input[type="number"]');
      if (!input) return;

      const step = Number(input.step || 1);
      const min = Number(input.min || 1);
      const current = Number(input.value || min);
      input.value = String(Math.max(min, current + (button.dataset.quantityButton === 'increase' ? step : -step)));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  bindVariantSelectors() {
    document.querySelectorAll('[data-variant-selects]').forEach((selector) => {
      const json = selector.querySelector('[data-variants-json]');
      const formId = selector.dataset.productForm;
      const form = document.getElementById(formId);
      if (!json || !form) return;

      const variants = JSON.parse(json.textContent);
      const selects = Array.from(selector.querySelectorAll('[data-option-select]'));
      const hiddenInput = form.querySelector('input[name="id"]');
      const addButton = form.querySelector('[data-add-to-cart]');
      const addText = form.querySelector('[data-add-to-cart-text]');
      const price = document.querySelector(`[data-product-price="${selector.dataset.section}"]`);

      const update = () => {
        const selectedOptions = selects.map((select) => select.value);
        const variant = variants.find((item) => item.options.every((option, index) => option === selectedOptions[index]));

        if (!variant) {
          addButton.disabled = true;
          addText.textContent = 'Unavailable';
          return;
        }

        hiddenInput.value = variant.id;
        addButton.disabled = !variant.available;
        addText.textContent = variant.available ? 'Add to cart' : 'Sold out';

        if (price) {
          const regular = new Intl.NumberFormat(document.documentElement.lang || 'en-US', {
            style: 'currency',
            currency: price.dataset.currency || 'USD'
          }).format(variant.price / 100);
          const compare = variant.compare_at_price && variant.compare_at_price > variant.price
            ? `<s class="price__compare">${new Intl.NumberFormat(document.documentElement.lang || 'en-US', { style: 'currency', currency: price.dataset.currency || 'USD' }).format(variant.compare_at_price / 100)}</s>`
            : '';
          price.innerHTML = `<span>${regular}</span>${compare}`;
        }

        const url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url);
      };

      selects.forEach((select) => select.addEventListener('change', update));
    });
  }

  bindAutoSubmit() {
    document.querySelectorAll('[data-auto-submit]').forEach((element) => {
      element.addEventListener('change', () => element.form?.submit());
    });
  }

  bindProductRecommendations() {
    document.querySelectorAll('[data-recommendations-url]').forEach(async (container) => {
      try {
        const response = await fetch(container.dataset.recommendationsUrl);
        const html = await response.text();
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        const content = parsed.querySelector('[data-recommendations-content]');
        if (content?.innerHTML.trim()) container.innerHTML = content.innerHTML;
      } catch (error) {
        console.warn('Product recommendations could not be loaded.', error);
      }
    });
  }

  bindDesktopNavHover() {
    document.querySelectorAll('.desktop-nav__dropdown').forEach((dropdown) => {
      const summary = dropdown.querySelector(':scope > summary');
      if (!summary) return;

      dropdown.querySelectorAll('.collection-tree').forEach((tree) => {
        tree.addEventListener('pointerenter', (event) => {
          if (event.pointerType === 'mouse') tree.classList.add('is-expanded');
        });

        tree.addEventListener('pointerleave', (event) => {
          if (event.pointerType === 'mouse') tree.classList.remove('is-expanded');
        });
      });

      dropdown.addEventListener('pointerenter', (event) => {
        if (event.pointerType !== 'mouse') return;

        dropdown.setAttribute('open', '');
      });

      summary.addEventListener('click', (event) => {
        const isMouseClick = event.detail > 0 && (!event.pointerType || event.pointerType === 'mouse');
        if (!isMouseClick) return;

        event.preventDefault();
        dropdown.setAttribute('open', '');
      });

      dropdown.addEventListener('pointerleave', (event) => {
        if (event.pointerType !== 'mouse') return;
        if (dropdown.contains(document.activeElement)) return;

        dropdown.removeAttribute('open');
      });
    });
  }

  bindFilterDrawers() {
    document.querySelectorAll('[data-filter-drawer]').forEach((drawer) => {
      const trigger = drawer.querySelector(':scope > summary');
      const closeButton = drawer.querySelector('[data-filter-close]');

      const closeDrawer = () => {
        drawer.removeAttribute('open');
        trigger?.focus();
      };

      closeButton?.addEventListener('click', closeDrawer);
      drawer.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        closeDrawer();
      });
    });
  }

  syncHeaderHeight() {
    let ticking = false;
    const update = () => {
      const header = document.querySelector('.site-header');
      const announcement = document.querySelector('.announcement');
      const headerBottom = header?.getBoundingClientRect().bottom || 0;
      const announcementBottom = Math.max(0, announcement?.getBoundingClientRect().bottom || 0);
      document.documentElement.style.setProperty('--header-bottom', `${Math.max(headerBottom, announcementBottom)}px`);
      ticking = false;
    };
    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('resize', requestUpdate, { passive: true });
    window.addEventListener('scroll', requestUpdate, { passive: true });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SenaTheme());
} else {
  new SenaTheme();
}
