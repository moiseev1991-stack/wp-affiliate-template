import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface Post {
  title: string
  slug: string
  date: string
  description: string
  emoji: string
  featured: boolean
  content: string
}

const postsDir = path.join(process.cwd(), 'content/posts')

export function getAllPosts(): Post[] {
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.mdx'))
  const posts = files.map(file => {
    const raw = fs.readFileSync(path.join(postsDir, file), 'utf-8')
    const { data, content } = matter(raw)
    return {
      title: data.title as string,
      slug: data.slug as string,
      date: data.date as string,
      description: data.description as string,
      emoji: data.emoji as string,
      featured: Boolean(data.featured),
      content,
    }
  })
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): Post | null {
  const all = getAllPosts()
  return all.find(p => p.slug === slug) ?? null
}
