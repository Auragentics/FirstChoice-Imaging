import { ghlRequest, getLocationId } from '../ghl-client.js';
export function makeListWorkflowsHandler(tenant) {
    return async (_args) => {
        const locationId = getLocationId(tenant);
        const data = await ghlRequest(tenant, 'GET', `/workflows/?locationId=${locationId}`);
        if (!data.workflows || data.workflows.length === 0) {
            return {
                content: [{ type: 'text', text: 'No workflows found.' }],
            };
        }
        const lines = data.workflows.map((w) => `${w.name}\n  ID: ${w.id}\n  Status: ${w.status}`).join('\n\n');
        return {
            content: [{ type: 'text', text: `${data.workflows.length} workflow(s):\n\n${lines}` }],
        };
    };
}
