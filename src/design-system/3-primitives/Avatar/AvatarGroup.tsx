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
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div data-ink-component="AvatarGroup" className={`${styles.avatarGroup} ${className || ''}`} {...props}>
      <div style={{ display: 'flex', paddingRight: '8px', isolation: 'isolate' }}>
        {visibleAvatars.map((avatarProps, index) => (
          <div key={index} className={styles.avatarWrapper}>
            <Avatar {...avatarProps} size={size} />
          </div>
        ))}
      </div>
      {remainingCount > 0 && (
        <span className={styles.overflowCount}>
          +{remainingCount}
        </span>
      )}
    </div>
  );
};

AvatarGroup.displayName = 'AvatarGroup';
