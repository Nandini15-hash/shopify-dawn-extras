# Application answer: fill in AFTER you've built and tested it

Fill in the [brackets] from what actually happened to you. Delete anything you didn't do.

---

I'm newer to Shopify than to general web development. My main stack is React and MERN (I've shipped [taskflow / eventhive / ai-resume-project] on Vercel). To learn Shopify properly I built **Dawn Extras** [link to repo + theme preview link], three custom sections for Shopify's Dawn theme on a development store:

- **Sticky add-to-cart bar.** It appears once the main button scrolls off-screen and adds the selected variant through the AJAX Cart API, refreshing Dawn's cart drawer with the Section Rendering API so it all happens in one request.
- **Free-shipping progress bar.** It's server-rendered in Liquid and updates live on cart changes. It converts the threshold correctly under Shopify Markets.
- **Metafield-driven size chart.** Merchants manage sizes as JSON in the admin, and products without a chart show nothing.

**What I personally did:** set up the Partner dev store and Shopify CLI workflow, [wrote / adapted] the Liquid sections and schemas, wired them into Dawn's pub/sub events, set up the metafield definition, and tested variants, sold-out states, inventory errors, mobile, and multi-currency. [Mention anything you changed or fixed yourself.]

**Hardest part:** [Pick the one that was actually hardest for you. For example: keeping the sticky bar in sync with Dawn's variant picker, which re-renders the product section on every change, so I made the main form's hidden variant input the single source of truth instead of tracking state myself / realising `cart.total_price` is in the shopper's currency while my threshold was in the store's base currency, so the bar was wrong under Markets until I converted it with `Shopify.currency.rate`.]

**What I'd do next:** [e.g. turn these into a theme app extension so they work on any Online Store 2.0 theme, not just Dawn.]
