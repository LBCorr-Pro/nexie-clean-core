// src/app/[locale]/(app)/access/instances/[instanceId]/page.tsx

// PROXY PAGE
// This page re-exports the master instance management page.
// The master page will detect the `instanceId` from the URL params
// via the `useInstanceActingContext` and render the sub-instance list.
import ManageInstancesMasterPage from "../page";

export default ManageInstancesMasterPage;
