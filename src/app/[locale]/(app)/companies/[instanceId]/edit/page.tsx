// PROXY PAGE
// This page re-exports the master edit page.
// The router maps the `instanceId` param to the `companyId` param expected by the master page.

import EditCompanyPage from '../../company/[companyId]/edit/page';

export default EditCompanyPage;
