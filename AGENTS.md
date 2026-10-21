<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Imported barbershop screens live in src/views and use the TanStack navigation adapter; DataProvider loads Cloud records after hydration and never uses browser storage as the data authority.
- Preserve imported entity shapes in kind-scoped JSON records with RLS; public booking and receipt access use narrowly scoped transactional RPCs to avoid exposing client records.
- Cloud Auth owns staff credentials; roles live only in user_roles, and privileged staff management validates the caller before importing the admin client.
