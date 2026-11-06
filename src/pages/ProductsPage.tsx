import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '../components/Button';
import { ProductCard } from '../components/ProductCard';
import { QueryError } from '../components/QueryError';
import stateStyles from '../components/StoreStates.module.css';
import { parseFilters, roles, sortLabels, type SortKey } from '../data/products';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { useProducts } from '../hooks/useProducts';
import styles from './ProductsPage.module.css';

export function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const filters = parseFilters(params);
  const products = useProducts(filters);

  const setParam = (key: string, value: string, replace = false) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace },
    );
  };

  // The box updates on every key, the URL (and so the request) only when typing pauses.
  const [searchText, setSearchText] = useState(filters.q);
  const [syncedQuery, setSyncedQuery] = useState(filters.q);
  if (syncedQuery !== filters.q) {
    // The URL changed from outside the box, e.g. the back button or Clear filters.
    setSyncedQuery(filters.q);
    setSearchText(filters.q);
  }
  const commitSearch = useDebouncedCallback((text: string) => setParam('q', text, true), 300);

  const results = products.data ?? [];

  return (
    <div className={styles.page}>
      <title>Shop | Valo Drinks</title>
      <h1 className={styles.heading}>Shop</h1>

      <form className={styles.filters} role="search" onSubmit={(event) => event.preventDefault()}>
        <label className={styles.filter}>
          Search
          <input
            type="search"
            value={searchText}
            maxLength={50}
            onChange={(event) => {
              setSearchText(event.target.value);
              commitSearch(event.target.value);
            }}
          />
        </label>
        <label className={styles.filter}>
          Agent role
          <select
            value={filters.role ?? ''}
            onChange={(event) => setParam('role', event.target.value)}
          >
            <option value="">All roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role[0]?.toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filter}>
          Sort by
          <select
            value={filters.sort}
            onChange={(event) =>
              setParam('sort', event.target.value === 'featured' ? '' : event.target.value)
            }
          >
            {(Object.keys(sortLabels) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {sortLabels[key]}
              </option>
            ))}
          </select>
        </label>
      </form>

      {products.isPending && (
        <div className={styles.grid} role="status" aria-label="Loading products">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className={`${stateStyles.skeleton} ${styles.skeletonCard}`} />
          ))}
        </div>
      )}

      {products.isError && (
        <QueryError
          message="We couldn't load the drinks."
          onRetry={() => void products.refetch()}
          retrying={products.isFetching}
        />
      )}

      {products.isSuccess && results.length === 0 && (
        <div className={stateStyles.state}>
          <p>No drinks match those filters.</p>
          <Button variant="secondary" onClick={() => setParams({})}>
            Clear filters
          </Button>
        </div>
      )}

      {products.isSuccess && results.length > 0 && (
        <>
          <p className="visually-hidden" role="status">
            {results.length} {results.length === 1 ? 'drink' : 'drinks'} found
          </p>
          <div className={styles.grid} data-stale={products.isPlaceholderData}>
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
