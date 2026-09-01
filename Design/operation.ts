/**
 * Plugin/Design Operation Dispatcher
 *
 * Core execution engine for design system queries, component inspection,
 * Svelte 5 UI generation, token export, A11y auditing, and Chrome element bridging.
 */

import {
  DESIGN_PROTOCOL,
  type DesignInput,
  type DesignResult,
  COMPONENT_CATALOG,
  DESIGN_TOKENS,
  DOMAIN_PRESETS,
  DUOTONE_RECIPES,
  SUBSTRATES,
  type ComponentSpec,
  type TokenDefinition,
  type DomainPreset,
  type EditorialManifest,
  type DuotonePaletteId,
  type SubstrateId,
} from "./core.ts";

export async function designOperation(input: DesignInput): Promise<DesignResult> {
  const timestamp = new Date().toISOString();

  switch (input.action) {
    case "list_layers": {
      return {
        protocol: DESIGN_PROTOCOL,
        action: "list_layers",
        success: true,
        timestamp,
        data: {
          layers: [
            {
              name: "foundation",
              level: 1,
              description: "Compounds, layouts, elevation, materials, tokens, motion, gestures, and headless focus/scroll mechanisms.",
              rule: "Foundation is the floor; consumes only native CSS and headless runtimes.",
            },
            {
              name: "component",
              level: 2,
              description: "Atomic, single-part components (Button, Input, Card, Badge, Avatar, Separator, etc.).",
              rule: "Consumes only foundation. Exposes strict variants and A11y roles.",
            },
            {
              name: "composite",
              level: 3,
              description: "Multi-part interconnected patterns (Dialog, Drawer, Kanban, Chart, Pricing, Hero, Menu).",
              rule: "Composes components and foundation; zero business domain logic.",
            },
            {
              name: "block",
              level: 4,
              description: "Full content sections and specialized tool modules (Screener, Questionnaire, Auth, Case, Document).",
              rule: "Reusable across products; accepts typed domain parameters.",
            },
            {
              name: "template",
              level: 5,
              description: "Whole-page scaffolding archetypes (Information, Transaction, Navigation, Operation).",
              rule: "Top of the hierarchy; coordinates blocks and layouts.",
            },
          ],
        },
      };
    }

    case "catalog": {
      let components = [...COMPONENT_CATALOG];
      if (input.layer) {
        components = components.filter((c) => c.layer === input.layer);
      }
      if (input.category) {
        components = components.filter((c) => c.category === input.category);
      }
      if (input.prompt) {
        const query = input.prompt.toLowerCase();
        components = components.filter(
          (c) =>
            c.id.toLowerCase().includes(query) ||
            c.name.toLowerCase().includes(query) ||
            c.description.toLowerCase().includes(query)
        );
      }
      if (input.limit && input.limit > 0) {
        components = components.slice(0, input.limit);
      }
      return {
        protocol: DESIGN_PROTOCOL,
        action: "catalog",
        success: true,
        timestamp,
        data: {
          total: components.length,
          components: components.map((c) => ({
            id: c.id,
            name: c.name,
            layer: c.layer,
            category: c.category,
            description: c.description,
            importPath: c.importPath,
            variants: c.variants,
          })),
        },
      };
    }

    case "inspect_component": {
      if (!input.component_id && !input.prompt) {
        return {
          protocol: DESIGN_PROTOCOL,
          action: "inspect_component",
          success: false,
          timestamp,
          data: null,
          diagnostics: ["A component_id (e.g. 'button', 'dialog', 'screener') is required."],
        };
      }
      const target = (input.component_id ?? input.prompt ?? "").toLowerCase();
      const match = COMPONENT_CATALOG.find(
        (c) => c.id.toLowerCase() === target || c.name.toLowerCase() === target
      );
      if (!match) {
        return {
          protocol: DESIGN_PROTOCOL,
          action: "inspect_component",
          success: false,
          timestamp,
          data: null,
          diagnostics: [`Component '${target}' not found in catalog. Run action: 'catalog' to inspect available components.`],
        };
      }
      const resolvedPrimitives = match.primitives
        ? COMPONENT_CATALOG.filter((c) => match.primitives!.includes(c.id)).map((p) => ({
            id: p.id,
            name: p.name,
            subpath: p.subpath,
            description: p.description,
            example: p.example,
          }))
        : undefined;

      const parentComposite = match.parentComposite
        ? COMPONENT_CATALOG.find((c) => c.id === match.parentComposite)
        : undefined;

      return {
        protocol: DESIGN_PROTOCOL,
        action: "inspect_component",
        success: true,
        timestamp,
        data: {
          component: match,
          quickImport: `import { ${match.name} } from '${match.importPath}';`,
          resolvedPrimitives,
          parentComposite: parentComposite ? { id: parentComposite.id, name: parentComposite.name } : undefined,
        },
      };
    }

    case "theme_tokens": {
      let tokens = [...DESIGN_TOKENS];
      if (input.token_category) {
        tokens = tokens.filter((t) => t.category === input.token_category);
      }
      const cssVariables = tokens.map((t) => `  ${t.cssVariable}: ${t.value}; /* ${t.description} */`).join("\n");
      return {
        protocol: DESIGN_PROTOCOL,
        action: "theme_tokens",
        success: true,
        timestamp,
        data: {
          total: tokens.length,
          category: input.token_category ?? "all",
          tokens,
          cssRoot: `:root {\n${cssVariables}\n}`,
        },
      };
    }

    case "generate_ui": {
      const intent = input.intent ?? "marketing_hero";
      let code = "";
      let requiredImports = ["Button", "Card"];

      if (intent === "marketing_hero") {
        requiredImports = ["Hero", "Button", "Card"];
        code = `<script lang="ts">
  import { Hero, Button, Card } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";

  let { title = "Measure what matters, effortlessly", subtitle = "Send anonymous, clinically-validated screening links to clients in seconds." } = $props();
</script>

<section class="mx-auto w-full max-w-5xl px-6 py-16">
  <Hero
    {title}
    {subtitle}
    badge="100% Privacy Focused"
    primaryAction={{ label: "Create Screening Link", href: "#workspace" }}
  />
</section>`;
      } else if (intent === "auth_form") {
        requiredImports = ["Card", "Input", "Button"];
        code = `<script lang="ts">
  import { Card, Input, Button } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";

  let email = $state("");
  let busy = $state(false);

  async function handleLogin() {
    busy = true;
    try {
      // authentication dispatch logic
    } finally {
      busy = false;
    }
  }
</script>

<div class="mx-auto flex min-h-[60vh] w-full max-w-md items-center justify-center p-4">
  <Card padding="lg" class="w-full space-y-4">
    <div class="space-y-1">
      <h2 class="text-title-2 font-bold text-foreground">Sign In</h2>
      <p class="text-caption text-muted">Enter your email to receive a secure login link.</p>
    </div>

    <form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-4">
      <div class="space-y-1.5">
        <label for="email" class="text-caption font-medium text-foreground">Email Address</label>
        <Input id="email" bind:value={email} type="email" placeholder="you@clinic.com" required />
      </div>

      <Button type="submit" variant="primary" state={busy ? "busy" : "idle"} class="w-full">
        Continue with Email
      </Button>
    </form>
  </Card>
</div>`;
      } else if (intent === "screener") {
        requiredImports = ["Screener"];
        code = `<script lang="ts">
  import { Screener } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";

  let { quotaUsed = 3, quotaTotal = 10, pro = false } = $props();
</script>

<div class="mx-auto w-full max-w-4xl p-6">
  <Screener
    scale="gad7"
    {quotaUsed}
    {quotaTotal}
    {pro}
  />
</div>`;
      } else if (intent === "pricing_table") {
        requiredImports = ["Pricing", "Card", "Button"];
        code = `<script lang="ts">
  import { Pricing } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";

  const plans = [
    {
      id: "free",
      name: "Starter",
      price: "$0",
      description: "10 private screening links per month. No signup needed.",
      features: ["10 active links/mo", "GAD-7 & PHQ-9 scales", "Instant scoring receipt"],
      current: true,
    },
    {
      id: "pro",
      name: "Professional",
      price: "$19/mo",
      description: "Unlimited screening with longitudinal retest tracking.",
      features: ["Unlimited private links", "Retest progress trends", "Priority support", "Custom branding"],
      current: false,
    },
  ];
</script>

<div class="mx-auto w-full max-w-5xl px-6 py-12">
  <Pricing {plans} onSelectPlan={(id) => alert("Selected: " + id)} />
</div>`;
      } else if (intent === "ecommerce_pdp") {
        requiredImports = ["Card", "Button", "Badge"];
        code = `<script lang="ts">
  import { Card, Button, Badge } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";

  // Product specification and variant options
  const product = {
    id: "prod_aurora_pro",
    name: "Aurora Ultra-Light Noise-Canceling Headphones",
    tagline: "Studio-grade acoustics with 48h active noise cancellation",
    rating: 4.9,
    reviewsCount: 1420,
    basePrice: 349,
    msrp: 429,
    variants: [
      { id: "v_midnight", name: "Midnight Black", colorHex: "#18181b", stock: 3, image: "/images/aurora-black.webp" },
      { id: "v_silver", name: "Lunar Silver", colorHex: "#e4e4e7", stock: 12, image: "/images/aurora-silver.webp" },
      { id: "v_navy", name: "Deep Cobalt", colorHex: "#1e3a8a", stock: 0, image: "/images/aurora-navy.webp" },
    ],
    sizes: [
      { id: "standard", label: "Standard Fit", priceMod: 0 },
      { id: "pro_case", label: "Bundle + Hard Travel Case", priceMod: 40 },
    ],
  };

  // Svelte 5 State Runes
  let selectedVariantId = $state(product.variants[0].id);
  let selectedSizeId = $state(product.sizes[0].id);
  let quantity = $state(1);
  let isPurchasing = $state(false);
  let isCartAdded = $state(false);

  // Svelte 5 Derived Runes
  let selectedVariant = $derived(
    product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0]
  );
  let selectedSize = $derived(
    product.sizes.find((s) => s.id === selectedSizeId) ?? product.sizes[0]
  );
  let unitPrice = $derived(product.basePrice + selectedSize.priceMod);
  let totalPrice = $derived(unitPrice * quantity);
  let savingsAmount = $derived((product.msrp + selectedSize.priceMod) * quantity - totalPrice);
  let savingsPercent = $derived(
    Math.round(((product.msrp - product.basePrice) / product.msrp) * 100)
  );
  let isOutOfStock = $derived(selectedVariant.stock <= 0);
  let isLowStock = $derived(selectedVariant.stock > 0 && selectedVariant.stock <= 5);

  async function handleOneClickBuy() {
    if (isOutOfStock || isPurchasing) return;
    isPurchasing = true;
    try {
      // 1-Click Fast Express Checkout Dispatch
      await new Promise((resolve) => setTimeout(resolve, 800));
      alert(\`1-Click Purchase Initiated for \${quantity}x \${product.name} (\${selectedVariant.name}) - Total: $\${totalPrice}\`);
    } finally {
      isPurchasing = false;
    }
  }

  function handleAddToCart() {
    if (isOutOfStock) return;
    isCartAdded = true;
    setTimeout(() => { isCartAdded = false; }, 2500);
  }
</script>

<div class="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
  <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
    <!-- Gallery Showcase Column -->
    <div class="lg:col-span-7">
      <Card padding="none" class="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div class="flex aspect-square w-full items-center justify-center bg-surface-raised p-8">
          <div class="flex flex-col items-center space-y-4 text-center">
            <div class="h-64 w-64 rounded-full bg-gradient-to-tr from-primary/10 to-primary/30 flex items-center justify-center">
              <span class="text-title-1 font-extrabold text-foreground">{selectedVariant.name}</span>
            </div>
            <span class="text-caption font-mono text-muted">SKU: {product.id}-{selectedVariant.id}</span>
          </div>
        </div>

        {#if isLowStock}
          <div class="absolute left-4 top-4">
            <Badge variant="destructive" pulse={true}>
              ⚡ Only {selectedVariant.stock} items left in stock – order soon
            </Badge>
          </div>
        {:else if isOutOfStock}
          <div class="absolute left-4 top-4">
            <Badge variant="outline">Sold Out</Badge>
          </div>
        {:else}
          <div class="absolute left-4 top-4">
            <Badge variant="success">In Stock & Ready to Ship</Badge>
          </div>
        {/if}
      </Card>
    </div>

    <!-- Product Configuration & 1-Click Buy Column -->
    <div class="flex flex-col space-y-6 lg:col-span-5">
      <div class="space-y-2">
        <div class="flex items-center space-x-2 text-caption">
          <span class="font-semibold text-primary">★ {product.rating}</span>
          <span class="text-muted">({product.reviewsCount.toLocaleString()} verified reviews)</span>
          <span class="text-muted">•</span>
          <span class="text-success font-medium">Free 2-Day Shipping</span>
        </div>
        <h1 class="text-title-1 font-bold tracking-tight text-foreground">{product.name}</h1>
        <p class="text-body text-muted">{product.tagline}</p>
      </div>

      <!-- Pricing Summary -->
      <div class="flex items-baseline space-x-3">
        <span class="text-3xl font-extrabold text-foreground">\${unitPrice}</span>
        <span class="text-lg text-muted line-through">\${product.msrp + selectedSize.priceMod}</span>
        <Badge variant="primary" class="font-bold">Save {savingsPercent}% (\${savingsAmount})</Badge>
      </div>

      <!-- Color Variant Picker -->
      <div class="space-y-2">
        <label class="block text-caption font-semibold uppercase tracking-wider text-muted">
          Color: <span class="text-foreground">{selectedVariant.name}</span>
        </label>
        <div class="flex items-center space-x-3">
          {#each product.variants as variant}
            <button
              type="button"
              onclick={() => selectedVariantId = variant.id}
              class="relative h-10 w-10 rounded-full border-2 transition-all {selectedVariantId === variant.id ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-border hover:scale-105'}"
              style="background-color: {variant.colorHex};"
              aria-label="Select {variant.name}"
            >
              {#if variant.stock === 0}
                <span class="absolute inset-0 flex items-center justify-center">
                  <span class="h-0.5 w-8 -rotate-45 bg-destructive"></span>
                </span>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <!-- Size / Bundle Selector -->
      <div class="space-y-2">
        <label class="block text-caption font-semibold uppercase tracking-wider text-muted">
          Edition & Bundle
        </label>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {#each product.sizes as size}
            <button
              type="button"
              onclick={() => selectedSizeId = size.id}
              class="flex flex-col items-start rounded-lg border p-3 text-left transition-all {selectedSizeId === size.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-surface hover:border-muted'}"
            >
              <span class="text-caption font-medium text-foreground">{size.label}</span>
              <span class="text-xs text-muted">+{size.priceMod === 0 ? 'Included' : \`\$\${size.priceMod}\`}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Quantity & CTA Actions -->
      <div class="space-y-3 pt-2">
        <div class="flex items-center space-x-3">
          <label for="quantity" class="text-caption font-medium text-muted">Qty:</label>
          <select
            id="quantity"
            bind:value={quantity}
            class="rounded-md border border-border bg-surface px-3 py-1.5 text-caption font-medium text-foreground focus:border-primary focus:outline-none"
          >
            {#each [1, 2, 3, 4, 5] as num}
              <option value={num}>{num}</option>
            {/each}
          </select>
          <span class="text-caption text-muted">Total: <strong class="text-foreground">\${totalPrice}</strong></span>
        </div>

        <!-- 1-Click Fast Buy Button -->
        <Button
          type="button"
          variant="primary"
          state={isPurchasing ? "busy" : "idle"}
          disabled={isOutOfStock || isPurchasing}
          onclick={handleOneClickBuy}
          class="w-full py-3.5 text-base font-semibold shadow-md transition-transform active:scale-[0.99]"
        >
          {isOutOfStock ? "Out of Stock" : "⚡ Buy Now with 1-Click"}
        </Button>

        <!-- Standard Add to Cart -->
        <Button
          type="button"
          variant="line"
          disabled={isOutOfStock}
          onclick={handleAddToCart}
          class="w-full py-3 text-sm font-medium"
        >
          {isCartAdded ? "✓ Added to Cart" : "Add to Cart"}
        </Button>
      </div>

      <!-- Trust Badges -->
      <div class="grid grid-cols-3 gap-2 border-t border-border pt-4 text-center text-xs text-muted">
        <div>🔒 256-bit Encrypted</div>
        <div>🔄 30-Day Returns</div>
        <div>🛡️ 2-Year Warranty</div>
      </div>
    </div>
  </div>
</div>`;
      } else if (intent === "ecommerce_checkout") {
        requiredImports = ["Drawer", "Card", "Button", "Input", "Badge"];
        code = `<script lang="ts">
  import { Drawer, Card, Button, Input, Badge } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";

  // Cart item types and initial state
  type CartItem = {
    id: string;
    name: string;
    variant: string;
    price: number;
    quantity: number;
    image: string;
  };

  let isOpen = $state(true);
  let isSubmitting = $state(false);
  let promoInput = $state("");
  let appliedPromo = $state<string | null>("HOLAR20");
  let promoError = $state<string | null>(null);

  let items = $state<CartItem[]>([
    {
      id: "item_1",
      name: "Aurora Ultra-Light Headphones",
      variant: "Midnight Black / Standard",
      price: 349,
      quantity: 1,
      image: "/images/aurora-black.webp",
    },
    {
      id: "item_2",
      name: "Hard Shell Magnetic Travel Case",
      variant: "Matte Slate",
      price: 49,
      quantity: 1,
      image: "/images/case.webp",
    },
  ]);

  // Svelte 5 Derived Calculations
  let subtotal = $derived(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  let discountRate = $derived(
    appliedPromo === "HOLAR20" ? 0.20 : appliedPromo === "VIP10" ? 0.10 : 0
  );

  let discountAmount = $derived(
    Math.round(subtotal * discountRate * 100) / 100
  );

  let shippingCost = $derived(
    subtotal > 150 ? 0 : 15
  );

  let estimatedTax = $derived(
    Math.round((subtotal - discountAmount) * 0.0825 * 100) / 100
  );

  let orderTotal = $derived(
    Math.max(0, subtotal - discountAmount + shippingCost + estimatedTax)
  );

  function applyPromoCode() {
    promoError = null;
    const clean = promoInput.trim().toUpperCase();
    if (!clean) return;
    if (clean === "HOLAR20" || clean === "VIP10") {
      appliedPromo = clean;
      promoInput = "";
    } else {
      promoError = "Invalid discount code. Try 'HOLAR20' or 'VIP10'.";
    }
  }

  function removePromo() {
    appliedPromo = null;
  }

  function updateQuantity(id: string, delta: number) {
    items = items
      .map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
      .filter((item) => item.quantity > 0);
  }

  async function handleExpressPay(provider: "Apple Pay" | "Shop Pay") {
    isSubmitting = true;
    try {
      await new Promise((r) => setTimeout(r, 1000));
      alert(\`Processed $\${orderTotal.toFixed(2)} via \${provider}!\`);
      isOpen = false;
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Drawer open={isOpen} position="right" title="Express Checkout" onClose={() => isOpen = false}>
  <div class="flex h-full flex-col justify-between space-y-6 p-6">
    <!-- Quick 1-Tap Express Pay Buttons -->
    <div class="space-y-3">
      <div class="text-caption font-semibold uppercase tracking-wider text-muted">Express 1-Tap Checkout</div>
      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onclick={() => handleExpressPay("Apple Pay")}
          class="flex h-11 w-full items-center justify-center rounded-lg bg-black text-white font-medium hover:bg-neutral-800 transition active:scale-[0.98]"
        >
          Pay
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onclick={() => handleExpressPay("Shop Pay")}
          class="flex h-11 w-full items-center justify-center rounded-lg bg-[#5a31f4] text-white font-medium hover:bg-[#4b27d4] transition active:scale-[0.98]"
        >
          Shop Pay
        </button>
      </div>

      <div class="relative my-4 flex items-center justify-center">
        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-border"></div></div>
        <span class="relative bg-surface px-2 text-xs uppercase text-muted">Or pay with card</span>
      </div>
    </div>

    <!-- Itemized Cart Summary -->
    <div class="flex-1 space-y-4 overflow-y-auto pr-1">
      <div class="text-caption font-semibold uppercase tracking-wider text-muted">Itemized Cart ({items.length})</div>
      <div class="divide-y divide-border rounded-xl border border-border bg-surface p-3">
        {#each items as item (item.id)}
          <div class="flex items-center justify-between py-3">
            <div class="flex flex-col space-y-0.5">
              <span class="text-caption font-semibold text-foreground">{item.name}</span>
              <span class="text-xs text-muted">{item.variant}</span>
              <div class="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onclick={() => updateQuantity(item.id, -1)}
                  class="flex h-6 w-6 items-center justify-center rounded border border-border text-xs hover:bg-surface-raised"
                >-</button>
                <span class="text-caption font-medium">{item.quantity}</span>
                <button
                  type="button"
                  onclick={() => updateQuantity(item.id, 1)}
                  class="flex h-6 w-6 items-center justify-center rounded border border-border text-xs hover:bg-surface-raised"
                >+</button>
              </div>
            </div>
            <span class="text-caption font-bold text-foreground">\${item.price * item.quantity}</span>
          </div>
        {/each}
      </div>

      <!-- Promo Code Input & Badges -->
      <div class="space-y-2">
        <label for="promo" class="text-caption font-medium text-foreground">Promo Code</label>
        <div class="flex space-x-2">
          <Input id="promo" bind:value={promoInput} placeholder="e.g. HOLAR20" class="flex-1 text-sm" />
          <Button type="button" variant="secondary" onclick={applyPromoCode}>Apply</Button>
        </div>
        {#if promoError}
          <p class="text-xs text-destructive">{promoError}</p>
        {/if}
        {#if appliedPromo}
          <div class="flex items-center justify-between rounded-lg bg-success/10 px-3 py-1.5 text-xs text-success">
            <span>✓ Promo <strong>{appliedPromo}</strong> applied ({discountRate * 100}% off)</span>
            <button type="button" onclick={removePromo} class="text-muted hover:text-destructive">✕</button>
          </div>
        {/if}
      </div>
    </div>

    <!-- Order Ledger & Total Breakdown -->
    <div class="space-y-3 border-t border-border pt-4">
      <div class="space-y-1.5 text-caption">
        <div class="flex justify-between text-muted">
          <span>Subtotal</span>
          <span>\${subtotal.toFixed(2)}</span>
        </div>
        {#if discountAmount > 0}
          <div class="flex justify-between text-success">
            <span>Discount ({appliedPromo})</span>
            <span>-\${discountAmount.toFixed(2)}</span>
          </div>
        {/if}
        <div class="flex justify-between text-muted">
          <span>Shipping</span>
          <span>{shippingCost === 0 ? "FREE" : \`\$\${shippingCost.toFixed(2)}\`}</span>
        </div>
        <div class="flex justify-between text-muted">
          <span>Estimated Tax (8.25%)</span>
          <span>\${estimatedTax.toFixed(2)}</span>
        </div>
        <div class="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
          <span>Total</span>
          <span>\${orderTotal.toFixed(2)}</span>
        </div>
      </div>

      <Button
        type="button"
        variant="primary"
        state={isSubmitting ? "busy" : "idle"}
        disabled={items.length === 0 || isSubmitting}
        onclick={() => handleExpressPay("Apple Pay")}
        class="w-full py-3 font-semibold"
      >
        Complete Order • \${orderTotal.toFixed(2)}
      </Button>
    </div>
  </div>
</Drawer>`;
      } else if (intent === "academic_manuscript_viewer") {
        requiredImports = ["Card", "Badge", "Button", "Chart"];
        code = `<script lang="ts">
  import { Card, Badge, Button, Chart } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";

  // Academic Manuscript Metadata
  const manuscript = {
    id: "arxiv:2609.04128",
    title: "Latent Dynamic Attention Kernels for Sub-Millisecond LLM Speculative Decoding",
    authors: [
      { name: "Dr. Elena Rostova", institution: "Stanford AI Lab", primary: true },
      { name: "Marcus Thorne", institution: "MentalCraft Research", primary: false },
      { name: "Prof. Hiroshi Tanaka", institution: "Tokyo Institute of Technology", primary: false },
    ],
    venue: "NeurIPS 2026 (Oral Presentation)",
    doi: "10.48550/arXiv.2609.04128",
    publishedDate: "2026-08-28",
    abstract:
      "We introduce Latent Dynamic Attention (LDA), an asymmetric sparse transformer operator achieving 3.8x higher speculative verification throughput without KV cache memory overhead. Empirical validation across 70B parameter models demonstrates sustained sub-millisecond per-token latency with zero perplexity regression.",
    equations: [
      {
        id: "eq1",
        label: "Eq. (1) Sparse Latent Kernel",
        latex: "\\\\mathcal{K}(Q, K) = \\\\operatorname{softmax}\\\\left( \\\\frac{Q \\\\cdot W_L K^T}{\\\\sqrt{d_k}} + \\\\mathbf{M}_{\\\\text{spec}} \\\\right) \\\\odot \\\\sigma(\\\\Theta_\\\\tau)",
        description: "Dynamic asymmetric sparse kernel projection operator with adaptive temperature gating.",
      },
    ],
    reviews: [
      { criterion: "Originality", score: 9.2, max: 10 },
      { criterion: "Technical Rigor", score: 9.5, max: 10 },
      { criterion: "Clarity & Reproducibility", score: 8.8, max: 10 },
    ],
    bibtex: \`@inproceedings{rostova2026latent,
  title={Latent Dynamic Attention Kernels for Sub-Millisecond LLM Speculative Decoding},
  author={Rostova, Elena and Thorne, Marcus and Tanaka, Hiroshi},
  booktitle={Advances in Neural Information Processing Systems (NeurIPS)},
  year={2026},
  doi={10.48550/arXiv.2609.04128}
}\`,
  };

  // Svelte 5 State Runes
  let activeTab = $state<"abstract" | "latex" | "bibtex">("abstract");
  let copiedBibtex = $state(false);
  let copiedLatex = $state(false);
  let showRawLatex = $state(false);

  // Svelte 5 Derived Runes
  let averageReviewScore = $derived(
    Math.round((manuscript.reviews.reduce((acc, r) => acc + r.score, 0) / manuscript.reviews.length) * 10) / 10
  );

  let reviewerRadarSeries = $derived(
    manuscript.reviews.map((r) => ({ label: r.criterion, value: r.score }))
  );

  async function copyBibTeX() {
    await navigator.clipboard.writeText(manuscript.bibtex);
    copiedBibtex = true;
    setTimeout(() => { copiedBibtex = false; }, 2000);
  }

  async function copyLatex(formula: string) {
    await navigator.clipboard.writeText(formula);
    copiedLatex = true;
    setTimeout(() => { copiedLatex = false; }, 2000);
  }
</script>

<div class="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
  <!-- Manuscript Header Card -->
  <Card padding="lg" class="space-y-4 border-border bg-surface shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
      <div class="flex items-center space-x-2">
        <Badge variant="primary">{manuscript.venue}</Badge>
        <Badge variant="outline">DOI: {manuscript.doi}</Badge>
      </div>
      <div class="flex items-center space-x-2">
        <Badge variant="success" class="font-semibold">
          ★ Peer Review: {averageReviewScore}/10 (Top 2% Oral)
        </Badge>
      </div>
    </div>

    <div class="space-y-2">
      <h1 class="text-title-1 font-serif font-bold text-foreground">{manuscript.title}</h1>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted">
        {#each manuscript.authors as author}
          <span class="font-medium text-foreground">
            {author.name} <span class="text-xs text-muted">({author.institution})</span>
          </span>
        {/each}
        <span>• Published: {manuscript.publishedDate}</span>
      </div>
    </div>

    <!-- Reviewer Radar Badge & Score Breakdown -->
    <div class="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface-raised p-4 sm:grid-cols-3">
      {#each manuscript.reviews as rev}
        <div class="flex flex-col space-y-1">
          <span class="text-caption text-muted">{rev.criterion}</span>
          <div class="flex items-baseline space-x-2">
            <span class="text-title-3 font-bold text-foreground">{rev.score}</span>
            <span class="text-xs text-muted">/ {rev.max}</span>
          </div>
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div class="h-full bg-primary" style="width: {(rev.score / rev.max) * 100}%;"></div>
          </div>
        </div>
      {/each}
    </div>
  </Card>

  <!-- Interactive Section Tabs -->
  <div class="flex space-x-2 border-b border-border">
    <button
      type="button"
      onclick={() => activeTab = "abstract"}
      class="px-4 py-2 text-caption font-semibold transition-colors {activeTab === 'abstract' ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-foreground'}"
    >
      Abstract & Findings
    </button>
    <button
      type="button"
      onclick={() => activeTab = "latex"}
      class="px-4 py-2 text-caption font-semibold transition-colors {activeTab === 'latex' ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-foreground'}"
    >
      LaTeX Mathematical Formulation
    </button>
    <button
      type="button"
      onclick={() => activeTab = "bibtex"}
      class="px-4 py-2 text-caption font-semibold transition-colors {activeTab === 'bibtex' ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-foreground'}"
    >
      BibTeX Citation Receipt
    </button>
  </div>

  {#if activeTab === "abstract"}
    <Card padding="md" class="space-y-3 bg-surface">
      <h2 class="text-title-3 font-bold text-foreground">Abstract</h2>
      <p class="text-body leading-relaxed text-foreground/90 font-serif">{manuscript.abstract}</p>
      <div class="flex items-center space-x-3 pt-2">
        <Button variant="primary" onclick={() => window.open(\`https://doi.org/\${manuscript.doi}\`)}>
          Download Full PDF
        </Button>
        <Button variant="line" onclick={() => activeTab = 'bibtex'}>
          Cite this Paper
        </Button>
      </div>
    </Card>
  {:else if activeTab === "latex"}
    <Card padding="md" class="space-y-4 bg-surface">
      <div class="flex items-center justify-between">
        <h2 class="text-title-3 font-bold text-foreground">Core Mathematical Formulations</h2>
        <Button variant="ghost" onclick={() => showRawLatex = !showRawLatex}>
          {showRawLatex ? "View Formatted Render" : "View Raw TeX Source"}
        </Button>
      </div>

      {#each manuscript.equations as eq}
        <div class="space-y-2 rounded-xl border border-border bg-surface-raised p-4">
          <div class="flex items-center justify-between">
            <span class="text-caption font-mono font-bold text-primary">{eq.label}</span>
            <Button variant="line" onclick={() => copyLatex(eq.latex)}>
              {copiedLatex ? "✓ Copied TeX" : "Copy LaTeX"}
            </Button>
          </div>

          {#if showRawLatex}
            <pre class="overflow-x-auto rounded-lg bg-neutral-900 p-3 font-mono text-xs text-green-400">{eq.latex}</pre>
          {:else}
            <div class="overflow-x-auto py-3 text-center font-serif text-lg text-foreground">
              {eq.latex}
            </div>
          {/if}
          <p class="text-caption text-muted">{eq.description}</p>
        </div>
      {/each}
    </Card>
  {:else if activeTab === "bibtex"}
    <Card padding="md" class="space-y-3 bg-surface">
      <div class="flex items-center justify-between">
        <h2 class="text-title-3 font-bold text-foreground">BibTeX Citation Entry</h2>
        <Button variant="primary" onclick={copyBibTeX}>
          {copiedBibtex ? "✓ Copied to Clipboard" : "Copy BibTeX"}
        </Button>
      </div>
      <pre class="overflow-x-auto rounded-xl border border-border bg-neutral-950 p-4 font-mono text-xs text-neutral-200">{manuscript.bibtex}</pre>
    </Card>
  {/if}
</div>`;
      } else if (intent === "venture_telemetry_dashboard") {
        requiredImports = ["Card", "Chart", "Badge", "Button"];
        code = `<script lang="ts">
  import { Card, Chart, Badge, Button } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";

  // Venture SaaS Telemetry Data
  const telemetry = {
    currentMRR: 84500,
    mrrGrowthMoM: 14.8,
    arrRunRate: 1014000,
    arrGrowthYoY: 142.5,
    netRevenueRetention: 128,
    quickRatio: 3.8,
    cacPaybackMonths: 5.2,
    cohorts: [
      { cohort: "2026-03", size: 1420, d1: 78, d7: 54, d14: 46, d30: 41 },
      { cohort: "2026-04", size: 1890, d1: 81, d7: 58, d14: 50, d30: 45 },
      { cohort: "2026-05", size: 2340, d1: 83, d7: 61, d14: 53, d30: 48 },
      { cohort: "2026-06", size: 3100, d1: 85, d7: 64, d14: 57, d30: 52 },
    ],
  };

  // Svelte 5 State Runes
  let simPrice = $state(49);
  let audienceScale = $state(10000);
  let timeHorizon = $state<"12m" | "24m">("12m");

  // Svelte 5 Derived Runes - Price Elasticity & Revenue Modeling
  let estimatedConversionPct = $derived(
    Math.max(0.8, Math.min(12.0, Math.round((6.5 * Math.pow(simPrice / 29, -1.15)) * 10) / 10))
  );

  let projectedPaidUsers = $derived(
    Math.round(audienceScale * (estimatedConversionPct / 100))
  );

  let projectedMonthlyRevenue = $derived(
    projectedPaidUsers * simPrice
  );

  let projectedAnnualARR = $derived(
    projectedMonthlyRevenue * 12
  );

  let isOptimalPrice = $derived(
    simPrice >= 39 && simPrice <= 59
  );

  // Heatmap helper for cohort cell background
  function getHeatmapBg(rate: number): string {
    if (rate >= 70) return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold";
    if (rate >= 50) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium";
    if (rate >= 40) return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    return "bg-rose-500/15 text-rose-700 dark:text-rose-300";
  }
</script>

<div class="mx-auto w-full max-w-6xl space-y-8 px-4 py-8">
  <!-- Header & High-Level Pulse -->
  <div class="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
    <div class="space-y-1">
      <div class="flex items-center space-x-2">
        <h1 class="text-title-1 font-extrabold text-foreground">Venture Telemetry & Growth Engine</h1>
        <Badge variant="success">Series-A Ready</Badge>
      </div>
      <p class="text-body text-muted">Real-time MRR dynamics, cohort retention decay curves, and pricing elasticity.</p>
    </div>
    <div class="flex items-center space-x-2">
      <Badge variant="outline">Quick Ratio: {telemetry.quickRatio}x</Badge>
      <Badge variant="outline">NRR: {telemetry.netRevenueRetention}%</Badge>
    </div>
  </div>

  <!-- Metric KPI Cards Grid -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Card padding="md" class="space-y-2 bg-surface">
      <span class="text-caption font-semibold uppercase tracking-wider text-muted">Current MRR</span>
      <div class="flex items-baseline justify-between">
        <span class="text-title-1 font-extrabold text-foreground">\${(telemetry.currentMRR / 1000).toFixed(1)}k</span>
        <Badge variant="success">+{telemetry.mrrGrowthMoM}% MoM</Badge>
      </div>
      <p class="text-xs text-muted">Annualized run-rate \${(telemetry.arrRunRate / 1000000).toFixed(2)}M</p>
    </Card>

    <Card padding="md" class="space-y-2 bg-surface">
      <span class="text-caption font-semibold uppercase tracking-wider text-muted">ARR Growth YoY</span>
      <div class="flex items-baseline justify-between">
        <span class="text-title-1 font-extrabold text-foreground">+{telemetry.arrGrowthYoY}%</span>
        <Badge variant="primary">Top Decile</Badge>
      </div>
      <p class="text-xs text-muted">Base ARR: \${(telemetry.arrRunRate / 2.425 / 1000).toFixed(0)}k</p>
    </Card>

    <Card padding="md" class="space-y-2 bg-surface">
      <span class="text-caption font-semibold uppercase tracking-wider text-muted">Net Revenue Retention</span>
      <div class="flex items-baseline justify-between">
        <span class="text-title-1 font-extrabold text-foreground">{telemetry.netRevenueRetention}%</span>
        <Badge variant="success">Expansion</Badge>
      </div>
      <p class="text-xs text-muted">Gross churn &lt; 0.8% / mo</p>
    </Card>

    <Card padding="md" class="space-y-2 bg-surface">
      <span class="text-caption font-semibold uppercase tracking-wider text-muted">CAC Payback Period</span>
      <div class="flex items-baseline justify-between">
        <span class="text-title-1 font-extrabold text-foreground">{telemetry.cacPaybackMonths} mo</span>
        <Badge variant="outline">Capital Efficient</Badge>
      </div>
      <p class="text-xs text-muted">LTV / CAC ratio: 6.4x</p>
    </Card>
  </div>

  <!-- D1 / D7 / D30 Cohort Retention Heatmap Table -->
  <Card padding="lg" class="space-y-4 bg-surface">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-title-2 font-bold text-foreground">Cohort Retention Decay Matrix</h2>
        <p class="text-caption text-muted">Percentage of active returning accounts across D1, D7, D14, and D30 milestones.</p>
      </div>
      <Badge variant="primary">Median D30: 48.5% (Benchmark: 35%)</Badge>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-caption">
        <thead>
          <tr class="border-b border-border text-muted">
            <th class="py-2.5 pr-4 font-semibold">Cohort Month</th>
            <th class="py-2.5 px-3 font-semibold">Users</th>
            <th class="py-2.5 px-3 font-semibold">Day 1</th>
            <th class="py-2.5 px-3 font-semibold">Day 7</th>
            <th class="py-2.5 px-3 font-semibold">Day 14</th>
            <th class="py-2.5 px-3 font-semibold">Day 30</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#each telemetry.cohorts as c}
            <tr>
              <td class="py-3 pr-4 font-mono font-medium text-foreground">{c.cohort}</td>
              <td class="py-3 px-3 text-muted">{c.size.toLocaleString()}</td>
              <td class="py-3 px-3"><span class="rounded px-2 py-1 {getHeatmapBg(c.d1)}">{c.d1}%</span></td>
              <td class="py-3 px-3"><span class="rounded px-2 py-1 {getHeatmapBg(c.d7)}">{c.d7}%</span></td>
              <td class="py-3 px-3"><span class="rounded px-2 py-1 {getHeatmapBg(c.d14)}">{c.d14}%</span></td>
              <td class="py-3 px-3"><span class="rounded px-2 py-1 {getHeatmapBg(c.d30)}">{c.d30}%</span></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </Card>

  <!-- Interactive Price Elasticity & Revenue Simulation Widget -->
  <Card padding="lg" class="space-y-6 bg-surface">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
      <div>
        <h2 class="text-title-2 font-bold text-foreground">Dynamic Price Elasticity Simulation Curve</h2>
        <p class="text-caption text-muted">Simulate conversion velocity against ARPU expansion to identify profit-maximizing pricing tiers.</p>
      </div>
      {#if isOptimalPrice}
        <Badge variant="success">★ Optimal Revenue Band ($39 - $59/mo)</Badge>
      {:else}
        <Badge variant="warning">Sub-optimal Elasticity Point</Badge>
      {/if}
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <!-- Interactive Slider Column -->
      <div class="space-y-4 lg:col-span-6">
        <div class="space-y-2">
          <div class="flex justify-between text-caption font-medium">
            <span class="text-foreground">Simulated Monthly Price:</span>
            <span class="text-title-3 font-bold text-primary">\${simPrice}/mo</span>
          </div>
          <input
            type="range"
            min="9"
            max="199"
            step="5"
            bind:value={simPrice}
            class="w-full accent-primary cursor-pointer"
          />
          <div class="flex justify-between text-xs text-muted">
            <span>$9/mo (Freemium High Vol)</span>
            <span>$49/mo (Optimal)</span>
            <span>$199/mo (Enterprise)</span>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between text-caption font-medium">
            <span class="text-foreground">Total Addressable Visitor Scale:</span>
            <span class="font-bold text-foreground">{audienceScale.toLocaleString()} visitors/mo</span>
          </div>
          <input
            type="range"
            min="1000"
            max="50000"
            step="1000"
            bind:value={audienceScale}
            class="w-full accent-primary cursor-pointer"
          />
        </div>
      </div>

      <!-- Projected Output Ledger Column -->
      <div class="rounded-xl border border-border bg-surface-raised p-5 lg:col-span-6 space-y-4">
        <span class="text-caption font-semibold uppercase tracking-wider text-muted">Projected Yield Forecast</span>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-xs text-muted">Est. Conversion Rate</span>
            <div class="text-title-2 font-extrabold text-foreground">{estimatedConversionPct}%</div>
          </div>
          <div>
            <span class="text-xs text-muted">Projected Paid Subs</span>
            <div class="text-title-2 font-extrabold text-foreground">{projectedPaidUsers.toLocaleString()}</div>
          </div>
          <div>
            <span class="text-xs text-muted">Projected MRR</span>
            <div class="text-title-2 font-extrabold text-primary">\${(projectedMonthlyRevenue).toLocaleString()}</div>
          </div>
          <div>
            <span class="text-xs text-muted">Projected Annual ARR</span>
            <div class="text-title-2 font-extrabold text-success">\${(projectedAnnualARR / 1000).toFixed(1)}k</div>
          </div>
        </div>
      </div>
    </div>
  </Card>
</div>`;
      } else if (intent === "kanban_board") {
        requiredImports = ["Card", "Badge", "Button"];
        code = `<script lang="ts">
  import { Card, Badge, Button } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";

  // Task Kanban State with Svelte 5 Runes
  let columns = $state([
    {
      id: "backlog",
      title: "Backlog",
      color: "border-muted",
      cards: [
        { id: "MC-101", title: "Add WebGPU fallback shader to SpriteFlow", priority: "medium", tag: "Engine", points: 3 },
        { id: "MC-102", title: "Implement Stripe webhook retry queue", priority: "high", tag: "Billing", points: 5 },
      ],
    },
    {
      id: "in_progress",
      title: "In Progress",
      color: "border-primary",
      cards: [
        { id: "MC-103", title: "Refactor Table to 7 atomic primitives", priority: "urgent", tag: "Design", points: 8 },
        { id: "MC-104", title: "Wire GAD-7 screener to practitioner DB", priority: "high", tag: "Clinical", points: 5 },
      ],
    },
    {
      id: "done",
      title: "Completed",
      color: "border-success",
      cards: [
        { id: "MC-105", title: "Publish CSSCI empirical manuscript", priority: "urgent", tag: "Science", points: 13 },
        { id: "MC-106", title: "Zero-cost viral loops on GitHub & Itch.io", priority: "medium", tag: "Growth", points: 5 },
      ],
    },
  ]);

  function getPriorityBadge(priority: string) {
    if (priority === "urgent") return { variant: "destructive" as const, label: "Urgent" };
    if (priority === "high") return { variant: "warning" as const, label: "High" };
    return { variant: "outline" as const, label: "Normal" };
  }
</script>

<div class="w-full space-y-6 p-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-title-1 font-bold text-foreground">Sprint Production Board</h1>
      <p class="text-caption text-muted">Multi-track autonomous delivery across Design, Business, and Science.</p>
    </div>
    <Button variant="primary">+ New Task</Button>
  </div>

  <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
    {#each columns as col}
      <div class="flex flex-col space-y-3 rounded-xl border border-border bg-surface-raised/50 p-4">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <div class="flex items-center space-x-2">
            <span class="h-2.5 w-2.5 rounded-full {col.color === 'border-success' ? 'bg-success' : col.color === 'border-primary' ? 'bg-primary' : 'bg-muted'}"></span>
            <h2 class="text-caption font-bold text-foreground">{col.title}</h2>
          </div>
          <Badge variant="pill">{col.cards.length}</Badge>
        </div>

        <div class="flex flex-1 flex-col space-y-3">
          {#each col.cards as card}
            <Card padding="sm" class="space-y-2 border-border bg-surface transition-all hover:border-primary hover:shadow-sm">
              <div class="flex items-center justify-between text-xs text-muted">
                <span class="font-mono font-semibold">{card.id}</span>
                <Badge variant={getPriorityBadge(card.priority).variant}>
                  {getPriorityBadge(card.priority).label}
                </Badge>
              </div>
              <p class="text-caption font-medium text-foreground">{card.title}</p>
              <div class="flex items-center justify-between pt-1">
                <Badge variant="outline">{card.tag}</Badge>
                <span class="font-mono text-xs text-muted">{card.points} pts</span>
              </div>
            </Card>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>`;
      } else if (intent === "terminal_cli") {
        requiredImports = ["Card", "Badge", "Button"];
        code = `<script lang="ts">
  import { Card, Badge, Button } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";

  let lines = $state([
    { text: "$ agy --version", type: "command" },
    { text: "Google Antigravity CLI v2.4.0 (darwin-arm64)", type: "stdout" },
    { text: "$ bun test Plugin/", type: "command" },
    { text: "✓ 255 pass across 26 files (3,349 assertions, 0 errors)", type: "success" },
    { text: "$ git push origin main", type: "command" },
    { text: "To https://github.com/MentalCraft-LLC/Plugin.git", type: "stdout" },
    { text: "   fcf5d09..63a53a8  main -> main", type: "success" },
  ]);

  let commandInput = $state("");

  function executeCommand(e: Event) {
    e.preventDefault();
    if (!commandInput.trim()) return;
    lines = [...lines, { text: \`$ \${commandInput}\`, type: "command" }, { text: "Executing task...", type: "stdout" }];
    commandInput = "";
  }
</script>

<div class="mx-auto w-full max-w-4xl p-6">
  <div class="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 font-mono text-sm shadow-2xl">
    <!-- Titlebar -->
    <div class="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/80 px-4 py-2.5">
      <div class="flex items-center space-x-2">
        <span class="h-3 w-3 rounded-full bg-red-500/80"></span>
        <span class="h-3 w-3 rounded-full bg-yellow-500/80"></span>
        <span class="h-3 w-3 rounded-full bg-green-500/80"></span>
        <span class="ml-2 text-xs font-medium text-neutral-400">holar@antigravity: ~/Holar</span>
      </div>
      <Badge variant="primary">Node/Bun v1.3.14</Badge>
    </div>

    <!-- Terminal Buffer -->
    <div class="space-y-1.5 p-4 text-xs text-neutral-200">
      {#each lines as line}
        {#if line.type === "command"}
          <div class="text-neutral-400 font-semibold">{line.text}</div>
        {#else if line.type === "success"}
          <div class="text-emerald-400">{line.text}</div>
        {#else}
          <div class="text-neutral-300">{line.text}</div>
        {/if}
      {/each}

      <!-- Interactive Input Line -->
      <form onsubmit={executeCommand} class="flex items-center space-x-2 pt-2">
        <span class="text-primary font-bold">❯</span>
        <input
          bind:value={commandInput}
          placeholder="Type command..."
          class="flex-1 bg-transparent text-neutral-100 placeholder-neutral-600 focus:outline-none"
        />
      </form>
    </div>
  </div>
</div>`;
      } else if (intent === "command_palette_modal") {
        requiredImports = ["Dialog", "Input", "Badge", "Kbd"];
        code = `<script lang="ts">
  import { Dialog, Input, Badge } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";

  let open = $state(true);
  let searchQuery = $state("");

  const actions = [
    { id: "new_screener", title: "Create Clinical Screener Link", category: "MentalCraft", shortcut: "⌘N" },
    { id: "view_mrr", title: "Open Revenue Telemetry Dashboard", category: "SpriteFlow", shortcut: "⌘R" },
    { id: "audit_paper", title: "Audit Manuscript Triangulation", category: "Science", shortcut: "⌘S" },
    { id: "run_benchmark", title: "Run Microsecond Latency Benchmark", category: "Plugin", shortcut: "⌘B" },
  ];

  const filtered = $derived(
    actions.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );
</script>

<div class="mx-auto w-full max-w-xl p-4">
  <div class="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl backdrop-blur-xl">
    <div class="border-b border-border p-4">
      <Input
        bind:value={searchQuery}
        placeholder="Type a command or search actions (⌘K)..."
        class="border-0 bg-transparent text-base focus:ring-0"
      />
    </div>

    <div class="max-h-72 divide-y divide-border overflow-y-auto p-2">
      {#each filtered as action}
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-raised"
          onclick={() => alert(\`Executed \${action.title}\`)}
        >
          <div class="flex items-center space-x-3">
            <span class="text-caption font-semibold text-muted">[{action.category}]</span>
            <span class="font-medium text-foreground">{action.title}</span>
          </div>
          <kbd class="rounded border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-xs text-muted">
            {action.shortcut}
          </kbd>
        </button>
      {/each}
    </div>
  </div>
</div>`;
      } else if (intent === "design_engineering_showcase") {
        requiredImports = ["Blueprint", "Ruler", "Swatch", "Slider", "Comparison", "Button", "Card"];
        code = `<script lang="ts">
  import { Blueprint, Ruler, Swatch, Slider, Comparison, Button, Card } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";

  let boxWidth = $state(260);
  let liveColor = $state("oklch(0.991 0 0)");
</script>

<div class="mx-auto w-full max-w-4xl px-6 py-20 font-sans text-foreground">
  <!-- Hero Section with Blueprint & x-height Guideline -->
  <div class="flex flex-col gap-4">
    <Blueprint label="294 × 58" xHeight={true} color="blue">
      <h1 class="text-6xl font-medium tracking-tight">
        Interfaces <em class="font-serif italic text-muted">Magazine</em>
      </h1>
    </Blueprint>

    <div class="flex items-center gap-3 mt-2">
      <Swatch color={liveColor} label={liveColor} />
      <Swatch color="oklch(0.173 0 0)" label="dark: oklch(0.173 0 0)" />
    </div>
  </div>

  <!-- Spacing Measurement Overlay -->
  <div class="my-10">
    <Ruler size={32} color="pink" label="32 px layout gap" />
  </div>

  <!-- Interactive Comparison Sandbox -->
  <Comparison
    title="Design Engineering Live Typography Balance Sandbox"
    beforeLabel="text-wrap: wrap"
    afterLabel="text-wrap: balance + pretty"
  >
    {#snippet before()}
      <div class="flex flex-col justify-center gap-2" style="width: \${boxWidth}px;">
        <p class="text-lg font-medium leading-snug" style="text-wrap: wrap;">
          Designing interfaces that feel natural and intuitive
        </p>
        <p class="text-xs text-muted" style="text-wrap: wrap;">
          Great design is invisible. It guides users without them ever noticing.
        </p>
      </div>
    {/snippet}

    {#snippet after()}
      <div class="flex flex-col justify-center gap-2" style="width: \${boxWidth}px;">
        <p class="text-lg font-medium leading-snug" style="text-wrap: balance;">
          Designing interfaces that feel natural and intuitive
        </p>
        <p class="text-xs text-muted" style="text-wrap: pretty;">
          Great design is invisible. It guides users without them ever noticing.
        </p>
      </div>
    {/snippet}

    {#snippet controls()}
      <div class="w-full max-w-sm">
        <Slider
          bind:value={boxWidth}
          min={220}
          max={340}
          step={1}
          label="Card Width"
          unit="px"
          variant="diamond"
        />
      </div>
      <Button
        variant="primary"
        class="btn-tap ml-auto rounded-full px-6 bg-gradient-to-b from-sky-400 to-sky-500 text-white shadow-custom"
      >
        Subscribe Now
      </Button>
    {/snippet}
  </Comparison>
</div>`;
      } else if (intent === "essay_humanizer_workbench") {
        requiredImports = ["Card", "Button", "Badge", "Comparison", "Tabs"];
        code = `<script lang="ts">
  import { Card, Button, Badge, Comparison, Tabs } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";

  let inputText = $state("Furthermore, this research demonstrates that artificial intelligence algorithms possess substantial capabilities in optimizing complex workflows.");
  let outputText = $state("This study reveals how machine learning systems streamline intricate tasks with remarkable speed and precision.");
  let humanizeMode = $state<"standard" | "academic" | "deep">("academic");
  let isHumanizing = $state(false);
  let aiScoreBefore = $state(98);
  let aiScoreAfter = $state(0);

  let wordCount = $derived(inputText.trim() ? inputText.trim().split(/\\s+/).length : 0);

  async function triggerHumanize() {
    isHumanizing = true;
    try {
      await new Promise(r => setTimeout(r, 600));
      aiScoreAfter = 0;
    } finally {
      isHumanizing = false;
    }
  }
</script>

<div class="mx-auto w-full max-w-6xl px-4 py-8 font-sans text-foreground">
  <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Essay Humanize Workbench</h1>
      <p class="text-sm text-muted">Bypass Turnitin, GPTZero & Copyleaks with 0% AI detection score.</p>
    </div>
    <div class="flex items-center gap-2">
      <Badge variant="success">Turnitin 2026 Bypass Guaranteed</Badge>
      <Badge variant="outline">0% AI Score</Badge>
    </div>
  </div>

  <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-2">
    <div class="flex gap-1.5">
      <Button
        variant={humanizeMode === "standard" ? "primary" : "ghost"}
        size="sm"
        onclick={() => humanizeMode = "standard"}
      >
        Standard Flow
      </Button>
      <Button
        variant={humanizeMode === "academic" ? "primary" : "ghost"}
        size="sm"
        onclick={() => humanizeMode = "academic"}
      >
        Academic Tone
      </Button>
      <Button
        variant={humanizeMode === "deep" ? "primary" : "ghost"}
        size="sm"
        onclick={() => humanizeMode = "deep"}
      >
        Deep Bypass (100%)
      </Button>
    </div>

    <div class="text-xs text-muted">
      Words: <strong class="text-foreground">{wordCount}</strong> / 1,500
    </div>
  </div>

  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <Card class="flex flex-col p-4">
      <div class="mb-2 flex items-center justify-between border-b border-border pb-2">
        <span class="text-xs font-semibold uppercase text-muted">Original AI Text</span>
        {#if aiScoreBefore > 50}
          <Badge variant="danger">{aiScoreBefore}% AI Detected</Badge>
        {/if}
      </div>
      <textarea
        bind:value={inputText}
        class="h-64 w-full resize-none bg-transparent font-serif text-sm leading-relaxed focus:outline-none"
        placeholder="Paste your AI-generated essay or draft here..."
      ></textarea>
      <div class="mt-auto flex items-center justify-between border-t border-border pt-3">
        <Button variant="ghost" size="sm" onclick={() => inputText = ""}>Clear</Button>
        <Button variant="primary" state={isHumanizing ? "busy" : "idle"} onclick={triggerHumanize}>
          Humanize Text
        </Button>
      </div>
    </Card>

    <Card class="flex flex-col p-4 bg-muted/20">
      <div class="mb-2 flex items-center justify-between border-b border-border pb-2">
        <span class="text-xs font-semibold uppercase text-muted">Humanized Output</span>
        <Badge variant="success">{aiScoreAfter}% AI (100% Human)</Badge>
      </div>
      <div class="h-64 overflow-y-auto font-serif text-sm leading-relaxed text-foreground">
        {outputText}
      </div>
      <div class="mt-auto flex items-center justify-between border-t border-border pt-3">
        <a href="https://essaydetector.org" target="_blank" class="text-xs text-primary hover:underline">
          Verify on EssayDetector.org →
        </a>
        <Button variant="outline" size="sm" onclick={() => navigator.clipboard.writeText(outputText)}>
          Copy Output
        </Button>
      </div>
    </Card>
  </div>
</div>`;
      } else if (intent === "essay_detector_radar") {
        requiredImports = ["Card", "Button", "Badge"];
        code = `<script lang="ts">
  import { Card, Button, Badge } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";

  let sampleText = $state("In conclusion, the overarching ramifications of modern digital transformation can be observed across every stratum of society.");
  let overallScore = $state(88);
  let sentences = $state([
    { text: "In conclusion, the overarching ramifications of modern digital transformation", score: 92 },
    { text: "can be observed across every stratum of society.", score: 84 }
  ]);
</script>

<div class="mx-auto w-full max-w-5xl px-4 py-8 font-sans text-foreground">
  <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Multi-Engine AI Detector</h1>
      <p class="text-sm text-muted">Sentence-by-sentence perplexity & burstiness forensics.</p>
    </div>
    <div class="flex items-center gap-2">
      <Badge variant="outline">GPT-4o / Claude 3.5 / Gemini Ready</Badge>
    </div>
  </div>

  <Card class="mb-6 flex flex-col md:flex-row items-center justify-between gap-6 p-6 border-l-4 border-l-danger">
    <div class="space-y-1">
      <h2 class="text-xl font-bold text-foreground">Detection Result: Highly Likely AI-Generated</h2>
      <p class="text-sm text-muted">This text exhibits low lexical entropy and repetitive grammatical structures.</p>
    </div>

    <div class="flex items-center gap-4">
      <div class="text-center">
        <div class="text-4xl font-extrabold text-danger">{overallScore}%</div>
        <div class="text-xs uppercase text-muted font-medium">AI Probability</div>
      </div>
      <a
        href="https://essayhumanize.com"
        target="_blank"
        class="rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow hover:opacity-90 transition-opacity"
      >
        Bypass with EssayHumanize (0% AI) →
      </a>
    </div>
  </Card>

  <Card class="p-4 space-y-3">
    <h3 class="text-xs font-semibold uppercase text-muted">Sentence-by-Sentence Breakdown</h3>
    <div class="space-y-2">
      {#each sentences as s}
        <div class="flex items-start justify-between gap-3 rounded border border-border p-2.5 bg-danger/5">
          <p class="text-sm leading-relaxed text-foreground">{s.text}</p>
          <div class="flex shrink-0 items-center gap-2">
            <Badge variant="danger">{s.score}% AI</Badge>
          </div>
        </div>
      {/each}
    </div>
  </Card>
</div>`;
      } else {
        requiredImports = ["Card", "Button"];
        code = `<script lang="ts">
  import { Card, Button } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";
</script>

<Card padding="md">
  <p class="text-body text-foreground">${input.prompt ?? "Custom component composition"}</p>
  <Button variant="primary" class="mt-4">Action</Button>
</Card>`;
      }

      return {
        protocol: DESIGN_PROTOCOL,
        action: "generate_ui",
        success: true,
        timestamp,
        data: {
          intent,
          requiredImports,
          importStatement: `import { ${requiredImports.join(", ")} } from 'infra-ui-svelte';\nimport 'infra-ui-svelte/styles.css';`,
          svelteSnippet: code,
        },
      };
    }

    case "audit_ui": {
      const code = input.template_code ?? "";
      const diagnostics: string[] = [];
      const suggestions: string[] = [];

      // Check for hardcoded hex colors
      const hexMatches = code.match(/#[0-9a-fA-F]{3,6}\b/g);
      if (hexMatches) {
        diagnostics.push(`Found hardcoded HEX colors: ${Array.from(new Set(hexMatches)).join(", ")}.`);
        suggestions.push("Replace hardcoded hex colors with semantic tokens: var(--color-primary), var(--color-surface), or Tailwind classes text-foreground, bg-surface.");
      }

      // Check for raw HTML button usage (lowercase tag only, not Svelte <Button)
      if (/<button\b(?![^>]*class=["'][^"']*infra)/.test(code)) {
        diagnostics.push("Found raw HTML <button> element without design system variant styling.");
        suggestions.push("Use <Button variant='primary|secondary|ghost|line'> from 'infra-ui-svelte' for consistent focus rings, tactile press states, and A11y.");
      }

      // Check for raw input without label (lowercase tag only, not Svelte <Input)
      if (/<input\b(?![^>]*aria-label)(?![^>]*id)/.test(code)) {
        diagnostics.push("Found <input> element missing both 'id' (for <label>) and 'aria-label'.");
        suggestions.push("Provide an accessible label or aria-label for screen reader compliance (WCAG 2.1 AA).");
      }

      // Check for hardcoded px sizes on touch targets
      if (/class=["'][^"']*\b(h-[1-6]|w-[1-6])\b[^"']*["']/.test(code)) {
        diagnostics.push("Found small touch target dimensions (< 28px).");
        suggestions.push("Ensure interactive elements have at least a 40px bounding box (min-h-[40px] or Button size md) for mobile ergonomics.");
      }

      const score = Math.max(0, 100 - diagnostics.length * 20);

      return {
        protocol: DESIGN_PROTOCOL,
        action: "audit_ui",
        success: true,
        timestamp,
        data: {
          score,
          compliant: diagnostics.length === 0,
          diagnosticsCount: diagnostics.length,
          diagnostics,
          suggestions,
        },
      };
    }

    case "bridge_chrome": {
      const el = input.chrome_element;
      if (!el) {
        return {
          protocol: DESIGN_PROTOCOL,
          action: "bridge_chrome",
          success: false,
          timestamp,
          data: null,
          diagnostics: ["A chrome_element payload with tag, className, role is required."],
        };
      }

      // Match element against design system components
      let matchedComponent: ComponentSpec | undefined;
      const tag = el.tag.toLowerCase();
      const role = el.role?.toLowerCase();
      const className = el.className?.toLowerCase() ?? "";

      if (tag === "button" || role === "button" || className.includes("btn") || className.includes("button")) {
        matchedComponent = COMPONENT_CATALOG.find((c) => c.id === "button");
      } else if (tag === "input" || tag === "textarea" || role === "textbox") {
        matchedComponent = COMPONENT_CATALOG.find((c) => c.id === "input");
      } else if (role === "dialog" || className.includes("modal") || className.includes("dialog")) {
        matchedComponent = COMPONENT_CATALOG.find((c) => c.id === "dialog");
      } else if (role === "complementary" || className.includes("drawer") || className.includes("slideout") || className.includes("sheet")) {
        matchedComponent = COMPONENT_CATALOG.find((c) => c.id === "drawer");
      } else if (tag === "table" || role === "table" || role === "grid" || className.includes("table")) {
        matchedComponent = COMPONENT_CATALOG.find((c) => c.id === "table");
      } else if (role === "status" || className.includes("badge") || className.includes("pill") || className.includes("tag")) {
        matchedComponent = COMPONENT_CATALOG.find((c) => c.id === "badge");
      } else if (className.includes("avatar") || (tag === "img" && className.includes("profile"))) {
        matchedComponent = COMPONENT_CATALOG.find((c) => c.id === "avatar");
      } else if (className.includes("card") || className.includes("panel")) {
        matchedComponent = COMPONENT_CATALOG.find((c) => c.id === "card");
      }

      return {
        protocol: DESIGN_PROTOCOL,
        action: "bridge_chrome",
        success: true,
        timestamp,
        data: {
          element: el,
          matchedDesignComponent: matchedComponent
            ? {
                id: matchedComponent.id,
                name: matchedComponent.name,
                layer: matchedComponent.layer,
                suggestedReplacement: `<${matchedComponent.name} />`,
                importStatement: `import { ${matchedComponent.name} } from '${matchedComponent.importPath}';`,
              }
            : null,
          tokenMappings: {
            font: "var(--font-body)",
            background: "var(--color-surface)",
            textColor: "var(--color-foreground)",
            radius: "var(--radius-md)",
          },
        },
      };
    }

    case "resolve_imports": {
      let targetNames = input.components ?? [];
      if (targetNames.length === 0 && input.prompt) {
        targetNames = input.prompt.split(/[\s,]+/).filter(Boolean);
      }
      if (targetNames.length === 0 && input.template_code) {
        // Auto-extract used components from template
        for (const c of COMPONENT_CATALOG) {
          const pattern = new RegExp(`<${c.name}\\b`);
          if (pattern.test(input.template_code)) {
            targetNames.push(c.name);
          }
        }
      }

      if (targetNames.length === 0) {
        return {
          protocol: DESIGN_PROTOCOL,
          action: "resolve_imports",
          success: false,
          timestamp,
          data: null,
          diagnostics: ["Please supply 'components' array, 'prompt' (e.g. 'Button, Card'), or 'template_code'."],
        };
      }

      const matched: ComponentSpec[] = [];
      const unmatched: string[] = [];

      for (const name of targetNames) {
        const item = COMPONENT_CATALOG.find(
          (c) => c.name.toLowerCase() === name.toLowerCase() || c.id.toLowerCase() === name.toLowerCase()
        );
        if (item) {
          if (!matched.some((m) => m.id === item.id)) matched.push(item);
        } else {
          unmatched.push(name);
        }
      }

      const totalSizeKb = Math.round(matched.reduce((acc, c) => acc + c.estimatedSizeKb, 0) * 10) / 10;
      const monolithicSizeKb = 95.0;
      const savingsPct = Math.round(((monolithicSizeKb - totalSizeKb) / monolithicSizeKb) * 100);

      const barrelStatement = `import { ${matched.map((m) => m.name).join(", ")} } from 'infra-ui-svelte';`;
      const subpathStatements = matched
        .map((m) => `import ${m.name} from '${m.subpath}';`)
        .join("\n");

      return {
        protocol: DESIGN_PROTOCOL,
        action: "resolve_imports",
        success: true,
        timestamp,
        data: {
          matchedComponents: matched.map((m) => ({
            name: m.name,
            subpath: m.subpath,
            sizeKb: m.estimatedSizeKb,
          })),
          unmatched,
          barrelStatement,
          subpathStatements,
          metrics: {
            estimatedOnDemandKb: totalSizeKb,
            monolithicBundleKb: monolithicSizeKb,
            treeShakingSavings: `${savingsPct}%`,
          },
        },
      };
    }

    case "domain_presets": {
      if (input.preset_name) {
        const preset = DOMAIN_PRESETS.find((p) => p.id === input.preset_name);
        if (!preset) {
          return {
            protocol: DESIGN_PROTOCOL,
            action: "domain_presets",
            success: false,
            timestamp,
            data: null,
            diagnostics: [`Preset '${input.preset_name}' not found. Available: ${DOMAIN_PRESETS.map((p) => p.id).join(", ")}`],
          };
        }
        return {
          protocol: DESIGN_PROTOCOL,
          action: "domain_presets",
          success: true,
          timestamp,
          data: {
            preset,
            subpathImports: preset.recommendedComponents.map((name) => {
              const comp = COMPONENT_CATALOG.find((c) => c.name === name);
              return comp ? `import ${name} from '${comp.subpath}';` : `// ${name}`;
            }).join("\n"),
          },
        };
      }

      return {
        protocol: DESIGN_PROTOCOL,
        action: "domain_presets",
        success: true,
        timestamp,
        data: {
          total: DOMAIN_PRESETS.length,
          presets: DOMAIN_PRESETS,
        },
      };
    }

    case "bundle_optimize": {
      const code = input.template_code ?? "";
      if (!code) {
        return {
          protocol: DESIGN_PROTOCOL,
          action: "bundle_optimize",
          success: false,
          timestamp,
          data: null,
          diagnostics: ["A 'template_code' string is required for bundle optimization."],
        };
      }

      // Check for monolithic import { ... } from "infra-ui-svelte"
      const barrelRegex = /import\s*\{([^}]+)\}\s*from\s*["']infra-ui-svelte["'];?/;
      const match = code.match(barrelRegex);

      if (!match) {
        return {
          protocol: DESIGN_PROTOCOL,
          action: "bundle_optimize",
          success: true,
          timestamp,
          data: {
            optimized: false,
            message: "No monolithic 'infra-ui-svelte' barrel import found to refactor.",
            code,
          },
        };
      }

      const importedNames = match[1].split(",").map((s) => s.trim()).filter(Boolean);
      const usedComponents: ComponentSpec[] = [];
      const unusedComponents: string[] = [];

      for (const name of importedNames) {
        const comp = COMPONENT_CATALOG.find((c) => c.name === name);
        if (comp) {
          // Check if component is actually rendered in template
          const tagPattern = new RegExp(`<${name}\\b`);
          if (tagPattern.test(code)) {
            usedComponents.push(comp);
          } else {
            unusedComponents.push(name);
          }
        }
      }

      const optimizedImports = usedComponents
        .map((c) => `import ${c.name} from '${c.subpath}';`)
        .join("\n");

      const optimizedCode = code.replace(barrelRegex, optimizedImports);

      return {
        protocol: DESIGN_PROTOCOL,
        action: "bundle_optimize",
        success: true,
        timestamp,
        data: {
          optimized: true,
          removedUnused: unusedComponents,
          retainedComponents: usedComponents.map((c) => c.name),
          previousImport: match[0],
          optimizedImports,
          optimizedCode,
        },
      };
    }

    case "generate_editorial": {
      const subject = input.theme || input.prompt || "Field Observation & Scientific Inquiry";
      const exactText = input.exact_text || "field observation";
      const ratio = input.ratio || "3:4";
      const paletteId = (input.palette as DuotonePaletteId) || "cobalt_terracotta";
      const recipe = DUOTONE_RECIPES[paletteId] || DUOTONE_RECIPES.cobalt_terracotta;
      const substrateId = (input.substrate as SubstrateId) || "neutral_white";
      const substrate = SUBSTRATES[substrateId] || SUBSTRATES.neutral_white;
      const mode = input.mode || (paletteId ? "controlled_two_ink" : "pure_one_ink");

      const manifest: EditorialManifest = {
        subject,
        intent: "cultural_poster",
        exact_text: exactText,
        ratio,
        substrate: { id: substrateId, name: substrate.name, hex: substrate.hex },
        mode,
        palette: paletteId,
        dominant_ink: {
          name: recipe.dominant.name,
          hex: recipe.dominant.hex,
          role: "Main subject halftone, hero typography, and asymmetrical grid",
          area_percent: 75,
        },
        accent_ink: {
          name: recipe.accent.name,
          hex: recipe.accent.hex,
          role: "Specific milestone date, annotation dot, and overprint intersection",
          area_percent: 25,
        },
        empty_paper_percent: 35,
        focal_event: "oversized_typography_overlap",
        release_zone: "bottom_right_open_paper",
        type_hierarchy: {
          display: "Contemporary Neo-Grotesk (8:1 scale contrast)",
          support: "Monospace Tabular Metadata",
        },
        mechanical_process: "medium_risograph_halftone_screening",
        imperfections: ["subtle_misregistration", "ink_density_falloff"],
        generation_prompt: `A contemporary editorial ${mode.replace("_", " ")} visual artifact of ${subject}. Printed strictly in ${recipe.dominant.name} (${recipe.dominant.hex}) as dominant ink (75% coverage) and ${recipe.accent.name} (${recipe.accent.hex}) as accent ink (25% coverage) on clean ${substrate.name} (${substrate.hex}) paper substrate. Coarse mechanical halftone screen, Risograph grain, subtle ink plate misregistration. Active negative space with 35% visible empty paper. Bold display typography featuring text "${exactText}", 8:1 type hierarchy with small monospace metadata. No 3D render, no digital gradient, no third color, no fake logos or URLs. Flat front-facing editorial poster composition, ratio ${ratio}.`,
        svg_preview_snippet: `<svg viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg" style="background-color: ${substrate.hex}; font-family: monospace;">
  <!-- Substrate Paper -->
  <rect width="600" height="800" fill="${substrate.hex}" />
  <!-- Halftone Pattern Defs -->
  <defs>
    <pattern id="halftone" width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="2.5" fill="${recipe.dominant.hex}" />
    </pattern>
  </defs>
  <!-- Dominant Subject Graphic Field -->
  <rect x="48" y="120" width="504" height="420" fill="url(#halftone)" opacity="0.85" />
  <!-- Accent Overprint Element -->
  <circle cx="480" cy="180" r="48" fill="${recipe.accent.hex}" style="mix-blend-mode: multiply;" opacity="0.9" />
  <!-- Oversized Typography -->
  <text x="48" y="90" fill="${recipe.dominant.hex}" font-size="44" font-weight="700" letter-spacing="-1">${exactText.toUpperCase()}</text>
  <!-- Metadata & Accent Annotation -->
  <text x="48" y="580" fill="${recipe.dominant.hex}" font-size="12">${subject}</text>
  <text x="48" y="600" fill="${recipe.accent.hex}" font-size="11">PLATE: ${recipe.name.toUpperCase()} · RATIO: ${ratio}</text>
  <line x1="48" y1="620" x2="552" y2="620" stroke="${recipe.dominant.hex}" stroke-width="1" stroke-dasharray="4 4" />
  <!-- Release Zone (Open Paper) -->
</svg>`,
      };

      return {
        protocol: DESIGN_PROTOCOL,
        action: "generate_editorial",
        success: true,
        timestamp,
        data: {
          manifest,
          prompt: manifest.generation_prompt,
          recipe: {
            palette: recipe.name,
            substrate: substrate.name,
            dominantInk: recipe.dominant,
            accentInk: recipe.accent,
            emptyPaper: "35%",
          },
          svgPreview: manifest.svg_preview_snippet,
        },
      };
    }
  }
}
