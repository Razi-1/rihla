# Design System Specification: The Academic Curator

## 1. Overview & Creative North Star
The "Academic Curator" is the guiding philosophy for this design system. We are moving away from the cold, industrial feel of standard educational platforms and toward a high-end, editorial experience that balances authority with accessibility.

**Creative North Star: The Digital Curator.** 
The interface should feel like a premium, well-organized digital gallery of knowledge. We achieve this through:
*   **Intentional Asymmetry:** Using whitespace (Spacing 16, 20, 24) to create a sense of breath and focus rather than crowding every pixel.
*   **Layered Surfaces:** Treating the UI as physical sheets of fine paper or frosted glass rather than flat digital rectangles.
*   **Typography-First Hierarchy:** Letting the Inter typeface do the heavy lifting of structure, using the dramatic scale between `display-lg` and `body-sm` to create clear reading paths.

## 2. Color & Tonal Depth
Our color palette is rooted in a foundation of trust (`primary: #005c9b`) and sophisticated depth (`on_primary_fixed: #001d36`). 

### The "No-Line" Rule
To maintain a high-end editorial feel, **prohibit the use of 1px solid borders for sectioning.** Boundaries must be defined solely through background color shifts or subtle tonal transitions. For example, a `surface_container_low` section sitting on a `surface` background provides all the separation needed without the "noise" of a line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the surface-container tiers to define depth:
*   **Base:** `surface` (#f8f9ff)
*   **Sectioning:** `surface_container_low` (#f2f3f9)
*   **Cards/Primary Containers:** `surface_container_lowest` (#ffffff)
*   **Elevated Details:** `surface_container_high` (#e6e8ee)

### The "Glass & Gradient" Rule
For floating elements (modals, persistent navigation, or floating action buttons), use a **Glassmorphism** effect. Apply a semi-transparent `surface_container_lowest` at 80% opacity with a `backdrop-filter: blur(12px)`. This allows the academic blues of the background to bleed through, softening the layout.

### Signature Textures
Main CTAs and Hero sections should not be flat. Use subtle linear gradients transitioning from `primary` (#005c9b) to `primary_container` (#2e75b6) at a 135-degree angle to provide visual "soul" and professional polish.

## 3. Typography
We use **Inter** exclusively, utilizing its variable weight properties to convey authority.

*   **Display & Headline (`display-lg` to `headline-sm`):** These are your "Editorial Anchors." Use these with wide tracking (-1%) to create a sense of prestige.
*   **Title (`title-lg` to `title-sm`):** Used for card headers and navigation. They bridge the gap between high-level messaging and functional body text.
*   **Body (`body-lg` to `body-sm`):** Optimized for readability. Use `body-md` (0.875rem) for general instructional text to keep the interface feeling light.
*   **Labels (`label-md` to `label-sm`):** Use sparingly for micro-data (e.g., "Tutor Rating" or "Course Duration").

## 4. Elevation & Depth
In this design system, elevation is a product of light and shadow, not lines.

*   **Tonal Layering:** The primary method of depth. Place a `surface_container_lowest` card on a `surface_container_low` background to create a soft, natural lift.
*   **Ambient Shadows:** When a "floating" effect is required (e.g., a primary tutor card), use an extra-diffused shadow: `box-shadow: 0px 10px 30px rgba(25, 28, 32, 0.06)`. Note the low opacity (6%) and large blur—this mimics natural ambient light.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, it must be a "Ghost Border": use `outline_variant` at 15% opacity. **Never use 100% opaque borders.**

## 5. Components

### Cards & Lists
*   **Radius:** Always use `md` (0.75rem / 12px) for cards.
*   **Separation:** Forbid divider lines. Use vertical white space (`spacing-6` or `spacing-8`) to separate list items.
*   **Avatars:** Always `rounded: full`. For a premium touch, add a 2px `surface_container_lowest` "halo" around avatars when they overlap.

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`), `rounded: full`, white text.
*   **Secondary:** `surface_container_high` background with `on_secondary_container` text. No border.
*   **States:** On hover, primary buttons should shift scale slightly (1.02x) rather than just changing color.

### Input Fields
*   **Styling:** Use `surface_container_low` for the field background.
*   **Active State:** Change background to `surface_container_lowest` and apply a 1px "Ghost Border" using `primary`.
*   **Error:** Use `error` text and a `error_container` background tint.

### Chips (Specialized)
For "Subject Matter" chips (e.g., "Mathematics", "Design"), use `secondary_container` with `on_secondary_container` text. Keep them `rounded: full` to mirror the approachable brand personality.

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts. A 2/3 and 1/3 split feels more editorial than a 50/50 split.
*   **Do** prioritize `primary_fixed_dim` for subtle backgrounds when you need to highlight a specific learning module.
*   **Do** use **Lucide Icons** at a 1.5px stroke width to match the weight of Inter's body text.

### Don't
*   **Don't** use pure black (#000000). Always use `on_surface` (#191c20) to maintain a soft, premium feel.
*   **Don't** use standard 8px padding for everything. Use the wider scale (`spacing-12` to `spacing-16`) for container margins to create "luxury" space.
*   **Don't** use hard shadows. If a shadow looks like a shadow, it’s too dark. It should look like a "glow" of depth.