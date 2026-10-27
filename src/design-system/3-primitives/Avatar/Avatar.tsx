import React from 'react';
import { Icon } from '../Icon';
import { AlertBadge } from '../AlertBadge';
import styles from './Avatar.module.css';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'xsmall' | 'small' | 'medium' | 'large';
  shape?: 'circle' | 'round' | 'square';
  shadow?: boolean;
  border?: boolean;
  badge?: boolean | React.ReactNode;
  colorIndex?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 'sign';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  initials,
  size = 'medium',
  shape = 'circle',
  colorIndex = 0,
  shadow = false,
  border = false,
  badge = false,
  className,
  ...props
}) => {
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => setImgError(false), [src]);
  const showImage = src && !imgError;
  const showInitials = !showImage && !!initials;
  const showPlaceholder = !showImage && !showInitials;

  const avatarClasses = [
    styles.avatar,
    styles[size],
    styles[shape === 'round' ? 'circle' : shape],
    shadow && styles.shadow,
    border && styles.border,
    showInitials && styles[`color${colorIndex}`],
    showPlaceholder && styles.placeholderBg,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const getInitials = () => {
    if (initials) {
      return initials.substring(0, 2).toUpperCase();
    }
    return '';
  };

  return (
    <div data-ink-component="Avatar" data-ink-prop-size={size} className={avatarClasses} role={!showImage && alt ? 'img' : undefined} aria-label={!showImage && alt ? alt : undefined} {...props}>
      {src && !imgError ? (
        <img src={src} alt={alt} className={styles.image} onError={() => setImgError(true)} />
      ) : initials ? (
        <span className={styles.initials}>{getInitials()}</span>
      ) : (
        <Icon name={shape === 'square' ? 'building-company' : 'person'} size={size === 'large' ? 24 : size === 'medium' ? 20 : size === 'small' ? 16 : 12} className={styles.placeholder} aria-hidden />
      )}
      {badge && <span className={styles.badge}>{badge === true ? <AlertBadge dot /> : badge}</span>}
    </div>
  );
};

Avatar.displayName = 'Avatar';
