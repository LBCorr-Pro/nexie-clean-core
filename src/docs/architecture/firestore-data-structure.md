## Firestore Data Structure Overview

The application utilizes Firestore with a hierarchical data architecture centered around a clonable configuration structure within a root `Global` collection.

*   **Root Collection**: `Global`
*   **Master Configuration**: `Global/master/config/{collectionName}`
*   **Instance Data**: `Global/{instanceId}`
*   **Instance Configuration**: `Global/{instanceId}/config/{collectionName}`
*   **Sub-Instances**: `Global/{instanceId}/subinstances/{subInstanceId}`
*   **Splash Screen Campaigns**: `Global/master/config/splash_screen_campaigns/campaigns`

**Crucially, all Firestore references must be generated via the `refs` object from `src/lib/firestore-refs.ts` to ensure consistency.**

For a complete guide on the Firestore architecture, see `/docs/firestore_architecture.md`.
