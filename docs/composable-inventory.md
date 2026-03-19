# Composable Inventory

**Generated:** 2026-03-19
**Total composables:** 247
**With tests:** 210 (85%)
**Files scanned:** 268

## Summary by Domain

| Domain         | Count | Tested | Lines |
| -------------- | ----- | ------ | ----- |
| core           | 103   | 78/103 | 16857 |
| admin          | 86    | 78/86  | 25729 |
| dashboard      | 34    | 32/34  | 10605 |
| vehicles       | 10    | 9/10   | 2756  |
| market         | 4     | 4/4    | 737   |
| shared         | 4     | 3/4    | 396   |
| analytics      | 3     | 3/3    | 703   |
| auth           | 2     | 2/2    | 508   |
| multi-vertical | 1     | 1/1    | 146   |

## Full Inventory

### admin

| Composable                      | File                                                     | Lines | Deps | Tests |
| ------------------------------- | -------------------------------------------------------- | ----- | ---- | ----- |
| `useAdminAdDashboard`           | `app/composables/admin/useAdminAdDashboard.ts`           | 385   | 0    | ✅    |
| `useAdminAdvertisements`        | `app/composables/admin/useAdminAdvertisements.ts`        | 289   | 0    | ✅    |
| `useAdminAgenda`                | `app/composables/admin/useAdminAgenda.ts`                | 158   | 1    | ✅    |
| `useAdminAnunciantes`           | `app/composables/admin/useAdminAnunciantes.ts`           | 197   | 1    | ✅    |
| `useAdminArticleGenerate`       | `app/composables/admin/useAdminArticleGenerate.ts`       | 60    | 0    | ❌    |
| `useAdminAuctionDetail`         | `app/composables/admin/useAdminAuctionDetail.ts`         | 421   | 0    | ✅    |
| `useAdminAuctionList`           | `app/composables/admin/useAdminAuctionList.ts`           | 561   | 1    | ✅    |
| `useAdminBalance`               | `app/composables/admin/useAdminBalance.ts`               | 397   | 0    | ✅    |
| `useAdminBalanceUI`             | `app/composables/admin/useAdminBalanceUI.ts`             | 727   | 7    | ✅    |
| `useAdminBanner`                | `app/composables/admin/useAdminBanner.ts`                | 423   | 2    | ✅    |
| `useAdminBrokerage`             | `app/composables/admin/useAdminBrokerage.ts`             | 350   | 0    | ✅    |
| `useAdminBrokerageDeal`         | `app/composables/admin/useAdminBrokerageDeal.ts`         | 344   | 0    | ✅    |
| `useAdminCapacityAlerts`        | `app/composables/admin/useAdminCapacityAlerts.ts`        | 106   | 0    | ✅    |
| `useAdminCaptacion`             | `app/composables/admin/useAdminCaptacion.ts`             | 543   | 0    | ✅    |
| `useAdminCaracteristicas`       | `app/composables/admin/useAdminCaracteristicas.ts`       | 387   | 2    | ✅    |
| `useAdminChat`                  | `app/composables/admin/useAdminChat.ts`                  | 429   | 0    | ✅    |
| `useAdminChats`                 | `app/composables/admin/useAdminChats.ts`                 | 160   | 1    | ✅    |
| `useAdminComentarios`           | `app/composables/admin/useAdminComentarios.ts`           | 278   | 0    | ✅    |
| `useAdminConfig`                | `app/composables/admin/useAdminConfig.ts`                | 218   | 0    | ✅    |
| `useAdminConfigPricing`         | `app/composables/admin/useAdminConfigPricing.ts`         | 279   | 0    | ✅    |
| `useAdminContacts`              | `app/composables/admin/useAdminContacts.ts`              | 150   | 0    | ✅    |
| `useAdminDashboard`             | `app/composables/admin/useAdminDashboard.ts`             | 419   | 1    | ✅    |
| `useAdminDashboardPage`         | `app/composables/admin/useAdminDashboardPage.ts`         | 346   | 1    | ✅    |
| `useAdminDealerConfig`          | `app/composables/admin/useAdminDealerConfig.ts`          | 393   | 0    | ✅    |
| `useAdminDealerSuscripciones`   | `app/composables/admin/useAdminDealerSuscripciones.ts`   | 516   | 0    | ✅    |
| `useAdminDemands`               | `app/composables/admin/useAdminDemands.ts`               | 286   | 0    | ✅    |
| `useAdminEditorialCalendar`     | `app/composables/admin/useAdminEditorialCalendar.ts`     | 192   | 0    | ❌    |
| `useAdminEmails`                | `app/composables/admin/useAdminEmails.ts`                | 326   | 2    | ✅    |
| `useAdminFacturacion`           | `app/composables/admin/useAdminFacturacion.ts`           | 248   | 1    | ✅    |
| `useAdminFeatureFlags`          | `app/composables/admin/useAdminFeatureFlags.ts`          | 194   | 0    | ❌    |
| `useAdminFilters`               | `app/composables/admin/useAdminFilters.ts`               | 359   | 0    | ✅    |
| `useAdminHistorico`             | `app/composables/admin/useAdminHistorico.ts`             | 391   | 0    | ✅    |
| `useAdminHistoricoPage`         | `app/composables/admin/useAdminHistoricoPage.ts`         | 404   | 2    | ✅    |
| `useAdminHomepage`              | `app/composables/admin/useAdminHomepage.ts`              | 227   | 1    | ✅    |
| `useAdminInfrastructura`        | `app/composables/admin/useAdminInfrastructura.ts`        | 335   | 2    | ✅    |
| `useAdminLanguages`             | `app/composables/admin/useAdminLanguages.ts`             | 299   | 1    | ✅    |
| `useAdminMetrics`               | `app/composables/admin/useAdminMetrics.ts`               | 126   | 2    | ✅    |
| `useAdminMetricsActivity`       | `app/composables/admin/useAdminMetricsActivity.ts`       | 355   | 0    | ✅    |
| `useAdminMetricsRevenue`        | `app/composables/admin/useAdminMetricsRevenue.ts`        | 251   | 0    | ✅    |
| `useAdminNavigation`            | `app/composables/admin/useAdminNavigation.ts`            | 189   | 1    | ✅    |
| `useAdminNews`                  | `app/composables/admin/useAdminNews.ts`                  | 251   | 0    | ✅    |
| `useAdminNewsCreate`            | `app/composables/admin/useAdminNewsCreate.ts`            | 280   | 3    | ✅    |
| `useAdminNewsForm`              | `app/composables/admin/useAdminNewsForm.ts`              | 369   | 3    | ✅    |
| `useAdminNoticiaForm`           | `app/composables/admin/useAdminNoticiaForm.ts`           | 361   | 3    | ✅    |
| `useAdminNoticiasIndex`         | `app/composables/admin/useAdminNoticiasIndex.ts`         | 234   | 1    | ✅    |
| `useAdminPagos`                 | `app/composables/admin/useAdminPagos.ts`                 | 276   | 0    | ✅    |
| `useAdminProductForm`           | `app/composables/admin/useAdminProductForm.ts`           | 462   | 7    | ✅    |
| `useAdminProductoDetail`        | `app/composables/admin/useAdminProductoDetail.ts`        | 421   | 9    | ✅    |
| `useAdminProductoDetailImages`  | `app/composables/admin/useAdminProductoDetailImages.ts`  | 144   | 1    | ✅    |
| `useAdminProductoDetailRecords` | `app/composables/admin/useAdminProductoDetailRecords.ts` | 259   | 1    | ✅    |
| `useAdminProductoDetailVerif`   | `app/composables/admin/useAdminProductoDetailVerif.ts`   | 92    | 1    | ✅    |
| `useAdminProductoNuevo`         | `app/composables/admin/useAdminProductoNuevo.ts`         | 52    | 1    | ✅    |
| `useAdminProductosColumns`      | `app/composables/admin/useAdminProductosColumns.ts`      | 271   | 0    | ✅    |
| `useAdminProductosPage`         | `app/composables/admin/useAdminProductosPage.ts`         | 480   | 8    | ✅    |
| `useAdminProductosSort`         | `app/composables/admin/useAdminProductosSort.ts`         | 72    | 0    | ✅    |
| `useAdminProductRecords`        | `app/composables/admin/useAdminProductRecords.ts`        | 64    | 0    | ❌    |
| `useAdminPublicidad`            | `app/composables/admin/useAdminPublicidad.ts`            | 580   | 1    | ✅    |
| `useAdminReportes`              | `app/composables/admin/useAdminReportes.ts`              | 189   | 0    | ✅    |
| `useAdminRole`                  | `app/composables/useAdminRole.ts`                        | 46    | 0    | ✅    |
| `useAdminSearchAnalytics`       | `app/composables/admin/useAdminSearchAnalytics.ts`       | 123   | 0    | ❌    |
| `useAdminServicios`             | `app/composables/admin/useAdminServicios.ts`             | 244   | 0    | ✅    |
| `useAdminSidebar`               | `app/composables/admin/useAdminSidebar.ts`               | 256   | 2    | ✅    |
| `useAdminSocialCalendar`        | `app/composables/admin/useAdminSocialCalendar.ts`        | 348   | 0    | ❌    |
| `useAdminSolicitantes`          | `app/composables/admin/useAdminSolicitantes.ts`          | 209   | 1    | ✅    |
| `useAdminSubcategoriasPage`     | `app/composables/admin/useAdminSubcategoriasPage.ts`     | 291   | 3    | ✅    |
| `useAdminSubcategories`         | `app/composables/admin/useAdminSubcategories.ts`         | 376   | 0    | ✅    |
| `useAdminSubscriptions`         | `app/composables/admin/useAdminSubscriptions.ts`         | 144   | 0    | ✅    |
| `useAdminTiposPage`             | `app/composables/admin/useAdminTiposPage.ts`             | 360   | 4    | ✅    |
| `useAdminTransporte`            | `app/composables/admin/useAdminTransporte.ts`            | 256   | 0    | ✅    |
| `useAdminTypes`                 | `app/composables/admin/useAdminTypes.ts`                 | 298   | 0    | ✅    |
| `useAdminUsers`                 | `app/composables/admin/useAdminUsers.ts`                 | 206   | 0    | ✅    |
| `useAdminUsuariosPage`          | `app/composables/admin/useAdminUsuariosPage.ts`          | 227   | 1    | ✅    |
| `useAdminVehicleDetail`         | `app/composables/admin/useAdminVehicleDetail.ts`         | 566   | 1    | ✅    |
| `useAdminVehicles`              | `app/composables/admin/useAdminVehicles.ts`              | 495   | 0    | ✅    |
| `useAdminVerificaciones`        | `app/composables/admin/useAdminVerificaciones.ts`        | 377   | 0    | ✅    |
| `useAdminVerticalConfig`        | `app/composables/admin/useAdminVerticalConfig.ts`        | 122   | 0    | ✅    |
| `useAdminWhatsApp`              | `app/composables/admin/useAdminWhatsApp.ts`              | 360   | 0    | ✅    |
| `useCloudinaryUpload`           | `app/composables/admin/useCloudinaryUpload.ts`           | 145   | 0    | ✅    |
| `useContractForm`               | `app/composables/admin/useContractForm.ts`               | 236   | 0    | ✅    |
| `useContractGenerator`          | `app/composables/admin/useContractGenerator.ts`          | 454   | 0    | ✅    |
| `useFunnelAnalysis`             | `app/composables/admin/useFunnelAnalysis.ts`             | 113   | 0    | ❌    |
| `useGoogleDrive`                | `app/composables/admin/useGoogleDrive.ts`                | 410   | 1    | ✅    |
| `useGoogleDriveFolders`         | `app/composables/admin/useGoogleDriveFolders.ts`         | 97    | 0    | ❌    |
| `useInvoiceGenerator`           | `app/composables/admin/useInvoiceGenerator.ts`           | 376   | 1    | ✅    |
| `useSeoScore`                   | `app/composables/admin/useSeoScore.ts`                   | 713   | 1    | ✅    |
| `useSocialAdminUI`              | `app/composables/admin/useSocialAdminUI.ts`              | 306   | 1    | ✅    |

### analytics

| Composable             | File                                      | Lines | Deps | Tests |
| ---------------------- | ----------------------------------------- | ----- | ---- | ----- |
| `useAnalyticsTracking` | `app/composables/useAnalyticsTracking.ts` | 418   | 0    | ✅    |
| `useLeadTracking`      | `app/composables/useLeadTracking.ts`      | 43    | 0    | ✅    |
| `useProductAnalytics`  | `app/composables/useProductAnalytics.ts`  | 242   | 0    | ✅    |

### auth

| Composable | File                         | Lines | Deps | Tests |
| ---------- | ---------------------------- | ----- | ---- | ----- |
| `useAuth`  | `app/composables/useAuth.ts` | 350   | 0    | ✅    |
| `useMfa`   | `app/composables/useMfa.ts`  | 158   | 0    | ✅    |

### core

| Composable                | File                                             | Lines | Deps | Tests |
| ------------------------- | ------------------------------------------------ | ----- | ---- | ----- |
| `useAbTest`               | `app/composables/useAbTest.ts`                   | 85    | 0    | ✅    |
| `useAdaptiveLoading`      | `app/composables/useAdaptiveLoading.ts`          | 64    | 0    | ❌    |
| `useAds`                  | `app/composables/useAds.ts`                      | 231   | 0    | ✅    |
| `useAdvertiseModal`       | `app/composables/modals/useAdvertiseModal.ts`    | 342   | 1    | ✅    |
| `useAdViewability`        | `app/composables/useAdViewability.ts`            | 140   | 0    | ✅    |
| `useAuction`              | `app/composables/useAuction.ts`                  | 333   | 0    | ✅    |
| `useAuctionDetail`        | `app/composables/useAuctionDetail.ts`            | 280   | 5    | ✅    |
| `useAuctionRegistration`  | `app/composables/useAuctionRegistration.ts`      | 210   | 0    | ✅    |
| `useAudienceSegmentation` | `app/composables/useAudienceSegmentation.ts`     | 203   | 0    | ✅    |
| `useCacheAside`           | `app/composables/useCacheAside.ts`               | 144   | 0    | ❌    |
| `useCacheCategories`      | `app/composables/useCacheAside.ts`               | 144   | 0    | ❌    |
| `useCacheVehicleCounts`   | `app/composables/useCacheAside.ts`               | 144   | 0    | ❌    |
| `useCacheVerticalConfig`  | `app/composables/useCacheAside.ts`               | 144   | 0    | ❌    |
| `useConfirmModal`         | `app/composables/useConfirmModal.ts`             | 74    | 0    | ✅    |
| `useConsent`              | `app/composables/useConsent.ts`                  | 230   | 0    | ✅    |
| `useConversation`         | `app/composables/useConversation.ts`             | 505   | 0    | ✅    |
| `useCopyToClipboard`      | `app/composables/useCopyToClipboard.ts`          | 48    | 0    | ✅    |
| `useCorrelationId`        | `app/composables/useCorrelationId.ts`            | 56    | 0    | ✅    |
| `useDatos`                | `app/composables/useDatos.ts`                    | 334   | 1    | ✅    |
| `useEmailPreferences`     | `app/composables/useEmailPreferences.ts`         | 246   | 0    | ✅    |
| `useFavorites`            | `app/composables/useFavorites.ts`                | 216   | 0    | ✅    |
| `useFeatureFlag`          | `app/composables/useFeatureFlags.ts`             | 80    | 0    | ❌    |
| `useFeatureGate`          | `app/composables/useFeatureGate.ts`              | 98    | 2    | ✅    |
| `useFilterBar`            | `app/composables/catalog/useFilterBar.ts`        | 267   | 4    | ✅    |
| `useFilters`              | `app/composables/useFilters.ts`                  | 234   | 0    | ✅    |
| `useFinanceCalculator`    | `app/composables/useFinanceCalculator.ts`        | 32    | 0    | ✅    |
| `useFocusTrap`            | `app/composables/useFocusTrap.ts`                | 96    | 0    | ❌    |
| `useFormAutosave`         | `app/composables/useFormAutosave.ts`             | 121   | 0    | ✅    |
| `useFormValidation`       | `app/composables/useFormValidation.ts`           | 67    | 0    | ✅    |
| `useGeoFallback`          | `app/composables/catalog/useGeoFallback.ts`      | 155   | 3    | ✅    |
| `useGlossary`             | `app/composables/useGlossary.ts`                 | 115   | 0    | ❌    |
| `useGtag`                 | `app/composables/useGtag.ts`                     | 188   | 1    | ✅    |
| `useHorizontalScroll`     | `app/composables/catalog/useHorizontalScroll.ts` | 84    | 0    | ✅    |
| `useHreflang`             | `app/composables/useHreflang.ts`                 | 40    | 1    | ✅    |
| `useImageUrl`             | `app/composables/useImageUrl.ts`                 | 73    | 0    | ✅    |
| `useInfraMetrics`         | `app/composables/useInfraMetrics.ts`             | 215   | 0    | ✅    |
| `useInfraRecommendations` | `app/composables/useInfraRecommendations.ts`     | 226   | 0    | ✅    |
| `useInjectConfig`         | `app/composables/useInject.ts`                   | 74    | 0    | ❌    |
| `useInjectOrDefault`      | `app/composables/useInject.ts`                   | 74    | 0    | ❌    |
| `useInjectRoute`          | `app/composables/useInject.ts`                   | 74    | 0    | ❌    |
| `useInjectRouter`         | `app/composables/useInject.ts`                   | 74    | 0    | ❌    |
| `useInjectSupabase`       | `app/composables/useInject.ts`                   | 74    | 0    | ❌    |
| `useInjectUser`           | `app/composables/useInject.ts`                   | 74    | 0    | ❌    |
| `useInvoicing`            | `app/composables/useInvoicing.ts`                | 75    | 0    | ✅    |
| `useJsonLd`               | `app/composables/useStructuredData.ts`           | 149   | 2    | ❌    |
| `useListingLifecycle`     | `app/composables/useListingLifecycle.ts`         | 297   | 0    | ✅    |
| `useListingQuality`       | `app/composables/useListingQuality.ts`           | 159   | 0    | ✅    |
| `useListingRenewal`       | `app/composables/useListingRenewal.ts`           | 142   | 1    | ✅    |
| `useLocalStorageCache`    | `app/composables/useLocalStorageCache.ts`        | 76    | 0    | ❌    |
| `useNegotiation`          | `app/composables/useNegotiation.ts`              | 184   | 0    | ❌    |
| `useNews`                 | `app/composables/useNews.ts`                     | 145   | 0    | ✅    |
| `useOfflineSync`          | `app/composables/useOfflineSync.ts`              | 173   | 0    | ✅    |
| `useOnboarding`           | `app/composables/useOnboarding.ts`               | 266   | 0    | ✅    |
| `useOnboardingTour`       | `app/composables/useOnboardingTour.ts`           | 128   | 0    | ✅    |
| `useOperationTimeline`    | `app/composables/useOperationTimeline.ts`        | 141   | 0    | ❌    |
| `usePageSeo`              | `app/composables/usePageSeo.ts`                  | 74    | 1    | ✅    |
| `usePerfilAlertas`        | `app/composables/usePerfilAlertas.ts`            | 152   | 1    | ✅    |
| `usePerfilComparador`     | `app/composables/usePerfilComparador.ts`         | 227   | 1    | ✅    |
| `usePerfilMensajes`       | `app/composables/usePerfilMensajes.ts`           | 253   | 2    | ✅    |
| `usePerfilReservas`       | `app/composables/usePerfilReservas.ts`           | 145   | 1    | ✅    |
| `usePrebid`               | `app/composables/usePrebid.ts`                   | 256   | 0    | ✅    |
| `usePrecios`              | `app/composables/usePrecios.ts`                  | 291   | 0    | ✅    |
| `usePresence`             | `app/composables/usePresence.ts`                 | 88    | 0    | ✅    |
| `usePricingSuggestion`    | `app/composables/usePricingSuggestion.ts`        | 90    | 0    | ✅    |
| `usePushNotifications`    | `app/composables/usePushNotifications.ts`        | 232   | 0    | ✅    |
| `useQueryBudget`          | `app/composables/useQueryBudget.ts`              | 76    | 0    | ✅    |
| `useQueryCostEstimation`  | `app/composables/useQueryCostEstimation.ts`      | 107   | 0    | ✅    |
| `useReferral`             | `app/composables/useReferral.ts`                 | 181   | 0    | ✅    |
| `useReports`              | `app/composables/useReports.ts`                  | 56    | 0    | ✅    |
| `useReservation`          | `app/composables/useReservation.ts`              | 397   | 2    | ✅    |
| `useRetryOperation`       | `app/composables/useRetryOperation.ts`           | 172   | 0    | ✅    |
| `useRevenueMetrics`       | `app/composables/useRevenueMetrics.ts`           | 172   | 0    | ✅    |
| `useSanitize`             | `app/composables/useSanitize.ts`                 | 25    | 0    | ✅    |
| `useSavedFilters`         | `app/composables/catalog/useSavedFilters.ts`     | 109   | 0    | ✅    |
| `useScrollDepth`          | `app/composables/useScrollDepth.ts`              | 52    | 1    | ❌    |
| `useScrollLock`           | `app/composables/useScrollLock.ts`               | 19    | 0    | ❌    |
| `useSearchAutocomplete`   | `app/composables/useSearchAutocomplete.ts`       | 102   | 0    | ✅    |
| `useSearchHistory`        | `app/composables/useSearchHistory.ts`            | 55    | 0    | ❌    |
| `useSellerProfile`        | `app/composables/useSellerProfile.ts`            | 265   | 0    | ✅    |
| `useSessionTimeout`       | `app/composables/useSessionTimeout.ts`           | 146   | 0    | ✅    |
| `useSimilarSearches`      | `app/composables/catalog/useSimilarSearches.ts`  | 262   | 3    | ✅    |
| `useSiteName`             | `app/composables/useSiteName.ts`                 | 14    | 0    | ❌    |
| `useSiteUrl`              | `app/composables/useSiteUrl.ts`                  | 14    | 0    | ❌    |
| `useSocialPublisher`      | `app/composables/useSocialPublisher.ts`          | 604   | 1    | ✅    |
| `useSubastasIndex`        | `app/composables/useSubastasIndex.ts`            | 200   | 3    | ✅    |
| `useSubscriptionPlan`     | `app/composables/useSubscriptionPlan.ts`         | 296   | 0    | ✅    |
| `useSwrQuery`             | `app/composables/useSwrQuery.ts`                 | 111   | 0    | ❌    |
| `useTableOfContents`      | `app/composables/useTableOfContents.ts`          | 91    | 0    | ✅    |
| `useToast`                | `app/composables/useToast.ts`                    | 113   | 0    | ✅    |
| `useTransactionHistory`   | `app/composables/useTransactionHistory.ts`       | 95    | 0    | ❌    |
| `useTransport`            | `app/composables/useTransport.ts`                | 229   | 0    | ✅    |
| `useUndoAction`           | `app/composables/useUndoAction.ts`               | 148   | 0    | ✅    |
| `useUnreadMessages`       | `app/composables/useUnreadMessages.ts`           | 105   | 0    | ✅    |
| `useUnsavedChanges`       | `app/composables/useUnsavedChanges.ts`           | 35    | 0    | ✅    |
| `useUserChat`             | `app/composables/useUserChat.ts`                 | 214   | 0    | ✅    |
| `useUserLocation`         | `app/composables/useUserLocation.ts`             | 338   | 0    | ✅    |
| `useUserPanel`            | `app/composables/user/useUserPanel.ts`           | 460   | 3    | ✅    |
| `useUserProfile`          | `app/composables/useUserProfile.ts`              | 193   | 0    | ✅    |
| `useValoracion`           | `app/composables/useValoracion.ts`               | 291   | 0    | ✅    |
| `useVendedorDetail`       | `app/composables/useVendedorDetail.ts`           | 292   | 2    | ✅    |
| `useViewHistory`          | `app/composables/useViewHistory.ts`              | 123   | 0    | ✅    |
| `useVirtualList`          | `app/composables/useVirtualList.ts`              | 126   | 0    | ✅    |
| `useVoiceSearch`          | `app/composables/useVoiceSearch.ts`              | 118   | 0    | ✅    |

### dashboard

| Composable                    | File                                                       | Lines | Deps | Tests |
| ----------------------------- | ---------------------------------------------------------- | ----- | ---- | ----- |
| `useBuyerDashboard`           | `app/composables/useBuyerDashboard.ts`                     | 373   | 1    | ✅    |
| `useDashboardAlquileres`      | `app/composables/dashboard/useDashboardAlquileres.ts`      | 461   | 3    | ✅    |
| `useDashboardCalculadora`     | `app/composables/dashboard/useDashboardCalculadora.ts`     | 458   | 1    | ✅    |
| `useDashboardContrato`        | `app/composables/dashboard/useDashboardContrato.ts`        | 624   | 5    | ✅    |
| `useDashboardContratoHistory` | `app/composables/dashboard/useDashboardContratoHistory.ts` | 94    | 0    | ❌    |
| `useDashboardCrm`             | `app/composables/dashboard/useDashboardCrm.ts`             | 337   | 0    | ✅    |
| `useDashboardExportar`        | `app/composables/dashboard/useDashboardExportar.ts`        | 596   | 5    | ✅    |
| `useDashboardExportarAnuncio` | `app/composables/dashboard/useDashboardExportarAnuncio.ts` | 321   | 4    | ✅    |
| `useDashboardFactura`         | `app/composables/dashboard/useDashboardFactura.ts`         | 234   | 1    | ✅    |
| `useDashboardHistorico`       | `app/composables/dashboard/useDashboardHistorico.ts`       | 479   | 1    | ✅    |
| `useDashboardImportar`        | `app/composables/dashboard/useDashboardImportar.ts`        | 386   | 3    | ✅    |
| `useDashboardIndex`           | `app/composables/dashboard/useDashboardIndex.ts`           | 164   | 4    | ✅    |
| `useDashboardMantenimientos`  | `app/composables/dashboard/useDashboardMantenimientos.ts`  | 472   | 3    | ✅    |
| `useDashboardMercado`         | `app/composables/dashboard/useDashboardMercado.ts`         | 123   | 1    | ✅    |
| `useDashboardMerchandising`   | `app/composables/dashboard/useDashboardMerchandising.ts`   | 183   | 1    | ✅    |
| `useDashboardNuevoVehiculo`   | `app/composables/dashboard/useDashboardNuevoVehiculo.ts`   | 232   | 3    | ✅    |
| `useDashboardObservatorio`    | `app/composables/dashboard/useDashboardObservatorio.ts`    | 483   | 3    | ✅    |
| `useDashboardPipeline`        | `app/composables/dashboard/useDashboardPipeline.ts`        | 455   | 2    | ✅    |
| `useDashboardPresupuesto`     | `app/composables/dashboard/useDashboardPresupuesto.ts`     | 481   | 1    | ✅    |
| `useDashboardTransaccion`     | `app/composables/dashboard/useDashboardTransaccion.ts`     | 339   | 2    | ✅    |
| `useDashboardVehiculoDetail`  | `app/composables/dashboard/useDashboardVehiculoDetail.ts`  | 383   | 5    | ✅    |
| `useDashboardVisitas`         | `app/composables/dashboard/useDashboardVisitas.ts`         | 328   | 1    | ✅    |
| `useDashboardWidget`          | `app/composables/dashboard/useDashboardWidget.ts`          | 129   | 4    | ✅    |
| `useDealerDashboard`          | `app/composables/useDealerDashboard.ts`                    | 176   | 1    | ✅    |
| `useDealerHealthScore`        | `app/composables/useDealerHealthScore.ts`                  | 254   | 0    | ✅    |
| `useDealerLeads`              | `app/composables/useDealerLeads.ts`                        | 384   | 0    | ✅    |
| `useDealerPortal`             | `app/composables/dashboard/useDealerPortal.ts`             | 423   | 0    | ✅    |
| `useDealerReviews`            | `app/composables/useDealerReviews.ts`                      | 122   | 0    | ✅    |
| `useDealerStats`              | `app/composables/useDealerStats.ts`                        | 226   | 0    | ✅    |
| `useDealerTheme`              | `app/composables/useDealerTheme.ts`                        | 48    | 1    | ✅    |
| `useDealerTrustScore`         | `app/composables/useDealerTrustScore.ts`                   | 117   | 0    | ✅    |
| `useInvoice`                  | `app/composables/dashboard/useInvoice.ts`                  | 414   | 5    | ✅    |
| `useInvoiceData`              | `app/composables/dashboard/useInvoiceData.ts`              | 212   | 0    | ❌    |
| `useTopDealers`               | `app/composables/useTopDealers.ts`                         | 94    | 0    | ✅    |

### market

| Composable                 | File                                          | Lines | Deps | Tests |
| -------------------------- | --------------------------------------------- | ----- | ---- | ----- |
| `useMarketData`            | `app/composables/useMarketData.ts`            | 296   | 0    | ✅    |
| `useMarketIntelligence`    | `app/composables/useMarketIntelligence.ts`    | 90    | 0    | ✅    |
| `usePriceHistory`          | `app/composables/usePriceHistory.ts`          | 231   | 0    | ✅    |
| `usePriceRelativeToMarket` | `app/composables/usePriceRelativeToMarket.ts` | 120   | 0    | ✅    |

### multi-vertical

| Composable          | File                                   | Lines | Deps | Tests |
| ------------------- | -------------------------------------- | ----- | ---- | ----- |
| `useVerticalConfig` | `app/composables/useVerticalConfig.ts` | 146   | 0    | ✅    |

### shared

| Composable            | File                                         | Lines | Deps | Tests |
| --------------------- | -------------------------------------------- | ----- | ---- | ----- |
| `useCursorPagination` | `app/composables/shared/cursorPagination.ts` | 119   | 0    | ✅    |
| `useHydratedState`    | `app/composables/shared/useHydratedState.ts` | 78    | 0    | ✅    |
| `useQueryDedup`       | `app/composables/shared/useQueryDedup.ts`    | 94    | 0    | ✅    |
| `useStaleFallback`    | `app/composables/shared/useStaleFallback.ts` | 105   | 0    | ❌    |

### vehicles

| Composable               | File                                           | Lines | Deps | Tests |
| ------------------------ | ---------------------------------------------- | ----- | ---- | ----- |
| `useCatalogState`        | `app/composables/useCatalogState.ts`           | 201   | 0    | ✅    |
| `useHiddenVehicles`      | `app/composables/catalog/useHiddenVehicles.ts` | 150   | 0    | ✅    |
| `useVehicleComparator`   | `app/composables/useVehicleComparator.ts`      | 619   | 1    | ✅    |
| `useVehicleDetail`       | `app/composables/useVehicleDetail.ts`          | 319   | 6    | ✅    |
| `useVehicleGroups`       | `app/composables/useVehicleGroups.ts`          | 212   | 0    | ✅    |
| `useVehicles`            | `app/composables/useVehicles.ts`               | 186   | 0    | ✅    |
| `useVehicleTable`        | `app/composables/catalog/useVehicleTable.ts`   | 305   | 2    | ✅    |
| `useVehicleTypeSelector` | `app/composables/useVehicleTypeSelector.ts`    | 257   | 0    | ✅    |
| `useVehicleUnlock`       | `app/composables/useVehicleUnlock.ts`          | 77    | 0    | ❌    |
| `useVehicleVerification` | `app/composables/useVehicleVerification.ts`    | 430   | 0    | ✅    |

## Large Composables (>300 lines)

| Composable                    | Lines | File                                                       |
| ----------------------------- | ----- | ---------------------------------------------------------- |
| `useAdminBalanceUI`           | 727   | `app/composables/admin/useAdminBalanceUI.ts`               |
| `useSeoScore`                 | 713   | `app/composables/admin/useSeoScore.ts`                     |
| `useDashboardContrato`        | 624   | `app/composables/dashboard/useDashboardContrato.ts`        |
| `useVehicleComparator`        | 619   | `app/composables/useVehicleComparator.ts`                  |
| `useSocialPublisher`          | 604   | `app/composables/useSocialPublisher.ts`                    |
| `useDashboardExportar`        | 596   | `app/composables/dashboard/useDashboardExportar.ts`        |
| `useAdminPublicidad`          | 580   | `app/composables/admin/useAdminPublicidad.ts`              |
| `useAdminVehicleDetail`       | 566   | `app/composables/admin/useAdminVehicleDetail.ts`           |
| `useAdminAuctionList`         | 561   | `app/composables/admin/useAdminAuctionList.ts`             |
| `useAdminCaptacion`           | 543   | `app/composables/admin/useAdminCaptacion.ts`               |
| `useAdminDealerSuscripciones` | 516   | `app/composables/admin/useAdminDealerSuscripciones.ts`     |
| `useConversation`             | 505   | `app/composables/useConversation.ts`                       |
| `useAdminVehicles`            | 495   | `app/composables/admin/useAdminVehicles.ts`                |
| `useDashboardObservatorio`    | 483   | `app/composables/dashboard/useDashboardObservatorio.ts`    |
| `useDashboardPresupuesto`     | 481   | `app/composables/dashboard/useDashboardPresupuesto.ts`     |
| `useAdminProductosPage`       | 480   | `app/composables/admin/useAdminProductosPage.ts`           |
| `useDashboardHistorico`       | 479   | `app/composables/dashboard/useDashboardHistorico.ts`       |
| `useDashboardMantenimientos`  | 472   | `app/composables/dashboard/useDashboardMantenimientos.ts`  |
| `useAdminProductForm`         | 462   | `app/composables/admin/useAdminProductForm.ts`             |
| `useDashboardAlquileres`      | 461   | `app/composables/dashboard/useDashboardAlquileres.ts`      |
| `useUserPanel`                | 460   | `app/composables/user/useUserPanel.ts`                     |
| `useDashboardCalculadora`     | 458   | `app/composables/dashboard/useDashboardCalculadora.ts`     |
| `useDashboardPipeline`        | 455   | `app/composables/dashboard/useDashboardPipeline.ts`        |
| `useContractGenerator`        | 454   | `app/composables/admin/useContractGenerator.ts`            |
| `useVehicleVerification`      | 430   | `app/composables/useVehicleVerification.ts`                |
| `useAdminChat`                | 429   | `app/composables/admin/useAdminChat.ts`                    |
| `useAdminBanner`              | 423   | `app/composables/admin/useAdminBanner.ts`                  |
| `useDealerPortal`             | 423   | `app/composables/dashboard/useDealerPortal.ts`             |
| `useAdminAuctionDetail`       | 421   | `app/composables/admin/useAdminAuctionDetail.ts`           |
| `useAdminProductoDetail`      | 421   | `app/composables/admin/useAdminProductoDetail.ts`          |
| `useAdminDashboard`           | 419   | `app/composables/admin/useAdminDashboard.ts`               |
| `useAnalyticsTracking`        | 418   | `app/composables/useAnalyticsTracking.ts`                  |
| `useInvoice`                  | 414   | `app/composables/dashboard/useInvoice.ts`                  |
| `useGoogleDrive`              | 410   | `app/composables/admin/useGoogleDrive.ts`                  |
| `useAdminHistoricoPage`       | 404   | `app/composables/admin/useAdminHistoricoPage.ts`           |
| `useAdminBalance`             | 397   | `app/composables/admin/useAdminBalance.ts`                 |
| `useReservation`              | 397   | `app/composables/useReservation.ts`                        |
| `useAdminDealerConfig`        | 393   | `app/composables/admin/useAdminDealerConfig.ts`            |
| `useAdminHistorico`           | 391   | `app/composables/admin/useAdminHistorico.ts`               |
| `useAdminCaracteristicas`     | 387   | `app/composables/admin/useAdminCaracteristicas.ts`         |
| `useDashboardImportar`        | 386   | `app/composables/dashboard/useDashboardImportar.ts`        |
| `useAdminAdDashboard`         | 385   | `app/composables/admin/useAdminAdDashboard.ts`             |
| `useDealerLeads`              | 384   | `app/composables/useDealerLeads.ts`                        |
| `useDashboardVehiculoDetail`  | 383   | `app/composables/dashboard/useDashboardVehiculoDetail.ts`  |
| `useAdminVerificaciones`      | 377   | `app/composables/admin/useAdminVerificaciones.ts`          |
| `useAdminSubcategories`       | 376   | `app/composables/admin/useAdminSubcategories.ts`           |
| `useInvoiceGenerator`         | 376   | `app/composables/admin/useInvoiceGenerator.ts`             |
| `useBuyerDashboard`           | 373   | `app/composables/useBuyerDashboard.ts`                     |
| `useAdminNewsForm`            | 369   | `app/composables/admin/useAdminNewsForm.ts`                |
| `useAdminNoticiaForm`         | 361   | `app/composables/admin/useAdminNoticiaForm.ts`             |
| `useAdminTiposPage`           | 360   | `app/composables/admin/useAdminTiposPage.ts`               |
| `useAdminWhatsApp`            | 360   | `app/composables/admin/useAdminWhatsApp.ts`                |
| `useAdminFilters`             | 359   | `app/composables/admin/useAdminFilters.ts`                 |
| `useAdminMetricsActivity`     | 355   | `app/composables/admin/useAdminMetricsActivity.ts`         |
| `useAdminBrokerage`           | 350   | `app/composables/admin/useAdminBrokerage.ts`               |
| `useAuth`                     | 350   | `app/composables/useAuth.ts`                               |
| `useAdminSocialCalendar`      | 348   | `app/composables/admin/useAdminSocialCalendar.ts`          |
| `useAdminDashboardPage`       | 346   | `app/composables/admin/useAdminDashboardPage.ts`           |
| `useAdminBrokerageDeal`       | 344   | `app/composables/admin/useAdminBrokerageDeal.ts`           |
| `useAdvertiseModal`           | 342   | `app/composables/modals/useAdvertiseModal.ts`              |
| `useDashboardTransaccion`     | 339   | `app/composables/dashboard/useDashboardTransaccion.ts`     |
| `useUserLocation`             | 338   | `app/composables/useUserLocation.ts`                       |
| `useDashboardCrm`             | 337   | `app/composables/dashboard/useDashboardCrm.ts`             |
| `useAdminInfrastructura`      | 335   | `app/composables/admin/useAdminInfrastructura.ts`          |
| `useDatos`                    | 334   | `app/composables/useDatos.ts`                              |
| `useAuction`                  | 333   | `app/composables/useAuction.ts`                            |
| `useDashboardVisitas`         | 328   | `app/composables/dashboard/useDashboardVisitas.ts`         |
| `useAdminEmails`              | 326   | `app/composables/admin/useAdminEmails.ts`                  |
| `useDashboardExportarAnuncio` | 321   | `app/composables/dashboard/useDashboardExportarAnuncio.ts` |
| `useVehicleDetail`            | 319   | `app/composables/useVehicleDetail.ts`                      |
| `useSocialAdminUI`            | 306   | `app/composables/admin/useSocialAdminUI.ts`                |
| `useVehicleTable`             | 305   | `app/composables/catalog/useVehicleTable.ts`               |

## Untested Composables

| Composable                    | Domain    | Lines |
| ----------------------------- | --------- | ----- |
| `useAdminArticleGenerate`     | admin     | 60    |
| `useAdminEditorialCalendar`   | admin     | 192   |
| `useAdminFeatureFlags`        | admin     | 194   |
| `useAdminProductRecords`      | admin     | 64    |
| `useAdminSearchAnalytics`     | admin     | 123   |
| `useAdminSocialCalendar`      | admin     | 348   |
| `useFunnelAnalysis`           | admin     | 113   |
| `useGoogleDriveFolders`       | admin     | 97    |
| `useAdaptiveLoading`          | core      | 64    |
| `useCacheAside`               | core      | 144   |
| `useCacheCategories`          | core      | 144   |
| `useCacheVehicleCounts`       | core      | 144   |
| `useCacheVerticalConfig`      | core      | 144   |
| `useFeatureFlag`              | core      | 80    |
| `useFocusTrap`                | core      | 96    |
| `useGlossary`                 | core      | 115   |
| `useInjectConfig`             | core      | 74    |
| `useInjectOrDefault`          | core      | 74    |
| `useInjectRoute`              | core      | 74    |
| `useInjectRouter`             | core      | 74    |
| `useInjectSupabase`           | core      | 74    |
| `useInjectUser`               | core      | 74    |
| `useJsonLd`                   | core      | 149   |
| `useLocalStorageCache`        | core      | 76    |
| `useNegotiation`              | core      | 184   |
| `useOperationTimeline`        | core      | 141   |
| `useScrollDepth`              | core      | 52    |
| `useScrollLock`               | core      | 19    |
| `useSearchHistory`            | core      | 55    |
| `useSiteName`                 | core      | 14    |
| `useSiteUrl`                  | core      | 14    |
| `useSwrQuery`                 | core      | 111   |
| `useTransactionHistory`       | core      | 95    |
| `useDashboardContratoHistory` | dashboard | 94    |
| `useInvoiceData`              | dashboard | 212   |
| `useStaleFallback`            | shared    | 105   |
| `useVehicleUnlock`            | vehicles  | 77    |
