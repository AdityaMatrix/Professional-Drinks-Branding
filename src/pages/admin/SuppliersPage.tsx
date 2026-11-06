import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { RiskBadge, StatusBadge } from '../../components/Badge';
import { Button, buttonClass } from '../../components/Button';
import { QueryError } from '../../components/QueryError';
import { SelectField } from '../../components/SelectField';
import stateStyles from '../../components/StoreStates.module.css';
import { TextField } from '../../components/TextField';
import {
  categoryLabels,
  formatDate,
  PAGE_SIZE,
  parseSupplierFilters,
  riskLabels,
  statusLabels,
  type SortColumn,
} from '../../data/suppliers';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';
import { useSuppliers } from '../../hooks/useSuppliers';
import styles from './admin.module.css';

const columns: { key: SortColumn; label: string }[] = [
  { key: 'name', label: 'Supplier' },
  { key: 'risk_score', label: 'Risk' },
  { key: 'created_at', label: 'Added' },
];

export function SuppliersPage() {
  const [params, setParams] = useSearchParams();
  const filters = parseSupplierFilters(params);
  const suppliers = useSuppliers(filters);

  /** Any filter change returns to page 1, or you can land past the end of a shorter list. */
  const updateParams = (changes: Record<string, string>, replace = false) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('page');
        Object.entries(changes).forEach(([key, value]) => {
          if (value) next.set(key, value);
          else next.delete(key);
        });
        return next;
      },
      { replace },
    );
  };

  const [searchText, setSearchText] = useState(filters.q);
  const [syncedQuery, setSyncedQuery] = useState(filters.q);
  if (syncedQuery !== filters.q) {
    setSyncedQuery(filters.q);
    setSearchText(filters.q);
  }
  const commitSearch = useDebouncedCallback((text: string) => updateParams({ q: text }, true), 300);

  const toggleSort = (column: SortColumn) => {
    const ascending = filters.sort === column && filters.direction === 'desc';
    updateParams({ sort: column, direction: ascending ? 'asc' : 'desc' });
  };

  const goToPage = (page: number) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (page > 1) next.set('page', String(page));
      else next.delete('page');
      return next;
    });
  };

  const rows = suppliers.data?.rows ?? [];
  const total = suppliers.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstRow = (filters.page - 1) * PAGE_SIZE + 1;

  return (
    <>
      <title>Suppliers | Valo Drinks</title>
      <div className={styles.titleRow}>
        <h1 className={styles.heading}>Suppliers</h1>
        <Link className={buttonClass} to="/admin/suppliers/new">
          Add a supplier
        </Link>
      </div>

      <form className={styles.filters} role="search" onSubmit={(event) => event.preventDefault()}>
        <TextField
          label="Search"
          type="search"
          value={searchText}
          maxLength={50}
          onChange={(event) => {
            setSearchText(event.target.value);
            commitSearch(event.target.value);
          }}
        />
        <SelectField
          label="Status"
          value={filters.status ?? ''}
          onChange={(event) => updateParams({ status: event.target.value })}
        >
          <option value="">All statuses</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Risk"
          value={filters.risk ?? ''}
          onChange={(event) => updateParams({ risk: event.target.value })}
        >
          <option value="">All risk levels</option>
          {Object.entries(riskLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Category"
          value={filters.category ?? ''}
          onChange={(event) => updateParams({ category: event.target.value })}
        >
          <option value="">All categories</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
      </form>

      {suppliers.isPending && (
        <div
          className={`${stateStyles.skeleton} ${styles.skeletonTable}`}
          role="status"
          aria-label="Loading suppliers"
        />
      )}

      {suppliers.isError && (
        <QueryError
          message="We couldn't load the suppliers."
          onRetry={() => void suppliers.refetch()}
          retrying={suppliers.isFetching}
        />
      )}

      {suppliers.isSuccess && rows.length === 0 && (
        <div className={stateStyles.state}>
          <p>No suppliers match those filters.</p>
          <Button variant="secondary" onClick={() => setParams({})}>
            Clear filters
          </Button>
        </div>
      )}

      {suppliers.isSuccess && rows.length > 0 && (
        <>
          <div
            className={styles.tableWrap}
            data-stale={suppliers.isPlaceholderData}
            role="group"
            aria-label="Suppliers table"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- keyboard users need focus here to scroll the table sideways
            tabIndex={0}
          >
            <table className={styles.table}>
              <thead>
                <tr>
                  {columns.slice(0, 1).map((column) => (
                    <SortHeader
                      key={column.key}
                      column={column}
                      filters={filters}
                      onSort={toggleSort}
                    />
                  ))}
                  <th scope="col">Category</th>
                  <th scope="col">Country</th>
                  <th scope="col">Status</th>
                  {columns.slice(1).map((column) => (
                    <SortHeader
                      key={column.key}
                      column={column}
                      filters={filters}
                      onSort={toggleSort}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>
                      <Link className={styles.rowLink} to={`/admin/suppliers/${supplier.id}`}>
                        {supplier.name}
                      </Link>
                    </td>
                    <td>{categoryLabels[supplier.category]}</td>
                    <td>{supplier.country}</td>
                    <td>
                      <StatusBadge status={supplier.status} />
                    </td>
                    <td>
                      <RiskBadge level={supplier.riskLevel} />
                    </td>
                    <td>{formatDate(supplier.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className={styles.pagination} aria-label="Pagination">
            <p role="status">
              Showing {firstRow}–{firstRow + rows.length - 1} of {total}
            </p>
            <div className={styles.actions}>
              <Button
                variant="secondary"
                disabled={filters.page <= 1}
                onClick={() => goToPage(filters.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={filters.page >= pageCount}
                onClick={() => goToPage(filters.page + 1)}
              >
                Next
              </Button>
            </div>
          </nav>
        </>
      )}
    </>
  );
}

type SortHeaderProps = {
  column: { key: SortColumn; label: string };
  filters: { sort: SortColumn; direction: 'asc' | 'desc' };
  onSort: (column: SortColumn) => void;
};

function SortHeader({ column, filters, onSort }: SortHeaderProps) {
  const active = filters.sort === column.key;
  const ariaSort = !active ? 'none' : filters.direction === 'asc' ? 'ascending' : 'descending';

  return (
    <th scope="col" aria-sort={ariaSort}>
      <button type="button" className={styles.sortButton} onClick={() => onSort(column.key)}>
        {column.label}
        {active && <span aria-hidden="true">{filters.direction === 'asc' ? ' ↑' : ' ↓'}</span>}
      </button>
    </th>
  );
}
