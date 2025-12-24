# Theme Selector Feature

## Overview
The theme selector allows users to log into the dashboard and choose from 4 professional themes for the ecommerce website frontend. Each theme can be previewed before applying, and the site content editor remains fully functional.

## Features
- ✅ 4 Professional Themes: Default, Luxury, Minimal, and Vibrant
- ✅ Live Preview: Preview each theme before applying
- ✅ Color Palette Display: See the primary colors of each theme
- ✅ Easy Navigation: Accessible from the admin sidebar
- ✅ Content Preservation: All site content remains editable and unchanged when switching themes
- ✅ Instant Application: Themes apply instantly across the entire frontend

## Setup Instructions

### 1. Apply Database Migration
Run the migration to add theme settings support:

```bash
# If using Supabase CLI
npx supabase migration up

# Or apply manually in Supabase Dashboard
# Run the SQL in: supabase/migrations/0007_theme_selector.sql
```

### 2. Restart Development Server
```bash
npm run dev
```

### 3. Access Theme Selector
1. Log into the admin dashboard at `/admin`
2. Click on "Theme Selector" in the sidebar (Palette icon)
3. Browse the 4 available themes
4. Click "Preview Store" to see a theme in action
5. Click "Apply Theme" to activate your chosen theme

## Available Themes

### 1. Default Theme
- **Style**: Clean and modern
- **Best for**: Any store type
- **Colors**: Neutral blacks, grays, and whites
- **Border Radius**: Rounded (0.75rem)

### 2. Luxury Theme
- **Style**: Elegant and sophisticated
- **Best for**: Premium brands
- **Colors**: Deep blacks with gold accents
- **Border Radius**: Sharp (0.25rem)
- **Font**: Serif typography

### 3. Minimal Theme
- **Style**: Ultra-clean, product-focused
- **Best for**: Modern minimalist brands
- **Colors**: Pure black and white
- **Border Radius**: Square (0rem)
- **Font**: Helvetica Neue

### 4. Vibrant Theme
- **Style**: Bold and colorful
- **Best for**: Fashion and lifestyle brands
- **Colors**: Purple and pink tones
- **Border Radius**: Very rounded (1rem)

## Technical Details

### Files Created/Modified
- `supabase/migrations/0007_theme_selector.sql` - Database migration
- `src/app/api/admin/theme/route.ts` - Admin API for theme management
- `src/app/api/site-content/theme/route.ts` - Public API for theme retrieval
- `src/app/admin/themes/page.tsx` - Theme selector admin page
- `src/components/admin/ThemeSelector.tsx` - Theme selector UI component
- `src/lib/theme/getStoredTheme.ts` - Server-side theme retrieval utility
- `src/app/layout.tsx` - Updated to load theme from database
- `src/components/admin/AdminShell.tsx` - Added theme selector to navigation
- `src/lib/config/site.ts` - Updated theme types
- `src/lib/config/themes.ts` - Removed unused theme

### Database Structure
Theme settings are stored in the `site_content` table with key `theme_settings`:
```json
{
  "selectedTheme": "default",
  "lastUpdated": "2024-12-24T12:00:00.000Z"
}
```

### How It Works
1. User selects a theme in `/admin/themes`
2. Theme preference is saved to Supabase `site_content` table
3. Root layout fetches the theme on server-side render
4. ThemeProvider applies theme CSS variables to `:root`
5. All frontend components use these CSS variables for styling
6. Page reloads to apply theme globally

## Content Editing
The site content editor at `/admin/content` remains fully functional. When you switch themes:
- ✅ All text content is preserved
- ✅ All images are preserved
- ✅ All promo cards are preserved
- ✅ Hero section is preserved
- ✅ Only visual styling (colors, fonts, spacing) changes

## Support
If you encounter issues:
1. Check that the migration has been applied
2. Clear browser cache and reload
3. Verify Supabase connection is active
4. Check browser console for errors
