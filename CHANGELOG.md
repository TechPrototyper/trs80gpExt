# Changelog

All notable changes to the TRS-80 Development Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2025-06-05

### Added
- Robust configuration fallback system with default values
- Enhanced validation for configuration files and settings
- Comprehensive logging for debugging configuration issues
- Smart entry point detection from BDS files
- Output channels for better user experience (reduced notification spam)

### Fixed
- Configuration loading when project config files are missing
- Emulator argument validation and type checking
- File detection for `.a80` assembly files
- Breakpoint address calculation using listing files for accuracy

### Improved
- Error handling throughout the extension
- Documentation with comprehensive README
- Project structure organization

## [0.1.1] - 2025-06-04

### Added
- Debug Adapter Protocol support for VS Code breakpoints
- Smart listing file parser for accurate breakpoint addresses
- Automatic BDS file loading with `-ls` flag
- Enhanced output formatting with emojis and structure

### Fixed
- EmulatorManager argument handling
- Breakpoint address detection accuracy
- Extension packaging and installation

## [0.1.0] - 2025-06-04

### Added
- Initial release of TRS-80 Development Extension
- TRS-80GP emulator integration with process management
- ZMAC assembler support with automatic compilation
- VS Code breakpoint conversion to emulator breakpoints
- Z-80 assembly syntax highlighting and language support
- Flexible configuration system (global + project-specific)
- Commands: Run, Debug, Assemble Only, Stop, Status
- Support for multiple TRS-80 models (Model I, III, 4)
- Comprehensive output file generation (.cmd, .bds, .lst, .hex, .cas, .wav)

### Features
- File associations for `.z`, `.a80`, `.asm`, `.s` assembly files
- Automatic assembly on file changes
- Error navigation and diagnostic reporting
- Symbol table integration for debugging
- Project configuration via `.vscode/trs80gp.json`

## [Unreleased]

### Planned
- VS Code Marketplace publication
- Enhanced debugging features
- Additional TRS-80 model support
- Improved error reporting and diagnostics
- Community contributions and feedback integration