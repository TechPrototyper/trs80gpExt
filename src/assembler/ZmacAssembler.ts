import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

export interface AssemblyResult {
  success: boolean;
  stdout: string;
  stderr: string;
  outputFiles: {
    bds?: string;
    cmd?: string;
    lst?: string;
  };
  errors: AssemblyError[];
}

export interface AssemblyError {
  file: string;
  line: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning';
}

export class ZmacAssembler {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('TRS-80 zmac');
  }

  public async assemble(
    sourceFile: string,
    outputDir: string,
    zmacPath: string,
    zmacArgs: string[] = []
  ): Promise<AssemblyResult> {
    this.outputChannel.clear();
    this.outputChannel.show();

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('No workspace folder open');
    }

    // Ensure output directory exists
    const fullOutputDir = path.join(workspaceFolder.uri.fsPath, outputDir);
    if (!fs.existsSync(fullOutputDir)) {
      fs.mkdirSync(fullOutputDir, { recursive: true });
    }

    const sourceBaseName = path.basename(sourceFile, path.extname(sourceFile));
    const outputBds = path.join(fullOutputDir, `${sourceBaseName}.bds`);
    
    // Build zmac command
    const args = [
      '--od', fullOutputDir,
      ...zmacArgs,
      sourceFile
    ];

    this.outputChannel.appendLine(`Assembling: ${zmacPath} ${args.join(' ')}`);
    this.outputChannel.appendLine('');

    return new Promise((resolve) => {
      const process = spawn(zmacPath, args, {
        cwd: workspaceFolder.uri.fsPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        stdout += text;
        this.outputChannel.append(text);
      });

      process.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        stderr += text;
        this.outputChannel.append(text);
      });

      process.on('close', (code) => {
        const success = code === 0;
        const errors = this.parseZmacErrors(stderr, sourceFile);
        
        this.outputChannel.appendLine('');
        this.outputChannel.appendLine(
          success ? '✓ Assembly completed successfully' : '✗ Assembly failed'
        );

        // Determine output files
        const outputFiles = this.getOutputFiles(fullOutputDir, sourceBaseName);

        resolve({
          success,
          stdout,
          stderr,
          outputFiles,
          errors
        });
      });

      process.on('error', (error) => {
        this.outputChannel.appendLine(`Error starting zmac: ${error.message}`);
        resolve({
          success: false,
          stdout: '',
          stderr: error.message,
          outputFiles: {},
          errors: [{
            file: sourceFile,
            line: 1,
            message: `Failed to start zmac: ${error.message}`,
            severity: 'error'
          }]
        });
      });
    });
  }

  private parseZmacErrors(stderr: string, sourceFile: string): AssemblyError[] {
    const errors: AssemblyError[] = [];
    const lines = stderr.split('\n');

    for (const line of lines) {
      // Parse zmac error format: "File 'filename', line N: error message"
      const errorMatch = line.match(/File\s+'([^']+)',\s+line\s+(\d+):\s*(.+)/i);
      if (errorMatch) {
        const [, file, lineStr, message] = errorMatch;
        const lineNum = parseInt(lineStr, 10);
        
        errors.push({
          file: file,
          line: lineNum,
          message: message.trim(),
          severity: line.toLowerCase().includes('warning') ? 'warning' : 'error'
        });
      }
      
      // Also handle simpler error formats
      const simpleErrorMatch = line.match(/line\s+(\d+):\s*(.+)/i);
      if (simpleErrorMatch && !errorMatch) {
        const [, lineStr, message] = simpleErrorMatch;
        const lineNum = parseInt(lineStr, 10);
        
        errors.push({
          file: sourceFile,
          line: lineNum,
          message: message.trim(),
          severity: line.toLowerCase().includes('warning') ? 'warning' : 'error'
        });
      }
    }

    return errors;
  }

  public getOutputFiles(outputDir: string, baseName: string): AssemblyResult['outputFiles'] {
    const files: AssemblyResult['outputFiles'] = {};
    
    const bdsFile = path.join(outputDir, `${baseName}.bds`);
    const cmdFile = path.join(outputDir, `${baseName}.cmd`);
    const lstFile = path.join(outputDir, `${baseName}.lst`);
    
    if (fs.existsSync(bdsFile)) {
      files.bds = bdsFile;
    }
    if (fs.existsSync(cmdFile)) {
      files.cmd = cmdFile;
    }
    if (fs.existsSync(lstFile)) {
      files.lst = lstFile;
    }
    
    return files;
  }

  public async showFirstError(errors: AssemblyError[]): Promise<void> {
    if (errors.length === 0) {
      return;
    }

    const firstError = errors.find(e => e.severity === 'error') || errors[0];
    
    try {
      // Open the file and navigate to the error line
      const document = await vscode.workspace.openTextDocument(firstError.file);
      const editor = await vscode.window.showTextDocument(document);
      
      const line = Math.max(0, firstError.line - 1); // Convert to 0-based
      const column = firstError.column || 0;
      
      const position = new vscode.Position(line, column);
      const range = new vscode.Range(position, position);
      
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
      
      // Show error message
      vscode.window.showErrorMessage(
        `Line ${firstError.line}: ${firstError.message}`,
        'Show Problems Panel'
      ).then(choice => {
        if (choice === 'Show Problems Panel') {
          vscode.commands.executeCommand('workbench.panel.markers.view.focus');
        }
      });
      
    } catch (error) {
      vscode.window.showErrorMessage(`Error opening file ${firstError.file}: ${error}`);
    }
  }

  public needsAssembly(sourceFile: string, outputBds: string): boolean {
    if (!fs.existsSync(outputBds)) {
      return true;
    }

    try {
      const sourceStat = fs.statSync(sourceFile);
      const bdsStat = fs.statSync(outputBds);
      
      return sourceStat.mtimeMs > bdsStat.mtimeMs;
    } catch (error) {
      // If we can't stat files, assume assembly is needed
      return true;
    }
  }

  public dispose(): void {
    this.outputChannel.dispose();
  }
}
