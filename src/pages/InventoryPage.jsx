import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Database,
  Cpu,
  Variable as VariableIcon,
  Package,
  Search as SearchIcon,
  Tag,
  FolderTree,
  ChevronRight,
  Edit3, // For Edit button
  Save,  // For Save button
  XCircle // For Cancel button
} from 'lucide-react';

import { Link } from 'react-router-dom';

// --- INITIAL MOCK DATA (will be moved to state) ---
const initialMockInventoryData = {
  m204Files: [
    {
      id: 'm204file_1',
      name: 'CUSTOMER.FILE',
      type: 'M204 File',
      attributes: 'SIZE 10000, PAGESIZE 4096',
      definedIn: 'DEFFILES.M204',
      definedAtLine: 10,
      targetVsamName: 'PROJ.APP.CUST.KSDS',
      targetVsamType: 'KSDS',
      cobolSelectName: 'CUSTOMER-FILE',
      mappingStatus: 'Confirmed',
      structure: [
        { id: 'field_1_1', fieldName: 'CUST_ID', dataType: 'STRING', length: 10, m204Attributes: 'KEY' },
        { id: 'field_1_2', fieldName: 'CUST_NAME', dataType: 'STRING', length: 50, m204Attributes: 'ORDERED' },
        { id: 'field_1_3', fieldName: 'CUST_ADDRESS', dataType: 'STRING', length: 100 },
      ]
    },
    {
      id: 'm204file_2',
      name: 'ORDERS.FILE',
      type: 'M204 File',
      attributes: 'SIZE 50000',
      definedIn: 'DEFFILES.M204',
      definedAtLine: 25,
      targetVsamName: 'PROJ.APP.ORDERS.ESDS',
      targetVsamType: 'ESDS',
      cobolSelectName: 'ORDERS-FILE',
      mappingStatus: 'AI Proposed',
      structure: [
        { id: 'field_2_1', fieldName: 'ORDER_ID', dataType: 'STRING', length: 12, m204Attributes: 'KEY' },
        { id: 'field_2_2', fieldName: 'ORDER_DATE', dataType: 'DATE', length: 8 },
        { id: 'field_2_3', fieldName: 'PRODUCT_CODE', dataType: 'STRING', length: 8 },
        { id: 'field_2_4', fieldName: 'QUANTITY', dataType: 'NUMERIC', length: 5 },
      ]
    },
    {
      id: 'm204file_3',
      name: 'PRODUCT.INDEX',
      type: 'M204 File',
      attributes: 'INDEXED, KEY PROD_ID',
      definedIn: 'PRODDEFS.M204',
      definedAtLine: 5,
      targetVsamName: null,
      targetVsamType: null,
      cobolSelectName: null,
      mappingStatus: 'Pending Review',
      structure: [
        { id: 'field_3_1', fieldName: 'PROD_ID', dataType: 'STRING', length: 10, m204Attributes: 'KEY' },
        { id: 'field_3_2', fieldName: 'PROD_DESC', dataType: 'STRING', length: 75 },
      ]
    },
  ],
  procedures: [
    { id: 'proc_1', name: 'PROCESS_CUSTOMER_RECORD', type: 'Procedure', procedureType: 'PROCEDURE', parameters: '(%CUST_ID, %ACTION)', sourceFile: 'CUSTPROC.M204', startLine: 15, endLine: 150, targetCobolProgram: 'CUSTPROG', lines: 135, complexity: "Medium" },
    { id: 'proc_2', name: 'VALIDATE_INPUT', type: 'Procedure', procedureType: 'SUBROUTINE', parameters: '(%FIELD_VALUE, %FIELD_TYPE)', sourceFile: 'UTILS.M204', startLine: 5, endLine: 45, targetCobolProgram: 'VALINPUT', lines: 40, complexity: "Low" },
    { id: 'proc_3', name: 'MAIN_LOGIC_BLOCK', type: 'Procedure', procedureType: 'MAIN_BEGIN_BLOCK', parameters: null, sourceFile: 'MAINAPP.M204', startLine: 1, endLine: 200, targetCobolProgram: 'MAINPROG', lines: 199, complexity: "High" },
  ],
  variables: [
    { id: 'var_1', name: '%CUSTOMER_ID', type: 'Variable', scope: 'GLOBAL', dataType: 'STRING', sourceFile: 'CUSTPROC.M204', sourceLine: 5, cobolName: 'WS-CUSTOMER-ID', cobolPic: 'PIC X(10)', cobolLevel: '05', mappingStatus: 'Confirmed' },
    { id: 'var_2', name: '%LOOP_COUNT', type: 'Variable', scope: 'LOCAL', dataType: 'NUMERIC', sourceFile: 'MAINAPP.M204', sourceLine: 23, cobolName: 'WS-LOOP-COUNT', cobolPic: 'PIC S9(5) COMP', cobolLevel: '77', mappingStatus: 'AI Proposed' },
    { id: 'var_3', name: '%STATUS_FLAG', type: 'Variable', scope: 'PERMANENT', dataType: 'FLAG', sourceFile: 'GLOBALS.M204', sourceLine: 2, cobolName: 'WS-STATUS-FLAG', cobolPic: 'PIC X', cobolLevel: '05', mappingStatus: 'Pending Review' },
  ],
  fields: [ // This top-level 'fields' might become redundant or serve a different purpose if structure is primary
    { id: "field-1", name: "CUST_ID", m204File: "CUSTOMER.FILE", dataType: "STRING", length: 10, type: "Field", m204Attributes: "KEY", cobolFieldName: "CUST-REC-ID", cobolPicClause: "PIC X(10)" },
    { id: "field-2", name: "CUST_NAME", m204File: "CUSTOMER.FILE", dataType: "STRING", length: 50, type: "Field", m204Attributes: "ORDERED", cobolFieldName: "CUST-REC-NAME", cobolPicClause: "PIC X(50)" },
    { id: "field-3", name: "ORDER_ID", m204File: "ORDERS.FILE", dataType: "STRING", length: 12, type: "Field", m204Attributes: "KEY", cobolFieldName: "ORD-REC-ID", cobolPicClause: "PIC X(12)" },
  ],
  labels: [
    { id: "label-1", name: "MAIN_LOOP", procedure: "PROCESS_CUSTOMER_RECORD", line: 25, type: "Label" },
    { id: "label-2", name: "ERROR_EXIT", procedure: "VALIDATE_INPUT", line: 40, type: "Label" },
  ]
};
// --- END INITIAL MOCK DATA ---

const InventoryPage = () => {
  
  const { projectId } = useParams();
  const [inventoryData, setInventoryData] = useState(initialMockInventoryData);
  const [activeTab, setActiveTab] = useState('m204Files');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedItemData, setEditedItemData] = useState(null);

  const tabsConfig = useMemo(() => [
    { id: 'm204Files', label: 'M204 Files', icon: Database, dataKey: 'm204Files', displayField: 'name', subDisplayField: 'attributes' },
    { id: 'fields', label: 'Fields', icon: Tag, dataKey: 'fields', displayField: 'name', subDisplayField: 'm204File' },
    { id: 'procedures', label: 'Procedures', icon: Cpu, dataKey: 'procedures', displayField: 'name', subDisplayField: 'sourceFile' },
    { id: 'variables', label: 'Variables', icon: VariableIcon, dataKey: 'variables', displayField: 'name', subDisplayField: 'scope' },
    { id: 'labels', label: 'Labels', icon: FolderTree, dataKey: 'labels', displayField: 'name', subDisplayField: 'procedure' },
  ], []);

  const currentTabConfig = useMemo(() => tabsConfig.find(tab => tab.id === activeTab), [tabsConfig, activeTab]);
  const currentTabData = useMemo(() => currentTabConfig ? inventoryData[currentTabConfig.dataKey] || [] : [], [inventoryData, currentTabConfig]);

  const filteredData = useMemo(() => currentTabData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (currentTabConfig?.subDisplayField && item[currentTabConfig.subDisplayField] && typeof item[currentTabConfig.subDisplayField] === 'string' && item[currentTabConfig.subDisplayField].toLowerCase().includes(searchTerm.toLowerCase()))
  ), [currentTabData, searchTerm, currentTabConfig]);

  useEffect(() => {
    if (selectedItem && !isEditing) {
        const currentTabConfigForEffect = tabsConfig.find(t => t.id === activeTab);
        if (currentTabConfigForEffect) {
            const currentList = inventoryData[currentTabConfigForEffect.dataKey];
            if (currentList) {
                const refreshedItem = currentList.find(item => item.id === selectedItem.id);
                if (refreshedItem && JSON.stringify(refreshedItem) !== JSON.stringify(selectedItem)) {
                    setSelectedItem(refreshedItem);
                }
            }
        }
    }
  }, [inventoryData, selectedItem, activeTab, isEditing, tabsConfig]);


  const handleEdit = () => {
    setIsEditing(true);
    setEditedItemData(JSON.parse(JSON.stringify(selectedItem))); // Deep copy for editing
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedItemData(null);
  };

  const handleInputChange = (e, fieldId, structureIndex) => {
    const { name, value } = e.target;
    const originalItem = selectedItem; 

    let processedValue = value;
    // Type conversion logic
    if (structureIndex !== undefined && originalItem && originalItem.structure && originalItem.structure[structureIndex]) {
        const originalFieldStructure = originalItem.structure[structureIndex];
        if (name === 'length' || typeof originalFieldStructure[name] === 'number') { 
            processedValue = parseFloat(value);
            if (isNaN(processedValue)) {
                processedValue = originalFieldStructure[name]; 
            }
        }
    } else if (originalItem && typeof originalItem[name] === 'number') {
        processedValue = parseFloat(value);
        if (isNaN(processedValue)) {
            processedValue = originalItem[name]; 
        }
    }

    setEditedItemData(prev => {
      if (structureIndex !== undefined && prev.structure) {
        const updatedStructure = prev.structure.map((field, index) => {
          if (index === structureIndex) {
            return { ...field, [name]: processedValue };
          }
          return field;
        });
        return { ...prev, structure: updatedStructure };
      }
      return { ...prev, [name]: processedValue };
    });
  };

  const handleSave = () => {
    if (!editedItemData || !currentTabConfig) return;

    setInventoryData(prevInventory => {
      const updatedDataArray = prevInventory[currentTabConfig.dataKey].map(item =>
        item.id === editedItemData.id ? editedItemData : item
      );
      return {
        ...prevInventory,
        [currentTabConfig.dataKey]: updatedDataArray,
      };
    });
    setSelectedItem(editedItemData); 
    setIsEditing(false);
    setEditedItemData(null);
  };

  const renderDetailItem = (label, value, fieldName, item, fieldId, structureIndex) => {
    if (value === null || value === undefined) value = '';

    if (isEditing && editedItemData && item && editedItemData.id === item.id) {
      let originalValueForTypeCheck = item[fieldName];
      let currentValue = editedItemData[fieldName];

      if (structureIndex !== undefined && item.structure && item.structure[structureIndex] && editedItemData.structure && editedItemData.structure[structureIndex]) {
        originalValueForTypeCheck = item.structure[structureIndex][fieldName];
        currentValue = editedItemData.structure[structureIndex][fieldName];
      }
      
      const inputId = fieldId ? `${fieldId}-${fieldName}` : fieldName;

      return (
        <div className="grid grid-cols-[120px_1fr] gap-2 items-center mb-1.5">
          <label htmlFor={inputId} className="text-sm font-medium text-gray-500">{label}:</label>
          <input
            type={typeof originalValueForTypeCheck === 'number' ? 'number' : 'text'}
            id={inputId}
            name={fieldName}
            value={currentValue ?? ''}
            onChange={(e) => handleInputChange(e, fieldId, structureIndex)}
            className="text-sm text-gray-800 p-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      );
    }
    return (
      <div className="grid grid-cols-[120px_1fr] gap-1 items-center">
        <div className="text-sm font-medium text-gray-500">{label}:</div>
        <div className="text-sm text-gray-800 break-words">{String(value)}</div>
      </div>
    );
  };

  const renderStructureField = (field, index, parentItem) => {
    const fieldPrefix = `structure-${parentItem.id}-${index}`; // More unique prefix
    return (
      <div key={field.id || index} className="pl-4 mt-2 pt-2 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-600 mb-1">
          Field: {isEditing && editedItemData.structure ? editedItemData.structure[index].fieldName : field.fieldName}
        </p>
        {renderDetailItem("Field Name", field.fieldName, "fieldName", parentItem, field.id || fieldPrefix, index)}
        {renderDetailItem("Data Type", field.dataType, "dataType", parentItem, field.id || fieldPrefix, index)}
        {renderDetailItem("Length", field.length, "length", parentItem, field.id || fieldPrefix, index)}
        {field.m204Attributes !== undefined && renderDetailItem("M204 Attrs", field.m204Attributes, "m204Attributes", parentItem, field.id || fieldPrefix, index)}
      </div>
    );
  };
  
  const getEditableFields = (item) => {
    if (!item) return {};
    const commonFields = { name: "Name", type: "Type" };
    let specificFields = {};

    // Check item type based on its properties
    if (item.attributes !== undefined && item.definedIn !== undefined) { // M204 File
        specificFields = { attributes: "Attributes", definedIn: "Defined In", definedAtLine: "Defined At Line", targetVsamName: "Target VSAM", targetVsamType: "VSAM Type", cobolSelectName: "COBOL SELECT", mappingStatus: "Mapping Status"};
    } else if (item.procedureType !== undefined) { // Procedure
        specificFields = { procedureType: "Procedure Type", parameters: "Parameters", sourceFile: "Source File", startLine: "Start Line", endLine: "End Line", targetCobolProgram: "Target COBOL", lines: "Lines", complexity: "Complexity" };
    } else if (item.scope !== undefined) { // Variable
        specificFields = { scope: "Scope", dataType: "Data Type", sourceFile: "Source File", sourceLine: "Source Line", cobolName: "COBOL Name", cobolPic: "COBOL PIC", cobolLevel: "COBOL Level", mappingStatus: "Mapping Status" };
    } else if (item.m204File !== undefined && item.cobolFieldName !== undefined) { // Field (top-level, not structure field)
        specificFields = { m204File: "M204 File", dataType: "Data Type", length: "Length", m204Attributes: "M204 Attributes", cobolFieldName: "COBOL Field", cobolPicClause: "COBOL PIC" };
    } else if (item.procedure !== undefined && item.line !== undefined) { // Label
        specificFields = { procedure: "Procedure Context", line: "Line" };
    }
    return { ...commonFields, ...specificFields };
  };

  return (
    <div className="bg-white flex flex-col h-full">
      <div className="flex-grow flex flex-col border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
  <div className="relative flex-grow">
    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    <input
      type="search"
      placeholder="Search inventory..."
      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
      value={searchTerm}
      onChange={(e) => {
        setSearchTerm(e.target.value);
        setSelectedItem(null);
        setIsEditing(false); 
      }}
    />
  </div>
  <Link
  to={`/project/${projectId}/requirements`}
  className="ml-4 p-3 px-8 bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 text-white rounded-md hover:opacity-90 text-sm flex items-center"
  title="Generate Requirements"
>
  Generate Requirements
  <ChevronRight size={20} className="ml-2" />
</Link>
</div>

        <div className="border-b border-gray-200 bg-white">
          <nav className="-mb-px flex space-x-0" aria-label="Tabs">
            {tabsConfig.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedItem(null);
                    setIsEditing(false);
                    setSearchTerm('');
                  }}
                  className={`whitespace-nowrap py-3.5 px-4 border-b-2 font-medium text-sm flex items-center gap-2.5
                    ${activeTab === tab.id
                      ? 'border-teal-500 text-teal-600 bg-teal-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }
                    focus:outline-none transition-colors flex-1 justify-center md:flex-none`}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="grid md:grid-cols-[minmax(320px,_1fr)_350px] flex-grow overflow-hidden">
          <div className="overflow-y-auto border-r border-gray-200 p-2 bg-white">
            {filteredData.map((item) => {
                const Icon = tabsConfig.find(t => t.id === activeTab)?.icon || Package;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                        setSelectedItem(item);
                        setIsEditing(false); 
                    }}
                    className={`w-full flex items-center text-left px-3 py-3 text-sm rounded-md
                                ${selectedItem?.id === item.id && !isEditing ? 'bg-teal-100 text-teal-700 font-medium' : ''}
                                ${selectedItem?.id === item.id && isEditing ? 'bg-orange-100 text-orange-700 font-medium' : ''}
                                ${!(selectedItem?.id === item.id) ? 'hover:bg-gray-100 text-gray-700' : ''}
                                `}
                  >
                    <Icon size={15} className="mr-2.5 flex-shrink-0" />
                    <span className="truncate flex-grow">{item.name}</span>
                    {currentTabConfig?.subDisplayField && item[currentTabConfig.subDisplayField] && (
                       <span className="ml-2 text-gray-500 text-xs truncate hidden sm:inline">
                         ({item[currentTabConfig.subDisplayField]})
                       </span>
                    )}
                    <ChevronRight size={15} className="ml-auto text-gray-400 flex-shrink-0" />
                  </button>
                );
              })}
            {filteredData.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-500">
                No {tabsConfig.find(t => t.id === activeTab)?.label.toLowerCase()} found matching your search.
              </div>
            )}
          </div>

          <div className="overflow-y-auto p-5 bg-gray-50/70">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-base text-gray-700">Item Details</h3>
              {selectedItem && !isEditing && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-3 rounded-md transition-colors"
                >
                  <Edit3 size={12} /> Edit
                </button>
              )}
            </div>
             {selectedItem ? (
              <div className="space-y-2">
                {renderDetailItem("ID", selectedItem.id, 'id', selectedItem, selectedItem.id)} 
                
                {Object.entries(getEditableFields(isEditing ? editedItemData : selectedItem)).map(([key, label]) => 
                    Object.prototype.hasOwnProperty.call((isEditing ? editedItemData : selectedItem), key) &&
                    key !== 'structure' && // Exclude structure from direct rendering here
                    renderDetailItem(label, (isEditing ? editedItemData : selectedItem)[key], key, (isEditing ? editedItemData : selectedItem), (isEditing ? editedItemData : selectedItem).id)
                )}

                {/* Render Structure for M204 Files */}
                {activeTab === 'm204Files' && selectedItem.structure && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">Structure:</h4>
                    {(isEditing && editedItemData.structure ? editedItemData.structure : selectedItem.structure).map((field, index) => (
                      renderStructureField(field, index, selectedItem) // Pass selectedItem as the original item context
                    ))}
                    {/* TODO: Add button to add new field to structure when editing */}
                  </div>
                )}

                {isEditing && (
                  <div className="pt-4 mt-4 border-t border-gray-200 flex gap-3">
                    <button
                      onClick={handleSave}
                      className="flex-1 flex items-center justify-center gap-1.5 text-sm bg-teal-500 hover:bg-teal-600 text-white py-2 px-3 rounded-md transition-colors"
                    >
                      <Save size={16} /> Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 flex items-center justify-center gap-1.5 text-sm bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded-md transition-colors"
                    >
                      <XCircle size={16} /> Cancel
                    </button>
                  </div>
                )}
                {!isEditing && (
                    <div className="pt-4 mt-4 border-t border-gray-200">
                        <button className="w-full text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 px-3 rounded-md transition-colors" disabled>
                        View Definition (Simulated)
                        </button>
                    </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 pt-2">Select an item from the list to view its details.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;