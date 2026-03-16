import { ghlRequest, getLocationId } from '../ghl-client.js';
export function makeGetCustomFieldsHandler(tenant) {
    return async (_args) => {
        const locationId = getLocationId(tenant);
        const data = await ghlRequest(tenant, 'GET', `/locations/${locationId}/customFields`);
        if (!data.customFields || data.customFields.length === 0) {
            return {
                content: [{ type: 'text', text: 'No custom fields found.' }],
            };
        }
        const lines = data.customFields.map((f) => `${f.name} (${f.dataType})\n  Key: ${f.fieldKey}\n  ID: ${f.id}`).join('\n\n');
        return {
            content: [{ type: 'text', text: `${data.customFields.length} custom field(s):\n\n${lines}` }],
        };
    };
}
