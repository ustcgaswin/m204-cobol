import React, { useState, useRef } from 'react';
import { Edit3, Save, XCircle, UploadCloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../config/axiosConfig';

const InventoryDetailPanel = ({
  projectId,
  selectedItem,
  isEditing,
  editedItemData,
  activeTab,
  getEditableFields,
  renderDetailItem,
  renderStructureField,
  renderImageDefinitionField,
  onEdit,
  onSave,
  onCancel,
  onRefresh,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedItem) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('m204_db_file_name', selectedItem.name);

    const analysisPromise = apiClient.post(`/analysis/project/${projectId}/upload_and_analyze_parmlib`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    toast.promise(analysisPromise, {
      loading: 'Uploading and analyzing Parmlib file...',
      success: () => {
        if (onRefresh) {
          onRefresh();
        }
        return 'Parmlib analyzed successfully. Data has been refreshed.';
      },
      error: (error) => {
        const errorMessage = error.response?.data?.detail || error.message || "An unknown error occurred.";
        console.error("Failed to upload and analyze parmlib:", error);
        return `Error: ${errorMessage}`;
      },
    });

    analysisPromise.finally(() => {
        setIsUploading(false);
        if(fileInputRef.current) {
          fileInputRef.current.value = '';
        }
    });
  };

  if (!selectedItem) {
    return <p className="text-sm text-gray-500 pt-2">Select an item from the list to view its details.</p>;
  }

  const itemToDisplay = isEditing ? editedItemData : selectedItem;

  return (
    <div className="relative">
      {isUploading && (
        <div className="absolute inset-0 bg-gray-50 bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
          <Loader2 size={32} className="animate-spin text-teal-600" />
          <p className="mt-3 text-sm font-semibold text-gray-700">Analyzing Parmlib...</p>
          <p className="mt-1 text-xs text-gray-500">The item details will refresh upon completion.</p>
        </div>
      )}
      <div className={isUploading ? 'opacity-40' : ''}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-base text-gray-700">Item Details</h3>
          {selectedItem && !isEditing && (activeTab === 'm204DbFiles' || activeTab === 'procedures' || activeTab === 'otherDatasets') && (
            <div className="flex items-center gap-2">
              {activeTab === 'm204DbFiles' && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".txt,.parm,.*"
                    disabled={isUploading}
                  />
                  <button
                    onClick={handleUploadClick}
                    className="flex items-center gap-1.5 text-xs bg-indigo-500 hover:bg-indigo-600 text-white py-1.5 px-3 rounded-md transition-colors disabled:bg-indigo-300"
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
                    {isUploading ? 'Uploading...' : 'Upload Parmlib'}
                  </button>
                </>
              )}
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-3 rounded-md transition-colors"
              >
                <Edit3 size={12} /> Edit
              </button>
            </div>
          )}
        </div>
        <div className="space-y-1">
          {Object.entries(getEditableFields(itemToDisplay)).map(([key, label]) => {
            if (Object.prototype.hasOwnProperty.call(itemToDisplay, key) ||
                (key === 'attributesDisplay' && activeTab === 'variables' && Object.prototype.hasOwnProperty.call(itemToDisplay, 'attributes')) ||
                (key === 'imageStatementsDisplay' && activeTab === 'otherDatasets' && itemToDisplay.imageStatements?.length > 0)) {
              
              let valueToRender;
              if (key === 'attributesDisplay') valueToRender = itemToDisplay.attributes;
              else if (key === 'imageStatementsDisplay') valueToRender = itemToDisplay.imageStatements;
              else valueToRender = itemToDisplay[key];

              return <div key={`${itemToDisplay._internalId || itemToDisplay.name}-${key}`}>{renderDetailItem(label, valueToRender, key, selectedItem, selectedItem._internalId || selectedItem.name)}</div>;
            }
            return null;
          })}

          {activeTab === 'procedures' && itemToDisplay?.parsedParameters?.parameters?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Parsed Parameters:</h4>
              <div className="space-y-1.5">
                {itemToDisplay.parsedParameters.parameters.map((param, index) => (
                  <div key={index} className="grid grid-cols-[auto_1fr] gap-x-2 items-center py-0.5">
                    <span className="text-xs font-medium text-gray-500 truncate" title={param.name}>{param.name}:</span>
                    <span className="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md font-mono">{param.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'm204DbFiles' && (
            itemToDisplay.structure && itemToDisplay.structure.length > 0 ? (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Structure (Fields):</h4>
                {itemToDisplay.structure.map((field, index) => renderStructureField(field, index, selectedItem))}
                {isEditing && <p className="text-xs text-gray-500 mt-2">Field structure editing is enabled.</p>}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-2">No detailed field structure available for this M204 DB file.</p>
            )
          )}

          {activeTab === 'otherDatasets' && (
            itemToDisplay.parsedImageFields && itemToDisplay.parsedImageFields.length > 0 ? (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Image Fields:</h4>
                {itemToDisplay.parsedImageFields.map((field, index) => renderImageDefinitionField(field, index, selectedItem))}
                {isEditing && <p className="text-xs text-gray-500 mt-2">Image field editing is enabled.</p>}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-2">No parsed image fields available for this file.</p>
            )
          )}

          {isEditing && (
            <div className="pt-4 mt-4 border-t border-gray-200 flex gap-3">
              <button onClick={onSave} className="flex-1 flex items-center justify-center gap-1.5 text-sm bg-teal-500 hover:bg-teal-600 text-white py-2 px-3 rounded-md transition-colors">
                <Save size={16} /> Save
              </button>
              <button onClick={onCancel} className="flex-1 flex items-center justify-center gap-1.5 text-sm bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded-md transition-colors">
                <XCircle size={16} /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryDetailPanel;