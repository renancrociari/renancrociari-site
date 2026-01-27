---
name: design-system
description: Official design system for the Renan Crociari portfolio project. Use this authentic source of truth for all UI implementation, ensuring consistency in colors, typography, spacing, and component usage.
---

# Renan Crociari Design System

This design system defines the visual language of the project. Always adhere to these tokens and components when creating or modifying UI elements.

## 1. Design Tokens

### Colors
Use CSS variables or their hex values if variables are unavailable in context.

| Token | Variable | Value | Usage |
|-------|----------|-------|-------|
| **White** | `--typography-white` | `#ffffff` | Light text, backgrounds |
| **Green Light** | `--typography-green-light` | `#38C545` | Primary actions, links, accents |
| **Green Dark** | `--typography-green-dark` | `#099415` | Darker state for green elements |
| **Gradient 1** | `--typography-gradient-1` | `#25D16A` | Gradient Start |
| **Gradient 2** | `--typography-gradient-2` | `#9EE825` | Gradient End |
| **Gray 200** | `--typography-gray-200` | `#222222` | Primary text color |
| **Gray 300** | `--typography-gray-300` | `#B6B6B6` | Placeholders, muted text |
| **Bg Gray Light** | `--background-gray-light` | `#f1f2f5` | Page backgrounds |
| **Bg Gray Medium** | `--background-gray-medium` | `#E9EAEE` | Component backgrounds, Footer |
| **Border Gray** | `--border-gray` | `#E9EAEE` | Subtle borders |
| **Border Red** | `--border-red` | `#FF6060` | Error states |

### Typography
**Fonts**
- **Display**: `Degular`, sans-serif (`--font-display`) - Used for Headings
- **Paragraph**: `Source Serif`, `Georgia`, serif (`--font-paragraph`) - Used for Body text

**Scale & Line Height**
| Class / Variable | Size | Line Height | Weight | Usage |
|------------------|------|-------------|--------|-------|
| `.hero` / `.display-xxxl` | 60px (`--font-xxxxl`) | 60px | 700 | Hero Headlines |
| `.display-xxl` | 40px (`--font-xxxl`) | 44px | 700 | Section Headlines |
| `.display-xl` | 36px (`--font-xxl`) | 42px | 600 | Card Titles |
| `.display-md` | 22px (`--font-xs`) | 24px | 700 | Subheadings |
| `.body-large` | 22px (`--font-xs`) | 32px | 400 | Introductory text |
| `.body-medium` | 20px (`--font-xxs`) | 30px | 400 | Standard body text |
| `.body-small` | 18px (`--font-xxxs`) | 26px | 400 | Captions, small links |

**Helper Classes**
- `.t-regular`: font-weight 400
- `.t-semibold`: font-weight 600
- `.t-bold`: font-weight 700
- `.t-gray-200`: Color Gray 200
- `.t-white`: Color White
- `.t-green-light`: Color Green Light

### Spacing
Consistent spacing scale for margins and paddings.
- `--spacing-xxxs`: 4px
- `--spacing-xxs`: 8px
- `--spacing-xs`: 16px
- `--spacing-md`: 24px
- `--spacing-lg`: 32px
- `--spacing-xl`: 48px
- `--spacing-xxl`: 64px
- `--spacing-xxxl`: 80px
- `--spacing-xxxxl`: 128px

### Border Radius
- `--br-xxxs`: 4px
- `--br-xxs`: 8px
- `--br-xs`: 16px
- `--br-md`: 24px

## 2. Components

### Buttons (`.btn`)
Base class `.btn` creates a flex container with consistent gap.

**Variants**
- **Green Button** (`.btn-green`):
  - Text gradient: `#25D16A` to `#9EE825`
  - Hover: Opacity change on text/icon
  - Icon: SVG arrow fills with `--typography-green-light`
- **White Button** (`.btn-white`):
  - White text
  - Icon: White fill
- **Gray Button** (`.btn-gray-200`):
  - Dark gray text (#222)

**Iconography in Buttons**
Buttons typically include an SVG arrow.
- Standard: Arrow on right
- Backwards: Add `.btn-arrow-left` to reverse arrow direction and placement.
- Animation: On hover, arrow translates x-axis by 2px (or -2px for left arrow).

### Inputs
- **Base Style**:
  - Padding: `24px 24px 24px 24px` (Right padding 80px for icons)
  - Border: `2px solid #AEB5C7`
  - Transition: `border 0.4s ease-in-out`
- **States**:
  - Focus: Border color `--typography-green-light`
  - Invalid: Border color `--border-red`
  - Placeholder: Color `#B6B6B6`

### Cards (`.project-card`)
Used for showcasing projects.
- **Base**: Height 800px, relative positioning, transition 0.6s.
- **Content**: `.project-card-content` with significant padding (top 100px).
- **Variants**:
  - `.card-1` to `.card-5`: Specific background colors and images.
  - Hover: Background color shifts to a darker/richer shade.

### Dialog / Modal (`.dialog`)
- **Structure**: `<dialog class="dialog">`
- **Styles**:
  - Fixed full screen (when open).
  - Background: White.
  - **Signature Border**: 16px solid with gradient from `#C8F686` to `#75EF81`.
- **Animation**: Fade in (0.8s).

## 3. Utility Classes

### Margins
Format: `.{property}-{size}`
- Property: `mt` (top), `mb` (bottom), `ml` (left), `mr` (right), `my` (vertical), `mx` (horizontal).
- Size: matches spacing tokens (`xxxs` to `xxxxl`).
- *Example*: `.mt-xl` adds 48px top margin.

### Paddings
Format: `.{property}-{size}`
- Property: `pt`, `pb`, `pl`, `pr`, `py`, `vertical`, `px` (horizontal).
- Size: matches spacing tokens.
- *Example*: `.py-md` adds 24px vertical padding.

### Layout
- `.wrapper`: Max-width 1344px, centered, 32px padding on sides.
- `.visually-hidden`: Standard accessible hiding pattern.

## 4. Global CSS Reset & Globals
- `box-sizing: border-box` is applied generally (via normalization).
- `body`: It has a distinctive **16px solid gradient border** acting as a page frame.
- `a`: Links default to `--typography-green-light` and have a transparent text-clip hover effect.
