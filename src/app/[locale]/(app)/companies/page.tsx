
"use client";

import { CompanyListClient } from './components/CompanyListClient';

export default function ManageCompaniesPage() {
  // This page is now a simple wrapper for the client component
  // that handles all the logic. The AuthGuard was removed as it is deprecated.
  return (
      <CompanyListClient />
  );
}
