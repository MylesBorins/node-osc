# Agent Instructions for node-osc

This document provides context and instructions for AI agents (GitHub Copilot, Cursor, and other agentic platforms) working on the node-osc project.

## Project Overview

**node-osc** is a Node.js library for sending and receiving [Open Sound Control (OSC)](http://opensoundcontrol.org) messages over UDP. It provides a simple, no-frills API inspired by pyOSC.

### Key Features
- Send and receive OSC messages and bundles
- Dual module support (ESM and CommonJS)
- Both callback and async/await APIs
- TypeScript type definitions generated from JSDoc
- Well-tested with comprehensive test coverage
- Supports Node.js 20, 22, and 24

## Architecture

### Core Components

1. **Server** (`lib/Server.mjs`) - EventEmitter-based OSC server for receiving messages
   - Listens on UDP socket
   - Emits events: `listening`, `message`, `bundle`, `error`, and address-specific events

2. **Client** (`lib/Client.mjs`) - OSC client for sending messages
   - Sends messages over UDP
   - Supports both callbacks and async/await

3. **Message** (`lib/Message.mjs`) - Represents a single OSC message
   - Contains address (string) and arguments (array)
   - Can append additional arguments

4. **Bundle** (`lib/Bundle.mjs`) - Represents a collection of OSC messages
   - Contains timetag and array of elements (messages or nested bundles)
   - Used for sending multiple messages together

5. **Low-level encoding/decoding** (`lib/osc.mjs`, `lib/internal/`) - Binary OSC protocol implementation
   - `encode()` - Converts Message/Bundle objects to binary Buffer
   - `decode()` - Parses binary Buffer into Message/Bundle objects

### Module System

The project uses **ESM as the source format** but provides **dual ESM/CommonJS support**:
- Source files: `lib/**/*.mjs` (ESM)
- Built CommonJS files: `dist/lib/**/*.js` (transpiled via Rollup)
- TypeScript definitions: `types/index.d.mts` (generated from JSDoc)

**Important:** The single `.d.mts` type definition file works for both ESM and CommonJS consumers.

### Package Exports

```json
{
  "exports": {
    "types": "./types/index.d.mts",
    "require": "./dist/lib/index.js",
    "import": "./lib/index.mjs",
    "default": "./lib/index.mjs"
  }
}
```

## Development Workflow

### Essential Commands

```bash
# Install dependencies
npm install

# Run linter (ESLint)
npm run lint

# Build the project (clean, transpile to CJS, generate types)
npm run build

# Run all tests (lint + build + ESM tests + CJS tests)
npm test

# Run only ESM tests
npm run test:esm

# Run only CJS tests
npm run test:cjs

# Generate API documentation from JSDoc
npm run docs

# Clean build artifacts
npm run clean
```

### Testing Strategy

- Tests are written in ESM format in `test/test-*.mjs`
- Tests are run against both ESM source (`lib/`) and transpiled CJS (`dist/`)
- Uses `tap` test framework
- Test utilities in `test/util.mjs` provide helpers like `getPort()` for getting available ports
- Always run `npm run build` before running CJS tests
- **100% test coverage is required** - All lines, branches, functions, and statements must be covered

### Build Process

1. **Clean**: Removes `dist/` and `types/` directories
2. **Rollup**: Transpiles ESM to CommonJS in `dist/` directory
3. **TypeScript**: Generates type definitions from JSDoc in `types/` directory

The build is automatically run before publishing (`prepublishOnly` script).

## Coding Standards

### JavaScript Style

- **ES Modules**: Use ESM syntax (`import`/`export`)
- **File extension**: Use `.mjs` for ESM files
- **Linting**: Follow ESLint rules in `eslint.config.mjs`
- **Modern JavaScript**: Use async/await, arrow functions, destructuring
- **Error handling**: Always handle errors in async operations

### Documentation

- **JSDoc comments**: All public APIs must have JSDoc comments
- **Type annotations**: Use JSDoc types for TypeScript generation
- **Examples**: Include code examples in JSDoc comments
- **Auto-generated docs**: Run `npm run docs` after changing JSDoc comments

Example JSDoc pattern:
```javascript
/**
 * Sends an OSC message or bundle.
 * 
 * @param {Message|Bundle|string} msg - The message, bundle, or address to send.
 * @param {...*} args - Additional arguments (used when first param is a string address).
 * @returns {Promise<void>}
 * 
 * @example
 * await client.send('/test', 123);
 * 
 * @example
 * const message = new Message('/test', 123);
 * await client.send(message);
 */
async send(msg, ...args) { ... }
```

### Type System

- TypeScript definitions are **generated** from JSDoc comments
- Do not manually edit `types/*.d.mts` files
- Update JSDoc comments in source files instead
- Run `npm run build:types` to regenerate types

### Naming Conventions

- **Classes**: PascalCase (e.g., `Client`, `Server`, `Message`, `Bundle`)
- **Functions**: camelCase (e.g., `encode`, `decode`, `toBuffer`)
- **Private functions**: Prefix with underscore (e.g., `_oscType`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Files**: Match class names or use descriptive kebab-case

### Dual Module Support Patterns

When writing code that needs to work in both ESM and CJS:

1. **Imports**: Use ESM imports in source (Rollup handles conversion)
2. **Exports**: Use named exports for all public APIs
3. **Testing**: Test both ESM and CJS builds
4. **Package imports**: Use `#decode` subpath import for internal modules (defined in `package.json` imports field)

## Important Files and Directories

### Source Files
- `lib/` - ESM source code (the canonical source)
- `lib/index.mjs` - Main entry point, exports all public APIs
- `lib/internal/` - Internal utilities (decode, encode, helpers)
- `lib/osc.mjs` - Low-level encode/decode functions

### Build Artifacts
- `dist/` - Transpiled CommonJS files (generated, do not edit)
- `types/` - TypeScript type definitions (generated, do not edit)

### Tests
- `test/test-*.mjs` - Test files using tap framework
- `test/util.mjs` - Test utilities and helpers
- `test/fixtures/` - Test data and fixtures

### Documentation
- `README.md` - Main documentation with quick start guide
- `docs/API.md` - Auto-generated API reference (do not edit manually)
- `docs/GUIDE.md` - Best practices, error handling, troubleshooting
- `examples/` - Working example code for various use cases

### Configuration
- `package.json` - Package configuration, scripts, exports
- `eslint.config.mjs` - ESLint configuration
- `rollup.config.mjs` - Rollup build configuration (ESM to CJS)
- `tsconfig.json` - TypeScript compiler options for type generation
- `jsdoc.json` - JSDoc configuration for documentation generation

## Making Changes

### Adding a New Feature

1. **Write ESM source** in `lib/`
2. **Add JSDoc comments** with types and examples
3. **Export** from `lib/index.mjs` if it's a public API
4. **Write tests** in `test/test-*.mjs` - **must achieve 100% coverage** (lines, branches, functions, statements)
5. **Run tests**: `npm test` (tests both ESM and CJS)
6. **Update docs**: `npm run docs` to regenerate API.md
7. **Update README.md** if adding user-facing functionality

### Fixing a Bug

1. **Write a failing test** that demonstrates the bug
2. **Fix the bug** in the ESM source files
3. **Run tests**: `npm test` to verify fix works in both ESM and CJS
4. **Verify coverage**: Ensure 100% test coverage is maintained
5. **Check no regressions**: Ensure all tests pass

### Modifying the API

1. **Update JSDoc** in source files
2. **Regenerate types**: `npm run build:types`
3. **Update tests** to cover new behavior - **must maintain 100% coverage**
4. **Regenerate docs**: `npm run docs`
5. **Update README.md** and `docs/GUIDE.md` as appropriate

## Common Patterns

### Creating a Server
```javascript
import { Server } from 'node-osc';

const server = new Server(3333, '0.0.0.0');
server.on('message', (msg, rinfo) => {
  console.log('Message:', msg);
});
```

### Creating a Client
```javascript
import { Client } from 'node-osc';

const client = new Client('127.0.0.1', 3333);
await client.send('/test', 123);
await client.close();
```

### Working with Bundles
```javascript
import { Bundle } from 'node-osc';

const bundle = new Bundle(['/one', 1], ['/two', 2]);
await client.send(bundle);
```

### Low-level Encoding/Decoding
```javascript
import { Message, encode, decode } from 'node-osc';

const message = new Message('/test', 123);
const buffer = encode(message);
const decoded = decode(buffer);
```

## Troubleshooting

### Build Issues

- **"Cannot find module"**: Run `npm install` to install dependencies
- **Type generation fails**: Check JSDoc syntax in source files
- **CJS tests fail but ESM pass**: Run `npm run build` before testing

### Test Issues

- **Port conflicts**: Tests use dynamic port allocation via `getPort()` utility
- **Timing issues**: Use async/await and proper event handling
- **ESM/CJS differences**: Ensure code works in both environments

### Module Resolution

- **Dual package hazard**: The package exports both ESM and CJS - don't mix them
- **Type imports**: TypeScript consumers get types automatically from `types/index.d.mts`
- **Internal imports**: Use `#decode` subpath for internal modules

## Dependencies

### Runtime Dependencies
- **None** - This is a zero-dependency library for production use

### Development Dependencies
- **eslint** - Code linting
- **tap** - Test framework
- **rollup** - Module bundler for ESM → CJS transpilation
- **typescript** - Type definition generation from JSDoc
- **jsdoc** - Documentation generation
- **globals** - ESLint globals configuration

## OSC Protocol Knowledge

When working with OSC message encoding/decoding:

- OSC addresses start with `/` (e.g., `/oscillator/frequency`)
- OSC types: integer (i), float (f), string (s), blob (b), time tag (t)
- Messages are null-padded to 4-byte boundaries
- Bundles have time tags (when to execute) and can contain nested bundles
- See [OSC Specification](http://opensoundcontrol.org/spec-1_0) for protocol details

## Security Considerations

- Always validate input data when decoding OSC messages
- Be careful with buffer operations to avoid out-of-bounds access
- Limit message and bundle sizes to prevent DoS attacks
- Sanitize OSC addresses before using them as event names
- Handle malformed OSC data gracefully (emit errors, don't crash)

## License

This project uses the Apache-2.0 license. When contributing code:
- Ensure all new code is compatible with Apache-2.0
- Do not introduce dependencies with incompatible licenses
- Include proper attribution for any third-party code

## Getting Help

- **API Documentation**: See `docs/API.md`
- **Usage Guide**: See `docs/GUIDE.md`
- **Examples**: See `examples/` directory
- **Issues**: Check existing GitHub issues for similar problems
- **OSC Protocol**: Refer to http://opensoundcontrol.org for protocol details
