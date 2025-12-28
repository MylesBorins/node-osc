# Contributing to node-osc

Thank you for your interest in contributing to node-osc! This document provides guidelines and information for contributors.

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/MylesBorins/node-osc.git
   cd node-osc
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run tests:
   ```bash
   npm test
   ```

## Project Structure

- `lib/` - Source code (ESM modules)
  - `Client.mjs` - OSC client implementation
  - `Server.mjs` - OSC server implementation
  - `Message.mjs` - OSC message class
  - `Bundle.mjs` - OSC bundle class
  - `internal/` - Internal encoding/decoding utilities
- `test/` - Test files
- `examples/` - Example usage
- `dist/` - Built CJS modules (generated)

## Development Workflow

### Running Tests

```bash
# Run all tests (lint, build, ESM tests, CJS tests)
npm test

# Run only linter
npm run lint

# Run only ESM tests
npm run test:esm

# Run only CJS tests
npm run test:cjs
```

### Building

```bash
# Build CJS version from ESM source
npm run build

# Clean build artifacts
npm run clean
```

## Code Style

- This project uses ESLint for code quality
- Run `npm run lint` before committing
- Follow the existing code style
- Use meaningful variable names
- Add JSDoc comments for public APIs

## Testing

- All new features should include tests
- Tests should cover both ESM and CJS usage
- Use the `tap` testing framework (already configured)
- Tests are located in the `test/` directory

### Writing Tests

```javascript
import { test } from 'tap';
import { Client, Server } from 'node-osc';

test('your test description', (t) => {
  // Your test code
  t.end();
});
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes with descriptive messages
6. Push to your fork
7. Open a Pull Request

### PR Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Ensure all tests pass
- Update documentation if needed
- Keep changes focused and atomic

## Supported Node.js Versions

This library supports:
- Node.js 20.9.0+
- Node.js 22.11.0+
- Node.js 24.0.0+

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for new public APIs
- Include code examples where helpful
- Document breaking changes clearly

## OSC Specification

This library implements the [OSC 1.0 specification](http://opensoundcontrol.org/spec-1_0). When implementing new features or fixing bugs, refer to this specification.

## Getting Help

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Be respectful and constructive in discussions

## License

By contributing to node-osc, you agree that your contributions will be licensed under the LGPL-3.0-or-later license.
