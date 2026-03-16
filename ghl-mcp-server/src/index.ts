import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { registerTenant } from './ghl-client.js';

// ── Tool factories (tenant-aware) ──────────────────────────────────────────
import { makeSearchContactHandler } from './tools/search_contact.js';
import { makeSendSmsHandler } from './tools/send_sms.js';
import { makeCreateContactHandler } from './tools/create_contact.js';
import { makeAddNoteHandler } from './tools/add_note.js';
import { makeAddTagHandler } from './tools/add_tag.js';
import { makeTriggerWorkflowHandler } from './tools/trigger_workflow.js';
import { makeGetContactHandler } from './tools/get_contact.js';
import { makeUpdateContactHandler } from './tools/update_contact.js';
import { makeGetContactNotesHandler } from './tools/get_contact_notes.js';
import { makeGetMessagesHandler } from './tools/get_messages.js';
import { makeDeleteContactHandler } from './tools/delete_contact.js';
import { makeListWorkflowsHandler } from './tools/list_workflows.js';
import { makeGetCustomFieldsHandler } from './tools/get_custom_fields.js';
import { makeSendEmailHandler } from './tools/send_email.js';

// ── AIOS-only tools (Google Sheets — not tenant-scoped) ────────────────────
import { checkUnitAvailabilityHandler } from './tools/check_unit_availability.js';
import { getAllPricingHandler } from './tools/get_all_pricing.js';
import { getTenantInfoHandler } from './tools/get_tenant_info.js';
import { updateUnitHandler } from './tools/update_unit.js';

// ── Register tenants from env ──────────────────────────────────────────────

function loadTenants() {
  const aiosKey = process.env.AIOS_GHL_API_KEY;
  const aiosLoc = process.env.AIOS_GHL_LOCATION_ID;
  if (aiosKey && aiosLoc) {
    registerTenant('aios', { apiKey: aiosKey, locationId: aiosLoc });
    console.log('  ✓ Tenant registered: aios');
  }

  const fciKey = process.env.FCI_GHL_API_KEY;
  const fciLoc = process.env.FCI_GHL_LOCATION_ID;
  if (fciKey && fciLoc) {
    registerTenant('fci', { apiKey: fciKey, locationId: fciLoc });
    console.log('  ✓ Tenant registered: fci');
  }
}

// ── Shared GHL tool definitions (used by both tenants) ─────────────────────

function registerSharedGhlTools(server: McpServer, tenant: string) {
  // ── Contact Management ──────────────────────────────────────────────────

  server.tool(
    'search_contact',
    'Search GoHighLevel CRM contacts by name, email, or phone number.',
    { query: z.string().describe('The name, email address, or phone number to search for') },
    makeSearchContactHandler(tenant)
  );

  server.tool(
    'get_contact',
    'Get full contact details by ID, including custom fields (webhook variables) and tags.',
    { contact_id: z.string().describe('The GHL Contact ID') },
    makeGetContactHandler(tenant)
  );

  server.tool(
    'create_contact',
    'Create a new contact in GoHighLevel CRM.',
    {
      first_name: z.string().describe('Contact\'s first name'),
      last_name: z.string().optional().describe('Contact\'s last name'),
      phone: z.string().optional().describe('Phone number (e.g. +15551234567)'),
      email: z.string().optional().describe('Email address'),
      source: z.string().optional().describe('Lead source (defaults to "Voice AI")'),
    },
    makeCreateContactHandler(tenant)
  );

  server.tool(
    'update_contact',
    'Update a contact\'s fields in GoHighLevel, including custom fields (webhook variables).',
    {
      contact_id: z.string().describe('The GHL Contact ID'),
      first_name: z.string().optional().describe('Updated first name'),
      last_name: z.string().optional().describe('Updated last name'),
      phone: z.string().optional().describe('Updated phone number'),
      email: z.string().optional().describe('Updated email'),
      custom_fields: z.string().optional().describe('JSON object of custom field key-value pairs, e.g. {"intents_handled": "records", "sms_consent": "YES"}'),
    },
    makeUpdateContactHandler(tenant)
  );

  server.tool(
    'delete_contact',
    'Delete a contact from GoHighLevel CRM. Use for cleaning up test contacts.',
    { contact_id: z.string().describe('The GHL Contact ID to delete') },
    makeDeleteContactHandler(tenant)
  );

  // ── Notes ───────────────────────────────────────────────────────────────

  server.tool(
    'add_note',
    'Add a note to a contact\'s record in GoHighLevel.',
    {
      contact_id: z.string().describe('The GHL Contact ID'),
      note: z.string().describe('The note text to add'),
    },
    makeAddNoteHandler(tenant)
  );

  server.tool(
    'get_contact_notes',
    'Get all notes on a contact\'s record. Use to verify call summaries were logged.',
    { contact_id: z.string().describe('The GHL Contact ID') },
    makeGetContactNotesHandler(tenant)
  );

  // ── Tags ────────────────────────────────────────────────────────────────

  server.tool(
    'add_tag',
    'Add one or more tags to a contact in GoHighLevel.',
    {
      contact_id: z.string().describe('The GHL Contact ID'),
      tags: z.string().describe('Comma-separated list of tags to add'),
    },
    makeAddTagHandler(tenant)
  );

  // ── Messaging ───────────────────────────────────────────────────────────

  server.tool(
    'send_sms',
    'Send an SMS message to a contact in GoHighLevel.',
    {
      contact_id: z.string().describe('The GHL Contact ID'),
      message: z.string().describe('The SMS message text to send'),
      from_number: z.string().optional().describe('Sender phone number (optional, uses account default)'),
    },
    makeSendSmsHandler(tenant)
  );

  server.tool(
    'send_email',
    'Send an email to a contact in GoHighLevel (e.g. lien notifications, records confirmations).',
    {
      contact_id: z.string().describe('The GHL Contact ID'),
      subject: z.string().describe('Email subject line'),
      body: z.string().describe('Email body (HTML supported)'),
      from_email: z.string().optional().describe('Sender email address (optional, uses account default)'),
    },
    makeSendEmailHandler(tenant)
  );

  server.tool(
    'get_messages',
    'Get SMS/email message history for a contact. Use to verify messages were sent.',
    {
      contact_id: z.string().describe('The GHL Contact ID'),
      limit: z.number().optional().describe('Max messages to return (default 20)'),
    },
    makeGetMessagesHandler(tenant)
  );

  // ── Workflows ───────────────────────────────────────────────────────────

  server.tool(
    'list_workflows',
    'List all workflows in the GHL location. Use to discover workflow IDs.',
    {},
    makeListWorkflowsHandler(tenant)
  );

  server.tool(
    'trigger_workflow',
    'Trigger a GoHighLevel workflow for a contact.',
    {
      contact_id: z.string().describe('The GHL Contact ID'),
      workflow_id: z.string().describe('The GHL Workflow ID to trigger'),
    },
    makeTriggerWorkflowHandler(tenant)
  );

  // ── Custom Fields ───────────────────────────────────────────────────────

  server.tool(
    'get_custom_fields',
    'List all custom field definitions for the location. Use to discover webhook variable field keys and IDs.',
    {},
    makeGetCustomFieldsHandler(tenant)
  );
}

// ── AIOS-only tool definitions (Google Sheets inventory) ────────────────────

function registerAiosTools(server: McpServer) {
  server.tool(
    'check_unit_availability',
    'Check which self storage units are currently available. Optionally filter by unit size.',
    { size: z.string().optional().describe('Unit size to filter by, e.g. "10x10"') },
    checkUnitAvailabilityHandler
  );

  server.tool(
    'get_all_pricing',
    'Get a full list of all storage unit sizes and their monthly rental rates.',
    {},
    getAllPricingHandler
  );

  server.tool(
    'get_tenant_info',
    'Look up an existing tenant\'s unit information by name, unit number, or GHL contact ID.',
    {
      contact_id: z.string().optional().describe('GHL Contact ID of the tenant'),
      name: z.string().optional().describe('Tenant name to search for'),
      unit_number: z.string().optional().describe('Unit number to look up'),
    },
    getTenantInfoHandler
  );

  server.tool(
    'update_unit',
    'Update a storage unit record in Google Sheets (status, tenant, notes).',
    {
      unit_number: z.string().describe('The unit number to update'),
      status: z.enum(['available', 'occupied', 'reserved']).optional().describe('New status'),
      tenant_name: z.string().optional().describe('Tenant name to assign'),
      contact_id: z.string().optional().describe('GHL Contact ID to link'),
      notes: z.string().optional().describe('Notes to write'),
    },
    updateUnitHandler
  );
}

// ── MCP request handler ────────────────────────────────────────────────────

async function handleMcpRequest(
  tenant: string,
  serverName: string,
  extraTools: (server: McpServer) => void,
  req: express.Request,
  res: express.Response
) {
  const server = new McpServer({ name: serverName, version: '2.1.0' });

  registerSharedGhlTools(server, tenant);
  extraTools(server);

  try {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error(`MCP request error (${tenant}):`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// ── Express app ────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'auragentics-ghl-mcp-server',
    version: '2.1.0',
    tenants: {
      aios: { path: '/aios/mcp', tools: 18 },
      fci:  { path: '/fci/mcp',  tools: 14 },
    },
  });
});

// ── AIOS tenant: 14 shared GHL tools + 4 storage unit tools = 18 ───────────
app.all('/aios/mcp', (req, res) => {
  handleMcpRequest('aios', 'aios-ghl-tools', registerAiosTools, req, res);
});

// ── FCI tenant: 14 shared GHL tools ────────────────────────────────────────
app.all('/fci/mcp', (req, res) => {
  handleMcpRequest('fci', 'firstchoice-ghl-tools', () => {}, req, res);
});

// ── Legacy fallback: /mcp → AIOS (backwards compatible) ────────────────────
app.all('/mcp', (req, res) => {
  handleMcpRequest('aios', 'aios-ghl-tools', registerAiosTools, req, res);
});

// ── Start ──────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 8080;

loadTenants();

app.listen(PORT, () => {
  console.log(`\nAuragentics GHL MCP Server v2.1 running on port ${PORT}`);
  console.log(`  Health:    http://localhost:${PORT}/health`);
  console.log(`  AIOS MCP:  http://localhost:${PORT}/aios/mcp  (18 tools)`);
  console.log(`  FCI MCP:   http://localhost:${PORT}/fci/mcp   (14 tools)`);
  console.log(`  Legacy:    http://localhost:${PORT}/mcp → AIOS\n`);
});
