/**
 * AgreementSnapshot — the two facts the page would have shown, and the way back
 * to the rest.
 *
 * This card exists because the extraction panel is collapsed, not because it
 * adds anything the user could not already see. Sid, 2026-08-17: *"they clicked
 * on the agreement list table, and suddenly all the extractions are missing, we
 * just took them to a blank chat."* So the snapshot is a receipt — it says the
 * extractions are still there and shows the way to them.
 *
 * **Two attributes, never more.** Poonam capped it in the same call: *"limit it
 * to really two of them, type and expiration date, with the third item being see
 * all."* Her reason is a standing one — extractions carry an accuracy reputation,
 * and *"bringing extractions into chat pollutes their thinking about chat also."*
 * Two is the dose that pays the debt without starting that argument. Do not add
 * parties, status, or a value row here.
 *
 * **"See all" opens the panel beside the chat, never instead of it.** Sid: *"both
 * will be open at that point in time… think of it as it opening the citation."*
 * The host owns that; this component only reports the click.
 */

import { Icon } from '@ink';

import styles from './AgreementSnapshot.module.css';

// =============================================================================
// Types
// =============================================================================

export interface AgreementSnapshotProps {
  /** The agreement's name. Sits at the top, one line, truncated. */
  fileName: string;
  /** Agreement type — "License", "MSA", "Order Form". */
  agreementType?: string;
  /** Expiration, already formatted by the host. Omit when the agreement has none. */
  expiration?: string;
  /** How many extractions exist behind the panel. Drives the "See all" label. */
  extractionCount?: number;
  /** Opens the extraction panel beside the chat. Omit and there is no way out. */
  onSeeAll?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export const AgreementSnapshot = ({
  fileName,
  agreementType,
  expiration,
  extractionCount,
  onSeeAll,
}: AgreementSnapshotProps) => {
  /*
    Only the fields the agreement actually has. An empty row would be the
    fourth copy of "we do not know" — the panel already says that better.
  */
  const fields = [
    agreementType && { label: 'Type', value: agreementType },
    expiration && { label: 'Expires', value: expiration },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className={styles.card}>
      <p className={styles.fileName} title={fileName}>
        {fileName}
      </p>

      {fields.length > 0 && (
        <dl className={styles.fields}>
          {fields.map((field) => (
            <div key={field.label} className={styles.field}>
              <dt className={styles.fieldLabel}>{field.label}</dt>
              <dd className={styles.fieldValue}>{field.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {onSeeAll && (
        <button type="button" className={styles.seeAll} onClick={onSeeAll}>
          {extractionCount ? `See all ${extractionCount} extractions` : 'See all extractions'}
          <Icon name="chevron-right" size={14} />
        </button>
      )}
    </div>
  );
};

AgreementSnapshot.displayName = 'AgreementSnapshot';
