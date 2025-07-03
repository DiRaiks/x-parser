# Contributing to X Parser

We love your input! We want to make contributing to X Parser as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Quick Start for Contributors

1. **Clone and setup:**

   ```bash
   git clone https://github.com/DiRaiks/x-parser.git
   cd x-parser
   yarn setup
   ```

2. **Environment setup:**

   ```bash
   cp .env.example .env
   # Edit .env with your OPENAI_API_KEY
   ```

3. **Start development:**

   ```bash
   yarn dev
   ```

4. **Before submitting:**
   ```bash
   yarn lint
   yarn type-check
   yarn build
   ```

## Coding Standards

- **TypeScript**: We use TypeScript for type safety
- **ESLint**: Run `yarn lint` to check code style
- **Prettier**: Code formatting is handled by ESLint
- **Conventional Commits**: Use conventional commit messages

## Commit Messages

We use [Conventional Commits](https://conventionalcommits.org/) for commit messages:

- `feat: add new parsing method`
- `fix: resolve session timeout issue`
- `docs: update API documentation`
- `style: fix code formatting`
- `refactor: improve error handling`
- `test: add unit tests for AI analysis`
- `chore: update dependencies`

## Issue Reporting

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/DiRaiks/x-parser/issues/new).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Feature Requests

We're always looking for suggestions to improve X Parser. If you have an idea for a new feature:

1. Check if it's already been suggested in [issues](https://github.com/DiRaiks/x-parser/issues)
2. Open a new issue with the "enhancement" label
3. Describe the feature and why it would be useful
4. If possible, provide implementation ideas

## Areas We Need Help

- **Testing**: We need more comprehensive tests
- **Documentation**: Improve and expand documentation
- **Performance**: Optimize AI analysis and parsing speed
- **Features**: New parsing methods and analysis capabilities
- **UI/UX**: Improve the user interface and experience
- **Accessibility**: Make the app more accessible

## Code of Conduct

This project adheres to a [Contributor Covenant](https://www.contributor-covenant.org/) code of conduct. By participating, you are expected to uphold this code.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Don't hesitate to ask questions by opening an issue or reaching out to the maintainers.

Thank you for contributing! 🚀
