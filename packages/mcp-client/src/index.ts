import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type {
  CallToolResult,
  GetPromptResult,
  ReadResourceResult,
} from '@modelcontextprotocol/sdk/types.js';
import { LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/sdk/types.js';

import type { InMemoryTraceCollector } from '@mcp-expedition/protocol-tracer';
import { AppError } from '@mcp-expedition/shared-schemas';

export interface StdioServerLaunchConfig {
  name: string;
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
}

export interface ExpeditionMcpClientOptions {
  clientName?: string;
  clientVersion?: string;
  tracer?: InMemoryTraceCollector;
}

export interface DiscoveredCapabilities {
  tools: string[];
  resources: string[];
  prompts: string[];
  serverName?: string;
  serverVersion?: string;
  protocolVersion?: string;
}

export class ExpeditionMcpClient {
  readonly #client: Client;
  readonly #tracer: InMemoryTraceCollector | undefined;
  #transport: StdioClientTransport | undefined;
  #serverId = 'unknown';
  #initialized = false;
  #protocolVersion: string | undefined;

  constructor(options: ExpeditionMcpClientOptions = {}) {
    this.#client = new Client({
      name: options.clientName ?? 'mcp-expedition-client',
      version: options.clientVersion ?? '0.1.0',
    });
    this.#tracer = options.tracer;
  }

  get rawClient(): Client {
    return this.#client;
  }

  async connectStdio(config: StdioServerLaunchConfig): Promise<void> {
    this.#serverId = config.name;

    const transportOptions: {
      command: string;
      args: string[];
      cwd?: string;
      env?: Record<string, string>;
      stderr: 'pipe';
    } = {
      command: config.command,
      args: config.args ?? [],
      stderr: 'pipe',
    };
    if (config.cwd !== undefined) {
      transportOptions.cwd = config.cwd;
    }
    if (config.env !== undefined) {
      transportOptions.env = config.env;
    }

    this.#transport = new StdioClientTransport(transportOptions);

    try {
      const started = Date.now();
      await this.#client.connect(this.#transport);
      this.#initialized = true;
      // connect() negotiates a supported protocol version; the SDK does not expose a getter.
      this.#protocolVersion = LATEST_PROTOCOL_VERSION;
      this.#tracer?.record({
        direction: 'client->server',
        serverId: this.#serverId,
        messageType: 'lifecycle',
        method: 'initialize',
        durationMs: Date.now() - started,
        success: true,
      });
    } catch (error) {
      this.#tracer?.record({
        direction: 'client->server',
        serverId: this.#serverId,
        messageType: 'error',
        method: 'initialize',
        success: false,
        metadata: {
          errorName: error instanceof Error ? error.name : 'unknown',
        },
      });
      throw new AppError('MCP_CONNECTION_FAILURE', 'Failed to connect to MCP server over stdio.', {
        server: config.name,
      });
    }
  }

  async listCapabilities(): Promise<DiscoveredCapabilities> {
    this.#assertInitialized();
    try {
      const [tools, resources, prompts] = await Promise.all([
        this.#client.listTools(),
        this.#client.listResources(),
        this.#client.listPrompts(),
      ]);

      const serverVersion = this.#client.getServerVersion();
      const result: DiscoveredCapabilities = {
        tools: tools.tools.map((tool) => tool.name),
        resources: resources.resources.map((resource) => resource.uri),
        prompts: prompts.prompts.map((prompt) => prompt.name),
      };

      if (serverVersion?.name !== undefined) {
        result.serverName = serverVersion.name;
      }
      if (serverVersion?.version !== undefined) {
        result.serverVersion = serverVersion.version;
      }
      if (this.#protocolVersion !== undefined) {
        result.protocolVersion = this.#protocolVersion;
      }

      return result;
    } catch (error) {
      throw new AppError('MCP_REQUEST_FAILURE', 'Failed to list MCP capabilities.', {
        cause: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  async listTools(): Promise<string[]> {
    const tools = await this.#client.listTools();
    return tools.tools.map((tool) => tool.name);
  }

  async listResources(): Promise<string[]> {
    const resources = await this.#client.listResources();
    return resources.resources.map((resource) => resource.uri);
  }

  async listPrompts(): Promise<string[]> {
    const prompts = await this.#client.listPrompts();
    return prompts.prompts.map((prompt) => prompt.name);
  }

  async readResource(uri: string): Promise<ReadResourceResult> {
    this.#assertInitialized();
    try {
      return await this.#client.readResource({ uri });
    } catch (error) {
      throw new AppError('MCP_REQUEST_FAILURE', `Failed to read resource ${uri}.`, {
        cause: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
    this.#assertInitialized();
    const started = Date.now();
    try {
      const result = await this.#client.callTool({ name, arguments: args });
      this.#tracer?.record({
        direction: 'client->server',
        serverId: this.#serverId,
        messageType: 'request',
        method: 'tools/call',
        durationMs: Date.now() - started,
        success: !result.isError,
        metadata: { toolName: name },
      });
      return result as CallToolResult;
    } catch (error) {
      this.#tracer?.record({
        direction: 'client->server',
        serverId: this.#serverId,
        messageType: 'error',
        method: 'tools/call',
        durationMs: Date.now() - started,
        success: false,
        metadata: { toolName: name },
      });
      throw new AppError('MCP_REQUEST_FAILURE', `Failed to call tool ${name}.`, {
        cause: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  async getPrompt(name: string, args?: Record<string, string>): Promise<GetPromptResult> {
    this.#assertInitialized();
    if (args === undefined) {
      return this.#client.getPrompt({ name });
    }
    return this.#client.getPrompt({ name, arguments: args });
  }

  getServerInfo(): { name?: string; version?: string } {
    const info = this.#client.getServerVersion();
    const result: { name?: string; version?: string } = {};
    if (info?.name !== undefined) {
      result.name = info.name;
    }
    if (info?.version !== undefined) {
      result.version = info.version;
    }
    return result;
  }

  getProtocolVersion(): string | undefined {
    return this.#protocolVersion;
  }

  async close(): Promise<void> {
    try {
      await this.#client.close();
    } finally {
      this.#transport = undefined;
      this.#initialized = false;
      this.#protocolVersion = undefined;
      this.#tracer?.record({
        direction: 'client->server',
        serverId: this.#serverId,
        messageType: 'lifecycle',
        method: 'close',
        success: true,
      });
    }
  }

  #assertInitialized(): void {
    if (!this.#initialized) {
      throw new AppError('MCP_CONNECTION_FAILURE', 'MCP client is not connected.');
    }
  }
}
