// components/Table/Table.jsx
//
// Why it exists: Users, Shops, Products, and Orders all need a <table>.
//               Without this, each page would duplicate hundreds of lines of table HTML.
// Responsibility: Render a fully styled table from columns[] + data[] props.
// Used by: UsersPage, ShopsPage, ProductsPage, OrdersPage, RecentOrdersTable
//
// columns prop shape:
//   [{ header: 'Name', accessor: 'name', render?: (value, row) => JSX }]
//
// The render function allows any cell to render a Badge, Button, or custom JSX.
// Without render, the raw value from data[accessor] is displayed.

import Loader from '../Loader/Loader';
import EmptyState from '../EmptyState/EmptyState';
import TableSkeleton from './TableSkeleton';

const Table = ({
  columns      = [],
  data         = [],
  isLoading    = false,
  emptyTitle   = 'No data found',
  emptyMessage = 'There is nothing to display here yet.',
  emptyIcon,
  onRowClick,
  keyExtractor = (row) => row.id,
}) => {
  if (isLoading) {
    return <TableSkeleton columns={columns.length} />;
  }

  if (!isLoading && data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyMessage}
      />
    );
  }

  return (
    <div className="table-wrapper">
      <table className="table-base">
        {/* Header */}
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="table-th" style={col.width ? { width: col.width } : {}}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className={`table-row ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col, idx) => (
                <td key={idx} className="table-td">
                  {col.render
                    ? col.render(col.accessor ? row[col.accessor] : undefined, row)
                    : col.accessor
                    ? (row[col.accessor] ?? '—')
                    : '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
