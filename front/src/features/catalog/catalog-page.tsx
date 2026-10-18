import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { Search, SlidersHorizontal } from 'lucide-react'
import { StitchIcon } from '@/components/stitch-icon'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { GroupBanner } from './group-banner'
import { destinations, categories } from '../../../../shared/contracts'
import { useTours } from './queries'
import { TourCard } from './tour-card'
import { Metadata } from '@/components/metadata'
import { ErrorState, Loading } from '@/components/feedback'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Badge } from '@/components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { SelectField } from '@/components/select-field'
import { SelectItem } from '@/components/ui/select'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
const sorts = ['recommended', 'price-asc', 'duration-desc'] as const
export default function CatalogPage() {
  const { t } = useTranslation('catalog')
  const { t: common } = useTranslation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(''),
      destination: parseAsString.withDefault(''),
      category: parseAsString.withDefault(''),
      sort: parseAsStringLiteral(sorts).withDefault('recommended'),
      page: parseAsInteger.withDefault(1),
    },
    { history: 'replace' },
  )
  const query = useTours({ ...filters, page: Math.max(1, filters.page) })
  const update = (value: Partial<typeof filters>) => {
    void setFilters({ ...value, page: 1 })
  }
  const reset = () => {
    void setFilters(null)
  }
  return (
    <>
      <Metadata title={t('title')} description={t('subtitle')} />
      <section className="stitch-catalog-intro">
        <div className="stitch-container stitch-catalog-intro-grid">
          <div>
            <Badge variant="outline" className="stitch-catalog-badge">
              <StitchIcon name="explore" />
              {t('design.region')}
            </Badge>
            <h1>{t('title')}</h1>
            <p>{t('subtitle')}</p>
          </div>
          <div className="stitch-catalog-info">
            <div>
              <StitchIcon name="chat" />
              <span>
                <small>{t('design.localContact')}</small>
                <strong>{t('design.manualConfirmation')}</strong>
              </span>
            </div>
            <div className="stitch-mobile-catalog-tools">
              <Field>
                <FieldLabel className="sr-only" htmlFor="sort-mobile">
                  {t('sort')}
                </FieldLabel>
                <SelectField
                  id="sort-mobile"
                  value={filters.sort}
                  onValueChange={(value) => update({ sort: value as typeof filters.sort })}
                >
                  {sorts.map((sort) => (
                    <SelectItem value={sort} key={sort}>
                      {t(sort)}
                    </SelectItem>
                  ))}
                </SelectField>
              </Field>
              <Button
                variant="soft"
                size="icon"
                aria-label={t('search')}
                aria-expanded={searchOpen || !!filters.q}
                aria-controls="catalog-search"
                onClick={() => setSearchOpen((v) => !v)}
              >
                <StitchIcon name="search" />
              </Button>
            </div>
            <div>
              <StitchIcon name="payments" />
              <span>
                <small>{common('priceNotice')}</small>
                <strong>USD</strong>
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="stitch-filter-section">
        <div className="stitch-container">
          <div className="stitch-filter-top">
            <ToggleGroup
              type="single"
              className="stitch-location-tabs"
              value={filters.destination || 'all'}
              onValueChange={(v) => update({ destination: v === 'all' ? '' : v })}
              aria-label={t('destination')}
            >
              <ToggleGroupItem value="all">{t('design.all')}</ToggleGroupItem>
              {destinations.map((d) => (
                <ToggleGroupItem key={d} value={d}>
                  {common(`destinations.${d}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Field className="stitch-sort" orientation="horizontal">
              <FieldLabel htmlFor="sort">
                <StitchIcon name="swap_vert" />
                {t('sort')}
              </FieldLabel>
              <SelectField
                id="sort"
                value={filters.sort}
                onValueChange={(value) => update({ sort: value as typeof filters.sort })}
              >
                {sorts.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(s)}
                  </SelectItem>
                ))}
              </SelectField>
            </Field>
          </div>
          <FieldGroup
            id="catalog-search"
            className="stitch-catalog-search"
            data-expanded={searchOpen || !!filters.q}
          >
            <Field className="stitch-mobile-destination">
              <FieldLabel htmlFor="search">{t('search')}</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Search aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  id="search"
                  value={filters.q}
                  onChange={(e) => update({ q: e.target.value })}
                  maxLength={150}
                  placeholder={t('search')}
                />
              </InputGroup>
            </Field>
          </FieldGroup>
          <div className="stitch-activity-row">
            <span>{t('design.activity')}:</span>
            <ToggleGroup
              type="single"
              className="stitch-category-tabs"
              value={filters.category || 'all'}
              onValueChange={(v) => update({ category: v === 'all' ? '' : v })}
              aria-label={t('category')}
            >
              <ToggleGroupItem value="all">{t('design.all')}</ToggleGroupItem>
              {categories.map((c) => (
                <ToggleGroupItem key={c} value={c}>
                  {common(`categories.${c}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </section>
      <section className="stitch-container stitch-catalog-results">
        <span className="sr-only" aria-live="polite">
          {query.data && t('results', { count: query.data.total })}
        </span>
        <div className="stitch-results-line" aria-live="polite">
          <div>
            <strong>{t('design.featuredLabel')}</strong>
            <Badge variant="secondary">
              {query.data && t('design.count', { count: query.data.total })}
            </Badge>
          </div>
          {(filters.q || filters.destination || filters.category) && (
            <Button variant="ghost" onClick={reset}>
              <SlidersHorizontal data-icon="inline-start" />
              {t('reset')}
            </Button>
          )}
        </div>
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        ) : query.data.items.length ? (
          <>
            <div className="stitch-tour-grid">
              {query.data.items.map((tour, index) => (
                <TourCard tour={tour} key={tour.id} priority={index < 3} />
              ))}
            </div>
            {query.data.total > query.data.pageSize && (
              <Pagination
                className="pagination"
                aria-label={t('page', {
                  page: query.data.page,
                  total: Math.ceil(query.data.total / query.data.pageSize),
                })}
              >
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={`?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(window.location.search)), page: String(Math.max(1, filters.page - 1)) })}`}
                      text={t('previous')}
                      aria-label={t('previous')}
                      aria-disabled={filters.page <= 1}
                      tabIndex={filters.page <= 1 ? -1 : undefined}
                      onClick={(event) => {
                        event.preventDefault()
                        if (filters.page > 1) void setFilters({ page: filters.page - 1 })
                      }}
                    />
                  </PaginationItem>
                  <PaginationItem aria-current="page">
                    {t('page', {
                      page: query.data.page,
                      total: Math.ceil(query.data.total / query.data.pageSize),
                    })}
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href={`?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(window.location.search)), page: String(filters.page + 1) })}`}
                      text={t('next')}
                      aria-label={t('next')}
                      aria-disabled={filters.page * query.data.pageSize >= query.data.total}
                      tabIndex={
                        filters.page * query.data.pageSize >= query.data.total ? -1 : undefined
                      }
                      onClick={(event) => {
                        event.preventDefault()
                        if (filters.page * query.data.pageSize < query.data.total)
                          void setFilters({ page: filters.page + 1 })
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{t('empty')}</EmptyTitle>
              <EmptyDescription>{t('emptyBody')}</EmptyDescription>
            </EmptyHeader>
            <Button onClick={reset}>{t('reset')}</Button>
          </Empty>
        )}
      </section>
      <GroupBanner />
    </>
  )
}
