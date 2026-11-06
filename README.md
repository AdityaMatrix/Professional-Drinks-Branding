# Valo Drinks

A fan-concept drinks store with a supplier onboarding and risk portal, built with React and
TypeScript on a real Supabase backend.

**[Live site](https://adityamatrix.github.io/Professional-Drinks-Branding/)**. To see the portal,
choose **Log in**, then **Try the demo**.

This started as a static HTML, CSS and JavaScript landing page. I rebuilt it to practise the things
that only come up in a real application: where state should live, what happens when an API fails,
and validation that doesn't stop at the browser.

> Unofficial fan project, not affiliated with or endorsed by Riot Games. Nothing is for sale, and
> no payment is taken. VALORANT and its characters are trademarks of Riot Games, Inc.

## What's in it

**Store**

- Catalogue with search, filter and sort held in the URL, so any view can be shared or bookmarked
- Cart that survives refreshes and stays in sync across tabs
- Three-step checkout priced by the server, with a mock payment page
- Contact form with server-side rate limiting
- Cans that morph between pages using the View Transitions API

**Supplier portal** (staff only)

- Dashboard of supplier status and risk
- Table with server-side filtering, sorting and pagination, all held in the URL
- Four-step onboarding that saves as a draft after every step
- Review workflow with a server-calculated risk score and a full history

## Stack

React 19, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, Supabase (Postgres,
Auth, Row Level Security), Vitest, Testing Library and Playwright, with CI and deployment on GitHub
Actions.

## Decisions worth explaining

**State lives where its lifetime fits.**

| State | Where | Why |
| --- | --- | --- |
| Products, suppliers | TanStack Query | It belongs to the server, so it needs caching and refetching |
| Filters, sort, page | The URL | They should survive a refresh and be shareable |
| Cart | Context and `localStorage` | It belongs to this browser and should survive a refresh |
| Delivery details | `sessionStorage` | Needed across steps, but shouldn't outlive the tab |
| Card details | Form state only | They should never be stored anywhere |

**The cart stores only ids and quantities.** Prices and stock always come from the server, so a
cart can't go stale or be edited into a cheaper order. The cart page handles a drink selling out
after it was added.

**The server has the final say.** Zod gives instant feedback, but database constraints enforce the
same rules, and their errors are mapped back onto the right field. Some rules can only live on the
server, such as the contact rate limit and the check for a duplicate supplier name.

**The browser's route guard isn't the security.** `RequireStaff` only decides what to show. Access
comes from Row Level Security and a `staff` table, because the demo password is public and being
signed in proves nothing.

**Status changes go through one function.** Column grants stop the client writing `status` or
`risk_score` directly. `transition_supplier` enforces the allowed steps and takes the status the
reviewer was looking at, so two people acting at once get a conflict rather than silently
overwriting each other. This was tested with two simultaneous requests.

**The demo is built for strangers.** The portal has a row limit and a reset button, and sign-ups
are off. Checkout stores nothing, so no visitor details are kept and nobody can sell out the shop.
The payment form only accepts published test cards, so a real number can't be used by mistake.

## Bugs that taught me something

- **Autoplay never resumed after clicking an arrow.** A clicked button keeps focus, and I was
  pausing on any focus. Only keyboard focus should pause, so it now checks `:focus-visible`.
- **Searching for `%` matched everything.** Backslash escaping didn't survive the API, and mocked
  tests could never have shown that. Wildcards are now removed from the search instead.
- **`?sort=toString` got past validation.** The `in` operator also matches inherited properties,
  which would have crashed the shop page. It now uses `Object.hasOwn`.
- **A successful payment landed on the empty cart.** Emptying the cart raced with leaving the page,
  and the empty cart redirected away. The confirmation page now empties it, once per order.
- **Tests failed only when the machine was low on memory.** The code was fine, but the timeouts
  were too tight. I confirmed that by running with fewer workers, then made the suite more tolerant.

## Performance

Lighthouse mobile scores for the live home page. The rebuilt columns are the median of three runs,
and the original site is a single run.

| | Original site | Rebuilt, no intro | Rebuilt, first visit |
| --- | --- | --- | --- |
| Performance | 29 | 95 | 85 |
| Largest Contentful Paint | 12.2 s | 2.7 s | 4.1 s |
| Total Blocking Time | 12,270 ms | 42 ms | 93 ms |
| Page weight | 10,295 KiB | 721 KiB | 6,226 KiB |

"No intro" was measured with reduced motion on, as the closest stand-in for a refresh. The first
visit score is kinder than the experience: the page isn't revealed until the 6.6 second intro ends,
at about 8.7 seconds in my testing, and the video is most of that page weight.

What made the difference:

- Trimmed and converted the images, from about 10.5 MB to under 600 KB
- Replaced a third-party typing library with a small hook
- Loaded Supabase on first use, taking the main bundle from 184 KB to 133 KB gzipped
- Stopped the font stylesheet blocking the first paint
- Only download the intro video when it's going to play

## Accessibility

- Everything works by keyboard, with visible focus and a skip link
- Form errors are linked to their fields, and focus moves to the first problem
- The carousel has a pause control, and stops for hover and keyboard focus
- Reduced motion turns off the intro video and the animations

## Running it

```bash
npm install
npm run dev
```

Create a Supabase project and run the files in `supabase/migrations` in order. Then add a
`.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

```bash
npm test           # unit and component tests
npm run test:e2e   # browser tests, with the API stubbed
npm run lint
npm run typecheck
```

## How AI was used

I built this with Claude Code. It wrote much of the code, and I directed the product decisions,
reviewed the work and tested it in a real browser. Several bugs above came from AI-written code
that looked right and passed its tests, which is why the checks against the real database and
browser matter.

## Known limits

- The intro video adds about 7 seconds to the first visit in a session. That's a deliberate branding
  choice, and it can be skipped.
- GitHub Pages has no server routing, so direct links like `/products` load the app through its
  404 page. They work normally, but the HTTP status is 404, which a real host would fix.
- The Supabase free plan can pause inactive projects, which would stop the API until it's restored.
- The demo account is shared, so anyone can change the sample suppliers. Reset them from the
  dashboard.
- The morph transition needs a browser that supports the View Transitions API. Other browsers
  change pages normally.
