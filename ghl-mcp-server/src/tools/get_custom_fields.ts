import { ghlRequest, getLocationId } from '../ghl-client.js';

interface CustomField {
  id: string;
  name: string;
  fieldKey: string;
  dataType: string;
  placeholder?: string;
}

interface CustomFieldsResponse {
  customFields: CustomField[];
}

export function makeGetCustomFieldsHandler(tenant: string) {
  return async (_args: Record<string, never>) => {
    const locationId = getLocationId(tenant);

    const data = await ghlRequest<CustomFieldsResponse>(
      tenant,
      'GET',
      `/locations/${locationId}/customFields`
    );

    if (!data.customFields || data.customFields.length === 0) {
      return {
        content: [{ type: 'text' as const, text: 'No custom fields found.' }],
      };
    }

    const lines = data.customFields.map((f) =>
      `${f.name} (${f.dataType})\n  Key: ${f.fieldKey}\n  ID: ${f.id}`
    ).join('\n\n');

    return {
      content: [{ type: 'text' as const, text: `${data.customFields.length} custom field(s):\n\n${lines}` }],
    };
  };
}
