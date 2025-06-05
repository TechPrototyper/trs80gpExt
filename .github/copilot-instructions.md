# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a VS Code extension project. Please use the get_vscode_api with a query as input to fetch the latest VS Code API references.

## Project Context

This VS Code extension is designed for TRS-80 development with the following key features:

- **TRS-80 Emulation**: Integration with trs80gp emulator
- **Assembly**: Support for zmac Z-80 assembler
- **Development Workflow**: Run and debug commands for Z-80 assembly code
- **Breakpoint Support**: VS Code breakpoint integration with emulator debugging
- **Configuration**: Flexible project and global configuration system

## Key Components

1. **Commands**: `trs80gp.run` and `trs80gp.debug` for executing code
2. **Assembler Integration**: Automatic zmac compilation when source files change
3. **Emulator Management**: Process management for trs80gp instances
4. **Breakpoint Conversion**: Convert VS Code breakpoints to emulator format
5. **Error Handling**: Parse assembler errors and navigate to error locations

## File Structure

- `src/extension.ts` - Main extension entry point
- `src/assembler/` - zmac assembler integration
- `src/emulator/` - trs80gp emulator management
- `src/debugging/` - Breakpoint and debugging features
- `src/configuration/` - Settings and project configuration
- `src/commands/` - VS Code command implementations

## Configuration Schema

The extension supports both global VS Code settings and project-specific configuration files (`.vscode/trs80gp.json`).
