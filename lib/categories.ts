import type { Post } from '@/lib/posts'

export interface Category {
  slug: string
  label: string
  emoji: string
  description: string
}

// Default casino categories. The scaffold-site skill replaces this list per-niche.
export const CATEGORIES: Category[] = [
  { slug: 'reviews',     label: 'Reviews',     emoji: '🍳', description: 'In-depth reviews of operators and products in this niche.' },
  { slug: 'guides',      label: 'Guides',      emoji: '💡', description: 'Practical step-by-step guides for beginners and pros.' },
  { slug: 'bonuses',     label: 'Bonuses',     emoji: '✨', description: 'Bonus and promo offers — comparisons and terms breakdown.' },
  { slug: 'strategies',  label: 'Strategies',  emoji: '🎨', description: 'Tested strategies and tactical playbooks.' },
  { slug: 'mobile',      label: 'Mobile',      emoji: '💻', description: 'Mobile apps and on-the-go experience.' },
  { slug: 'classics',    label: 'Classics',    emoji: '🪵', description: 'Timeless topics, fundamentals, and reference material.' },
  { slug: 'live',        label: 'Live',        emoji: '🪟', description: 'Live formats and real-time experiences.' },
  { slug: 'promos',      label: 'Promos',      emoji: '🌿', description: 'Recurring promos, tournaments and seasonal deals.' },
  { slug: 'top',         label: 'Top picks',   emoji: '🎰', description: 'Editorial top picks and rankings.' },
]

export const EMOJI_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  CATEGORIES.map(c => [c.emoji, c.slug])
)

export const CATEGORY_BY_SLUG: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map(c => [c.slug, c])
)

export function postsInCategory(allPosts: Post[], categorySlug: string): Post[] {
  return allPosts.filter(p => EMOJI_TO_CATEGORY[p.emoji] === categorySlug)
}
