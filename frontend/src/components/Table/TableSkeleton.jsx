// components/Table/TableSkeleton.jsx
//
// Why it exists: While data is loading, showing empty rows with animated shimmer
//               prevents layout shift and feels faster than a spinner.
// Responsibility: Render animated placeholder rows that match the table's column count.
// Used by: Table.jsx (auto-rendered during isLoading = true)

const TableSkeleton = ({ columns = 4, rows = 6 }) => (
  <div className="table-wrapper">
    <table className="table-base">
      <thead>
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="table-th">
              <div className="h-3 bg-surface-200 rounded animate-pulse w-20" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <tr key={rowIdx} className="border-b border-surface-100">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <td key={colIdx} className="px-4 py-3.5">
                <div
                  className="h-4 bg-surface-100 rounded animate-pulse"
                  style={{ width: `${60 + Math.random() * 30}%`, animationDelay: `${colIdx * 0.05}s` }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default TableSkeleton;
