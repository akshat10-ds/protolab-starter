import React from 'react';
import { Icon } from '../Icon';
import styles from './Avatar.module.css';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'xsmall' | 'small' | 'medium' | 'large';
  shape?: 'circle' | 'square';
  colorIndex?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 'sign';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  initials,
  size = 'medium',
  shape = 'circle',
  colorIndex = 0,
  className,
  ...props
}) => {
  const [imgError, setImgError] = React.useState(false);

  const showImage = src && !imgError;
  const showInitials = !showImage && !!initials;
  const showPlaceholder = !showImage && !showInitials;

  const avatarClasses = [
    styles.avatar,
    styles[size],
    styles[shape],
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
    <div data-ink-component="Avatar" data-ink-prop-size={size} className={avatarClasses} {...props}>
      {src && !imgError ? (
        <img src={src} alt={alt} className={styles.image} onError={() => setImgError(true)} />
      ) : initials ? (
        <span className={styles.initials}>{getInitials()}</span>
      ) : (
        <Icon name="person" className={styles.placeholder} aria-hidden />
      )}
    </div>
  );
};

Avatar.displayName = 'Avatar';
