import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { ConfigurationManager, TRS80Config } from '../configuration/ConfigurationManager';
import { ZmacAssembler, AssemblyResult } from '../assembler/ZmacAssembler';
import { EmulatorManager } from '../emulator/EmulatorManager';
import { BreakpointManager, BreakpointInfo } from '../debugging/BreakpointManager';

export class TRS80Commands {
  private assembler: ZmacAssembler;
  private emulatorManager: EmulatorManager;
  private diagnostics: vscode.DiagnosticCollection;
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.assembler = new ZmacAssembler();
    this.emulatorManager = EmulatorManager.getInstance();
    this.diagnostics = BreakpointManager.createDiagnosticCollection();
    this.outputChannel = vscode.window.createOutputChannel('TRS-80 Development');
  }

  /**
   * Run command - assemble and execute without debugging
   */
  public async run(): Promise<void> {
    await this.executeWithMode(false);
  }

  /**
   * Debug command - assemble and execute with breakpoints
   */
  public async debug(): Promise<void> {
    await this.executeWithMode(true);
  }

  /**
   * Assemble only command
   */
  public async assembleOnly(): Promise<void> {
    const result = await this.performAssembly();
    if (result) {
      this.outputChannel.appendLine('✅ Assembly completed successfully');
      this.outputChannel.show();
    }
  }

  /**
   * Main execution logic for both run and debug modes
   */
  private async executeWithMode(isDebugMode: boolean): Promise<void> {
    try {
      // Get configuration
      const config = ConfigurationManager.getConfiguration();
      
      // Validate configuration
      const configErrors = ConfigurationManager.validateConfiguration(config);
      if (configErrors.length > 0) {
        vscode.window.showErrorMessage(
          `Configuration errors:\n${configErrors.join('\n')}`,
          'Open Settings'
        ).then(choice => {
          if (choice === 'Open Settings') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'trs80gp');
          }
        });
        return;
      }

      // Get source file
      const sourceFile = await this.getSourceFile(config);
      if (!sourceFile) {
        return;
      }

      // Perform assembly if needed
      const assemblyResult = await this.performAssembly(sourceFile, config);
      if (!assemblyResult || !assemblyResult.success) {
        return;
      }

      // Prepare emulator arguments
      const { emulatorArgs, breakpointArgs } = await this.prepareEmulatorArgs(
        config, 
        assemblyResult, 
        isDebugMode
      );

      // Start emulator
      await this.startEmulator(
        config,
        assemblyResult,
        sourceFile,
        emulatorArgs,
        breakpointArgs,
        isDebugMode
      );

    } catch (error) {
      vscode.window.showErrorMessage(`TRS-80 execution failed: ${error}`);
      console.error('TRS-80 execution error:', error);
    }
  }

  /**
   * Get the source file to assemble
   */
  private async getSourceFile(config: TRS80Config): Promise<string | null> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder open');
      return null;
    }

    // Try active editor first
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && this.isAssemblyFile(activeEditor.document.fileName)) {
      return activeEditor.document.fileName;
    }

    // Try project config default
    if (config.projectConfig?.defaultSourceFile) {
      const defaultFile = path.join(
        workspaceFolder.uri.fsPath,
        config.projectConfig.defaultSourceFile
      );
      if (fs.existsSync(defaultFile)) {
        return defaultFile;
      }
    }

    // Find any assembly files in workspace (.z, .a80, .asm)
    const files = await vscode.workspace.findFiles('**/*.{z,a80,asm}', '**/node_modules/**', 10);
    if (files.length === 1) {
      return files[0].fsPath;
    } else if (files.length > 1) {
      // Let user choose
      const items = files.map(file => ({
        label: path.basename(file.fsPath),
        description: path.relative(workspaceFolder.uri.fsPath, file.fsPath),
        filePath: file.fsPath
      }));

      const chosen = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select Z-80 assembly file to run'
      });

      return chosen?.filePath || null;
    }

    vscode.window.showErrorMessage(
      'No Z-80 assembly file found. Please open a .z, .a80, or .asm file or configure defaultSourceFile.'
    );
    return null;
  }

  /**
   * Check if file is a supported assembly file
   */
  private isAssemblyFile(fileName: string): boolean {
    const ext = path.extname(fileName).toLowerCase();
    return ['.z', '.a80', '.asm', '.s'].includes(ext);
  }

  /**
   * Perform assembly and handle errors
   */
  private async performAssembly(
    sourceFile?: string,
    config?: TRS80Config
  ): Promise<AssemblyResult | null> {
    if (!sourceFile) {
      config = config || ConfigurationManager.getConfiguration();
      const resolvedSourceFile = await this.getSourceFile(config);
      if (!resolvedSourceFile) {
        return null;
      }
      sourceFile = resolvedSourceFile;
    }

    if (!config) {
      config = ConfigurationManager.getConfiguration();
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('No workspace folder open');
    }

    const sourceBaseName = path.basename(sourceFile, path.extname(sourceFile));
    const outputDir = path.join(workspaceFolder.uri.fsPath, config.outputDir);
    const outputBds = path.join(outputDir, `${sourceBaseName}.bds`);

    // Check if assembly is needed
    if (!this.assembler.needsAssembly(sourceFile, outputBds)) {
      this.outputChannel.appendLine('ℹ️ Source file unchanged, using existing assembly');
      
      // Return a mock successful result
      return {
        success: true,
        stdout: '',
        stderr: '',
        outputFiles: this.assembler.getOutputFiles(outputDir, sourceBaseName),
        errors: []
      } as AssemblyResult;
    }

    // Perform assembly
    const zmacArgs = config.projectConfig?.zmacArgs || [];
    const result = await this.assembler.assemble(
      sourceFile,
      config.outputDir,
      config.zmacPath,
      zmacArgs
    );

    // Update diagnostics
    BreakpointManager.updateDiagnostics(this.diagnostics, result.errors);

    // Handle assembly errors
    if (!result.success) {
      await this.assembler.showFirstError(result.errors);
      return null;
    }

    return result;
  }

  /**
   * Prepare emulator arguments including breakpoints for debug mode
   */
  private async prepareEmulatorArgs(
    config: TRS80Config,
    assemblyResult: AssemblyResult,
    isDebugMode: boolean
  ): Promise<{ emulatorArgs: string[], breakpointArgs: string[] }> {
    
    const emulatorArgs = [...config.emulatorArgs];
    let breakpointArgs: string[] = [];

    if (isDebugMode && assemblyResult.outputFiles.bds) {
      // Get breakpoints from VS Code
      const breakpoints = await BreakpointManager.getBreakpointAddresses(
        assemblyResult.outputFiles.bds
      );

      if (breakpoints.length > 0) {
        breakpointArgs = BreakpointManager.formatBreakpointsForEmulator(breakpoints);
        BreakpointManager.showBreakpointInfo(breakpoints, this.outputChannel);
      } else {
        // No breakpoints set, use entry point from BDS file
        const entryPoint = BreakpointManager.getEntryPoint(assemblyResult.outputFiles.bds);
        if (entryPoint !== null) {
          breakpointArgs = ['-b', entryPoint.toString(16).toUpperCase()];
          this.outputChannel.appendLine(
            `ℹ️ No breakpoints set, using program entry point: $${entryPoint.toString(16).toUpperCase()}`
          );
        } else {
          this.outputChannel.appendLine(
            '⚠️ No breakpoints set and no entry point found in BDS file'
          );
        }
      }
    }

    return { emulatorArgs, breakpointArgs };
  }

  /**
   * Start the emulator with the assembled program
   */
  private async startEmulator(
    config: TRS80Config,
    assemblyResult: AssemblyResult,
    sourceFile: string,
    emulatorArgs: string[],
    breakpointArgs: string[],
    isDebugMode: boolean
  ): Promise<void> {
    
    if (!assemblyResult.outputFiles.bds) {
      throw new Error('No BDS file generated');
    }

    if (!assemblyResult.outputFiles.cmd) {
      throw new Error('No CMD file generated');
    }

    await this.emulatorManager.startEmulator(
      config.emulatorPath,
      assemblyResult.outputFiles.bds,
      assemblyResult.outputFiles.cmd,
      sourceFile,
      emulatorArgs,
      breakpointArgs,
      isDebugMode
    );

    const mode = isDebugMode ? 'Debug' : 'Run';
    // Emulator start success is already logged by EmulatorManager, no need for notification
  }

  /**
   * Stop the currently running emulator
   */
  public async stop(): Promise<void> {
    const instance = this.emulatorManager.getCurrentInstance();
    if (!instance) {
      this.outputChannel.appendLine('ℹ️ No emulator instance running');
      this.outputChannel.show();
      return;
    }

    await this.emulatorManager.stopEmulator();
    this.outputChannel.appendLine('✅ Emulator stopped');
    this.outputChannel.show();
  }

  /**
   * Show emulator status
   */
  public async status(): Promise<void> {
    const instance = this.emulatorManager.getCurrentInstance();
    if (!instance) {
      this.outputChannel.appendLine('ℹ️ No emulator instance running');
      this.outputChannel.show();
      return;
    }

    const uptime = Date.now() - instance.startTime.getTime();
    const uptimeStr = this.formatUptime(uptime);
    
    const statusMessage = `📊 Emulator Status: Running (PID: ${instance.pid}, uptime: ${uptimeStr}, ${instance.isDebugMode ? 'debug' : 'run'} mode)`;
    this.outputChannel.appendLine(statusMessage);
    this.outputChannel.show();
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  public dispose(): void {
    this.assembler.dispose();
    this.emulatorManager.dispose();
    this.diagnostics.dispose();
    this.outputChannel.dispose();
  }
}
