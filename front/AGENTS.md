# Frontend component conventions

- The browser only calls same-origin `/api/v1`. Authentication, session cookies, recovery and Storage access belong to the backend. Do not add Supabase clients, credentials, JWT storage or direct Storage URLs to the frontend. Keep the Vite API proxy and production Worker service binding aligned.
- Catalogue data always comes from the backend, including development. Do not add local demo catalogues or fallback data. Synthetic fixtures belong exclusively to test helpers and intercepted test API responses.

- Use the `shadcn` skill for frontend work. Use the official `@shadcn` registry and the project's Radix base.
- Prefer installed shadcn components for interface controls, fields, cards, badges, feedback, overlays and navigation widgets. Compose these primitives instead of building custom equivalents.
- Use shadcn `Select` for dropdowns throughout the public site and administration, including language and theme. Use `SelectField` for the shared trigger/content/group composition. Do not use `NativeSelect` or hand-written `<select>` controls in application code.
- Keep `SelectItem` inside `SelectGroup`. Represent empty domain choices with `EMPTY_SELECT_VALUE`, decoded by `SelectField`; never pass an empty string to `SelectItem`.
- Use React Hook Form `Controller` for controlled shadcn fields. Preserve labels, refs, validation, URL filters and in-memory quotation data.
- Use `AlertDialog` for in-app destructive confirmations and unsaved-change prompts. Retain `beforeunload` only for leaving the browser document.
- Preserve the RM Tours design, responsive layouts and both themes through semantic tokens and shared component variants.
- Verify changes with the existing build, lint, unit and relevant browser tests. Exercise portalled controls inside sheets and dialogs as well as the public header.
