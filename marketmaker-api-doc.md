# MarketMaker V2 REST API Documentation

> **Purpose:** Feed this document to Claude to generate a web UI for CRUD operations on all MarketMaker configuration entities.

---

## Overview

This API manages FX market-maker configuration across six domains. All endpoints are under `/marketMaker/` and require authentication with role `MARKETMAKER` or `SYSADMINMakerChecker` and permission `PRICEMAKING_UPDATE` or `PRICEMAKING_VIEW`.

### Resource Hierarchy

```
BrokerConfiguration (/{brokerOrg})
  ├── currencyPairs (set of strings, e.g. "EURUSD")
  ├── PricingConfiguration (per brokerOrg + ccyPair)
  ├── ProviderConfiguration (per brokerOrg + ccyPair)
  │     └── Providers (per providerOrg)
  ├── StreamPricingConfiguration (per brokerOrg + ccyPair)
  │     └── Streams (per streamName)
  │           └── Tiers (per limit)
  ├── TierPricingConfiguration (per brokerOrg + ccyPair)
  │     └── Tiers (per tierAmount)
  └── ForwardPointsConfiguration (per brokerOrg + ccyPair)
        └── Tenors (per tenorName)
```

### Currency Pair Convention

Currency pairs are always passed in the URL as two separate path variables `{baseCcy}` and `{termCcy}` (e.g., `/EUR/USD`), and are concatenated internally as `EURUSD`.

---

## Common Schemas

### ErrorResponse
```json
{
  "errors": [
    { "code": "string", "message": "string" }
  ]
}
```

### Standard HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200  | OK (GET / PUT success) |
| 201  | Created (POST success) |
| 204  | No Content (DELETE success) |
| 400  | Validation error / invalid payload |
| 404  | Resource not found |
| 409  | Duplicate entity (already exists) |
| 500  | Internal server error |

### Patch Operation Schema
Used by all `PUT /{...}/patch` endpoints. Body is an **array** of patch operations:

```json
[
  {
    "operation": "replace | add | remove",
    "path": "fieldName",
    "value": <any>
  }
]
```

**Path syntax for nested collection items:**
`fieldName|keyField=keyValue|targetField`
Example: `"providers|name=LP1|status"` — navigates to the provider named LP1 and targets its `status` field.

**Fields marked `@Unpatchable` cannot appear in patch paths.**
**Fields marked `@PartiallyPatchable` list which operations are allowed** (add/remove/replace).

---

## 1. Broker Configuration

**Base path:** `/marketMaker/broker-configurations`

### Schema: `BrokerConfigurationMetaData`
```json
{
  "organization": "string",          // path key; @Unpatchable
  "currencyPairs": ["EURUSD", ...],  // Set<string>; patchable: add, remove, replace
  "pricingEnabled": true             // boolean
}
```

### Endpoints

#### Create Broker Configuration
```
POST /marketMaker/broker-configurations/{brokerOrg}
```
- **Path:** `brokerOrg` — broker organization short name
- **Body:** `BrokerConfigurationMetaData`
- **Success:** `201` with created `BrokerConfigurationMetaData`
- **Errors:** `409` if already exists, `400` if validation fails

#### Get Broker Configuration
```
GET /marketMaker/broker-configurations/{brokerOrg}
```
- **Success:** `200` with `BrokerConfigurationMetaData`
- **Errors:** `404` if not found

#### Update Broker Configuration (full replace)
```
PUT /marketMaker/broker-configurations/{brokerOrg}
```
- **Body:** `BrokerConfigurationMetaData`
- **Success:** `200` with updated `BrokerConfigurationMetaData`
- **Errors:** `404` if not found or inactive, `400` if validation fails

#### Delete Broker Configuration
```
DELETE /marketMaker/broker-configurations/{brokerOrg}
```
- **Success:** `204` No Content
- **Errors:** `404` if not found

#### Partial Update Broker Configuration (patch)
```
PUT /marketMaker/broker-configurations/{brokerOrg}/patch
```
- **Body:** `PatchOperationDTO[]`
- **Patchable fields:** `currencyPairs` (add/remove/replace)
- **Success:** `200` with updated `BrokerConfigurationMetaData`
- **Errors:** `404` if not found or inactive, `400` on validation/patch error

#### Add a Currency Pair to Broker
```
POST /marketMaker/broker-configurations/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}
```
- **Path:** `baseCcy` + `termCcy` → concatenated to e.g. `EURUSD`
- **Success:** `201` with updated `BrokerConfigurationMetaData`
- **Errors:** `409` if currency pair already exists, `404` if broker not found

#### Delete a Specific Currency Pair from Broker
```
DELETE /marketMaker/broker-configurations/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}
```
- **Success:** `204` No Content
- **Errors:** `404` if broker or currency pair not found

#### Delete All Currency Pairs from Broker
```
DELETE /marketMaker/broker-configurations/{brokerOrg}/currencyPairs
```
- **Success:** `204` No Content
- **Errors:** `404` if broker not found

---

## 2. Core Pricing Configuration

**Base path:** `/marketMaker/pricing`

### Enums

| Enum | Values |
|------|--------|
| `Mode` | `MANUAL`, `AUTO` |
| `AggregationStrategy` | `BestPriceMidRate`, `WeightedAverage` |
| `ExecutionStrategy` | `NoCover`, `Cover` |

### Schema: `CorePricingConfigurationMetaData`
```json
{
  "organization": "string",                       // @Unpatchable
  "currencyPair": "string",                       // @Unpatchable; e.g. "EURUSD"
  "pricingMode": "AUTO | MANUAL",                 // default: AUTO; patchable: replace
  "midRate": 1.1234,                              // double
  "bidOfferSpread": 0.0002,                       // double
  "asymmetricSkew": false,                        // boolean
  "skew": 0.0,                                    // double
  "skewMode": "AUTO | MANUAL",                    // default: AUTO; patchable: replace
  "bidSkew": 0.0,                                 // double
  "offerSkew": 0.0,                               // double
  "pricingEnabled": true,                         // boolean; default: true
  "aggregationStrategy": "BestPriceMidRate | WeightedAverage", // default: BestPriceMidRate; patchable: replace
  "aggregationMode": "MANUAL | AUTO",             // default: MANUAL; patchable: replace
  "executionMode": "NoCover | Cover"              // default: NoCover; patchable: replace
}
```

### Endpoints

#### Create Pricing Configuration
```
POST /marketMaker/pricing/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}
```
- **Body:** `CorePricingConfigurationMetaData`
- **Success:** `200` with created configuration
- **Errors:** `409` if exists, `400` on validation failure

#### Get Pricing Configuration
```
GET /marketMaker/pricing/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}
```
- **Success:** `200` with `CorePricingConfigurationMetaData`
- **Errors:** `404` if not found

#### Get All Pricing Configurations for a Broker
```
GET /marketMaker/pricing/{brokerOrg}
```
- **Success:** `200` with `CorePricingConfigurationMetaData[]` (all currency pairs for that broker)
- **Errors:** `404` if broker not found

#### Update Pricing Configuration (full replace)
```
PUT /marketMaker/pricing/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}
```
- **Body:** `CorePricingConfigurationMetaData`
- **Success:** `200` with updated configuration
- **Errors:** `404` if not found, `400` on validation failure

#### Delete Pricing Configuration
```
DELETE /marketMaker/pricing/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}
```
- **Success:** `204` No Content
- **Errors:** `404` if not found

#### Partial Update Pricing Configuration (patch)
```
PUT /marketMaker/pricing/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}/patch
```
- **Body:** `PatchOperationDTO[]`
- **Patchable fields:** `pricingMode`, `skewMode`, `aggregationStrategy`, `aggregationMode`, `executionMode` (all: replace only)
- **Success:** `200` with updated configuration
- **Errors:** `404` if not found, `400` on validation/patch error

---

## 3. Provider Configuration

**Base path:** `/marketMaker/broker-configurations`
*(shares the same base path as BrokerController — no path conflicts)*

### Schema: `ProviderConfigurationMetaData`
```json
{
  "organization": "string",     // @Unpatchable
  "currencyPair": "string",     // @Unpatchable
  "providers": [                // Set<ProviderMetaData>; patchable: add, remove, replace
    {
      "name": "string",         // provider org short name; @Unpatchable
      "status": true            // boolean; true=on, false=off
    }
  ]
}
```

### Schema: `ProviderMetaData` (standalone)
```json
{
  "name": "string",
  "status": true
}
```

### Endpoints

#### Create Provider Configuration (for a currency pair)
```
POST /marketMaker/broker-configurations/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}/providers
```
- **Body:** `ProviderConfigurationMetaData`
- **Success:** `201` with created `ProviderConfigurationMetaData`
- **Errors:** `409` if already exists, `400` on validation failure

#### Add a Provider to a Provider Configuration
```
POST /marketMaker/broker-configurations/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}/providers/{providerOrg}
```
- **Body:** `ProviderMetaData` (`{ "name": "LP1", "status": true }`)
- **Success:** `201` with updated `ProviderConfigurationMetaData`
- **Errors:** `409` if provider already exists, `404` if provider config not found

#### Get All Provider Configurations for a Broker (all currency pairs)
```
GET /marketMaker/broker-configurations/{brokerOrg}/providers
```
- **Success:** `200` with `ProviderConfigurationMetaData[]`
- **Errors:** `404` if none found

#### Get Provider Configuration for a Specific Currency Pair
```
GET /marketMaker/broker-configurations/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}/providers
```
- **Success:** `200` with `ProviderConfigurationMetaData`
- **Errors:** `404` if not found

#### Get Provider Status
```
GET /marketMaker/broker-configurations/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}/providers/{providerOrg}/status
```
- **Success:** `200` with `ProviderMetaData`
- **Errors:** `404` if not found

#### Get All Provider Names Available for a Broker
```
GET /marketMaker/broker-configurations/{brokerOrg}/providers/names
```
- Returns list of LP org names that have an active FI_LP_RELATIONSHIP with the broker and are active broker/external-provider/masked organizations.
- **Success:** `200` with `string[]`

#### Update Provider Configuration (full replace)
```
PUT /marketMaker/broker-configurations/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}/providers
```
- **Body:** `ProviderConfigurationMetaData`
- **Success:** `200` with updated `ProviderConfigurationMetaData`
- **Errors:** `404` if not found, `400` on validation failure

#### Update Provider Status
```
PUT /marketMaker/broker-configurations/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}/providers/{providerOrg}/status
```
- **Body:** `ProviderMetaData` (`{ "name": "LP1", "status": false }`)
- **Success:** `200` with updated `ProviderConfigurationMetaData`
- **Errors:** `404` if provider config or provider not found

#### Delete Provider Configuration (entire config for a currency pair)
```
DELETE /marketMaker/broker-configurations/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}/providers
```
- **Success:** `204` No Content
- **Errors:** `404` if not found

#### Delete a Provider from a Provider Configuration
```
DELETE /marketMaker/broker-configurations/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}/providers/{providerOrg}
```
- **Success:** `204` No Content
- **Errors:** `404` if not found

#### Partial Update Provider Configuration (patch)
```
PUT /marketMaker/broker-configurations/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}/providers/patch
```
- **Body:** `PatchOperationDTO[]`
- **Patchable fields:** `providers` (add/remove/replace); navigate into a specific provider via path `providers|name=LP1|status`
- **Success:** `200` with updated `ProviderConfigurationMetaData`
- **Errors:** `404` if not found, `400` on validation/patch error

---

## 4. Stream Pricing Configuration

**Base path:** `/marketMaker/streamprices`

### Enums

| Enum | Values |
|------|--------|
| `SpreadType` | `PIPS` |

### Schema: `StreamPricingConfigurationMetaData`
```json
{
  "organization": "string",          // @Unpatchable
  "currencyPair": "string",          // @Unpatchable
  "streams": [                       // Set<StreamMetaData>; patchable: add, remove, replace
    {
      "name": "string",              // stream name; @Unpatchable; equality key
      "hourglassPricingSupported": false, // boolean
      "status": true,                // boolean; default: true
      "tiers": [                     // SortedSet<TierMetaData> sorted by limit; patchable: add, remove, replace
        {
          "tierId": 1,               // int; @Unpatchable
          "minSpread": 0.0,          // double
          "maxSpread": 0.0,          // double
          "bidSpread": 0.0,          // double
          "offerSpread": 0.0,        // double
          "spreadType": "PIPS",      // SpreadType enum; default: PIPS; patchable: replace
          "limit": 1000000.0         // double; @Unpatchable; equality key (sorted by this)
        }
      ]
    }
  ]
}
```

### Schema: `StreamMetaData` (used in `updateStream` endpoint)
```json
{
  "name": "string",
  "hourglassPricingSupported": false,
  "status": true,
  "tiers": [ ... ]
}
```

### Endpoints

#### Create Stream Pricing Configuration
```
POST /marketMaker/streamprices/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}
```
- **Body:** `StreamPricingConfigurationMetaData`
- **Success:** `201` with created configuration
- **Errors:** `409` if exists, `400` on validation failure

#### Get Stream Pricing Configuration
```
GET /marketMaker/streamprices/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}
```
- **Success:** `200` with `StreamPricingConfigurationMetaData`
- **Errors:** `404` if not found

#### Update Stream Pricing Configuration (full replace)
```
PUT /marketMaker/streamprices/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}
```
- **Body:** `StreamPricingConfigurationMetaData`
- **Success:** `200` with updated configuration
- **Errors:** `404` if not found, `400` on validation failure

#### Update a Specific Stream within the Configuration
```
PUT /marketMaker/streamprices/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}/streams/{streamName}
```
- **Body:** `StreamMetaData` (the full stream object; `name` in body must match `streamName` path variable)
- **Success:** `200` with full `StreamPricingConfigurationMetaData`
- **Errors:** `404` if configuration or stream not found, `400` on validation failure

#### Delete Stream Pricing Configuration
```
DELETE /marketMaker/streamprices/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}
```
- **Success:** `204` No Content
- **Errors:** `400` (via IllegalArgumentException) if not found

#### Delete a Specific Stream from the Configuration
```
DELETE /marketMaker/streamprices/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}/streams/{streamName}
```
- **Success:** `204` No Content
- **Errors:** `404` if configuration or stream not found

#### Partial Update Stream Pricing Configuration (patch)
```
PUT /marketMaker/streamprices/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}/patch
```
- **Body:** `PatchOperationDTO[]`
- **Patchable fields:** `streams` (add/remove/replace); within a stream: `tiers` (add/remove/replace), `spreadType` (replace)
- **Success:** `200` with updated configuration
- **Errors:** `404` if not found, `400` on validation/patch error

---

## 5. Tier Pricing Configuration

**Base path:** `/marketMaker/tierprices`

### Schema: `TierPricingConfigurationMetaData`
```json
{
  "organization": "string",                   // @Unpatchable
  "currencyPair": "string",                   // @Unpatchable
  "tiers": [                                  // SortedSet<TierMetaData> sorted by tierAmount; patchable: add, remove, replace
    {
      "tierAmount": 1000000.0,                // double; @Unpatchable; equality key (sorted by this)
      "bidOfferSpread": 0.0,                  // double
      "bidSpread": 0.0,                       // double
      "offerSpread": 0.0,                     // double
      "missingPriceSpread": 0.0               // double
    }
  ],
  "minSpreadEnabled": false,                  // boolean
  "volatilityEnabled": false,                 // boolean
  "volatilitySpreadMultiplier": 1.0,          // double
  "useMultiplierFromService": false,          // boolean
  "missingPriceCalculationEnabled": false     // boolean
}
```

### Endpoints

#### Create Tier Pricing Configuration
```
POST /marketMaker/tierprices/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}
```
- **Body:** `TierPricingConfigurationMetaData`
- **Success:** `201` with created configuration
- **Errors:** `409` if exists, `400` on validation failure

#### Get Tier Pricing Configuration
```
GET /marketMaker/tierprices/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}
```
- **Success:** `200` with `TierPricingConfigurationMetaData`
- **Errors:** `404` if not found

#### Update Tier Pricing Configuration (full replace)
```
PUT /marketMaker/tierprices/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}
```
- **Body:** `TierPricingConfigurationMetaData`
- **Success:** `200` with updated configuration
- **Errors:** `404` if not found, `400` on validation failure

#### Delete Tier Pricing Configuration
```
DELETE /marketMaker/tierprices/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}
```
- **Success:** `204` No Content
- **Errors:** `404` if not found

#### Partial Update Tier Pricing Configuration (patch)
```
PUT /marketMaker/tierprices/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}/patch
```
- **Body:** `PatchOperationDTO[]`
- **Patchable fields:** `tiers` (add/remove/replace)
- **Success:** `200` with updated configuration
- **Errors:** `404` if not found, `400` on validation/patch error

---

## 6. Forward Points Configuration

**Base path:** `/marketMaker/forwardpoints`

### Schema: `ForwardPointsConfigurationMetaData`
```json
{
  "organization": "string",        // @Unpatchable
  "currencyPair": "string",        // @Unpatchable
  "mode": "string",                // forward points mode (free text)
  "currency1Primary": true,        // boolean
  "spotRate": 1.1234,              // double
  "tenors": [                      // List<TenorMetaData>; patchable: add, remove, replace
    {
      "tenor": "string",           // tenor name e.g. "1M", "3M", "1Y"; @Unpatchable; equality key
      "mode": "string",            // tenor-level mode (free text)
      "bid": 0.0,                  // double (forward points bid)
      "offer": 0.0,                // double (forward points offer)
      "mid": 0.0,                  // double (forward points mid)
      "spread": 0.0,               // double
      "skew": 0.0,                 // double
      "interestRate1": 0.0,        // double (interest rate for currency 1)
      "interestRate2": 0.0         // double (interest rate for currency 2)
    }
  ]
}
```

### Schema: `TenorMetaData` (used in `updateTenor` endpoint)
```json
{
  "tenor": "string",
  "mode": "string",
  "bid": 0.0,
  "offer": 0.0,
  "mid": 0.0,
  "spread": 0.0,
  "skew": 0.0,
  "interestRate1": 0.0,
  "interestRate2": 0.0
}
```

### Endpoints

#### Create Forward Points Configuration
```
POST /marketMaker/forwardpoints/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}
```
- **Body:** `ForwardPointsConfigurationMetaData`
- **Success:** `201` with created configuration
- **Errors:** `409` if exists, `400` on validation failure

#### Get Forward Points Configuration
```
GET /marketMaker/forwardpoints/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}
```
- **Success:** `200` with `ForwardPointsConfigurationMetaData`
- **Errors:** `404` if not found

#### Update Forward Points Configuration (full replace)
```
PUT /marketMaker/forwardpoints/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}
```
- **Body:** `ForwardPointsConfigurationMetaData`
- **Success:** `200` with updated configuration
- **Errors:** `404` if not found, `400` on validation failure

#### Update a Specific Tenor
```
PUT /marketMaker/forwardpoints/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}/tenors/{tenorName}
```
- **Path:** `tenorName` — tenor identifier e.g. `1M`, `3M`, `1Y`
- **Body:** `TenorMetaData` (the `tenor` field in body must match `tenorName` path variable)
- **Success:** `200` with full `ForwardPointsConfigurationMetaData`
- **Errors:** `404` if configuration not found, `400` on validation failure

#### Delete Forward Points Configuration
```
DELETE /marketMaker/forwardpoints/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}
```
- **Success:** `204` No Content
- **Errors:** `404` if not found

#### Partial Update Forward Points Configuration (patch)
```
PUT /marketMaker/forwardpoints/{brokerOrg}/currencyPairs/{baseCcy}/{termCcy}/patch
```
- **Body:** `PatchOperationDTO[]`
- **Patchable fields:** `tenors` (add/remove/replace)
- **Success:** `200` with updated configuration
- **Errors:** `404` if not found, `400` on validation/patch error

---

## Patch Operation Examples

### Replace a scalar field
```json
[{ "operation": "replace", "path": "pricingEnabled", "value": false }]
```

### Replace a nested field inside a collection item
```json
[{ "operation": "replace", "path": "providers|name=LP1|status", "value": false }]
```

### Add a new item to a collection
```json
[{ "operation": "add", "path": "currencyPairs", "value": "GBPUSD" }]
```

### Remove an item from a collection
```json
[{ "operation": "remove", "path": "currencyPairs", "value": "GBPUSD" }]
```

### Replace an entire collection item (identified by key field)
```json
[{ "operation": "replace", "path": "providers|name=LP1", "value": { "name": "LP1", "status": true } }]
```

---

## Suggested Web UI Structure

### Recommended UI Layout

```
MarketMaker Configuration
├── [Broker Configuration]       — /marketMaker/broker-configurations
│     • List/Search brokers
│     • Create/Edit/Delete broker
│     • Manage currency pairs (add/remove chips)
├── [Core Pricing]               — /marketMaker/pricing
│     • Select broker → list all pricing configs
│     • Create/Edit/Delete per currency pair
├── [Providers]                  — /marketMaker/broker-configurations (.../providers)
│     • Select broker → list all provider configs
│     • Create/Edit/Delete provider config per currency pair
│     • Toggle individual provider status
├── [Stream Pricing]             — /marketMaker/streamprices
│     • Select broker → currency pair
│     • Expandable streams with nested tiers table
│     • Add/Edit/Delete streams and tiers
├── [Tier Pricing]               — /marketMaker/tierprices
│     • Select broker → currency pair
│     • Tiers table (sorted by tierAmount)
│     • Feature flags (minSpread, volatility, etc.)
└── [Forward Points]             — /marketMaker/forwardpoints
      • Select broker → currency pair
      • Tenors table (1D, 1W, 2W, 1M, 3M, 6M, 1Y, etc.)
      • Per-tenor: bid, offer, mid, spread, skew, interest rates
```

### Key UI Behaviors to Implement

1. **Broker selector** — shared dropdown across all sub-sections; populated from broker configs.
2. **Currency pair selector** — two-part (base + term) or free-text `EURUSD`; the API takes them as separate path variables.
3. **Provider names lookup** — use `GET /marketMaker/broker-configurations/{brokerOrg}/providers/names` to populate provider dropdowns.
4. **Tiers are sorted** — `StreamPricingConfigurationMetaData.streams[].tiers` and `TierPricingConfigurationMetaData.tiers` are sorted by `limit` / `tierAmount` respectively; render them in order.
5. **Mode fields** — show as radio buttons or select: `AUTO` vs `MANUAL`.
6. **Enum fields** — `AggregationStrategy` (`BestPriceMidRate`, `WeightedAverage`), `ExecutionStrategy` (`NoCover`, `Cover`), `SpreadType` (`PIPS` — currently only one value).
7. **Patch endpoint** — prefer using the specific targeted endpoints (e.g., `PUT .../providers/{providerOrg}/status`) where available; use the `/patch` endpoint for bulk edits.
8. **409 Conflict** — UI should show "already exists" and offer navigation to the existing resource.
9. **Asymmetric skew** — when `asymmetricSkew=true` in `CorePricingConfigurationMetaData`, show both `bidSkew` and `offerSkew` fields; otherwise show just `skew`.
