# Dawn Extras: three conversion sections for Shopify's Dawn theme

| Section | What it does | Shopify concepts it exercises |
|---|---|---|
| **Sticky add to cart** | A bar slides up once the main ATC button scrolls off-screen, mirrors the selected variant's price and stock, and adds it to the cart without a page reload | Liquid objects, the AJAX Cart API, the Section Rendering API, Dawn's pub/sub events, IntersectionObserver |
| **Free shipping bar** | "You're $12 away from free shipping" with a progress bar that updates live as the cart changes | `cart` object, `money` filter, multi-currency (Shopify Markets) conversion, `/cart.js` |
| **Size chart** | A "Size guide" link that opens a modal table built from a product metafield, and renders nothing on products without a chart | Metafields (JSON type), `<dialog>`, theme editor schema |

---

## 1. Set up a free dev store (≈10 min)

1. Sign up at **partners.shopify.com** (free).
2. Go to **Stores → Add store → Create development store**, choose "Create a store to test and build".
3. In the store admin, **Online Store → Themes**. Dawn is the default theme.
4. Add 2–3 test products, with at least one that has **Size** variants (S / M / L) and one variant set to 0 inventory with "continue selling" off, so you can test the sold-out state.

## 2. Get the theme locally with Shopify CLI

```bash
npm install -g @shopify/cli@latest
shopify theme pull --store your-store.myshopify.com      # pick Dawn
shopify theme dev  --store your-store.myshopify.com      # live preview at http://127.0.0.1:9292
```

Copy this repo's `sections/` and `assets/` files into the pulled theme folder. `theme dev` hot-reloads.

## 3. Add the sections in the theme editor

- **Customize → Products → Default product → Add section → Sticky add to cart**
- Same template → **Add section → Size chart**, and drag it under the product info
- **Header group → Add section → Free shipping bar** (or put it on the cart template)

## 4. Create the size-chart metafield

**Settings → Custom data → Products → Add definition**
- Name: `Size chart`, namespace and key: `custom.size_chart`, type: **JSON**

Then on a product, paste:

```json
{
  "unit": "in",
  "columns": ["Size", "Chest", "Waist", "Length"],
  "rows": [
    ["S", "34–36", "28–30", "27"],
    ["M", "38–40", "31–33", "28"],
    ["L", "42–44", "34–36", "29"]
  ]
}
```

## 5. Test checklist (do each one and note what happens)

- [ ] Scroll down a product page: the sticky bar appears only *after* the main button is off-screen
- [ ] Change the size: the sticky bar's price and label update
- [ ] Pick the sold-out variant: the sticky button shows "Sold out" and is disabled
- [ ] Click sticky "Add to cart": the cart drawer opens with the right variant and the header count updates
- [ ] Add the same item until inventory runs out: the error message from Shopify (422) shows under the bar
- [ ] Free shipping bar moves when you add items, and after changing quantity in the cart drawer
- [ ] Settings → Markets: enable a second currency, switch to it, and check the bar's amount converts
- [ ] Product **without** the metafield shows no "Size guide" link
- [ ] Mobile width (DevTools): sticky bar hides the image, and the table scrolls sideways
- [ ] Lighthouse accessibility score on a product page

## 6. Ship it

```bash
shopify theme push --unpublished   # creates a new theme you can share via preview link
shopify theme share                 # gives a public preview URL for your application
```

Push the code to GitHub too (`dawn-extras`), and include screenshots or a short screen recording in the README.

---

## Design decisions (and why)

- **The sticky bar never stores the variant itself.** It reads the main form's hidden `<input name="id">` at click time, so it can't add a different variant from the one the shopper picked, whatever Dawn version re-renders the picker.
- **One request, not two, to add to the cart.** It passes `sections` to `/cart/add.js` so Shopify returns the re-rendered cart drawer HTML in the same response (the Section Rendering API), and calls Dawn's own `renderContents()`.
- **The free shipping bar renders on the server first**, so there's no layout jump, then corrects itself in JS. The threshold is stored in base currency and multiplied by `Shopify.currency.rate`, because `cart.total_price` is in the shopper's presentment currency.
- **The size chart is data, not code.** Merchants edit sizes in the admin. No theme edits are needed per product.
