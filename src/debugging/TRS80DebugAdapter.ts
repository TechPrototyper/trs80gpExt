import * as vscode from 'vscode';

/**
 * TRS-80 Debug Adapter for VS Code debugging integration
 * Implements basic debug adapter protocol for TRS-80 assembly debugging
 */
export class TRS80DebugAdapter {
    private outputChannel: vscode.OutputChannel;
    private session: vscode.DebugSession | undefined;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    /**
     * Register the debug adapter with VS Code
     */
    public static register(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): vscode.Disposable {
        const adapter = new TRS80DebugAdapter(outputChannel);
        
        // Register debug adapter descriptor factory
        const factory = new TRS80DebugAdapterDescriptorFactory();
        const disposable1 = vscode.debug.registerDebugAdapterDescriptorFactory('trs80gp', factory);
        
        // Register debug configuration provider
        const provider = new TRS80DebugConfigurationProvider();
        const disposable2 = vscode.debug.registerDebugConfigurationProvider('trs80gp', provider);

        // Listen for debug session events
        const disposable3 = vscode.debug.onDidStartDebugSession(session => {
            if (session.type === 'trs80gp') {
                adapter.session = session;
                outputChannel.appendLine(`Debug session started: ${session.name}`);
            }
        });

        const disposable4 = vscode.debug.onDidTerminateDebugSession(session => {
            if (session.type === 'trs80gp') {
                adapter.session = undefined;
                outputChannel.appendLine(`Debug session terminated: ${session.name}`);
            }
        });

        return vscode.Disposable.from(disposable1, disposable2, disposable3, disposable4);
    }

    /**
     * Get active debug session
     */
    public getSession(): vscode.DebugSession | undefined {
        return this.session;
    }
}

/**
 * Debug Adapter Descriptor Factory for TRS-80 debugging
 */
class TRS80DebugAdapterDescriptorFactory implements vscode.DebugAdapterDescriptorFactory {
    createDebugAdapterDescriptor(session: vscode.DebugSession): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
        // For now, we'll use inline debug adapter (runs in extension host)
        // This allows us to integrate directly with our emulator management
        return new vscode.DebugAdapterInlineImplementation(new TRS80DebugSession());
    }
}

/**
 * Debug Configuration Provider for TRS-80 debugging
 */
class TRS80DebugConfigurationProvider implements vscode.DebugConfigurationProvider {
    resolveDebugConfiguration(
        folder: vscode.WorkspaceFolder | undefined, 
        config: vscode.DebugConfiguration, 
        token?: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.DebugConfiguration> {
        
        // If no configuration provided, create a default one
        if (!config.type && !config.request && !config.name) {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'z80asm') {
                config.type = 'trs80gp';
                config.name = 'Debug TRS-80 Assembly';
                config.request = 'launch';
                config.program = editor.document.fileName;
                config.stopOnEntry = true;
            }
        }

        if (!config.program) {
            return vscode.window.showInformationMessage("Cannot find a program to debug").then(_ => {
                return undefined;	// abort launch
            });
        }

        return config;
    }
}

/**
 * Minimal Debug Session implementation for TRS-80
 * This handles the Debug Adapter Protocol communication
 */
class TRS80DebugSession implements vscode.DebugAdapter {
    private outputChannel: vscode.OutputChannel;
    private _onDidSendMessage = new vscode.EventEmitter<vscode.DebugProtocolMessage>();

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('TRS-80 Debug');
    }

    /**
     * Event emitter for messages sent to VS Code
     */
    get onDidSendMessage(): vscode.Event<vscode.DebugProtocolMessage> {
        return this._onDidSendMessage.event;
    }

    /**
     * Handle incoming Debug Adapter Protocol messages
     */
    public handleMessage(message: vscode.DebugProtocolMessage): void {
        this.outputChannel.appendLine(`Debug message: ${JSON.stringify(message)}`);
        
        // Cast to any to access DAP properties not typed in VS Code API
        const request = message as any;
        
        // Handle basic DAP messages
        switch (request.command) {
            case 'initialize':
                this.sendResponse(request, {
                    supportsBreakpointLocationsRequest: true,
                    supportsSetBreakpointsRequest: true
                });
                this.sendEvent('initialized');
                break;
            case 'launch':
                this.outputChannel.appendLine('Launching TRS-80 debug session...');
                this.sendResponse(request);
                break;
            case 'setBreakpoints':
                this.outputChannel.appendLine(`Setting breakpoints: ${JSON.stringify(request.arguments)}`);
                this.sendResponse(request, {
                    breakpoints: request.arguments?.breakpoints?.map((bp: any) => ({
                        verified: true,
                        line: bp.line
                    })) || []
                });
                break;
            case 'configurationDone':
                this.sendResponse(request);
                break;
            case 'threads':
                this.sendResponse(request, {
                    threads: [{ id: 1, name: 'Main Thread' }]
                });
                break;
            case 'disconnect':
                this.sendResponse(request);
                break;
            default:
                this.sendResponse(request);
        }
    }

    /**
     * Send a response back to VS Code
     */
    private sendResponse(request: any, body?: any): void {
        const response: vscode.DebugProtocolMessage = {
            seq: 0,
            type: 'response',
            request_seq: request.seq,
            command: request.command,
            success: true,
            body: body
        } as any;
        this.outputChannel.appendLine(`Debug response: ${JSON.stringify(response)}`);
        this._onDidSendMessage.fire(response);
    }

    /**
     * Send an event to VS Code
     */
    private sendEvent(event: string, body?: any): void {
        const message: vscode.DebugProtocolMessage = {
            seq: 0,
            type: 'event',
            event: event,
            body: body
        } as any;
        this.outputChannel.appendLine(`Debug event: ${JSON.stringify(message)}`);
        this._onDidSendMessage.fire(message);
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this._onDidSendMessage.dispose();
        this.outputChannel.dispose();
    }
}
