Review ALL Vue components and pages for mobile-first compliance:

1. Check every .vue file in components/ and pages/.
2. For each file, verify:
   - CSS uses mobile-first approach (base styles = mobile, `min-width` for larger screens)
   - No `max-width` media queries (except for specific overrides with justification)
   - All interactive elements have min 44x44px touch target
   - No hover-only interactions (must have tap equivalent)
   - No fixed widths that break on 360px
   - No horizontal overflow on 360px
   - Text is readable without zooming (min 14px / 0.875rem)
   - Images use responsive widths (max-width: 100%)
   - Modals/drawers: bottom sheet pattern on mobile (<768px), centered modal on desktop
   - Forms: full-width inputs on mobile, proper spacing for thumb input
3. Report findings per component:
   - ✅ Passes mobile-first check
   - ⚠️ Has potential issues (describe)
   - ❌ Fails mobile-first (describe, suggest fix)
