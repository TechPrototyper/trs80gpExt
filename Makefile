# TRS-80 Development Extension - Build System
# Platform-agnostic Makefile for development and distribution

.PHONY: help install compile watch package clean test lint format check-tools

# Default target
help: ## Show this help message
	@echo "TRS-80 Development Extension - Build Commands"
	@echo "=============================================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Platform Requirements:"
	@echo "  - Node.js 16+ (npm)"
	@echo "  - VS Code Extension CLI (vsce)"
	@echo "  - Git (for repository management)"

# Development setup
install: ## Install all dependencies
	@echo "📦 Installing dependencies..."
	npm install
	@echo "✅ Dependencies installed successfully"

check-tools: ## Verify required tools are available
	@echo "🔍 Checking required tools..."
	@command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed"; exit 1; }
	@command -v npx >/dev/null 2>&1 || { echo "❌ npx is required but not installed"; exit 1; }
	@npx vsce --version >/dev/null 2>&1 || { echo "📦 Installing vsce..."; npm install -g vsce; }
	@echo "✅ All required tools are available"

# Build and compilation
compile: install ## Compile TypeScript to JavaScript
	@echo "🔨 Compiling TypeScript..."
	npm run compile
	@echo "✅ Compilation complete"

watch: install ## Watch for changes and recompile automatically
	@echo "👀 Starting watch mode..."
	npm run watch

# Testing and quality
test: compile ## Run all tests
	@echo "🧪 Running tests..."
	npm run test
	@echo "✅ Tests completed"

lint: ## Run ESLint on source code
	@echo "🔍 Linting source code..."
	npm run lint
	@echo "✅ Linting complete"

format: ## Format code (if formatter is configured)
	@echo "🎨 Formatting code..."
	@if [ -f ".prettierrc" ] || [ -f "prettier.config.js" ]; then \
		npx prettier --write "src/**/*.ts" "*.json" "*.md"; \
	else \
		echo "ℹ️  No Prettier configuration found, skipping format"; \
	fi

# Packaging and distribution
package: compile lint ## Build VSIX package for distribution
	@echo "📦 Building VSIX package..."
	@mkdir -p vsix
	npx vsce package --out vsix/trs80gp-extension-1.0.0-release.vsix
	@echo "✅ VSIX package created: vsix/trs80gp-extension-1.0.0-release.vsix"

package-dev: compile ## Build development VSIX package
	@echo "📦 Building development VSIX package..."
	@mkdir -p vsix
	npx vsce package --out vsix/trs80gp-extension-dev-$(shell date +%Y%m%d-%H%M%S).vsix
	@echo "✅ Development VSIX package created"

# Installation and testing
install-local: package ## Install the extension locally for testing
	@echo "🚀 Installing extension locally..."
	code --install-extension vsix/trs80gp-extension-1.0.0-release.vsix --force
	@echo "✅ Extension installed locally"

uninstall-local: ## Uninstall the extension locally
	@echo "🗑️  Uninstalling extension..."
	code --uninstall-extension trs80dev.trs80gpExt
	@echo "✅ Extension uninstalled"

# Repository management
clean: ## Clean build artifacts and temporary files
	@echo "🧹 Cleaning build artifacts..."
	rm -rf out/
	rm -rf node_modules/.cache
	rm -rf .vscode-test/
	@echo "✅ Cleanup complete"

clean-all: clean ## Clean everything including node_modules
	@echo "🧹 Deep cleaning..."
	rm -rf node_modules/
	rm -rf vsix/*.vsix
	@echo "✅ Deep cleanup complete"

# Repository initialization
init-repo: ## Initialize Git repository and prepare for GitHub
	@echo "🔧 Initializing Git repository..."
	@if [ ! -d ".git" ]; then \
		git init; \
		git add .; \
		git commit -m "Initial commit: TRS-80 Development Extension v1.0.0"; \
		echo "✅ Git repository initialized"; \
	else \
		echo "ℹ️  Git repository already exists"; \
	fi

# GitHub repository setup (requires GitHub CLI)
github-create: ## Create GitHub repository (requires 'gh' CLI)
	@echo "🌐 Creating GitHub repository..."
	@command -v gh >/dev/null 2>&1 || { echo "❌ GitHub CLI (gh) is required"; exit 1; }
	gh repo create trs80gpExt --public --description "VS Code extension for TRS-80 development with emulator and assembler integration" --clone=false
	git remote add origin https://github.com/TechPrototyper/trs80gpExt.git
	@echo "✅ GitHub repository created"

# Complete setup workflow
setup: check-tools install compile test package ## Complete setup: install, compile, test, and package
	@echo "🎉 Setup complete! Extension is ready for development and distribution"

# Release workflow
release: clean setup ## Full release build: clean, setup, and package
	@echo "🚀 Creating release build..."
	@echo "📋 Release checklist:"
	@echo "  ✅ Dependencies installed"
	@echo "  ✅ Code compiled"
	@echo "  ✅ Tests passed"
	@echo "  ✅ Linting passed"
	@echo "  ✅ VSIX package created"
	@echo "🎉 Release v1.0.0 ready for distribution!"

# Version management
version-patch: ## Bump patch version and rebuild
	npm version patch
	$(MAKE) package

version-minor: ## Bump minor version and rebuild
	npm version minor
	$(MAKE) package

version-major: ## Bump major version and rebuild
	npm version major
	$(MAKE) package
