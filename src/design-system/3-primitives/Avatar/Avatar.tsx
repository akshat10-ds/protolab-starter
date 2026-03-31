import React from 'react';
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
  const avatarClasses = [
    styles.avatar,
    styles[size],
    styles[shape],
    !src && styles[`color${colorIndex}`],
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
      {src ? (
        <img src={src} alt={alt} className={styles.image} />
      ) : initials ? (
        <span className={styles.initials}>{getInitials()}</span>
      ) : (
        <svg className={styles.placeholder} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
            fill="currentColor"
          />
        </svg>
      )}
    </div>
  );
};

Avatar.displayName = 'Avatar';
