import React from 'react';
import { Loader2, AlertTriangle, Package, ChevronRight } from 'lucide-react';

const InventoryList = ({
  loading,
  error,
  filteredData,
  currentTabData,
  currentTabConfig,
  selectedItem,
  isEditing,
  onSelectItem,
}) => {
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin mr-2" /> Loading {currentTabConfig?.label.toLowerCase()}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-md m-2">
        <AlertTriangle size={24} className="mx-auto mb-2" />
        <p className="font-semibold">Error loading data</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        {currentTabData.length > 0
          ? `No ${currentTabConfig?.label.toLowerCase()} found matching your search.`
          : `No ${currentTabConfig?.label.toLowerCase()} found for this project.`}
      </div>
    );
  }

  return (
    <>
      {filteredData.map((item) => {
        const Icon = currentTabConfig?.icon || Package;
        const isSelected = selectedItem?._internalId === item._internalId;
        let itemClasses = 'hover:bg-gray-100 text-gray-700';
        if (isSelected) {
            itemClasses = isEditing ? 'bg-orange-100 text-orange-700 font-medium' : 'bg-teal-100 text-teal-700 font-medium';
        }

        return (
          <button
            key={item.key}
            onClick={() => onSelectItem(item)}
            className={`w-full flex items-center text-left px-3 py-3 text-sm rounded-md ${itemClasses} transition-colors duration-150`}
          >
            <Icon size={15} className="mr-2.5 flex-shrink-0 text-gray-500" />
            <span className="truncate flex-grow" title={item.name}>{item.name}</span>
            {currentTabConfig?.subDisplayField && item[currentTabConfig.subDisplayField] && typeof item[currentTabConfig.subDisplayField] === 'string' && item[currentTabConfig.subDisplayField] !== 'N/A' && (
              <span className="ml-2 text-gray-400 text-xs truncate hidden sm:inline" title={item[currentTabConfig.subDisplayField]}>
                ({item[currentTabConfig.subDisplayField].substring(0, 30)}{item[currentTabConfig.subDisplayField].length > 30 ? '...' : ''})
              </span>
            )}
            <ChevronRight size={15} className="ml-auto text-gray-400 flex-shrink-0" />
          </button>
        );
      })}
    </>
  );
};

export default InventoryList;