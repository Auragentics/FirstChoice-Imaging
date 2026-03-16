import { ghlRequest } from '../ghl-client.js';
export function makeTriggerWorkflowHandler(tenant) {
    return async (args) => {
        await ghlRequest(tenant, 'POST', `/contacts/${args.contact_id}/workflow/${args.workflow_id}`, {
            eventStartTime: new Date().toISOString(),
        });
        return {
            content: [{ type: 'text', text: `Workflow ${args.workflow_id} triggered for contact ${args.contact_id}.` }],
        };
    };
}
