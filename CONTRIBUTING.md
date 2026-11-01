# Contributing to GeoAttend

Thank you for your interest in contributing to GeoAttend! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/GeoAttend.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Follow the setup instructions in [README.md](README.md)

## Development Workflow

### Code Style

- **TypeScript**: Use strict typing, avoid `any` when possible
- **Naming conventions**:
  - Files: `camelCase.ts` for server, `PascalCase.tsx` for React components
  - Variables/functions: `camelCase`
  - Components: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
- **Imports**: Group by external, internal, then relative
- **Comments**: Add JSDoc comments for public functions

### Project Structure

Follow the established structure:
- **Server**: `routes` → `controllers` → `services` → `models`
- **Client**: Feature-based organization in `src/pages/` and `src/components/`

### Testing

- Write unit tests for utility functions
- Test coverage for new services and business logic
- Run tests before submitting: `npm test`

### Commits

Use conventional commit messages:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Formatting, no code change
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance tasks

Examples:
```
feat: add email notification for check-ins
fix: correct distance calculation in haversine formula
docs: update API endpoint documentation
```

## Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features
3. **Ensure all tests pass**: Run `npm test` in server directory
4. **Check TypeScript compilation**: Run `npm run build` in both client and server
5. **Update CHANGELOG.md** if applicable
6. **Submit PR** with a clear description of changes

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No console.log statements in production code
- [ ] TypeScript compiles without errors
- [ ] Branch is up to date with main

## Feature Requests & Bug Reports

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment (browser, OS, Node version)
- Screenshots if applicable

### Feature Requests

Include:
- Clear description of the feature
- Use case and motivation
- Mockups or examples if applicable

## Areas for Contribution

### Priority Features
- [ ] Email service integration (SendGrid, Mailgun, etc.)
- [ ] Push notifications
- [ ] Offline queue for check-ins
- [ ] Organization/team management
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)

### Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Deployment guides (AWS, Azure, Vercel)
- [ ] Video tutorials
- [ ] Localization/i18n

### Testing
- [ ] Integration tests
- [ ] E2E tests with Playwright
- [ ] Load testing
- [ ] Security testing

## Code Review

All submissions require review. We use GitHub pull requests for this purpose. Reviewers will check for:

- Code quality and style
- Test coverage
- Documentation
- Security implications
- Performance considerations

## Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

---

Thank you for contributing to GeoAttend! 🎉
