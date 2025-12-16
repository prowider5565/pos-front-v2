# i18n (Internationalization) Guide

## Overview

This project uses **i18next** and **react-i18next** for internationalization with support for three languages:
- 🇬🇧 **English (en)** - Default
- 🇷🇺 **Russian (ru)**
- 🇺🇿 **Uzbek (uz)**

## Architecture

### File Structure

```
src/
├── i18n/
│   ├── config.ts           # i18n configuration
│   └── index.ts            # Export i18n instance
├── locales/
│   ├── en/                 # English translations
│   │   ├── common.json     # Common UI elements
│   │   ├── auth.json       # Authentication pages
│   │   ├── dashboard.json  # Dashboard page
│   │   ├── users.json      # Users page
│   │   ├── settings.json   # Settings pages
│   │   └── errors.json     # Error messages
│   ├── ru/                 # Russian translations (same structure)
│   └── uz/                 # Uzbek translations (same structure)
├── components/
│   └── language-switcher.tsx  # Language selector component
├── hooks/
│   └── use-language.ts     # Custom language hook
└── lib/
    └── i18n-utils.ts       # Formatting utilities
```

### Translation Namespaces

Translations are organized into namespaces for better organization:

| Namespace | Purpose | Example Keys |
|-----------|---------|--------------|
| `common` | Shared UI elements | `buttons.save`, `navigation.dashboard` |
| `auth` | Authentication pages | `login.title`, `forgotPassword.subtitle` |
| `dashboard` | Dashboard page | `title`, `welcome` |
| `users` | Users management | `addUser`, `table.username` |
| `settings` | Settings pages | `appearance.theme`, `notifications.email` |
| `errors` | Error messages | `404.title`, `network.description` |

## Usage

### Basic Translation

```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation('common')
  
  return (
    <div>
      <h1>{t('navigation.dashboard')}</h1>
      <button>{t('buttons.save')}</button>
    </div>
  )
}
```

### Multiple Namespaces

```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation(['common', 'users'])
  
  return (
    <div>
      <h1>{t('common:navigation.users')}</h1>
      <button>{t('users:addUser')}</button>
    </div>
  )
}
```

### Interpolation (Variables in Translations)

Translation file (`common.json`):
```json
{
  "welcome": "Welcome, {{name}}!",
  "itemCount": "You have {{count}} items"
}
```

Component:
```tsx
const { t } = useTranslation('common')

<h1>{t('welcome', { name: 'John' })}</h1>
// Output: "Welcome, John!"

<p>{t('itemCount', { count: 5 })}</p>
// Output: "You have 5 items"
```

### Language Switcher

The language switcher is already included in the header:

```tsx
import { LanguageSwitcher } from '@/components/language-switcher'

// Already added to site-header.tsx
<LanguageSwitcher />
```

### Custom Language Hook

```tsx
import { useLanguage } from '@/hooks/use-language'

function MyComponent() {
  const { 
    currentLanguage,      // 'en', 'ru', or 'uz'
    currentLanguageData,  // { code: 'en', name: 'English', nativeName: 'English' }
    changeLanguage,       // Function to change language
    availableLanguages    // Array of all available languages
  } = useLanguage()

  return (
    <div>
      <p>Current: {currentLanguageData.nativeName}</p>
      <button onClick={() => changeLanguage('ru')}>
        Switch to Russian
      </button>
    </div>
  )
}
```

## Formatting Utilities

### Date Formatting

```tsx
import { formatDate, formatDateTime } from '@/lib/i18n-utils'
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { i18n } = useTranslation()
  const date = new Date()

  return (
    <div>
      <p>{formatDate(date, i18n.language)}</p>
      {/* English: January 15, 2024 */}
      {/* Russian: 15 января 2024 г. */}
      {/* Uzbek: 15 yanvar 2024 */}
      
      <p>{formatDateTime(date, i18n.language)}</p>
      {/* Includes time as well */}
    </div>
  )
}
```

### Number Formatting

```tsx
import { formatNumber } from '@/lib/i18n-utils'
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { i18n } = useTranslation()

  return (
    <p>{formatNumber(1234567.89, i18n.language)}</p>
    // English: 1,234,567.89
    // Russian: 1 234 567,89
    // Uzbek: 1 234 567,89
  )
}
```

### Currency Formatting

```tsx
import { formatCurrency } from '@/lib/i18n-utils'
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { i18n } = useTranslation()

  return (
    <div>
      <p>{formatCurrency(1000, i18n.language, 'UZS')}</p>
      {/* 1 000 UZS (Uzbek Som) */}
      
      <p>{formatCurrency(1000, i18n.language, 'USD')}</p>
      {/* $1,000.00 */}
    </div>
  )
}
```

### Relative Time

```tsx
import { formatRelativeTime } from '@/lib/i18n-utils'
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { i18n } = useTranslation()
  const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago

  return (
    <p>{formatRelativeTime(pastDate, i18n.language)}</p>
    // English: "2 hours ago"
    // Russian: "2 часа назад"
    // Uzbek: "2 soat oldin"
  )
}
```

## Adding New Translations

### 1. Add Translation Keys

Add the same key to all three language files:

**`src/locales/en/common.json`**
```json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}
```

**`src/locales/ru/common.json`**
```json
{
  "newFeature": {
    "title": "Новая функция",
    "description": "Это новая функция"
  }
}
```

**`src/locales/uz/common.json`**
```json
{
  "newFeature": {
    "title": "Yangi xususiyat",
    "description": "Bu yangi xususiyat"
  }
}
```

### 2. Use in Component

```tsx
const { t } = useTranslation('common')

<h1>{t('newFeature.title')}</h1>
<p>{t('newFeature.description')}</p>
```

### 3. Update i18n Config (if adding new namespace)

If creating a new namespace file (e.g., `products.json`):

**`src/i18n/config.ts`**
```typescript
import productsEN from '@/locales/en/products.json'
import productsRU from '@/locales/ru/products.json'
import productsUZ from '@/locales/uz/products.json'

const resources = {
  en: {
    common: commonEN,
    auth: authEN,
    products: productsEN, // Add here
    // ...
  },
  ru: {
    common: commonRU,
    auth: authRU,
    products: productsRU, // Add here
    // ...
  },
  uz: {
    common: commonUZ,
    auth: authUZ,
    products: productsUZ, // Add here
    // ...
  },
}
```

## Language Detection

The app automatically detects the user's language based on:

1. **localStorage** - Previously selected language (persisted)
2. **Browser language** - If no saved preference

### Change Default Language

Edit `src/i18n/config.ts`:

```typescript
export const DEFAULT_LANGUAGE = 'en' // Change to 'ru' or 'uz'
```

### Force a Specific Language

```typescript
import i18n from '@/i18n'

// Change language programmatically
i18n.changeLanguage('ru')
```

## Form Validation with i18n

Use translated error messages in form schemas:

```tsx
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

function MyForm() {
  const { t } = useTranslation('common')

  const schema = z.object({
    email: z.string().email(t('form.invalidEmail')),
    password: z.string().min(6, t('form.minLength', { min: 6 })),
  })

  // Use schema with react-hook-form
}
```

## Best Practices

### ✅ DO

1. **Use nested keys** for organization
   ```json
   {
     "auth": {
       "login": {
         "title": "Login",
         "subtitle": "Enter credentials"
       }
     }
   }
   ```

2. **Keep translations consistent** across all languages

3. **Use namespaces** to organize translations by feature

4. **Use interpolation** for dynamic content
   ```tsx
   t('welcome', { name: user.name })
   ```

5. **Add context** in translation keys
   ```json
   {
     "buttons": {
       "save": "Save",
       "saveChanges": "Save Changes"
     }
   }
   ```

### ❌ DON'T

1. **Don't hardcode text** - Always use translation keys
   ```tsx
   // ❌ Bad
   <button>Save</button>
   
   // ✅ Good
   <button>{t('buttons.save')}</button>
   ```

2. **Don't concatenate translations**
   ```tsx
   // ❌ Bad
   {t('welcome')} + ' ' + {t('user.name')}
   
   // ✅ Good
   {t('welcome', { name: t('user.name') })}
   ```

3. **Don't use translation keys as fallback**
   ```tsx
   // ❌ Bad
   {t('missingKey') || 'Fallback'}
   
   // ✅ Good - Add the translation to all language files
   ```

## Testing Translations

### Manual Testing

1. Use the language switcher in the header (globe icon)
2. Switch between English, Russian, and Uzbek
3. Verify all text updates correctly

### Check for Missing Translations

All translation keys should exist in all three language files. Missing translations will show the key path instead of translated text.

```
// Missing translation shows as:
auth.login.title
```

## TypeScript Support

To add type safety for translation keys:

1. Install type generation package (optional):
   ```bash
   npm install -D i18next-parser
   ```

2. Or use IDE autocomplete by importing types:
   ```tsx
   import type { TFunction } from 'i18next'
   
   function MyComponent() {
     const { t }: { t: TFunction } = useTranslation('common')
   }
   ```

## Performance Optimization

### Lazy Loading Translations

Currently all translations are loaded upfront. For larger apps, implement lazy loading:

```typescript
// Future improvement - load translations on demand
i18n.loadNamespaces(['products']).then(() => {
  // Translations loaded
})
```

### Caching

Translations are automatically cached in memory and localStorage saves the selected language.

## Troubleshooting

### Translation not showing

1. **Check the key exists** in the translation file
2. **Verify namespace** is correct
3. **Check for typos** in the key path
4. **Ensure i18n is initialized** in App.tsx

### Language not persisting

- Check localStorage for `i18nextLng` key
- Clear browser cache and localStorage

### Missing translations in build

- Ensure all JSON files are imported in `i18n/config.ts`
- Check build output for missing modules

## Migration Guide

### Converting Existing Components

1. **Find hardcoded text:**
   ```tsx
   // Before
   <h1>Dashboard</h1>
   ```

2. **Add translation key:**
   ```json
   // locales/en/dashboard.json
   { "title": "Dashboard" }
   ```

3. **Use translation hook:**
   ```tsx
   // After
   const { t } = useTranslation('dashboard')
   <h1>{t('title')}</h1>
   ```

## Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)

## Summary

✅ **Three languages supported**: English, Russian, Uzbek  
✅ **Organized namespaces**: common, auth, dashboard, users, settings, errors  
✅ **Automatic detection**: Browser language + localStorage persistence  
✅ **Type-safe**: TypeScript support throughout  
✅ **Format utilities**: Date, number, currency, relative time  
✅ **Easy to extend**: Add new languages or translations easily  

---

**Last Updated**: December 2024  
**Version**: 1.0.0
