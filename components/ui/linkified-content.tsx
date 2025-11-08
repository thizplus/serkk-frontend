/**
 * LinkifiedContent Component
 *
 * Auto-converts URLs in plain text to clickable links
 * with proper security attributes (nofollow, noopener, noreferrer)
 *
 * Usage:
 * ```tsx
 * <LinkifiedContent>
 *   Check out https://example.com for more info!
 * </LinkifiedContent>
 * ```
 */

import { useMemo } from 'react';

interface LinkifiedContentProps {
  children: string;
  className?: string;
}

// URL regex pattern (simplified but effective)
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/**
 * Sanitize URL to prevent XSS
 * Only allow http and https protocols
 */
function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }

    return url;
  } catch {
    // Invalid URL
    return '';
  }
}

/**
 * Extract domain from URL for display
 * Example: https://www.example.com/path?query=1 → example.com
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function LinkifiedContent({ children, className }: LinkifiedContentProps) {
  const parts = useMemo(() => {
    if (!children) return [];

    const segments: Array<{ type: 'text' | 'link'; content: string }> = [];
    let lastIndex = 0;

    // Find all URLs in the text
    const matches = Array.from(children.matchAll(URL_REGEX));

    matches.forEach((match) => {
      const url = match[0];
      const index = match.index!;

      // Add text before the URL
      if (index > lastIndex) {
        segments.push({
          type: 'text',
          content: children.slice(lastIndex, index),
        });
      }

      // Add the URL
      const sanitized = sanitizeUrl(url);
      if (sanitized) {
        segments.push({
          type: 'link',
          content: sanitized,
        });
      } else {
        // If sanitization fails, treat as plain text
        segments.push({
          type: 'text',
          content: url,
        });
      }

      lastIndex = index + url.length;
    });

    // Add remaining text after the last URL
    if (lastIndex < children.length) {
      segments.push({
        type: 'text',
        content: children.slice(lastIndex),
      });
    }

    return segments;
  }, [children]);

  if (parts.length === 0) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'link') {
          return (
            <a
              key={index}
              href={part.content}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-primary hover:underline break-all"
              onClick={(e) => e.stopPropagation()} // Prevent parent click handlers
            >
              {extractDomain(part.content)}
            </a>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </span>
  );
}
