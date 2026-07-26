---
name: design-system
description: Official design system for the Renan Crociari portfolio project. Use this authentic source of truth for all UI implementation, ensuring consistency in colors, typography, spacing, and component usage.
---

# Renan Crociari Design System

This design system defines the visual language of the project. Always adhere to these tokens and components when creating or modifying UI elements.

> **Source of truth**: All token variable names and values below are synced with `src/styles/global.css`. If in doubt, cross-reference that file directly.

## 1. Design Tokens

### Colors (Dark Mode — Active)
Use CSS variables or their hex values if variables are unavailable in context.

| Token | Variable | Value | Usage |
|-------|----------|-------|-------|
| **White** | `--typography-white` | `#ffffff` | Light text, headings on dark backgrounds |
| **Green Lighter** | `--typography-green-lighter` | `#49E257` | Lighter green accents |
| **Green Light** | `--typography-green-light` | `#38C545` | Primary actions, links, accents |
| **Green Dark** | `--typography-green-dark` | `#099415` | Darker state for green elements |
| **Gradient 1** | `--typography-gradient-1` | `#25D16A` | Gradient Start |
| **Gradient 2** | `--typography-gradient-2` | `#9EE825` | Gradient End |
| **Gray 200** | `--typography-gray-200` | `#E3E3E3` | Primary text color (dark mode) |
| **Gray 300** | `--typography-gray-300` | `#8E8E8E` | Muted text, placeholders |
| **Gray Dark** | `--typography-gray-dark` | `#333333` | Dark gray text/elements |
| **Bg Body** | `--background-body` | `#141414` | Page body background |
| **Bg Gray Medium** | `--background-gray-medium` | `#1E1F20` | Component backgrounds, footer |
| **Bg Gray Light** | `--background-gray-light` | `#272829` | Section backgrounds |
| **Bg Gray Lighter** | `--background-gray-lighter` | `#343536` | Elevated surface backgrounds |
| **Border Gray** | `--border-gray` | `#E9EAEE` | Subtle borders |
| **Border Red** | `--border-red` | `#FF6060` | Error states |

> **Note**: A commented-out "White Mode" palette exists in `global.css` for future reference with different gray/background values.

### Typography
**Fonts**
- **Display**: `Degular`, sans-serif (`--font-display`) - Used for Headings
- **Paragraph**: `Source Serif`, `Georgia`, serif (`--font-paragraph`) - Used for Body text

**Font Size Scale**
| Variable | Size |
|----------|------|
| `--font-2xs` | 16px |
| `--font-xs` | 18px |
| `--font-sm` | 20px |
| `--font-md` | 22px |
| `--font-lg` | 24px |
| `--font-xl` | 26px |
| `--font-2xl` | 32px |
| `--font-3xl` | 40px |
| `--font-4xl` | 44px |
| `--font-5xl` | 60px |

**Typography Classes**
| Class | Font Size Variable | Size | Line Height | Weight | Usage |
|-------|-------------------|------|-------------|--------|-------|
| `.hero` / `.display-xxxl` | `--font-5xl` | 60px | 60px | 600 | Hero Headlines |
| `h1` / `.display-xxl` | `--font-4xl` | 44px | 48px | 600 | Section Headlines |
| `h2` / `.display-xl` | `--font-3xl` | 40px | 46px | 500 | Card Titles |
| `h3` / `.display-lg` | `--font-2xl` | 32px | 36px | 600 | Large Subheadings |
| `h4`–`h6` / `.display-md` | `--font-md` | 22px | 24px | 600 | Subheadings |
| `.body-large` | `--font-md` | 22px | 32px | 300 | Introductory text |
| `.body-medium` | `--font-sm` | 20px | 30px | 300 | Standard body text |
| `.body-small` | `--font-xs` | 18px | 26px | 300 | Captions, small links |

**Helper Classes**
- `.t-regular`: font-weight 400
- `.t-semibold`: font-weight 500
- `.t-bold`: font-weight 600
- `.t-gray-200`: Color `--typography-gray-200`
- `.t-gray-300`: Color `--typography-gray-300`
- `.t-white`: Color `--typography-white`
- `.t-green-light`: Color `--typography-green-light`
- `.t-green-dark`: Color `--typography-green-dark`
- `.t-ct`: text-align center
- `.t-upper`: text-transform uppercase

### Spacing
Consistent spacing scale for margins and paddings.
- `--spacing-2xs`: 4px
- `--spacing-xs`: 8px
- `--spacing-sm`: 16px
- `--spacing-md`: 24px
- `--spacing-lg`: 32px
- `--spacing-xl`: 48px
- `--spacing-2xl`: 64px
- `--spacing-3xl`: 80px
- `--spacing-4xl`: 128px
- `--spacing-5xl`: 160px
- `--spacing-6xl`: 224px

### Border Radius
- `--br-xxxs`: 4px
- `--br-xxs`: 8px
- `--br-xs`: 16px
- `--br-md`: 24px

## 2. Components

### Buttons (`.btn`)
Base class `.btn` creates a flex container with consistent gap (`--spacing-xs` = 8px).

**Variants**
- **Green Button** (`.btn-green`):
  - Text gradient: `#25D16A` to `#9EE825`
  - Hover: Opacity change on text/icon
  - Icon: SVG arrow fills with `--typography-green-light`
- **White Button** (`.btn-white`):
  - White text
  - Icon: White fill
- **Gray Button** (`.btn-gray-200`):
  - Gray 200 text color

**Iconography in Buttons**
Buttons typically include an SVG arrow.
- Standard: Arrow on right
- Backwards: Add `.btn-arrow-left` to reverse arrow direction and placement.
- Animation: On hover, arrow translates x-axis by 2px (or -2px for left arrow).

### Inputs
- **Base Style**:
  - Padding: `--spacing-sm` (16px)
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
  - Background: `--background-body` (#141414).
  - **Signature Border**: 8px solid with gradient from `#C8F686` to `#75EF81`.
- **Animation**: Fade in (0.8s).

## 3. Utility Classes

### Margins
Format: `.{property}-{size}`
- Property: `mt` (top), `mb` (bottom), `ml` (left), `mr` (right), `my` (vertical), `mx` (horizontal).
- Size: matches spacing tokens (`2xs` to `6xl`).
- *Example*: `.mt-xl` adds 48px top margin.

### Paddings
Format: `.{property}-{size}`
- Property: `pt`, `pb`, `pl`, `pr`, `py` (vertical), `px` (horizontal).
- Size: matches spacing tokens.
- *Example*: `.py-md` adds 24px vertical padding.

### Layout
- `.wrapper`: Max-width 1344px, centered, 32px (`--spacing-lg`) padding on sides.
- `.visually-hidden`: Standard accessible hiding pattern.

## 4. Global CSS Reset & Globals
- `box-sizing: border-box` is applied generally (via normalization).
- `body`: Background `--background-body` (#141414) with a distinctive **8px solid gradient border** acting as a page frame.
- `a`: Links default to `--typography-green-light` and have a transparent text-clip hover effect.
