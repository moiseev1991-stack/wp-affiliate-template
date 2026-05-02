import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { siteConfig } from '@/lib/config'

interface Props {
  post: Post
  size?: 'normal' | 'large'
  customExcerpt?: React.ReactNode
}

const CARD_I18N: Record<string, { reading: string; readMore: string }> = {
  pl: { reading: 'min czytania', readMore: 'Czytaj więcej' },
  en: { reading: 'min read', readMore: 'Read more' },
  de: { reading: 'Min. Lesezeit', readMore: 'Weiterlesen' },
  cs: { reading: 'min čtení', readMore: 'Číst dále' },
  sk: { reading: 'min čítania', readMore: 'Čítať ďalej' },
  ru: { reading: 'мин чтения', readMore: 'Читать далее' },
}

const LOCALES: Record<string, string> = { pl: 'pl-PL', en: 'en-US', de: 'de-DE', cs: 'cs-CZ', sk: 'sk-SK', ru: 'ru-RU' }

const THEMES: Record<string, {
  label: string
  bg: [string, string]
  svg: React.ReactNode
}> = {
  '🎰': {
    label: 'Sloty',
    bg: ['#1a0d05', '#6a0723'],
    svg: (
      <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-36 h-28">
        <rect x="20" y="15" width="80" height="70" rx="8" fill="white" fillOpacity=".12" stroke="white" strokeOpacity=".3" strokeWidth="1.5"/>
        <rect x="30" y="28" width="18" height="30" rx="3" fill="white" fillOpacity=".2" stroke="white" strokeOpacity=".4" strokeWidth="1"/>
        <rect x="51" y="28" width="18" height="30" rx="3" fill="white" fillOpacity=".2" stroke="white" strokeOpacity=".4" strokeWidth="1"/>
        <rect x="72" y="28" width="18" height="30" rx="3" fill="white" fillOpacity=".2" stroke="white" strokeOpacity=".4" strokeWidth="1"/>
        <circle cx="39" cy="43" r="6" fill="white" fillOpacity=".7"/>
        <circle cx="60" cy="43" r="6" fill="#ffd166" fillOpacity=".9"/>
        <circle cx="81" cy="43" r="6" fill="white" fillOpacity=".7"/>
        <rect x="35" y="62" width="50" height="8" rx="4" fill="white" fillOpacity=".15" stroke="white" strokeOpacity=".3" strokeWidth="1"/>
        <circle cx="60" cy="66" r="3" fill="#ffd166" fillOpacity=".8"/>
        <line x1="55" y1="23" x2="55" y2="15" stroke="white" strokeOpacity=".4" strokeWidth="1.5"/>
        <line x1="65" y1="23" x2="65" y2="15" stroke="white" strokeOpacity=".4" strokeWidth="1.5"/>
        <rect x="50" y="12" width="20" height="5" rx="2.5" fill="white" fillOpacity=".2"/>
      </svg>
    ),
  },
  '🪟': {
    label: 'Live Casino',
    bg: ['#1a0d05', '#8e1538'],
    svg: (
      <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-36 h-28">
        <rect x="25" y="20" width="70" height="60" rx="2" fill="white" fillOpacity=".08" stroke="white" strokeOpacity=".4" strokeWidth="1.5"/>
        <line x1="60" y1="20" x2="60" y2="80" stroke="white" strokeOpacity=".4" strokeWidth="1.5"/>
        <line x1="25" y1="50" x2="95" y2="50" stroke="white" strokeOpacity=".4" strokeWidth="1.5"/>
        <rect x="27" y="22" width="31" height="26" rx="1" fill="white" fillOpacity=".06"/>
        <rect x="62" y="22" width="31" height="26" rx="1" fill="white" fillOpacity=".06"/>
        <rect x="27" y="52" width="31" height="26" rx="1" fill="white" fillOpacity=".06"/>
        <rect x="62" y="52" width="31" height="26" rx="1" fill="white" fillOpacity=".06"/>
        <circle cx="60" cy="50" r="3" fill="white" fillOpacity=".5"/>
        <line x1="15" y1="50" x2="25" y2="50" stroke="white" strokeOpacity=".2" strokeWidth="1"/>
        <line x1="95" y1="50" x2="105" y2="50" stroke="white" strokeOpacity=".2" strokeWidth="1"/>
      </svg>
    ),
  },
  '🪵': {
    label: 'Klasyka',
    bg: ['#231410', '#5c2c0b'],
    svg: (
      <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-36 h-28">
        <polygon points="60,12 85,45 75,45 90,68 70,68 70,88 50,88 50,68 30,68 45,45 35,45" fill="white" fillOpacity=".18" stroke="white" strokeOpacity=".4" strokeWidth="1.2"/>
        <polygon points="60,12 82,42 38,42" fill="white" fillOpacity=".12"/>
        <polygon points="60,28 87,68 33,68" fill="white" fillOpacity=".1"/>
        <circle cx="60" cy="30" r="4" fill="white" fillOpacity=".3"/>
        <circle cx="50" cy="50" r="2.5" fill="white" fillOpacity=".25"/>
        <circle cx="70" cy="50" r="2.5" fill="white" fillOpacity=".25"/>
        <circle cx="45" cy="65" r="2" fill="white" fillOpacity=".2"/>
        <circle cx="75" cy="65" r="2" fill="white" fillOpacity=".2"/>
        <circle cx="60" cy="58" r="2" fill="#ffd166" fillOpacity=".7"/>
      </svg>
    ),
  },
  '🎨': {
    label: 'Strategie',
    bg: ['#1c0d27', '#4a1968'],
    svg: (
      <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-36 h-28">
        <circle cx="60" cy="50" r="32" fill="white" fillOpacity=".08" stroke="white" strokeOpacity=".2" strokeWidth="1"/>
        <circle cx="48" cy="42" r="10" fill="#ff6b6b" fillOpacity=".7"/>
        <circle cx="72" cy="42" r="10" fill="#ffd166" fillOpacity=".7"/>
        <circle cx="60" cy="60" r="10" fill="#4ecdc4" fillOpacity=".7"/>
        <circle cx="48" cy="42" r="10" fill="white" fillOpacity=".1"/>
        <circle cx="72" cy="42" r="10" fill="white" fillOpacity=".1"/>
        <circle cx="60" cy="60" r="10" fill="white" fillOpacity=".1"/>
        <circle cx="60" cy="50" r="5" fill="white" fillOpacity=".25"/>
        <circle cx="35" cy="28" r="4" fill="white" fillOpacity=".15" stroke="white" strokeOpacity=".3" strokeWidth="1"/>
        <circle cx="85" cy="28" r="4" fill="white" fillOpacity=".15" stroke="white" strokeOpacity=".3" strokeWidth="1"/>
        <circle cx="35" cy="72" r="4" fill="white" fillOpacity=".15" stroke="white" strokeOpacity=".3" strokeWidth="1"/>
        <circle cx="85" cy="72" r="4" fill="white" fillOpacity=".15" stroke="white" strokeOpacity=".3" strokeWidth="1"/>
      </svg>
    ),
  },
  '🌿': {
    label: 'Promocje',
    bg: ['#1a0d05', '#9c4a1a'],
    svg: (
      <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-36 h-28">
        <line x1="60" y1="88" x2="60" y2="35" stroke="white" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round"/>
        <path d="M60 55 Q40 40 35 22 Q50 25 60 40" fill="white" fillOpacity=".2" stroke="white" strokeOpacity=".35" strokeWidth="1"/>
        <path d="M60 45 Q80 30 85 12 Q70 15 60 30" fill="white" fillOpacity=".2" stroke="white" strokeOpacity=".35" strokeWidth="1"/>
        <path d="M60 68 Q42 55 38 38 Q53 42 60 58" fill="white" fillOpacity=".15" stroke="white" strokeOpacity=".3" strokeWidth="1"/>
        <path d="M60 62 Q78 48 82 30 Q68 34 60 50" fill="white" fillOpacity=".15" stroke="white" strokeOpacity=".3" strokeWidth="1"/>
        <ellipse cx="60" cy="90" rx="18" ry="5" fill="white" fillOpacity=".1"/>
        <rect x="52" y="82" width="16" height="10" rx="3" fill="white" fillOpacity=".15" stroke="white" strokeOpacity=".25" strokeWidth="1"/>
        <circle cx="60" cy="35" r="3" fill="white" fillOpacity=".4"/>
      </svg>
    ),
  },
  '💻': {
    label: 'Mobile',
    bg: ['#0f0a1a', '#3d1d56'],
    svg: (
      <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-36 h-28">
        <rect x="22" y="22" width="76" height="50" rx="5" fill="white" fillOpacity=".1" stroke="white" strokeOpacity=".35" strokeWidth="1.5"/>
        <rect x="27" y="27" width="66" height="40" rx="3" fill="white" fillOpacity=".07"/>
        <line x1="35" y1="35" x2="60" y2="35" stroke="white" strokeOpacity=".4" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="35" y1="41" x2="75" y2="41" stroke="white" strokeOpacity=".25" strokeWidth="1" strokeLinecap="round"/>
        <line x1="35" y1="47" x2="68" y2="47" stroke="white" strokeOpacity=".25" strokeWidth="1" strokeLinecap="round"/>
        <rect x="35" y="53" width="12" height="8" rx="1.5" fill="#4ecdc4" fillOpacity=".6"/>
        <line x1="10" y1="78" x2="110" y2="78" stroke="white" strokeOpacity=".3" strokeWidth="1.5"/>
        <path d="M45 78 L42 88 L78 88 L75 78" fill="white" fillOpacity=".12" stroke="white" strokeOpacity=".2" strokeWidth="1"/>
        <circle cx="85" cy="35" r="8" fill="white" fillOpacity=".12" stroke="white" strokeOpacity=".3" strokeWidth="1"/>
        <path d="M82 35 L84 37 L88 33" stroke="white" strokeOpacity=".7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  '✨': {
    label: 'Bonusy',
    bg: ['#3d2106', '#a3781d'],
    svg: (
      <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-36 h-28">
        <circle cx="60" cy="42" r="22" fill="white" fillOpacity=".12" stroke="white" strokeOpacity=".3" strokeWidth="1.5"/>
        <path d="M52 42 Q52 32 60 28 Q68 32 68 42 Q68 52 64 56 L56 56 Q52 52 52 42Z" fill="white" fillOpacity=".25"/>
        <path d="M56 56 L64 56 L63 62 L57 62 Z" fill="white" fillOpacity=".3"/>
        <line x1="57" y1="62" x2="63" y2="62" stroke="white" strokeOpacity=".4" strokeWidth="1.5"/>
        <line x1="57" y1="65" x2="63" y2="65" stroke="white" strokeOpacity=".3" strokeWidth="1.2"/>
        <line x1="60" y1="15" x2="60" y2="10" stroke="white" strokeOpacity=".4" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="82" y1="20" x2="86" y2="16" stroke="white" strokeOpacity=".4" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="38" y1="20" x2="34" y2="16" stroke="white" strokeOpacity=".4" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="88" y1="42" x2="94" y2="42" stroke="white" strokeOpacity=".4" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="32" y1="42" x2="26" y2="42" stroke="white" strokeOpacity=".4" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="60" cy="38" r="4" fill="#ffd166" fillOpacity=".8"/>
        <line x1="35" y1="78" x2="85" y2="78" stroke="white" strokeOpacity=".15" strokeWidth="1"/>
        <line x1="40" y1="83" x2="80" y2="83" stroke="white" strokeOpacity=".1" strokeWidth="1"/>
      </svg>
    ),
  },
  '🍳': {
    label: 'Recenzje',
    bg: ['#231410', '#7c2d12'],
    svg: (
      <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-36 h-28">
        <ellipse cx="55" cy="58" rx="28" ry="22" fill="white" fillOpacity=".1" stroke="white" strokeOpacity=".3" strokeWidth="1.5"/>
        <ellipse cx="55" cy="54" rx="22" ry="16" fill="white" fillOpacity=".12"/>
        <line x1="55" y1="34" x2="55" y2="20" stroke="white" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round"/>
        <line x1="55" y1="20" x2="55" y2="15" stroke="white" strokeOpacity=".3" strokeWidth="3" strokeLinecap="round"/>
        <rect x="82" y="45" width="16" height="4" rx="2" fill="white" fillOpacity=".2" stroke="white" strokeOpacity=".3" strokeWidth="1"/>
        <rect x="84" y="49" width="12" height="18" rx="2" fill="white" fillOpacity=".12" stroke="white" strokeOpacity=".25" strokeWidth="1"/>
        <line x1="88" y1="53" x2="92" y2="53" stroke="white" strokeOpacity=".35" strokeWidth="1"/>
        <line x1="88" y1="57" x2="92" y2="57" stroke="white" strokeOpacity=".35" strokeWidth="1"/>
        <line x1="88" y1="61" x2="92" y2="61" stroke="white" strokeOpacity=".35" strokeWidth="1"/>
        <circle cx="47" cy="54" r="5" fill="white" fillOpacity=".2"/>
        <circle cx="63" cy="50" r="4" fill="white" fillOpacity=".15"/>
        <circle cx="55" cy="62" r="4" fill="white" fillOpacity=".15"/>
      </svg>
    ),
  },
  '💡': {
    label: 'Porady',
    bg: ['#3d2106', '#8e6911'],
    svg: (
      <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-36 h-28">
        <line x1="60" y1="10" x2="60" y2="22" stroke="white" strokeOpacity=".4" strokeWidth="2" strokeLinecap="round"/>
        <path d="M45 38 Q45 24 60 22 Q75 24 75 38 Q75 50 68 56 L52 56 Q45 50 45 38Z" fill="#ffd166" fillOpacity=".3" stroke="white" strokeOpacity=".4" strokeWidth="1.5"/>
        <rect x="52" y="56" width="16" height="4" rx="2" fill="white" fillOpacity=".3"/>
        <rect x="54" y="60" width="12" height="4" rx="2" fill="white" fillOpacity=".25"/>
        <rect x="56" y="64" width="8" height="3" rx="1.5" fill="white" fillOpacity=".2"/>
        <circle cx="60" cy="38" r="8" fill="#ffd166" fillOpacity=".5"/>
        <line x1="30" y1="30" x2="24" y2="24" stroke="#ffd166" strokeOpacity=".4" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="90" y1="30" x2="96" y2="24" stroke="#ffd166" strokeOpacity=".4" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="25" y1="48" x2="18" y2="48" stroke="#ffd166" strokeOpacity=".3" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="95" y1="48" x2="102" y2="48" stroke="#ffd166" strokeOpacity=".3" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="30" y1="66" x2="24" y2="72" stroke="#ffd166" strokeOpacity=".25" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="90" y1="66" x2="96" y2="72" stroke="#ffd166" strokeOpacity=".25" strokeWidth="1.5" strokeLinecap="round"/>
        <ellipse cx="60" cy="82" rx="20" ry="4" fill="white" fillOpacity=".06"/>
      </svg>
    ),
  },
}

const DEFAULT_THEME = {
  label: 'Casino',
  bg: ['#1a0d05', '#6a0723'] as [string, string],
  svg: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-36 h-28">
      <rect x="25" y="20" width="70" height="60" rx="6" fill="white" fillOpacity=".1" stroke="white" strokeOpacity=".3" strokeWidth="1.5"/>
      <line x1="25" y1="35" x2="95" y2="35" stroke="white" strokeOpacity=".3" strokeWidth="1"/>
      <circle cx="34" cy="27.5" r="3" fill="white" fillOpacity=".4"/>
      <circle cx="44" cy="27.5" r="3" fill="white" fillOpacity=".25"/>
      <circle cx="54" cy="27.5" r="3" fill="white" fillOpacity=".15"/>
      <rect x="33" y="45" width="54" height="6" rx="3" fill="white" fillOpacity=".2"/>
      <rect x="33" y="57" width="40" height="4" rx="2" fill="white" fillOpacity=".12"/>
      <rect x="33" y="66" width="50" height="4" rx="2" fill="white" fillOpacity=".1"/>
    </svg>
  ),
}

function slugHash(slug: string): number {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  return h
}

// Per-slug variation seed: keeps the category SVG, but tweaks accent fills,
// rotation and floating decorations so two posts in the same category never
// look identical.
const ACCENT_PALETTE = ['#ffd166', '#f5d36c', '#4ecdc4', '#ff6b6b', '#c2185b', '#a78bfa', '#fbbf24', '#fb7185', '#34d399']

interface Variation {
  rotate: number
  scale: number
  accent: string
  shapes: Array<{ kind: 'dot' | 'ring' | 'sparkle' | 'bar'; x: number; y: number; r: number; fill: string; opacity: number }>
}

function variationFor(slug: string): Variation {
  const h = slugHash(slug)
  const accent = ACCENT_PALETTE[h % ACCENT_PALETTE.length]
  const rotate = ((h >> 3) % 11) - 5
  const scale = 0.92 + ((h >> 7) % 16) / 100
  const shapeCount = 3 + ((h >> 5) % 3)
  const shapes: Variation['shapes'] = []
  for (let i = 0; i < shapeCount; i++) {
    const seed = (h >> (i * 4)) ^ (i * 2654435761)
    const kind = (['dot', 'ring', 'sparkle', 'bar'] as const)[seed % 4]
    shapes.push({
      kind,
      x: 8 + (seed % 100),
      y: 6 + ((seed >> 7) % 80),
      r: 2 + ((seed >> 3) % 5),
      fill: ACCENT_PALETTE[(seed >> 11) % ACCENT_PALETTE.length],
      opacity: 0.18 + ((seed >> 13) % 35) / 100,
    })
  }
  return { rotate, scale, accent, shapes }
}

function VariationLayer({ v, slug }: { v: Variation; slug: string }) {
  return (
    <svg
      viewBox="0 0 120 100"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {v.shapes.map((s, i) => {
        if (s.kind === 'dot')
          return <circle key={`${slug}-${i}`} cx={s.x} cy={s.y} r={s.r} fill={s.fill} opacity={s.opacity} />
        if (s.kind === 'ring')
          return <circle key={`${slug}-${i}`} cx={s.x} cy={s.y} r={s.r + 2} fill="none" stroke={s.fill} strokeWidth="0.8" opacity={s.opacity} />
        if (s.kind === 'bar')
          return <rect key={`${slug}-${i}`} x={s.x} y={s.y} width={s.r * 3} height="1.4" rx="0.7" fill={s.fill} opacity={s.opacity} />
        return (
          <g key={`${slug}-${i}`} opacity={s.opacity}>
            <line x1={s.x - s.r} y1={s.y} x2={s.x + s.r} y2={s.y} stroke={s.fill} strokeWidth="0.8" strokeLinecap="round" />
            <line x1={s.x} y1={s.y - s.r} x2={s.x} y2={s.y + s.r} stroke={s.fill} strokeWidth="0.8" strokeLinecap="round" />
          </g>
        )
      })}
    </svg>
  )
}

function formatDate(d: string, lang: string) {
  return new Date(d).toLocaleDateString(LOCALES[lang] ?? 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

function readingTime(content: string) {
  return Math.max(1, Math.ceil(content.split(/\s+/).length / 200))
}

export default function PostCard({ post, size = 'normal', customExcerpt }: Props) {
  const theme = THEMES[post.emoji] ?? DEFAULT_THEME
  const [c1, c2] = theme.bg
  const mins = readingTime(post.content)
  const v = variationFor(post.slug)
  const excerpt = customExcerpt ?? post.description
  const lang = (siteConfig.language || 'en') as keyof typeof CARD_I18N
  const t = CARD_I18N[lang] ?? CARD_I18N.en

  return (
    <article className={`card-lift hentry type-post status-publish format-standard bg-[var(--bg-card)] rounded-2xl overflow-hidden border border-[var(--border)] flex flex-col group`} style={{ boxShadow: 'var(--shadow)' }}>
      <div
        className="relative overflow-hidden flex items-center justify-center"
        style={{
          background: `linear-gradient(${135 + v.rotate * 4}deg, ${c1} 0%, ${c2} 100%)`,
          height: size === 'large' ? 220 : 180,
        }}
      >
        {/* dot pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`p-${post.slug}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill="white" />
              <circle cx="0" cy="0" r="1.5" fill="white" />
              <circle cx="40" cy="40" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#p-${post.slug})`} />
        </svg>

        <VariationLayer v={v} slug={post.slug} />

        <div
          className="absolute w-32 h-32 rounded-full border-2 border-white/10"
          style={{
            bottom: -32 + (slugHash(post.slug) % 24),
            right: -32 + ((slugHash(post.slug) >> 4) % 24),
          }}
        />

        <div
          className="relative group-hover:scale-105 transition-transform duration-300 drop-shadow-lg"
          style={{ transform: `rotate(${v.rotate}deg) scale(${v.scale})` }}
        >
          {theme.svg}
        </div>

        <span
          className="absolute top-3 left-3 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
          style={{ background: 'rgba(0,0,0,0.35)', borderColor: `${v.accent}66` }}
        >
          {theme.label}
        </span>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mb-2.5">
          <time dateTime={post.date} className="entry-date published">{formatDate(post.date, lang)}</time>
          <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
          <span>{mins} {t.reading}</span>
        </div>

        <h3 className="entry-title font-heading text-lg font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors mb-2 leading-snug line-clamp-2">
          <Link href={`/${post.slug}/`}>{post.title}</Link>
        </h3>

        <p className="text-sm text-[var(--text-muted)] leading-relaxed line-clamp-3 flex-1 mb-4 wp-block-paragraph">
          {excerpt}
        </p>

        <Link
          href={`/${post.slug}/`}
          className="self-start inline-flex items-center gap-1.5 text-sm text-[var(--accent)] font-semibold hover:gap-3 transition-all"
        >
          {t.readMore} <span className="text-base">→</span>
        </Link>
      </div>
    </article>
  )
}
