/*
 * <free-shipping-bar> — updates itself whenever the cart changes.
 * Listens to Dawn's cartUpdate pubsub event (fired by product forms,
 * the cart drawer quantity buttons, and our sticky-atc).
 */
if (!customElements.get('free-shipping-bar')) {
  class FreeShippingBar extends HTMLElement {
    connectedCallback() {
      this.text = this.querySelector('[data-text]');
      this.fill = this.querySelector('[data-fill]');
      this.track = this.querySelector('[data-track]');

      if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        this.unsubscribe = subscribe(PUB_SUB_EVENTS.cartUpdate, () => this.refresh());
      }
      // Under Shopify Markets the server-rendered first paint compares a base-currency
      // threshold against a converted cart total, so correct it right away.
      if (parseFloat(window.Shopify?.currency?.rate || '1') !== 1) this.refresh();
      // Back/forward cache can restore a stale bar.
      this.onPageShow = (e) => e.persisted && this.refresh();
      window.addEventListener('pageshow', this.onPageShow);
    }

    disconnectedCallback() {
      this.unsubscribe?.();
      window.removeEventListener('pageshow', this.onPageShow);
    }

    // Threshold is in base currency; convert to the shopper's presentment currency.
    thresholdCents() {
      const rate = parseFloat(window.Shopify?.currency?.rate || '1');
      return Math.round(Number(this.dataset.threshold) * rate);
    }

    format(cents) {
      const currency = window.Shopify?.currency?.active || 'USD';
      const locale = document.documentElement.lang || undefined;
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
    }

    async refresh() {
      // Always read the real cart; event payloads differ between Dawn versions.
      const res = await fetch(`${window.Shopify?.routes?.root || '/'}cart.js`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return;
      const cart = await res.json();
      this.update(cart.total_price);
    }

    update(totalCents) {
      const threshold = this.thresholdCents();
      const remaining = Math.max(threshold - totalCents, 0);
      const pct = threshold > 0 ? Math.min(Math.floor((totalCents / threshold) * 100), 100) : 100;

      this.fill.style.width = `${pct}%`;
      this.track.setAttribute('aria-valuenow', pct);
      this.text.textContent =
        remaining > 0
          ? this.dataset.msgRemaining.replace('[amount]', this.format(remaining))
          : this.dataset.msgDone;
    }
  }

  customElements.define('free-shipping-bar', FreeShippingBar);
}
