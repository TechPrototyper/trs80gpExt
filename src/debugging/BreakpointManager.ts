import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface BreakpointInfo {
  address: number;
  file: string;
  line: number;
  label?: string;
}

export interface SymbolInfo {
  address: number;
  label: string;
  file?: string;
  line?: number;
}

export class BreakpointManager {
  
  /**
   * Get active breakpoints from VS Code and convert them to addresses
   */
  public static async getBreakpointAddresses(bdsFile: string): Promise<BreakpointInfo[]> {
    const breakpoints = vscode.debug.breakpoints;
    const symbolMap = this.parseBdsFile(bdsFile);
    const breakpointInfos: BreakpointInfo[] = [];

    console.log(`[DEBUG] Total VS Code breakpoints: ${breakpoints.length}`);
    console.log(`[DEBUG] BDS symbols found: ${symbolMap.length}`);

    for (const breakpoint of breakpoints) {
      console.log(`[DEBUG] Checking breakpoint type: ${breakpoint.constructor.name}`);
      if (breakpoint instanceof vscode.SourceBreakpoint) {
        const sourceFile = breakpoint.location.uri.fsPath;
        const line = breakpoint.location.range.start.line + 1; // Convert to 1-based

        console.log(`[DEBUG] Source breakpoint: ${sourceFile}:${line}`);

        // Since zmac BDS doesn't provide line-to-address mapping,
        // we'll try to find the closest label or use heuristics
        const address = this.findAddressForSourceLine(sourceFile, line, symbolMap);
        
        if (address !== null) {
          console.log(`[DEBUG] Found address for breakpoint: $${address.toString(16)} at line ${line}`);
          breakpointInfos.push({
            address: address,
            file: sourceFile,
            line: line,
            label: `line_${line}`
          });
        } else {
          console.log(`[DEBUG] Could not map line ${line} to an address`);
        }
      }
    }

    console.log(`[DEBUG] Final breakpoint addresses: ${breakpointInfos.length}`);
    
    // Limit to 4 breakpoints (trs80gp limitation)
    return breakpointInfos.slice(0, 4);
  }

  /**
   * Get the program entry point from the BDS file
   */
  public static getEntryPoint(bdsFile: string): number | null {
    if (!fs.existsSync(bdsFile)) {
      return null;
    }

    try {
      const content = fs.readFileSync(bdsFile, 'utf8');
      const lines = content.split('\n');
      
      // Look for entry point line (format: "ADDRESS e")
      for (const line of lines) {
        const trimmed = line.trim();
        const entryMatch = trimmed.match(/^([0-9A-Fa-f]{4})\s+e\s*$/);
        if (entryMatch) {
          const [, addressStr] = entryMatch;
          return parseInt(addressStr, 16);
        }
      }

      // Fallback: look for 'main' label
      const symbolMap = this.parseBdsFile(bdsFile);
      const mainSymbol = symbolMap.find(s => 
        s.label?.toLowerCase() === 'main'
      );
      if (mainSymbol) {
        return mainSymbol.address;
      }

      // Last fallback: use first symbol address
      if (symbolMap.length > 0) {
        return symbolMap[0].address;
      }

    } catch (error) {
      console.error('Error reading entry point from BDS file:', error);
    }

    return null;
  }

  /**
   * Parse BDS file to extract symbol information
   */
  public static parseBdsFile(bdsFilePath: string): SymbolInfo[] {
    if (!fs.existsSync(bdsFilePath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(bdsFilePath, 'utf8');
      const lines = content.split('\n');
      const symbols: SymbolInfo[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse zmac BDS format
        // Label definition format: "ADDRESS a LABEL"
        const labelMatch = line.match(/^([0-9A-Fa-f]{4})\s+a\s+(\w+)$/);
        if (labelMatch) {
          const [, addressStr, label] = labelMatch;
          symbols.push({
            address: parseInt(addressStr, 16),
            label: label,
            line: i + 1
          });
          continue;
        }

        // Source line format: "ADDRESS ADDRESS s SOURCE_TEXT" 
        // We can use this to map addresses to source lines
        const sourceMatch = line.match(/^([0-9A-Fa-f]{4})\s+[0-9A-Fa-f]{4}\s+s\s+(.*)$/);
        if (sourceMatch) {
          const [, addressStr, sourceText] = sourceMatch;
          // Only create symbols for lines that look like labels (end with :)
          const labelInSource = sourceText.match(/^\s*(\w+):\s*/);
          if (labelInSource) {
            const [, labelName] = labelInSource;
            symbols.push({
              address: parseInt(addressStr, 16),
              label: labelName,
              line: i + 1
            });
          }
          continue;
        }

        // Fallback: try to parse older format styles
        // Format: "ADDRESS LABEL" or "ADDRESS    LABEL"
        const simpleMatch = line.match(/^([0-9A-Fa-f]{4})\s+(\w+)$/);
        if (simpleMatch) {
          const [, addressStr, label] = simpleMatch;
          symbols.push({
            address: parseInt(addressStr, 16),
            label: label,
            line: i + 1
          });
          continue;
        }

        // Format: "ADDRESS LABEL (FILE:LINE)"
        const complexMatch = line.match(/^([0-9A-Fa-f]{4})\s+(\w+)\s*\(([^:]+):(\d+)\)$/);
        if (complexMatch) {
          const [, addressStr, label, file, lineStr] = complexMatch;
          symbols.push({
            address: parseInt(addressStr, 16),
            label: label,
            file: file,
            line: parseInt(lineStr, 10)
          });
          continue;
        }
      }

      return symbols;
    } catch (error) {
      console.error('Error parsing BDS file:', error);
      return [];
    }
  }

  /**
   * Create diagnostic collection for assembly errors
   */
  public static createDiagnosticCollection(): vscode.DiagnosticCollection {
    return vscode.languages.createDiagnosticCollection('trs80gp');
  }

  /**
   * Update diagnostics based on assembly errors
   */
  public static updateDiagnostics(
    diagnostics: vscode.DiagnosticCollection,
    errors: Array<{file: string, line: number, message: string, severity: 'error' | 'warning'}>
  ): void {
    // Clear existing diagnostics
    diagnostics.clear();

    // Group errors by file
    const errorsByFile = new Map<string, vscode.Diagnostic[]>();

    for (const error of errors) {
      if (!errorsByFile.has(error.file)) {
        errorsByFile.set(error.file, []);
      }

      const line = Math.max(0, error.line - 1); // Convert to 0-based
      const range = new vscode.Range(line, 0, line, Number.MAX_VALUE);
      
      const diagnostic = new vscode.Diagnostic(
        range,
        error.message,
        error.severity === 'error' 
          ? vscode.DiagnosticSeverity.Error 
          : vscode.DiagnosticSeverity.Warning
      );
      
      diagnostic.source = 'zmac';
      errorsByFile.get(error.file)!.push(diagnostic);
    }

    // Set diagnostics for each file
    for (const [file, fileDiagnostics] of errorsByFile) {
      try {
        const uri = vscode.Uri.file(file);
        diagnostics.set(uri, fileDiagnostics);
      } catch (error) {
        console.error(`Error setting diagnostics for ${file}:`, error);
      }
    }
  }

  /**
   * Format breakpoint addresses for trs80gp command line
   */
  public static formatBreakpointsForEmulator(breakpoints: BreakpointInfo[]): string[] {
    const args: string[] = [];
    
    for (const bp of breakpoints) {
      args.push('-b', bp.address.toString(16).toUpperCase());
    }
    
    return args;
  }

  /**
   * Show breakpoint information to user
   */
  public static showBreakpointInfo(breakpoints: BreakpointInfo[], outputChannel?: vscode.OutputChannel): void {
    if (breakpoints.length === 0) {
      if (outputChannel) {
        outputChannel.appendLine('ℹ️ No breakpoints set');
      }
      return;
    }

    const messages = breakpoints.map(bp => 
      `  ${path.basename(bp.file)}:${bp.line} → $${bp.address.toString(16).toUpperCase()}${bp.label ? ` (${bp.label})` : ''}`
    );

    const message = `🔍 Breakpoints (${breakpoints.length}/4):\n${messages.join('\n')}`;
    
    if (outputChannel) {
      outputChannel.appendLine(message);
    } else {
      // Fallback to notification if no output channel provided
      vscode.window.showInformationMessage(
        `Debug session starting with ${breakpoints.length} breakpoint(s)`,
        'Show Details'
      ).then(choice => {
        if (choice === 'Show Details') {
          vscode.window.showInformationMessage(message);
        }
      });
    }
  }

  /**
   * Find memory address for a source line using the listing file
   * The listing file (.lst) contains the actual assembled addresses for each source line
   */
  private static findAddressForSourceLine(sourceFile: string, targetLine: number, symbolMap: SymbolInfo[]): number | null {
    try {
      // Get the listing file (.lst) which contains line-to-address mapping
      const sourceBaseName = path.basename(sourceFile, path.extname(sourceFile));
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        console.log(`[DEBUG] No workspace folder found`);
        return null;
      }

      // Try to find the output directory - check configuration
      let outputDir = '.zout'; // default
      try {
        const config = vscode.workspace.getConfiguration('trs80gp');
        outputDir = config.get('defaultOutputDir', '.zout');
      } catch (error) {
        console.log(`[DEBUG] Using default output dir: ${outputDir}`);
      }

      const listingFile = path.join(workspaceFolder.uri.fsPath, outputDir, `${sourceBaseName}.lst`);

      console.log(`[DEBUG] Looking for listing file: ${listingFile}`);
      
      if (!fs.existsSync(listingFile)) {
        console.log(`[DEBUG] Listing file not found: ${listingFile}`);
        // Fallback to old method using nearest label
        return this.findAddressUsingNearestLabel(sourceFile, targetLine, symbolMap);
      }

      const listingContent = fs.readFileSync(listingFile, 'utf8');
      console.log(`[DEBUG] Parsing listing file for line ${targetLine}`);

      // Parse the listing file to find the address for the given source line
      // Format: "line:offset address opcode  source"
      // Example: "   7:   17+10	6003  210C60  	        ld      hl, hello_msg"
      
      const lines = listingContent.split('\n');
      for (const line of lines) {
        // Match listing format: line number, then address
        const match = line.match(/^\s*(\d+):\s*[^	]*	([0-9A-Fa-f]{4})\s+/);
        if (match) {
          const listingLineNumber = parseInt(match[1], 10);
          const addressHex = match[2];
          
          if (listingLineNumber === targetLine) {
            const address = parseInt(addressHex, 16);
            console.log(`[DEBUG] ✅ Found address for line ${targetLine}: $${addressHex} (${address})`);
            return address;
          }
        }
      }

      console.log(`[DEBUG] No address found for line ${targetLine} in listing file`);
      // Fallback to old method
      return this.findAddressUsingNearestLabel(sourceFile, targetLine, symbolMap);

    } catch (error) {
      console.error('[DEBUG] Error parsing listing file:', error);
      // Fallback to old method
      return this.findAddressUsingNearestLabel(sourceFile, targetLine, symbolMap);
    }
  }

  /**
   * Fallback method: Find memory address using nearest label (old method)
   */
  private static findAddressUsingNearestLabel(sourceFile: string, targetLine: number, symbolMap: SymbolInfo[]): number | null {
    try {
      // Read the source file to analyze it
      const sourceContent = fs.readFileSync(sourceFile, 'utf8');
      const sourceLines = sourceContent.split('\n');
      
      if (targetLine > sourceLines.length) {
        return null;
      }

      const targetLineText = sourceLines[targetLine - 1].trim();
      console.log(`[DEBUG] Fallback: Analyzing line ${targetLine}: "${targetLineText}"`);

      // Strategy 1: If the line contains a label, find that label in symbols
      const labelMatch = targetLineText.match(/^(\w+):/);
      if (labelMatch) {
        const labelName = labelMatch[1];
        console.log(`[DEBUG] Found label on target line: ${labelName}`);
        const symbol = symbolMap.find(s => s.label === labelName);
        if (symbol) {
          console.log(`[DEBUG] Found symbol address for label ${labelName}: $${symbol.address.toString(16)}`);
          return symbol.address;
        }
      }

      // Strategy 2: Find the nearest label before this line
      let nearestLabel: SymbolInfo | null = null;
      let nearestDistance = Infinity;

      // Look for labels in the source code and match with symbol map
      for (let i = 0; i < sourceLines.length; i++) {
        const line = sourceLines[i].trim();
        const match = line.match(/^(\w+):/);
        if (match) {
          const labelName = match[1];
          const symbol = symbolMap.find(s => s.label === labelName);
          if (symbol) {
            const lineNumber = i + 1;
            if (lineNumber <= targetLine) {
              const distance = targetLine - lineNumber;
              if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestLabel = symbol;
              }
            }
          }
        }
      }

      if (nearestLabel) {
        console.log(`[DEBUG] Using nearest label ${nearestLabel.label} at $${nearestLabel.address.toString(16)} (distance: ${nearestDistance} lines)`);
        return nearestLabel.address;
      }

      console.log(`[DEBUG] No suitable address found for line ${targetLine}`);
      return null;

    } catch (error) {
      console.error(`[DEBUG] Error analyzing source line ${targetLine}:`, error);
      return null;
    }
  }
}
