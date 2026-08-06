# Bug Fix Checklist

## Backend
- [x] Fix 1: Restrict role at registration (registerUser) - prevent admin escalation
- [x] Fix 2: Restrict role in googleLogin - prevent admin escalation
- [x] Fix 3: Filter unpublished products in getSingleProducts
- [x] Fix 4: Cap pagination limit (max 100)
- [x] Fix 9: Wire up errorMiddleware + add 404 handler
- [x] Fix 10: Fix `mesage` typo -> `message`
- [x] Fix 11: Add stock min:0 + price NaN guard (Product model)
- [x] Fix 12: Remove unused `images` destructure in createProduct
- [x] Fix 16: Rename getSingleProducts -> getSingleProduct (consistency)
- [x] Fix 17: CORS origin + cookie secure from env
- [x] Fix 18: Align JWT expiry & cookie lifetime (30 days)

## Frontend
- [x] Fix 5: Homepage CTA -> link to /shop
- [x] Fix 6: Cart badge uses getCartCount()
- [x] Fix 7: Create /checkout page (remove dead link)
- [x] Fix 8: /product/[id] redirects to /shop/[id] (remove duplicate)
- [x] Fix 13: CartContext guards for missing/corrupt data
- [x] Fix 14: vendor/products auth guard (redirect non-vendors)
- [x] Fix 15: Centralize API base URL (env-based)

## Verification
- [x] Backend starts without syntax errors (`node --check` passed on all files)
- [x] Frontend builds without errors (`next build` compiled successfully)
