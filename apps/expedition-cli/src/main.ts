import { Command } from 'commander';

import { runDoctor } from './commands/doctor.js';
import { runListCapabilities } from './commands/server.js';
import { runWorkspaceInspect } from './commands/workspace.js';
import { printError } from './presentation/output.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('expedition')
    .description('ResearchOps Assistant CLI for Model Context Protocol expeditions')
    .version('0.1.0');

  const workspace = program.command('workspace').description('Workspace workflows');
  workspace
    .command('inspect')
    .argument('<path>', 'Path to an approved workspace directory')
    .description('Inspect a workspace through the local Workspace MCP server')
    .action(async (path: string) => {
      await runWorkspaceInspect(path);
    });

  const server = program.command('server').description('Server utilities');
  server
    .command('list-capabilities')
    .description('List tools, resources, and prompts from the local Workspace server')
    .action(async () => {
      await runListCapabilities();
    });

  program
    .command('doctor')
    .description('Check local development prerequisites')
    .action(async () => {
      const code = await runDoctor();
      process.exitCode = code;
    });

  return program;
}

export async function runCli(argv: string[] = process.argv): Promise<void> {
  const program = createProgram();
  const debug = process.env.MCP_DEBUG === 'true' || process.env.MCP_DEBUG === '1';

  try {
    await program.parseAsync(argv);
  } catch (error) {
    printError(error, debug);
    process.exitCode = 1;
  }
}
