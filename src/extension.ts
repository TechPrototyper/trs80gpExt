// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TRS80Commands } from './commands/TRS80Commands';
import { ConfigurationManager } from './configuration/ConfigurationManager';
import { TRS80DebugAdapter } from './debugging/TRS80DebugAdapter';

let trs80Commands: TRS80Commands;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('TRS-80 Development extension is now active!');

	// Initialize command handler
	trs80Commands = new TRS80Commands();

	// Register commands
	const runCommand = vscode.commands.registerCommand('trs80gp.run', async () => {
		await trs80Commands.run();
	});

	const debugCommand = vscode.commands.registerCommand('trs80gp.debug', async () => {
		await trs80Commands.debug();
	});

	const assembleCommand = vscode.commands.registerCommand('trs80gp.assemble', async () => {
		await trs80Commands.assembleOnly();
	});

	const stopCommand = vscode.commands.registerCommand('trs80gp.stop', async () => {
		await trs80Commands.stop();
	});

	const statusCommand = vscode.commands.registerCommand('trs80gp.status', async () => {
		await trs80Commands.status();
	});

	const createConfigCommand = vscode.commands.registerCommand('trs80gp.createConfig', async () => {
		await ConfigurationManager.createProjectConfig();
	});

	// Add commands to subscriptions
	context.subscriptions.push(
		runCommand,
		debugCommand,
		assembleCommand,
		stopCommand,
		statusCommand,
		createConfigCommand
	);

	// DEBUG: Temporarily disable debug adapter to test breakpoint detection
	// const outputChannel = vscode.window.createOutputChannel('TRS-80 Debug');
	// const debugAdapterDisposable = TRS80DebugAdapter.register(context, outputChannel);
	// context.subscriptions.push(debugAdapterDisposable);

	// Show welcome message for first-time users
	const config = vscode.workspace.getConfiguration('trs80gp');
	const showWelcome = config.get('showWelcome', true);
	if (showWelcome) {
		vscode.window.showInformationMessage(
			'TRS-80 Development Extension is ready! Try "TRS-80: Run" from the Command Palette.',
			'Open Command Palette',
			'Don\'t show again'
		).then(choice => {
			if (choice === 'Open Command Palette') {
				vscode.commands.executeCommand('workbench.action.showCommands');
			} else if (choice === 'Don\'t show again') {
				config.update('showWelcome', false, vscode.ConfigurationTarget.Global);
			}
		});
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (trs80Commands) {
		trs80Commands.dispose();
	}
}
