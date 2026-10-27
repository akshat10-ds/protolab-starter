import * as React from 'react';
import styles from './Icon.module.css';
import irisPetals from './assets/iris-petals.svg';
import irisMain from './assets/iris-main.svg';
import irisSmallPetals from './assets/iris-small-artwork-petals.svg';
import irisSmallMain from './assets/iris-small-artwork-main.svg';
import inversePetals from './assets/inverse-petals.svg';
import inverseMain from './assets/inverse-main.svg';
import inverseSmallPetals from './assets/inverse-small-petals.svg';
import inverseSmallMain from './assets/inverse-small-main.svg';
import spark from './assets/spark-aispark.svg';
import sparkSmall from './assets/spark-small-aisparksmall.svg';
import sparkFilled from './assets/spark-filled-aisparkfilled.svg';
import sparkFilledSmall from './assets/spark-filled-small-aisparkfilledsmall.svg';

/** ai-iris-filled is retained as a compatibility alias for the standard Iris. */
export type AIIconName = 'ai-iris' | 'ai-iris-filled' | 'ai-iris-inverse' | 'ai-spark' | 'ai-spark-filled';
export type AIIconSize = 'small' | 'medium' | number;
export interface AIIconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name' | 'size' | 'children'> { name: AIIconName; size?: AIIconSize; }

/** Exact current Figma SVG assets, placed in their original20/24px containers. */
export const AIIcon: React.FC<AIIconProps> = ({ name, size = 'medium', className, 'aria-label': label, 'aria-hidden': hidden, ...props }) => {
  const pixels = typeof size === 'number' ? size : size === 'small' ? 20 : 24;
  const small = size === 'small' || (typeof size === 'number' && size <= 20);
  const box = small ? 20 : 24;
  const hasName = !!(label || props['aria-labelledby']);
  let artwork: React.ReactNode;
  if (name === 'ai-spark' || name === 'ai-spark-filled') {
    const asset = name === 'ai-spark' ? small ? sparkSmall : spark : small ? sparkFilledSmall : sparkFilled;
    artwork = <image href={asset} x={0} y={0} width={box} height={box} />;
  } else if (name === 'ai-iris-inverse') {
    artwork = small ? <><image href={inverseSmallPetals} x={0} y={0} width={20} height={20} /><image href={inverseSmallMain} x={3.01} y={3} width={13.9898} height={13.984} /></> : <><image href={inversePetals} x={0} y={0} width={24} height={24} /><image href={inverseMain} x={3.01} y={3.01} width={17.9901} height={17.9791} /></>;
  } else {
    artwork = small ? <><image href={irisSmallPetals} x={1.2499882} y={1.24698186} width={16.625} height={16.625} /><image href={irisSmallMain} x={3} y={2.99698302} width={14} height={14} /></> : <><image href={irisPetals} x={.75} y={.74612045} width={21.375} height={21.375} /><image href={irisMain} x={3} y={2.99612128} width={18} height={18} /></>;
  }
  return <svg {...props} data-ink-component="AIIcon" data-ink-prop-name={name} data-ink-source-size={box} className={`${styles.aiIcon} ${className ?? ''}`} xmlns="http://www.w3.org/2000/svg" width={pixels} height={pixels} viewBox={`0 0 ${box} ${box}`} fill="none" focusable="false" aria-label={label} aria-hidden={hidden ?? !hasName} role={props.role ?? (hasName ? 'img' : undefined)}>{artwork}</svg>;
};
AIIcon.displayName = 'AIIcon';
