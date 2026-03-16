import { ghlRequest, getLocationId } from '../ghl-client.js';

interface Workflow {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

interface WorkflowsResponse {
  workflows: Workflow[];
  total?: number;
}

export function makeListWorkflowsHandler(tenant: string) {
  return async (_args: Record<string, never>) => {
    const locationId = getLocationId(tenant);

    const data = await ghlRequest<WorkflowsResponse>(
      tenant,
      'GET',
      `/workflows/?locationId=${locationId}`
    );

    if (!data.workflows || data.workflows.length === 0) {
      return {
        content: [{ type: 'text' as const, text: 'No workflows found.' }],
      };
    }

    const lines = data.workflows.map((w) =>
      `${w.name}\n  ID: ${w.id}\n  Status: ${w.status}`
    ).join('\n\n');

    return {
      content: [{ type: 'text' as const, text: `${data.workflows.length} workflow(s):\n\n${lines}` }],
    };
  };
}
