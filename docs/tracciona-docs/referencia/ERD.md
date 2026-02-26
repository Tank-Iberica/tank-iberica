# Entity Relationship Diagram

> Generated from migrations 00001-00063. Simplified view showing key entities and relationships.

```mermaid
erDiagram
    users ||--o{ dealers : "owns"
    users ||--o{ favorites : "has"
    users ||--o{ search_alerts : "creates"
    users ||--o{ reservations : "makes"
    users ||--o{ auction_bids : "places"
    users ||--o{ user_activity_log : "generates"
    users ||--o{ gdpr_requests : "submits"

    dealers ||--o{ vehicles : "publishes"
    dealers ||--o{ subscriptions : "has"
    dealers ||--o{ dealer_leads : "receives"
    dealers ||--o{ dealer_api_keys : "manages"
    dealers ||--o{ whatsapp_submissions : "sends"
    dealers ||--o{ crm_contacts : "tracks"
    dealers ||--o{ crm_interactions : "logs"

    vehicles ||--o{ vehicle_images : "has"
    vehicles ||--o{ vehicle_views : "tracks"
    vehicles ||--o{ favorites : "receives"
    vehicles ||--o{ reservations : "has"
    vehicles ||--o{ auction_bids : "receives"
    vehicles ||--o{ verification_documents : "requires"

    categories ||--o{ subcategories : "contains"
    categories ||--o{ vehicles : "classifies"

    articles ||--o{ content_translations : "has"

    subscriptions ||--o{ invoices : "generates"

    auctions ||--o{ auction_bids : "receives"
    auctions }o--|| vehicles : "sells"

    advertisements ||--o{ ad_impressions : "tracks"
    advertisements ||--o{ ad_clicks : "tracks"

    vertical_config ||--o{ categories : "defines"
    vertical_config ||--o{ dealers : "scopes"
    vertical_config ||--o{ vehicles : "scopes"
    vertical_config ||--o{ articles : "scopes"
```

## Key Tables

| Table                    | RLS | Vertical | Description                    |
| ------------------------ | --- | -------- | ------------------------------ |
| `users`                  | Yes | No       | Auth users (Supabase Auth)     |
| `dealers`                | Yes | Yes      | Business accounts              |
| `vehicles`               | Yes | Yes      | Vehicle listings               |
| `vehicle_images`         | Yes | No       | Images per vehicle             |
| `categories`             | Yes | Yes      | Dynamic categories             |
| `subcategories`          | Yes | Yes      | Nested under categories        |
| `articles`               | Yes | Yes      | Blog posts and guides          |
| `content_translations`   | Yes | No       | Long-form translations (JSONB) |
| `favorites`              | Yes | No       | User favorites                 |
| `search_alerts`          | Yes | No       | Saved search alerts            |
| `reservations`           | Yes | No       | Vehicle reservations           |
| `auctions`               | Yes | No       | Auction listings               |
| `auction_bids`           | Yes | No       | Bids on auctions               |
| `subscriptions`          | Yes | No       | Dealer subscriptions (Stripe)  |
| `invoices`               | Yes | No       | Billing invoices               |
| `advertisements`         | Yes | Yes      | Ad placements                  |
| `ad_impressions`         | No  | No       | Ad impression tracking         |
| `ad_clicks`              | No  | No       | Ad click tracking              |
| `dealer_leads`           | Yes | No       | Lead capture                   |
| `dealer_api_keys`        | Yes | No       | External API access            |
| `whatsapp_submissions`   | Yes | No       | WhatsApp vehicle submissions   |
| `verification_documents` | Yes | No       | Document verification          |
| `crm_contacts`           | Yes | No       | Dealer CRM contacts            |
| `crm_interactions`       | Yes | No       | CRM interaction log            |
| `vertical_config`        | Yes | No       | Multi-vertical settings        |
| `static_pages`           | Yes | No       | CMS static pages               |
| `gdpr_requests`          | Yes | No       | GDPR data requests             |
| `infra_alerts`           | No  | No       | Infrastructure alerts          |
| `infra_clusters`         | No  | No       | Alert clustering               |
| `user_activity_log`      | Yes | No       | User activity tracking         |

## Migrations

63 migrations (00001-00063) covering:

- Schema creation and evolution
- RLS policies for all tables
- Composite indexes for vertical isolation (migration 62-63)
- Full-text search indexes
- Trigger functions for updated_at, slug generation, etc.
