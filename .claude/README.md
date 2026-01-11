# Claude Code Skills for SalesFlow

This directory contains custom Skills for Claude Code to help with development of the SalesFlow CRM application.

## Available Skills

### 1. TypeScript Safety (`typescript-safety`)
Ensures TypeScript code follows strict mode compliance and proper type annotations.

**Triggers when:**
- Writing TypeScript code
- Fixing type errors
- Refactoring components
- Mentions of TypeScript, type safety, or strict mode

**Key features:**
- Verifies strict mode compliance
- Ensures Supabase type safety
- Checks React Query hook typing
- Validates component props interfaces

### 2. Supabase Query Patterns (`supabase-query-patterns`)
Enforces consistent React Query and Supabase data fetching patterns.

**Triggers when:**
- Implementing database queries
- Creating mutations
- Fetching data
- Mentions of Supabase, React Query, TanStack Query, or mutations

**Key features:**
- Server vs client data fetching patterns
- Mutation implementation with optimistic updates
- Query key conventions
- Real-time subscription patterns

### 3. Component Architecture (`component-architecture`)
Ensures consistent React component structure and shadcn/ui patterns.

**Triggers when:**
- Creating components
- Refactoring React code
- Setting up forms
- Mentions of React components, Server/Client Components, or shadcn/ui

**Key features:**
- Server vs Client Component decision guidance
- shadcn/ui component usage patterns
- Form validation with react-hook-form + zod
- Modal and dialog patterns

### 4. TailwindCSS Styling (`tailwind-styling`)
Maintains consistent TailwindCSS styling and design system.

**Triggers when:**
- Styling components
- Creating layouts
- Implementing responsive design
- Mentions of TailwindCSS, styling, CSS, or dark mode

**Key features:**
- Color system and CSS variables
- Dark mode support
- Responsive design patterns
- Typography and spacing scales

### 5. Testing Implementation (`testing-implementation`)
Guides Jest and React Testing Library test implementation.

**Triggers when:**
- Writing tests
- Debugging test failures
- Improving coverage
- Mentions of testing, Jest, React Testing Library, or test coverage

**Key features:**
- Unit, integration, and E2E testing patterns
- Component testing with RTL
- React Query hook testing
- Mock patterns for Supabase

**Note:** This Skill runs in a forked context to avoid cluttering the main conversation with verbose test output.

### 6. Security Review (`security-review`)
Reviews code for security vulnerabilities and best practices.

**Triggers when:**
- Reviewing security-sensitive code
- Implementing authentication
- Working with API routes
- Mentions of security, vulnerabilities, or data protection

**Key features:**
- Authentication & authorization verification
- Input validation and SQL injection prevention
- XSS and CSRF protection
- Sensitive data handling
- Row Level Security (RLS) policy verification

## Using Skills

### Automatic Activation
Skills activate automatically when your request matches their description:

```
You: "How should I structure this database query?"
Claude: [Automatically loads supabase-query-patterns Skill]
```

### Manual Invocation
You can also invoke Skills explicitly:

```
/typescript-safety
Review this file for type safety issues.
```

### List Available Skills
To see all available Skills:

```
What Skills are available?
```

## Skill Organization

```
.claude/
├── skills/
│   ├── typescript-safety/
│   │   └── SKILL.md
│   ├── supabase-query-patterns/
│   │   └── SKILL.md
│   ├── component-architecture/
│   │   └── SKILL.md
│   ├── tailwind-styling/
│   │   └── SKILL.md
│   ├── testing-implementation/
│   │   └── SKILL.md
│   └── security-review/
│       └── SKILL.md
├── settings.json              # Project permissions config
├── settings.local.json        # Personal overrides (gitignored)
└── README.md                  # This file
```

## Modifying Skills

Skills are checked into version control and shared with the team. To modify:

1. Edit the `SKILL.md` file in the appropriate directory
2. Changes take effect immediately (no restart needed)
3. Commit changes to share with team

## Personal Overrides

Create `.claude/settings.local.json` for personal configuration:

```json
{
  "permissions": {
    "allow": [
      "Bash(your-custom-command:*)"
    ]
  }
}
```

This file is gitignored and won't affect other team members.

## Tech Stack Context

These Skills are specifically designed for:

- **Framework:** Next.js 15 with App Router and Turbopack
- **Database:** PostgreSQL via Supabase with RLS
- **UI:** shadcn/ui components + TailwindCSS
- **State:** TanStack Query (React Query)
- **Types:** TypeScript with strict mode
- **Testing:** Jest + React Testing Library

## Contributing

To add a new Skill:

1. Create a new directory: `.claude/skills/skill-name/`
2. Create `SKILL.md` with YAML frontmatter and markdown instructions
3. Write a clear description that includes trigger keywords
4. Test that Claude discovers and applies it correctly
5. Commit to version control

See [Claude Code Skills documentation](https://code.claude.com/docs/en/skills.md) for full details.

## Resources

- [Claude Code Skills Docs](https://code.claude.com/docs/en/skills.md)
- [Claude Code Subagents](https://code.claude.com/docs/en/sub-agents.md)
- [Project CLAUDE.md](../CLAUDE.md) - Main project documentation
