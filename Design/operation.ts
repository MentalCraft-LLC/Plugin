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
  type ComponentSpec,
  type TokenDefinition,
  type DomainPreset,
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
      return {
        protocol: DESIGN_PROTOCOL,
        action: "inspect_component",
        success: true,
        timestamp,
        data: {
          component: match,
          quickImport: `import { ${match.name} } from '${match.importPath}';`,
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
      } else {
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
  }
}
