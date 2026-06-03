---
name: Paynote Crystal
colors:
  surface: '#f9f9ff'
  surface-dim: '#d8d9e3'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3fd'
  surface-container: '#ecedf7'
  surface-container-high: '#e6e7f2'
  surface-container-highest: '#e1e2ec'
  on-surface: '#191b23'
  on-surface-variant: '#424754'
  inverse-surface: '#2e3038'
  inverse-on-surface: '#eff0fa'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#545f73'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f8'
  on-secondary-container: '#586377'
  tertiary: '#595c5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#727577'
  on-tertiary-container: '#fbfdff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f9f9ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ec'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style

The visual identity of the design system is anchored in **Trust, Clarity, and Efficiency**. Given the sensitive nature of debt and financial management, the UI must feel both authoritative and approachable. 

The design follows a **Corporate Modern** style with heavy influences from **Minimalism**. It prioritizes high-legibility typography and vast amounts of whitespace to reduce the cognitive load associated with tracking financial installments. The aesthetic is "Crystal-clear"—relying on a bright, light-mode-first interface that uses vibrant blue accents to guide user action and soft shadows to establish a hierarchy that feels physical yet lightweight.

## Colors

The palette is dominated by a clean white foundation to maintain a "fresh start" feeling for users managing their debts. 

- **Primary Blue (#3B82F6):** Used for primary actions, progress indicators, and key brand moments. It represents reliability and professional technology.
- **Secondary Slate (#1E293B):** Reserved for high-contrast typography and deep UI foundations like footers or dark-mode surfaces.
- **Tertiary/Neutral Background (#F8FAFC):** A very cool, light gray used to distinguish card backgrounds from the main page surface without introducing heavy borders.
- **Status Colors:** Standardized semantic colors (Green, Orange, Red) are used sparingly for payment statuses (Paid, Pending, Overdue).

## Typography

The typography system uses **Plus Jakarta Sans** across all levels to maintain a friendly, contemporary, and optimistic tone. 

Headlines utilize a tighter letter-spacing and heavier weights (Bold/ExtraBold) to create a strong visual anchor for data-heavy pages. Body text is set with generous line heights to ensure readability in long lists of transactions. Labels for data points and table headers use a semi-bold weight and occasional uppercase styling to provide clear distinction from user-generated content.

## Layout & Spacing

This design system utilizes a **12-column Fluid Grid** for desktop and a **4-column Fluid Grid** for mobile devices. 

- **Desktop:** The layout is centered with a maximum width of 1280px. Content sections are separated by large vertical margins (80px–120px) to give the financial data room to "breathe."
- **Rhythm:** An 8px linear spacing scale governs all internal padding and margins. 
- **Grids:** Cards and dashboard modules should span 3, 4, or 6 columns on desktop to maintain a balanced, symmetrical appearance.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layering** rather than heavy lines.

- **Level 0 (Surface):** The primary background, usually white (#FFFFFF) or the Tertiary tint (#F8FAFC).
- **Level 1 (Cards):** Used for the main content containers. These features a very soft, diffused shadow: `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05)`.
- **Level 2 (Dropdowns/Modals):** Elements that sit above the main UI use a more pronounced shadow to indicate interactivity: `box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1)`.

Avoid using pure black for shadows; instead, use a deep navy tint to keep the interface looking "clean" and "crystal" clear.

## Shapes

The shape language is approachable and soft, avoiding sharp corners that can feel aggressive or overly formal.

- **Standard Elements:** Buttons, input fields, and small tags use a **0.5rem (8px)** radius.
- **Containers:** Large content cards and dashboard modules use a **1rem (16px)** or **1.5rem (24px)** radius to emphasize the friendly nature of the app.
- **Interactive States:** Buttons may transition to slightly more rounded shapes upon interaction, but generally stay within the `rounded-lg` specification.

## Components

### Buttons
- **Primary:** Solid Primary Blue (#3B82F6) with white text. High-contrast, bold weight.
- **Secondary:** Ghost style (transparent background) with a Primary Blue border or text.
- **Icon Buttons:** Circular or softly rounded squares with centered icons for actions like "Add Debt" or "Delete Transaction."

### Cards
Cards are the primary container in the design system. They must always have a white background, the Level 1 soft shadow, and a 16px corner radius. Content inside cards should have a minimum of 24px padding.

### Inputs & Forms
Input fields use a light gray border (#E2E8F0) that transitions to Primary Blue on focus. The label should always sit above the field in `label-md` style.

### Status Chips
Small, pill-shaped indicators for "Paid," "Pending," or "Late." These use a light tinted background of the semantic color (e.g., light red for "Late") with high-contrast text of the same hue.

### Lists & Tables
Rows should have a subtle hover state (background change to #F8FAFC) and ample vertical padding (16px+) to ensure touch targets are accessible on mobile devices.