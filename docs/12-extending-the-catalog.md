# Extending the Catalog

## Add a resource

1. Open `src/data/catalog.ts`.
2. Append a new `R({ ... })` entry.
3. Provide `type`, `label`, `provider`, `category`, `icon`, `color`, and optional `terraformType` and `properties`.
4. Ensure the Lucide icon name exists in `src/lib/iconMap.ts` (regenerate if needed).

## Property helpers

- `str(key, label, default?, placeholder?)`
- `num(key, label, default?)`
- `bool(key, label, default?)`
- `sel(key, label, options[], default?)`
- `txt(key, label, default?)`

## Add a provider

1. Add to `Provider` union in `src/types/ir.ts`.
2. Add resources in `src/data/catalog.ts`.
3. Add provider block and variables in `src/lib/terraform.ts`.
4. Update `varsFor` and `PROVIDER_BLOCKS`.
5. Update UI provider selector in `src/components/Toolbar.tsx` if needed.

## Regenerate icon map

If you add new Lucide icons, run:

```bash
node -e "..." # see developer guide
```

Or manually add imports to `src/lib/iconMap.ts`.
