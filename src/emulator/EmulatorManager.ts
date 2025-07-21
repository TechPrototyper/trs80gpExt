import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

export interface EmulatorInstance {
  process: ChildProcess;
  pid: number;
  startTime: Date;
  sourceFile: string;
  isDebugMode: boolean;
}

export class EmulatorManager {
  private static instance: EmulatorManager;
  private currentInstance: EmulatorInstance | null = null;
  private outputChannel: vscode.OutputChannel;

  private constructor() {
    this.outputChannel = vscode.window.createOutputChannel('TRS-80 Emulator');
  }


  public static getInstance(): EmulatorManager {
    if (!EmulatorManager.instance) {
      EmulatorManager.instance = new EmulatorManager();
    }
    return EmulatorManager.instance;
  }

  public async startEmulator(
    emulatorPath: string,
    bdsFile: string,
    cmdFile: string,
    sourceFile: string,
    modelArg: string,
    emulatorArgs: string = '',
    breakpointArgs: string[] = [],
    isDebugMode: boolean = false
  ): Promise<EmulatorInstance> {
    
    // Stop any existing instance
    await this.stopEmulator();

    this.outputChannel.clear();
    this.outputChannel.show();

    // Build command arguments - pass CMD file as a regular argument
    // TRS-80GP will automatically load and execute .cmd files
    // Build argument list: model argument, then user args, then breakpoints
    const userArgs = emulatorArgs.trim() === '' ? [] : emulatorArgs.split(' ');
    const args = [
      modelArg,
      ...userArgs,
      ...breakpointArgs
    ];

    // Add BDS file for symbol information if available
    if (bdsFile && fs.existsSync(bdsFile)) {
      args.push('-ls', bdsFile);
      this.outputChannel.appendLine(`Loading symbols from: ${bdsFile}`);
    }

    // CMD file as last argument for auto-execution
    args.push(cmdFile);

    this.outputChannel.appendLine(`Starting trs80gp: ${emulatorPath} ${args.join(' ')}`);
    this.outputChannel.appendLine(`Source file: ${sourceFile}`);
    this.outputChannel.appendLine(`Debug mode: ${isDebugMode ? 'Yes' : 'No'}`);
    this.outputChannel.appendLine('');

    return new Promise((resolve, reject) => {
      const process = spawn(emulatorPath, args, {
        detached: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      if (!process.pid) {
        reject(new Error('Failed to start emulator process'));
        return;
      }

      // Create instance object
      const instance: EmulatorInstance = {
        process,
        pid: process.pid,
        startTime: new Date(),
        sourceFile,
        isDebugMode
      };

      // Handle process output
      process.stdout?.on('data', (data: Buffer) => {
        this.outputChannel.append(data.toString());
      });

      process.stderr?.on('data', (data: Buffer) => {
        this.outputChannel.append(data.toString());
      });

      process.on('spawn', () => {
        this.outputChannel.appendLine(`✓ Emulator started successfully (PID: ${process.pid})`);
        this.currentInstance = instance;
        resolve(instance);
      });

      process.on('error', (error) => {
        this.outputChannel.appendLine(`✗ Failed to start emulator: ${error.message}`);
        reject(error);
      });

      process.on('exit', (code, signal) => {
        this.outputChannel.appendLine('');
        if (signal) {
          this.outputChannel.appendLine(`Emulator terminated by signal: ${signal}`);
        } else {
          this.outputChannel.appendLine(`Emulator exited with code: ${code}`);
        }
        
        if (this.currentInstance?.pid === process.pid) {
          this.currentInstance = null;
        }
      });

      // Unref the process so it can run independently
      process.unref();
    });
  }

  public async stopEmulator(): Promise<void> {
    if (!this.currentInstance) {
      return;
    }

    const { process, pid } = this.currentInstance;
    
    this.outputChannel.appendLine(`Stopping emulator (PID: ${pid})...`);

    return new Promise((resolve) => {
      const cleanup = () => {
        this.currentInstance = null;
        resolve();
      };

      // Try graceful shutdown first
      try {
        process.kill('SIGTERM');
        
        // Wait for graceful shutdown
        const timeout = setTimeout(() => {
          // Force kill if graceful shutdown fails
          try {
            process.kill('SIGKILL');
          } catch (error) {
            // Process might already be dead
          }
          cleanup();
        }, 2000);

        process.on('exit', () => {
          clearTimeout(timeout);
          cleanup();
        });

      } catch (error) {
        // Process might already be dead
        cleanup();
      }
    });
  }

  public getCurrentInstance(): EmulatorInstance | null {
    return this.currentInstance;
  }

  public isRunning(): boolean {
    return this.currentInstance !== null;
  }

  public async restartWithBreakpoints(breakpointArgs: string[]): Promise<void> {
    if (!this.currentInstance) {
      throw new Error('No emulator instance running');
    }

    const { sourceFile, isDebugMode } = this.currentInstance;
    
    // Get the configuration to rebuild the command
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('No workspace folder open');
    }

    // We'll need to get these from the current configuration
    // This is a simplified restart - in practice you'd want to store more state
    this.outputChannel.appendLine('ℹ️ Restart with breakpoints requires re-running the debug command');
    this.outputChannel.show();
  }

  public getEmulatorModelArgs(target: string): string[] {
    switch (target) {
      case 'model1':
        return ['-m1'];
      case 'model3':
        return ['-m3'];
      case 'model4':
        return ['-m4'];
      default:
        return ['-m3'];
    }
  }

  public formatBreakpointArgs(addresses: number[]): string[] {
    const args: string[] = [];
    
    // trs80gp supports up to 4 breakpoints with -b hex
    const maxBreakpoints = Math.min(addresses.length, 4);
    
    for (let i = 0; i < maxBreakpoints; i++) {
      args.push('-b', addresses[i].toString(16).toUpperCase());
    }
    
    return args;
  }

  public dispose(): void {
    this.stopEmulator();
    this.outputChannel.dispose();
  }
}
