import Link from 'next/link'
import type { Post } from '@/lib/posts'
import MoneyBlock from './MoneyBlock'

interface Props {
  post: Post
}

export default function FeaturedCard({ post }: Props) {
  const words = post.description.split(/\s+/).slice(0, 28).join(' ') + '…'

  return (
    <div className="rounded-3xl overflow-hidden flex flex-col lg:flex-row shadow-2xl border border-white/10">
      {/* Left: article preview */}
      <div
        className="lg:w-[58%] relative overflow-hidden flex flex-col justify-end"
        style={{
          background: 'linear-gradient(160deg, #0d2818 0%, #1b4332 40%, #2d6a4f 100%)',
          minHeight: 380,
        }}
      >
        {/* Decorative SVG background */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="feat-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#feat-grid)" />
        </svg>

        {/* Big emoji watermark */}
        <span
          className="absolute right-6 top-1/2 -translate-y-1/2 select-none pointer-events-none"
          style={{ fontSize: 160, opacity: 0.08, lineHeight: 1 }}
          aria-hidden="true"
        >{post.emoji}</span>

        {/* Gradient overlay bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0d2818]/80 to-transparent pointer-events-none" />

        <div className="relative z-10 p-8 lg:p-10">
          <span className="inline-flex items-center gap-1.5 bg-[var(--accent-light)]/20 border border-[var(--accent-light)]/30 text-[var(--accent-light)] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
            ✦ Polecany artykuł
          </span>
          <h3 className="font-heading text-2xl lg:text-3xl font-bold text-white leading-snug mb-3 max-w-lg">
            {post.title}
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed mb-6 max-w-md">{words}</p>
          <Link
            href={`/blog/${post.slug}/`}
            className="inline-flex items-center gap-2 bg-white text-[var(--accent-dark)] font-bold text-sm px-6 py-3 rounded-xl hover:bg-[var(--accent-light)] hover:text-[var(--accent-dark)] transition-colors"
          >
            Czytaj artykuł →
          </Link>
        </div>
      </div>

      {/* Right: casino CTA */}
      <div className="lg:w-[42%]">
        <MoneyBlock variant="featured" />
      </div>
    </div>
  )
}
