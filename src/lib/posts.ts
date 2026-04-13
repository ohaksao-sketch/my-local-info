import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const POSTS_DIR = path.join(process.cwd(), 'src/content/posts');

export interface PostFrontmatter {
  title: string;
  date: string;
  summary: string;
  category: string;
  tags: string[];
}

export interface PostSummary extends PostFrontmatter {
  slug: string;
}

export interface Post extends PostSummary {
  content: string;
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  return '';
}

function toFrontmatter(data: Record<string, unknown>): PostFrontmatter {
  return {
    title: String(data.title ?? ''),
    date: normalizeDate(data.date),
    summary: String(data.summary ?? ''),
    category: String(data.category ?? ''),
    tags: Array.isArray(data.tags) ? data.tags.map((t) => String(t)) : [],
  };
}

function ensureDir(): boolean {
  return fs.existsSync(POSTS_DIR);
}

export function getAllPostSlugs(): string[] {
  if (!ensureDir()) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

export function getAllPosts(): PostSummary[] {
  if (!ensureDir()) return [];
  const slugs = getAllPostSlugs();
  const posts = slugs.map((slug) => {
    const filePath = path.join(POSTS_DIR, `${slug}.md`);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(raw);
    return { slug, ...toFrontmatter(data) };
  });

  return posts.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.slug < b.slug ? 1 : -1;
  });
}

export function getPostBySlug(slug: string): Post | null {
  if (!ensureDir()) return null;
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return {
    slug,
    ...toFrontmatter(data),
    content,
  };
}
