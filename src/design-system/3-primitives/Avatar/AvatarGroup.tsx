import React from 'react';
import { Avatar, AvatarProps } from './Avatar';
import styles from './AvatarGroup.module.css';

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: AvatarProps[];
  max?: number;
  size?: 'xsmall' | 'small' | 'medium' | 'large';
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars = [],
  max = 5,
  size = 'medium',
  className,
  ...props
}) => {
  const visibleLimit = Math.max(0, Math.floor(max));
  const visibleAvatars = avatars.slice(0, visibleLimit);
  const remainingCount = Math.max(0, avatars.length - visibleLimit);

  return (
    <div data-ink-component="AvatarGroup" className={`${styles.avatarGroup} ${className || ''}`} {...props}>
      <div className={styles.avatars}>
        {visibleAvatars.map((avatarProps, index) => (
          <div key={index} className={styles.avatarWrapper}>
            <Avatar {...avatarProps} size={size} border />
          </div>
        ))}
      </div>
      {remainingCount > 0 && (
        <span className={styles.overflowCount} aria-label={`${remainingCount} more people`}>
          +{remainingCount}
        </span>
      )}
    </div>
  );
};

AvatarGroup.displayName = 'AvatarGroup';
