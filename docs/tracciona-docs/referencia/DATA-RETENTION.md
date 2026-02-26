# Data Retention Policy

> Defines how long data is kept and when it's archived or deleted.

## Retention Periods

| Data Type                       | Active                                            | Archive          | Delete              | Legal Basis           |
| ------------------------------- | ------------------------------------------------- | ---------------- | ------------------- | --------------------- |
| Vehicle listings (active)       | Indefinite                                        | —                | —                   | Legitimate interest   |
| Vehicle listings (sold/removed) | 6 months visible                                  | 2 years archived | After 2 years       | Historical price data |
| User accounts                   | Indefinite                                        | —                | On request          | Consent               |
| User activity logs              | 6 months                                          | 2 years          | After 2 years       | Legitimate interest   |
| Session data                    | 30 days                                           | —                | After 30 days       | Technical necessity   |
| Search alerts                   | Indefinite                                        | —                | On account deletion | Consent               |
| Favorites                       | Indefinite                                        | —                | On account deletion | Consent               |
| Auction bids                    | 1 year                                            | 5 years          | After 5 years       | Legal requirement     |
| Invoices                        | 5 years                                           | 10 years         | After 10 years      | Tax law (Spain)       |
| GDPR requests                   | Processing + 30 days                              | 3 years          | After 3 years       | Legal requirement     |
| WhatsApp submissions            | 6 months                                          | 1 year           | After 1 year        | Legitimate interest   |
| Ad impressions/clicks           | 90 days                                           | 1 year           | After 1 year        | Legitimate interest   |
| CRM contacts                    | Indefinite                                        | —                | On dealer deletion  | Legitimate interest   |
| Error logs                      | 30 days                                           | —                | After 30 days       | Technical necessity   |
| Backup files                    | Daily: 7 days, Weekly: 4 weeks, Monthly: 6 months | —                | Per schedule        | Disaster recovery     |

## GDPR Compliance

### Right to Erasure (Article 17)

When a user requests account deletion:

1. **Immediate** (within 30 days):
   - Anonymize user profile (replace PII with hashed values)
   - Remove email, phone, name from `users` table
   - Anonymize `dealer_leads` entries
   - Remove `search_alerts` and `favorites`

2. **Retained** (legal obligation):
   - Invoice records (anonymized, 10 years)
   - Auction bid records (anonymized, 5 years)
   - GDPR request log (3 years)

3. **Vehicle listings**: Transfer ownership to "anonymous dealer" or mark as orphaned

### Data Portability (Article 20)

The `/api/account/export` endpoint generates a JSON/CSV export of:

- User profile data
- Favorites list
- Search alerts
- Vehicle listings (if dealer)
- Activity log (last 6 months)

## Archival Process

### Phase 1: Soft Archive (current)

- Set `status = 'archived'` on old records
- Exclude from queries with `status != 'archived'` filters
- Data remains in same database

### Phase 2: Cold Storage (future)

- Move archived records to a separate schema or database
- Compress and store in Backblaze B2
- Maintain index for retrieval if needed

## Implementation Status

- [x] Account deletion endpoint (`/api/account/delete`)
- [x] Data export endpoint (`/api/account/export`)
- [x] GDPR request tracking (`gdpr_requests` table)
- [x] Backup retention (daily/weekly/monthly via `backup-multi-tier.sh`)
- [ ] Automated archival cron job (planned)
- [ ] Cold storage migration (Phase 2)
