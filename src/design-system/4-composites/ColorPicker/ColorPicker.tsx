import * as React from 'react';
import { Input } from '../../3-primitives/Input';
import { IconButton } from '../../3-primitives/IconButton';
import { Button } from '../../3-primitives/Button';
import { FileUpload } from '../FileUpload';
import { cn } from '@/lib/utils';
import { clampChannel, hexToHSV, hsvToHex, normalizeHex, type HSVColor } from './color';
import styles from './ColorPicker.module.css';

// These are selectable color data, not interface theme colors.
const basicColors = ['#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#FFFFFF', '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF'];
const extendedColors = ['#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC', '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#0B5394', '#674EA7', '#A64D79'];
interface ScreenEyeDropper { open: () => Promise<{ sRGBHex: string }>; }
type EyeDropperWindow = Window & { EyeDropper?: new () => ScreenEyeDropper };
export interface ColorPickerProps {
  label?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (hex: string) => void;
  mode?: 'gradient' | 'image-upload' | 'image';
  imageSrc?: string;
  onImageChange?: (file: File) => void;
  swatches?: string[];
  savedColors?: string[];
  onSavedColorsChange?: (colors: string[]) => void;
  disabled?: boolean;
  className?: string;
}
export const ColorPicker: React.FC<ColorPickerProps> = ({ label = 'Color', value, defaultValue = '#DE483D', onChange, mode = 'gradient', imageSrc, onImageChange, swatches = basicColors, savedColors, onSavedColorsChange, disabled = false, className }) => {
  const [internal, setInternal] = React.useState(() => normalizeHex(defaultValue) ?? '#000000');
  const hex = normalizeHex(value ?? internal) ?? '#000000';
  const [hsv, setHSV] = React.useState(() => hexToHSV(hex));
  const [draft, setDraft] = React.useState(hex);
  const [error, setError] = React.useState('');
  const [expanded, setExpanded] = React.useState(false);
  const [saved, setSaved] = React.useState<string[]>([]);
  const [localImage, setLocalImage] = React.useState<File | null>(null);
  const [objectUrl, setObjectUrl] = React.useState<string>();
  const imageInput = React.useRef<HTMLInputElement>(null);
  const hexId = React.useId();
  const [eyeDropperAvailable, setEyeDropperAvailable] = React.useState(false);
  React.useEffect(() => { setHSV(hexToHSV(hex)); setDraft(hex); }, [hex]);
  React.useEffect(() => { setEyeDropperAvailable(!!(window as EyeDropperWindow).EyeDropper); }, []);
  React.useEffect(() => { if (!localImage) return; const url = URL.createObjectURL(localImage); setObjectUrl(url); return () => URL.revokeObjectURL(url); }, [localImage]);
  const emit = (color: string, nextHSV?: HSVColor) => {
    const normalized = normalizeHex(color);
    if (!normalized || disabled) return;
    if (value === undefined) {
      setInternal(normalized);
      setDraft(normalized);
      setHSV(nextHSV ?? hexToHSV(normalized));
    } else {
      // A controlled parent owns the committed color, including rejected requests.
      setDraft(hex);
      setHSV(normalized === hex && nextHSV ? nextHSV : hexToHSV(hex));
    }
    setError('');
    onChange?.(normalized);
  };
  const channel = (key: keyof HSVColor, amount: number) => { const next = { ...hsv, [key]: clampChannel(amount, key === 'h' ? 360 : 100) }; emit(hsvToHex(next), next); };
  const point = (event: React.PointerEvent<HTMLDivElement>) => { if (disabled) return; const rect = event.currentTarget.getBoundingClientRect(); if (!rect.width || !rect.height) return; const next = { ...hsv, s: clampChannel((event.clientX - rect.left) / rect.width * 100), v: clampChannel(100 - (event.clientY - rect.top) / rect.height * 100) }; emit(hsvToHex(next), next); };
  const save = () => { const next = [...new Set([hex, ...(savedColors ?? saved)])].slice(0, 9); if (savedColors === undefined) setSaved(next); onSavedColorsChange?.(next); };
  const pick = async () => { const Constructor = (window as EyeDropperWindow).EyeDropper; if (!Constructor || disabled) return; try { const result = await new Constructor().open(); emit(result.sRGBHex); } catch (cause) { if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError('The screen color picker could not open. Enter a hex color instead.'); } };
  const chooseImage = (files: File[]) => { const file = files[0]; if (file) { setLocalImage(file); onImageChange?.(file); } };
  const image = imageSrc ?? objectUrl;
  const colors = [...swatches, ...(expanded ? extendedColors : [])].flatMap(color => normalizeHex(color) ?? []);
  return <div data-ink-component="ColorPicker" role="group" aria-label={label} className={cn(styles.picker, disabled && styles.disabled, className)}>
    {mode === 'gradient' ? <div className={styles.gradient} style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }} onPointerDown={event => { if (!disabled) { event.currentTarget.setPointerCapture(event.pointerId); point(event); } }} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) point(event); }} onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}>
      <span className={styles.handle} style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }} />
      <input className={styles.srOnly} type="range" min={0} max={100} value={hsv.s} disabled={disabled} aria-label="Saturation" aria-valuetext={`${Math.round(hsv.s)} percent`} onChange={event => channel('s', Number(event.target.value))} />
      <input className={styles.srOnly} type="range" min={0} max={100} value={hsv.v} disabled={disabled} aria-label="Brightness" aria-valuetext={`${Math.round(hsv.v)} percent`} onChange={event => channel('v', Number(event.target.value))} />
    </div> : <div className={styles.imageArea}>{image ? <><img src={image} alt="Selected fill" /><Button kind="secondary" disabled={disabled} onClick={() => imageInput.current?.click()}>Replace image</Button><div hidden><FileUpload ref={imageInput} onFilesSelect={chooseImage} accept="image/png,image/jpeg,image/gif" multiple={false} maxFiles={1} disabled={disabled} /></div></> : <FileUpload ref={imageInput} onFilesSelect={chooseImage} accept="image/png,image/jpeg,image/gif" multiple={false} maxFiles={1} disabled={disabled} placeholder="Drag image file here" primaryActionLabel="Choose image" showFileList={false} />}</div>}
    <input className={styles.hue} type="range" min={0} max={360} value={hsv.h} disabled={disabled} aria-label="Hue" aria-valuetext={`${Math.round(hsv.h)} degrees`} onChange={event => channel('h', Number(event.target.value))} />
    <div className={styles.hex}><span aria-hidden="true">Hex</span><Input id={hexId} label="Hex" hideLabel value={draft} disabled={disabled} error={error || undefined} startElement={<span className={styles.swatch} style={{ backgroundColor: hex }} />} endElement={<IconButton icon="eyedropper" size="small" variant="tertiary" aria-label="Pick a color from screen" disabled={disabled || !eyeDropperAvailable} onClick={pick} />} onChange={event => { const text = event.target.value; setDraft(text); const normalized = normalizeHex(text); if (normalized && text.replace(/^#/, "").length === 6) emit(normalized); }} onBlur={() => { const normalized = normalizeHex(draft); if (normalized) emit(normalized); else setError('Enter a 3 or 6 digit hex color.'); }} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); const normalized = normalizeHex(draft); if (normalized) emit(normalized); else setError('Enter a 3 or 6 digit hex color.'); } }} /></div>
    <div className={styles.swatches} aria-label="Color swatches">{colors.map((color, index) => <button key={`${color}-${index}`} type="button" className={styles.swatchButton} style={{ backgroundColor: color }} disabled={disabled} onClick={() => emit(color)} aria-pressed={hex === color}><span className={styles.srOnly}>{color}</span></button>)}<IconButton icon={expanded ? 'chevron-up' : 'chevron-down'} size="small" variant="tertiary" aria-label={expanded ? 'Show fewer colors' : 'Show more colors'} aria-expanded={expanded} disabled={disabled} onClick={() => setExpanded(!expanded)} /></div>
    <div className={styles.swatches} aria-label="Saved colors">{(savedColors ?? saved).map(color => normalizeHex(color)).filter((color): color is string => !!color).map(color => <button key={color} type="button" className={styles.swatchButton} style={{ backgroundColor: color }} disabled={disabled} onClick={() => emit(color)}><span className={styles.srOnly}>Saved color {color}</span></button>)}<IconButton icon="plus" size="small" variant="tertiary" aria-label="Save current color" disabled={disabled} onClick={save} /></div>
  </div>;
};
ColorPicker.displayName = 'ColorPicker';
