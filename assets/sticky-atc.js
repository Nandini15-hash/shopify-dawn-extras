/*
 * <sticky-atc> — sticky add-to-cart bar for Dawn.
 *
 * Source of truth for "which variant" is ALWAYS the main product form's
 * hidden <input name="id">. The bar just mirrors it, so it can never add
 * a different variant from the one the shopper picked.
 */
if (!customElements.get('sticky-atc')) {
  class StickyAtc extends HTMLElement {
    connectedCallback() {
      this.variants = JSON.parse(this.querySelector('[data-variants]').textContent);
      this.strings = JSON.parse(this.querySelector('[data-strings]').textContent);
      this.button = this.querySelector('[data-add]');
      this.label = this.querySelector('[data-label]');
      this.priceEl = this.querySelector('[data-price]');
      this.titleEl = this.querySelector('[data-variant-title]');
      this.errorEl = this.querySelector('[data-error]');

      this.button.addEventListener('click', () => this.addToCart());
      this.watchMainButton();
      this.watchVariantChanges();
    }

    disconnectedCallback() {
      this.observer?.disconnect();
      this.unsubscribe?.();
    }

    /* ---------- Which variant is selected? ---------- */

    mainIdInput() {
      // Dawn renders one product-form per main product section.
      return document.querySelector('product-form form input[name="id"]');
    }

    currentVariantId() {
      return this.mainIdInput()?.value || this.dataset.defaultVariant;
    }

    render() {
      const id = this.currentVariantId();
      const v = this.variants[id];
      if (!v) return;
      this.priceEl.textContent = v.price;
      if (this.titleEl.textContent.trim() !== '') this.titleEl.textContent = v.title;
      this.button.disabled = !v.available;
      this.label.textContent = v.available ? this.strings.add : this.strings.soldOut;
    }

    watchVariantChanges() {
      // Dawn 13+ publishes variantChange via its pubsub helper.
      if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        this.unsubscribe = subscribe(PUB_SUB_EVENTS.variantChange, () =>
          // Dawn updates the hidden input in the same tick; wait one frame.
          requestAnimationFrame(() => this.render())
        );
      }
      // Fallback for older Dawn / other themes: any change on the main form.
      document.querySelector('product-form form')?.addEventListener('change', () =>
        requestAnimationFrame(() => this.render())
      );
      // Variant pickers live outside the form in Dawn, so also listen there.
      document.querySelectorAll('variant-selects, variant-radios').forEach((el) =>
        el.addEventListener('change', () => setTimeout(() => this.render(), 50))
      );
    }

    /* ---------- Show / hide ---------- */

    watchMainButton() {
      const target =
        document.querySelector('product-form [name="add"]') ||
        document.querySelector('.product-form__submit');
      if (!target) return;

      this.observer = new IntersectionObserver(([entry]) => {
        // Show only after the user has scrolled PAST the main button (not above it).
        const scrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        this.classList.toggle('is-visible', scrolledPast);
        this.toggleAttribute('inert', !scrolledPast);
      });
      this.observer.observe(target);
    }

    /* ---------- Add to cart ---------- */

    cartUi() {
      // Dawn ships either a cart drawer or a cart notification, depending on settings.
      return document.querySelector('cart-drawer') || document.querySelector('cart-notification');
    }

    async addToCart() {
      const id = Number(this.currentVariantId());
      const cart = this.cartUi();

      this.errorEl.hidden = true;
      this.button.disabled = true;
      this.button.setAttribute('aria-busy', 'true');
      this.label.textContent = this.strings.adding;

      const body = { items: [{ id, quantity: 1 }] };
      if (cart?.getSectionsToRender) {
        // Section Rendering API: Shopify returns fresh HTML for the cart UI in the same response.
        body.sections = cart.getSectionsToRender().map((s) => s.id);
        body.sections_url = window.location.pathname;
      }

      try {
        const res = await fetch(`${window.Shopify?.routes?.root || '/'}cart/add.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();

        if (!res.ok || data.status) {
          // 422 e.g. "You can't add more X to the cart" (inventory limit).
          throw new Error(data.description || data.message || 'Could not add to cart');
        }

        if (!cart) {
          window.location.href = this.dataset.cartUrl;
          return;
        }

        // Let the rest of Dawn (cart count, free-shipping bar, etc.) know.
        if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
          publish(PUB_SUB_EVENTS.cartUpdate, { source: 'sticky-atc', productVariantId: id, cartData: data });
        }
        cart.classList.remove('is-empty');
        cart.renderContents(data);
      } catch (err) {
        this.errorEl.textContent = err.message;
        this.errorEl.hidden = false;
      } finally {
        this.button.removeAttribute('aria-busy');
        this.render(); // restores label + disabled state from the variant table
      }
    }
  }

  customElements.define('sticky-atc', StickyAtc);
}
