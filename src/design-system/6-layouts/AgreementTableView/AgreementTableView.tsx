/**
 * AgreementTableView Layout
 *
 * A Layer 6 layout for table-based list pages in DocuSign Navigator style.
 * Provides consistent spacing and structure for pages with:
 * - PageHeader (with optional AI badge)
 * - Banner (optional, for alerts/promos)
 * - FilterBar (view selector, search, filters)
 * - DataTable content area
 *
 * @example
 * <AgreementTableView
 *   pageHeader={<PageHeader title="Completed" showAIBadge actions={...} />}
 *   banner={<Banner kind="promo">...</Banner>}
 *   filterBar={<FilterBar viewSelector={...} search={...} filters={...} />}
 * >
 *   <DataTable columns={columns} data={data} ... />
 * </AgreementTableView>
 */

import React from 'react';
import { Stack } from '../../2-utilities/Stack';
import styles from './AgreementTableView.module.css';

export interface AgreementTableViewProps {
  /** PageHeader component with title, AI badge, and actions */
  pageHeader: React.ReactNode;

  /** Optional Banner component for alerts, promos, or notifications */
  banner?: React.ReactNode;

  /** FilterBar component with view selector, search, and filter controls */
  filterBar: React.ReactNode;

  /** Main content area - typically a DataTable */
  children: React.ReactNode;

  /** Additional className for the container */
  className?: string;

  /**
   * Padding variant for content areas.
   * - 'default': 80px horizontal padding (standard Navigator layout)
   * - 'compact': 32px horizontal padding (narrower screens)
   */
  paddingVariant?: 'default' | 'compact';
}

export const AgreementTableView: React.FC<AgreementTableViewProps> = ({
  pageHeader,
  banner,
  filterBar,
  children,
  className,
  paddingVariant = 'default',
}) => {
  const containerClasses = [
    styles.container,
    paddingVariant === 'compact' ? styles.paddingCompact : styles.paddingDefault,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Stack data-ink-component="AgreementTableView" gap="none" className={containerClasses}>
      {/* Page Header */}
      <div className={styles.pageHeader}>{pageHeader}</div>

      {/* Banner (optional) */}
      {banner && <div className={styles.banner}>{banner}</div>}

      {/* Filter Bar */}
      <div className={styles.filterBar}>{filterBar}</div>

      {/* Table Content */}
      <div className={styles.tableWrapper}>{children}</div>
    </Stack>
  );
};

AgreementTableView.displayName = 'AgreementTableView';
