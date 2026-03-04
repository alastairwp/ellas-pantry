# Ella's Pantry Roadmap

## What We Have Now

- ~3,500 recipes (CSV + AI-generated) with images, ratings, dietary tags, categories
- User auth (register/login), saved favourites, 5-star ratings
- AI recipe generator (single, batch, continuous) with 700k+ dish name pool
- "What's In My Fridge?" AI photo scanner with ingredient matching
- Mega-menu navigation with seasonal occasions
- Recipe scaling (adjust servings, auto-recalculate ingredients)
- Google AdSense integration
- SEO (sitemap, JSON-LD, Open Graph)
- Admin dashboard with duplicate detection, image upload, recipe editing

---

## Completed — Sprint 1

- [x] **Recipe of the Day** — Deterministic daily featured recipe on homepage
- [x] **Cook Mode** — Full-screen step-by-step view with keyboard nav, wake lock, progress bar
- [x] **User Reviews** — Text reviews alongside star ratings, one per user per recipe
- [x] **Meal Planning & Shopping Lists** — Weekly planner with 7-day x 4-meal grid, auto-generated shopping list with copy/print

## Completed — Sprint 2

- [x] **Unit Conversion Toggle** — Metric/Imperial toggle on ingredient lists, persisted in localStorage
- [x] **Cooking Timers** — Inline timer buttons parsed from step text, concurrent timers with audio alerts in Cook Mode
- [x] **Nutrition Information** — AI-estimated calories/macros per serving with disclaimer, admin batch backfill, auto-included in new AI recipes
- [x] **Advanced Search & Filters** — Difficulty, cook time, ingredient search, sort (newest/rating/quickest)
- [x] **Collections / Cookbooks** — User-created named collections, add/remove recipes via dropdown, browse at /collections

## Completed — Sprint 3

- [x] **Related Recipes** — "You Might Also Like" section on recipe pages, matches by shared categories + dietary tags with fallback
- [x] **Social Sharing Enhancements** — Pinterest + Telegram buttons, share count tracking, Twitter card metadata
- [x] **User Profiles** — Public profile pages with avatar, bio, stats, reviews, collections; settings page for editing
- [x] **Recipe Variations & Substitutions** — AI-powered ingredient swap suggestions (Vegan, Gluten-Free, Dairy-Free, Budget)

---

## Not Yet Built

### High Impact — Revenue & Traffic

#### Social Sharing (remaining)
- Generate recipe card images for Instagram/Pinterest (photo + title overlay)
- "Staff Picks" curated collections for homepage

#### Newsletter / Email
- Weekly recipe digest email
- "New recipes in your favourite categories" personalised emails
- Capture email signups on homepage
- Integrate with Resend, SendGrid, or Mailchimp

---

### Medium Impact — Engagement & Retention

#### Cook Mode (remaining enhancements)
- Voice commands ("next step") via Web Speech API

#### User Reviews (remaining enhancements)
- "Most Helpful" sorting
- Reply/discussion threads
- Report inappropriate content

#### User Profiles (remaining enhancements)
- Avatar image upload
- "Recipes I've Cooked" log
- Cooking streak / gamification badges

#### Related Recipes (remaining enhancements)
- Collaborative filtering — "users who liked X also liked Y"
- Recently viewed recipes carousel

#### Advanced Search (remaining enhancements)
- Filter by number of ingredients ("5 ingredients or fewer")

---

### Lower Effort — Quick Wins

#### Accessibility Improvements
- ARIA labels audit across all interactive elements
- Keyboard navigation for mega-menu
- Screen reader testing
- High contrast mode option
- Reduced motion support

#### PWA / Offline Support
- Service worker for offline recipe viewing
- "Save for offline" button on recipe pages
- App-like experience on mobile (add to home screen)
- Push notifications for new recipes in favourite categories

---

### Technical / Infrastructure

#### Analytics Dashboard
- Google Analytics 4 integration
- Track recipe views, search queries, filter usage
- Admin analytics page showing popular recipes, trending searches
- Conversion tracking (view -> save -> cook)

#### Performance Optimisation
- Image CDN (Cloudflare Images, Imgix, or Vercel Image Optimisation)
- ISR (Incremental Static Regeneration) for recipe pages
- Database indexing optimisation for large recipe counts
- Redis caching for hot queries

#### Migrate to PostgreSQL
- Move from SQLite to PostgreSQL for production
- Full-text search with pg_trgm for better recipe search
- Better concurrent write handling at scale

#### API Rate Limiting
- Rate limit the fridge scan endpoint (expensive AI calls)
- Rate limit recipe generation
- Per-user daily limits

#### Content Moderation
- Flag/report system for user reviews
- Admin moderation queue
- Automated spam detection

---

### Ambitious / Long-term

#### Video Recipes
- Short cooking videos (or GIFs) embedded in recipe steps
- YouTube embed support

#### Community Contributions
- Users submit their own recipes
- Moderation/approval workflow
- "Community" vs "Editorial" recipe badges

#### AI Chef Assistant
- Chat-based cooking assistant on recipe pages
- Ask questions like "can I substitute X?" or "what wine pairs with this?"
- Powered by Claude with recipe context

#### Internationalisation
- Multi-language support
- Auto-translate recipes
- Region-specific ingredient names and measurements

#### Mobile App
- React Native or Capacitor wrapper
- Native camera integration for fridge scanning
- Push notifications
- Offline recipe storage
