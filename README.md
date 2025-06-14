# TRS-80 Development Extension for VS Code

A Visual Studio Code extension that integrates **trs80gp emulator** and **zmac assembler** by George Phillips to provide a complete Z-80 assembly development environment for TRS-80 computers. This extension acts as a bridge between VS Code and these essential TRS-80 development tools.

**⚠️ Important:** This extension requires both **trs80gp** and **zmac** to function. They are not optional dependencies but core requirements that must be installed separately.

## ✨ Features

### 🎯 **trs80gp Emulator Integration**
- **Direct Execution**: Run your Z-80 assembly code immediately in the trs80gp emulator
- **Debug Support**: Full debugging with breakpoints, stepping, and memory inspection
- **Model Support**: Target TRS-80 Model I, III, or 4 via emulator arguments
- **Process Management**: Automatic emulator lifecycle management

### 🔧 **zmac Assembler Integration**
- **Automatic Assembly**: Compile your source files when they change
- **Error Navigation**: Click on assembly errors to jump to source locations
- **Symbol Generation**: Automatic debug symbol (BDS) file creation
- **Multi-format Output**: Generate CMD, HEX, CAS, and WAV files

### 🐛 **VS Code Integration**
- **Breakpoint Conversion**: VS Code breakpoints automatically work in trs80gp debugger
- **Smart Detection**: Supports `.a80`, `.z`, `.asm`, and `.s` file extensions
- **Status Tracking**: Monitor emulator process status and uptime

### ⚙️ **Flexible Configuration**
- **Global Settings**: Configure emulator and assembler paths in VS Code settings
- **Project Configuration**: Override settings per project using `.vscode/trs80gp.json`
- **Robust Defaults**: Sensible fallback configuration when settings are missing
- **Multi-Model Support**: Target TRS-80 Model I, III, or 4

## 📋 Core Requirements

This extension requires two essential tools by **George Phillips** to function:

### 🎮 **trs80gp Emulator (Required)**
A high-fidelity TRS-80 emulator with comprehensive debugging support.

**Download:** http://48k.ca/trs80gp.html

**Installation:**
- Download the appropriate version for your platform (macOS, Linux, Windows)
- Install according to platform instructions
- Either add to your system PATH or configure the full path in extension settings

### 🔧 **zmac Assembler (Required)**  
A Z-80 macro assembler that generates TRS-80 compatible output with debug symbols.

**Download:** http://48k.ca/zmac.html

**Installation:**
- Download the appropriate version for your platform
- Install according to platform instructions  
- Either add to your system PATH or configure the full path in extension settings

**Configuration Options:**
1. **Add to PATH** (Recommended): Install tools so they're globally accessible
2. **Configure Paths**: Set `trs80gp.emulatorPath` and `trs80gp.zmacPath` in VS Code settings

## 🚀 Quick Start

### 1. **Install Required Tools**
Before using this extension, you must install both core tools:

1. **Download trs80gp emulator** from http://48k.ca/trs80gp.html
2. **Download zmac assembler** from http://48k.ca/zmac.html  
3. **Install both tools** according to their platform instructions
4. **Add to PATH** or note installation paths for VS Code settings

### 2. **Install the Extension**
- **Go to**: [GitHub Releases](https://github.com/TechPrototyper/trs80gpExt/releases/latest)
- **Download**: `trs80gp-extension-1.0.0-release.vsix`
- **Install**: `code --install-extension trs80gp-extension-1.0.0-release.vsix`

### 3. **Configure Paths** (if not in PATH)
Open VS Code settings and configure:
- `trs80gp.emulatorPath`: Full path to trs80gp executable
- `trs80gp.zmacPath`: Full path to zmac executable

### 4. **Create a Project**
```bash
mkdir my-trs80-project
cd my-trs80-project
code .
```

### 5. **Create Your First Program**
Create a file named `hello.a80`:
```z80asm
; hello.a80 - Simple TRS-80 "Hello World" program
        org     $6000           ; Start at memory location $6000

main:   call    $01c9           ; Call ROM to clear the screen
        ld      hl, hello_msg   ; Load address of message into HL
        call    $021B           ; Call ROM routine to output string
        jp      $402D           ; Return to operating system

; Data section
hello_msg:
        defb    "Hello, TRS-80 World!", 13, 0
        end     main            ; Entry point is main
```

### 6. **Configure the Project** (Optional)
Create `.vscode/trs80gp.json`:
```json
{
  "outputDir": ".zout",
  "zmacArgs": [
    "--od",
    ".zout",
    "-L",
    "-m"
  ],
  "emulatorArgs": ["-m3"],
  "target": "model3",
  "defaultSourceFile": "hello.a80"
}
```

### 7. **Run Your Program**
- **Press `Ctrl+Shift+P`** (Cmd+Shift+P on macOS)
- **Type**: `TRS-80: Debug` or `TRS-80: Run`
- **Watch**: Your program compile and run in the TRS-80 emulator!

## 📖 Usage

### Available Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| **TRS-80: Run** | Assemble and run program | `Ctrl+F5` |
| **TRS-80: Debug** | Assemble and debug with breakpoints | `F5` |
| **TRS-80: Assemble Only** | Compile without running | `Ctrl+Shift+B` |
| **TRS-80: Stop** | Stop running emulator | `Shift+F5` |
| **TRS-80: Status** | Show emulator status | - |

### Setting Breakpoints

1. Open your `.a80` assembly file
2. Click in the left margin next to line numbers to set breakpoints
3. Run **TRS-80: Debug** command
4. The emulator will stop at your breakpoints for inspection

**Note:** This extension converts VS Code breakpoints to the appropriate format for the trs80gp emulator's debugging interface. Refer to the trs80gp emulator documentation for specific debugging commands within the emulator.

## ⚙️ Configuration

The extension supports both global VS Code settings and project-specific configuration.

### Global Settings

Configure these in VS Code settings (`Ctrl+,` or `Cmd+,`):

| Setting | Description | Default |
|---------|-------------|---------|
| `trs80gp.emulatorPath` | Path to trs80gp executable | `/Applications/trs80gp.app/Contents/MacOS/trs80gp` |
| `trs80gp.zmacPath` | Path to zmac assembler | `zmac` |
| `trs80gp.defaultOutputDir` | Default output directory | `.zout` |
| `trs80gp.defaultEmulatorArgs` | Default emulator arguments | `["-m3"]` |
| `trs80gp.defaultTarget` | Default TRS-80 model | `model3` |
| `trs80gp.autoAssemble` | Auto-assemble on file changes | `true` |

### Project Configuration

Create `.vscode/trs80gp.json` in your project root to override global settings:

```json
{
  "outputDir": ".zout",
  "zmacArgs": [
    "--od",
    ".zout",
    "-L",
    "-m"
  ],
  "emulatorArgs": ["-m3"],
  "target": "model3",
  "defaultSourceFile": "main.a80"
}
```

**Configuration Options:**

| Setting | Description | Example Values |
|---------|-------------|----------------|
| `outputDir` | Directory for assembled output | `.zout`, `build`, `output` |
| `zmacArgs` | Arguments passed to zmac assembler | See example above |
| `emulatorArgs` | Arguments passed to trs80gp | `["-m1"]`, `["-m3"]`, `["-m4"]` |
| `target` | Target TRS-80 model | `model1`, `model3`, `model4` |
| `defaultSourceFile` | Default file to assemble/run | `main.a80`, `program.asm` |

**zmac Arguments Explained:**
- `--od .zout` - Set output directory
- `-L` - Generate listing file (.lst)
- `-m` - Generate symbol file (.bds) for debugging

### Target Models

| Target | Description | Emulator Flag |
|--------|-------------|---------------|
| `model1` | TRS-80 Model I | `-m1` |
| `model3` | TRS-80 Model III | `-m3` |
| `model4` | TRS-80 Model 4 | `-m4` |

## 📁 Project Structure

The extension works with this typical project structure:

```
your-trs80-project/
├── .vscode/
│   └── trs80gp.json          # Project configuration
├── *.a80                     # Assembly source files
├── .zout/                    # Generated output files
│   ├── *.cmd                 # TRS-80 executable
│   ├── *.bds                 # Debug symbols
│   ├── *.lst                 # Assembly listing
│   └── *.hex, *.cas, *.wav   # Additional formats
└── README.md
```

## 🔧 Output Files

The assembler generates comprehensive output in the `.zout/` directory:

### Core Files
- **`.cmd`** - TRS-80 command file (executable)
- **`.bds`** - Debug symbols for breakpoints
- **`.lst`** - Assembly listing with addresses

### Additional Formats
- **`.hex`** - Intel HEX format
- **`.cas`** - Cassette image files
- **`.wav`** - Audio cassette files (multiple baud rates)
- **`.ams`** - Assembled source with expansions

## Credits

This extension integrates excellent tools:

- **trs80gp**: A faithful TRS-80 Model I/III emulator with debugging capabilities, created by George Phillips
- **zmac**: A powerful Z-80 macro assembler, with enhanced version provided by George Phillips

Visit [George Phillips' homepage at 48k.ca](https://48k.ca/) for documentation, updates, and additional TRS-80 development tools.

## 🤝 Attribution & Credits

This extension builds upon the excellent work of:

- **George Phillips** - Creator of trs80gp emulator and zmac assembler
  - trs80gp: http://48k.ca/trs80gp.html
  - zmac: http://48k.ca/zmac.html
- **TRS-80 Community** - For preserving this important piece of computing history

## 🚀 Installation

### **📦 Download & Install (Recommended)**

**Step 1: Download Extension**
- Go to [Releases](https://github.com/TechPrototyper/trs80gpExt/releases/latest)
- Download `trs80gp-extension-1.0.0-release.vsix`

**Step 2: Install Extension**
```bash
# Command line installation:
code --install-extension trs80gp-extension-1.0.0-release.vsix
```

**Or install via VS Code UI:**
1. Open VS Code
2. Go to Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Click "..." menu → "Install from VSIX..."
4. Select the downloaded VSIX file
5. Restart VS Code when prompted

### **✅ Verify Installation**

After installation, verify the extension is working:

1. **Check Extensions List**: Look for "TRS-80 Development" in your installed extensions
2. **Open Command Palette**: Press `Ctrl+Shift+P` (`Cmd+Shift+P` on macOS)
3. **Type "TRS-80"**: You should see commands like:
   - `TRS-80: Run`
   - `TRS-80: Debug`
   - `TRS-80: Status`

### **⚠️ Expected Warnings**

**"Extension is not signed" Warning**
- This is normal for VSIX installations outside the official store
- Click "Install Anyway" to proceed
- The extension is safe - it's distributed directly from our GitHub repository

**Missing Tools Warnings**
- If you see "trs80gp not found" or "zmac not found" messages
- This means you need to install the required tools (see Core Requirements above)
- The extension will guide you to download them from http://48k.ca/

### **🏪 Why Not on VS Code Marketplace?**

This extension is currently distributed via GitHub Releases because:
- **Publisher Requirements**: Official store publishing requires additional verification steps
- **Direct Distribution**: GitHub Releases provide immediate access without delays
- **Community Focus**: TRS-80 development is a specialized community - direct distribution works well
- **Future Planning**: Official store publication may be considered based on community feedback

**Advantages of GitHub Release Distribution:**
- ✅ Immediate updates and releases
- ✅ Complete transparency (source code visible)
- ✅ No artificial restrictions or review delays
- ✅ Direct community feedback via GitHub Issues

## 🛠️ Development & Building

### Building from Source

If you want to build the extension yourself or contribute to development:

```bash
# Clone the repository
git clone https://github.com/TechPrototyper/trs80gpExt.git
cd trs80gpExt

# Install dependencies and build
make setup

# Or step by step:
npm install          # Install dependencies
npm run compile      # Compile TypeScript
make package         # Create VSIX file
```

### Development Commands

```bash
make help           # Show all available commands
make watch          # Watch for changes and recompile
make test           # Run tests
make clean          # Clean build artifacts
```

### Requirements for Development
- Node.js 16+
- TypeScript
- VS Code Extension API

## 🤝 Contributing

Contributions are welcome! Please feel free to:

- 🐛 Report bugs
- 💡 Suggest features
- 🔧 Submit pull requests
- 📚 Improve documentation

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Happy TRS-80 development! 🎮✨**

This VS Code extension integrates the essential TRS-80 development tools:
- **trs80gp emulator** and **zmac assembler** are created by **George Phillips**
- Download both tools from [48k.ca](https://48k.ca/)
- This extension is not affiliated with but requires these tools to function
- Check [48k.ca](https://48k.ca/) for the tools' respective license terms

**Enjoy developing for the TRS-80!**
