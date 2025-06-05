import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface ProjectConfig {
  outputDir?: string;
  zmacArgs?: string[];
  emulatorArgs?: string[];
  defaultSourceFile?: string;
  target?: 'model1' | 'model3' | 'model4';
}

export interface TRS80Config {
  emulatorPath: string;
  zmacPath: string;
  outputDir: string;
  emulatorArgs: string[];
  target: 'model1' | 'model3' | 'model4';
  autoAssemble: boolean;
  projectConfig?: ProjectConfig;
}

export class ConfigurationManager {
  private static readonly PROJECT_CONFIG_FILE = 'trs80gp.json';

  // Default configuration values - used when project config and VS Code settings are missing
  private static readonly DEFAULT_CONFIG: Partial<TRS80Config> = {
    emulatorPath: '/Applications/trs80gp.app/Contents/MacOS/trs80gp',
    zmacPath: 'zmac',
    outputDir: '.zout',
    emulatorArgs: ['-m3'],
    target: 'model3',
    autoAssemble: true
  };

  public static getConfiguration(): TRS80Config {
    const config = vscode.workspace.getConfiguration('trs80gp');
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    
    // Global configuration with robust fallback defaults
    const globalConfig: TRS80Config = {
      emulatorPath: config.get('emulatorPath') || this.DEFAULT_CONFIG.emulatorPath!,
      zmacPath: config.get('zmacPath') || this.DEFAULT_CONFIG.zmacPath!,
      outputDir: config.get('defaultOutputDir') || this.DEFAULT_CONFIG.outputDir!,
      emulatorArgs: config.get('defaultEmulatorArgs') || this.DEFAULT_CONFIG.emulatorArgs!,
      target: config.get('defaultTarget') || this.DEFAULT_CONFIG.target!,
      autoAssemble: config.get('autoAssemble') ?? this.DEFAULT_CONFIG.autoAssemble!
    };

    // Project-specific configuration
    if (workspaceFolder) {
      const projectConfigPath = path.join(
        workspaceFolder.uri.fsPath,
        '.vscode',
        this.PROJECT_CONFIG_FILE
      );
      
      if (fs.existsSync(projectConfigPath)) {
        try {
          const projectConfigText = fs.readFileSync(projectConfigPath, 'utf8');
          const projectConfig: ProjectConfig = JSON.parse(projectConfigText);
          
          globalConfig.projectConfig = projectConfig;
          
          // Override global settings with project settings (only if defined)
          if (projectConfig.outputDir !== undefined) {
            globalConfig.outputDir = projectConfig.outputDir;
          }
          if (projectConfig.emulatorArgs !== undefined && Array.isArray(projectConfig.emulatorArgs)) {
            globalConfig.emulatorArgs = [...projectConfig.emulatorArgs];
          }
          if (projectConfig.target !== undefined) {
            globalConfig.target = projectConfig.target;
          }
          
          console.log('TRS80GP: Loaded project configuration:', projectConfigPath);
        } catch (error) {
          console.error('TRS80GP: Error reading project configuration:', error);
          // Continue with global config on error
        }
      } else {
        console.log('TRS80GP: No project configuration found, using defaults and VS Code settings');
      }
    }

    // Validate emulator arguments to ensure they're proper
    if (!Array.isArray(globalConfig.emulatorArgs) || globalConfig.emulatorArgs.length === 0) {
      console.warn('TRS80GP: Invalid emulatorArgs, using default [-m3]');
      globalConfig.emulatorArgs = ['-m3'];
    }

    // Log final configuration for debugging
    console.log('TRS80GP: Final configuration:', {
      emulatorPath: globalConfig.emulatorPath,
      emulatorArgs: globalConfig.emulatorArgs,
      target: globalConfig.target,
      outputDir: globalConfig.outputDir,
      hasProjectConfig: !!globalConfig.projectConfig
    });

    // Ensure all fields are valid and have fallback defaults
    return this.ensureMinimalConfiguration(globalConfig);
  }

  public static async createProjectConfig(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    const vscodePath = path.join(workspaceFolder.uri.fsPath, '.vscode');
    const configPath = path.join(vscodePath, this.PROJECT_CONFIG_FILE);

    // Ensure .vscode directory exists
    if (!fs.existsSync(vscodePath)) {
      fs.mkdirSync(vscodePath, { recursive: true });
    }

    const defaultConfig = this.createDefaultProjectConfig();

    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    
    // Open the config file for editing
    const doc = await vscode.workspace.openTextDocument(configPath);
    await vscode.window.showTextDocument(doc);
    
    vscode.window.showInformationMessage(
      `Created TRS-80 project configuration at ${path.relative(workspaceFolder.uri.fsPath, configPath)}`
    );
  }

  public static getModelFlag(target: string): string {
    switch (target) {
      case 'model1': return '-m1';
      case 'model3': return '-m3';
      case 'model4': return '-m4';
      default: return '-m3';
    }
  }

  public static createDefaultProjectConfig(): ProjectConfig {
    return {
      outputDir: '.zout',
      zmacArgs: ["--od", ".zout", "-L", "-m"],
      emulatorArgs: ['-m3'],
      target: 'model3',
      defaultSourceFile: 'main.a80'
    };
  }

  public static ensureMinimalConfiguration(config: TRS80Config): TRS80Config {
    // Ensure all required fields have valid values
    const validatedConfig = { ...config };

    if (!validatedConfig.emulatorPath || validatedConfig.emulatorPath.trim() === '') {
      validatedConfig.emulatorPath = this.DEFAULT_CONFIG.emulatorPath!;
    }

    if (!validatedConfig.zmacPath || validatedConfig.zmacPath.trim() === '') {
      validatedConfig.zmacPath = this.DEFAULT_CONFIG.zmacPath!;
    }

    if (!validatedConfig.outputDir || validatedConfig.outputDir.trim() === '') {
      validatedConfig.outputDir = this.DEFAULT_CONFIG.outputDir!;
    }

    if (!Array.isArray(validatedConfig.emulatorArgs) || validatedConfig.emulatorArgs.length === 0) {
      validatedConfig.emulatorArgs = [...this.DEFAULT_CONFIG.emulatorArgs!];
    }

    if (!validatedConfig.target || !['model1', 'model3', 'model4'].includes(validatedConfig.target)) {
      validatedConfig.target = this.DEFAULT_CONFIG.target!;
    }

    if (validatedConfig.autoAssemble === undefined || validatedConfig.autoAssemble === null) {
      validatedConfig.autoAssemble = this.DEFAULT_CONFIG.autoAssemble!;
    }

    return validatedConfig;
  }

  public static validateConfiguration(config: TRS80Config): string[] {
    const errors: string[] = [];

    if (!config.emulatorPath) {
      errors.push('trs80gp emulator path is not configured. Please set trs80gp.emulatorPath in settings.');
    } else if (!fs.existsSync(config.emulatorPath)) {
      errors.push(`trs80gp emulator not found at: ${config.emulatorPath}`);
    }

    return errors;
  }
}
