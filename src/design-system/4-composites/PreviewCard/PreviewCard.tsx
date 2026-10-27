import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './PreviewCard.module.css';

export interface PreviewCardImageProps { src: string; alt: string; kind?: 'document' | 'image'; ratio?: '16:9' | '3:2' | '1:1'; badge?: React.ReactNode; className?: string; }
const Image: React.FC<PreviewCardImageProps> = ({ src, alt, kind = 'document', ratio = '3:2', badge, className }) => <div className={cn(styles.image, styles[kind], className)} style={{ aspectRatio: ratio.replace(':', '/') }}><img src={src} alt={alt} />{badge && <div className={styles.badge}>{badge}</div>}</div>;
export interface PreviewCardHeadingProps { text: string; description?: React.ReactNode; action?: React.ReactNode; level?: 1 | 2 | 3 | 4 | 5 | 6; }
const Heading: React.FC<PreviewCardHeadingProps> = ({ text, description, action, level = 3 }) => {
  const Element = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return <div className={styles.heading}><div className={styles.copy}><Element className={styles.title}>{text}</Element>{description && <div className={styles.description}>{description}</div>}</div>{action && <div className={styles.action}>{action}</div>}</div>;
};
export interface PreviewCardProps extends React.HTMLAttributes<HTMLDivElement> { heading: React.ReactNode; selected?: boolean; onOpen?: () => void; openLabel?: string; }
const PreviewCardRoot: React.FC<PreviewCardProps> = ({ heading, children, selected = false, onOpen, openLabel = 'Open preview', className, ...props }) => <div {...props} data-ink-component="PreviewCard" data-selected={selected || undefined} className={cn(styles.card, selected && styles.selected, onOpen && styles.interactive, className)}>
  {children}{heading}{onOpen && <button type="button" className={styles.open} onClick={onOpen}><span className={styles.srOnly}>{openLabel}</span></button>}
</div>;
export const PreviewCard = Object.assign(PreviewCardRoot, { Image, Heading });
PreviewCard.displayName = 'PreviewCard';
