import { useState, useMemo } from "react";
import { MdArrowUpward, MdArrowDownward, MdInbox } from "react-icons/md";

const DataTable = ({ columns, data = [], pageSize = 10, emptyMessage = "no records found" }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const [prevData, setPrevData] = useState(data);
  if (data !== prevData) {
    setPrevData(data);
    setCurrentPage(1);
  }

  const requestSort = (key, sortable) => {
    if (!sortable) return;
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Sort Data
  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Deep accessor support (e.g. 'payroll.net')
        if (sortConfig.key.includes(".")) {
          aValue = sortConfig.key.split(".").reduce((obj, key) => obj?.[key], a);
          bValue = sortConfig.key.split(".").reduce((obj, key) => obj?.[key], b);
        }

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (typeof aValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  // Paginated Data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? (
      <MdArrowUpward className="inline-block ml-1.5 align-middle text-base text-primary" />
    ) : (
      <MdArrowDownward className="inline-block ml-1.5 align-middle text-base text-primary" />
    );
  };

  const renderCell = (item, column) => {
    if (column.render) {
      return column.render(item);
    }
    if (column.accessor.includes(".")) {
      return column.accessor.split(".").reduce((obj, key) => obj?.[key], item);
    }
    return item[column.accessor];
  };

  return (
    <div className="bg-bg-secondary border border-border-color rounded-lg shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-bg-primary border-b border-border-color">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`px-6 py-4 font-semibold text-text-secondary select-none lowercase ${
                    col.sortable ? "cursor-pointer hover:text-primary transition-all" : ""
                  }`}
                  onClick={() => requestSort(col.accessor, col.sortable)}
                  style={{ width: col.width }}
                >
                  {col.header}
                  {col.sortable && getSortIcon(col.accessor)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rIndex) => (
                <tr key={row.id || rIndex} className="border-b border-border-color last:border-b-0 hover:bg-bg-primary transition-all">
                  {columns.map((col, cIndex) => (
                    <td key={cIndex} className="px-6 py-4 text-text-primary align-middle">
                      {renderCell(row, col)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>
                  <div className="py-12 px-6 text-center flex flex-col items-center gap-3 text-text-secondary">
                    <MdInbox className="text-5xl text-text-muted" />
                    <span className="text-base font-semibold">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {sortedData.length > pageSize && (
        <div className="px-6 py-4 border-t border-border-color flex items-center justify-between bg-bg-secondary lowercase">
          <span className="text-xs text-text-secondary">
            showing {Math.min((currentPage - 1) * pageSize + 1, sortedData.length)} to{" "}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-md border border-border-color bg-bg-secondary text-text-primary text-xs font-semibold cursor-pointer transition-all hover:bg-bg-primary hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed lowercase"
            >
              previous
            </button>
            <span className="text-sm font-semibold px-2 text-text-primary lowercase">
              page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-md border border-border-color bg-bg-secondary text-text-primary text-xs font-semibold cursor-pointer transition-all hover:bg-bg-primary hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed lowercase"
            >
              next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
