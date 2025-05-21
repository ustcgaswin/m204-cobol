import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import {
  Database,
  Cpu,
  Variable as VariableIcon,
  Package,
  Search as SearchIcon,
  ChevronRight,
  Edit3,
  Save,
  XCircle,
  Loader2, // For loading states
  AlertTriangle // For error messages
} from 'lucide-react';
import apiClient from '../config/axiosConfig';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const initialInventoryData = {
  m204DbFiles: [],
  procedures: [],
  variables: [],
  otherDatasets: [],
};

// --- Data Mapping Functions ---
const mapM204DbFile = (item) => ({
  name: item.m204_file_name,
  type: 'M204 DB File',
  m204Attributes: item.m204_attributes || 'N/A',
  definedAtLine: item.defined_at_line === null || item.defined_at_line === undefined ? 'N/A' : item.defined_at_line,
  targetVsamDatasetName: item.target_vsam_dataset_name || 'N/A',
  targetVsamType: item.target_vsam_type || 'N/A',
  primaryKeyFieldName: item.primary_key_field_name || 'N/A',
  structure: item.fields ? item.fields.map(field => ({
    fieldName: field.field_name,
    dataType: field.attributes_json?.type || 'N/A',
    length: field.attributes_json?.length === undefined ? 'N/A' : field.attributes_json.length,
    m204Attributes: field.attributes_text || 'N/A',
  })) : [],
  _internalId: item.m204_file_id,
  _definedInInputSourceId: item.defined_in_input_source_id,
});

const mapProcedure = (item) => ({
  name: item.m204_proc_name,
  type: 'Procedure',
  procedureType: item.m204_proc_type,
  parameters: item.m204_parameters_string, // Still mapped for potential future use or if API sends it
  parsedParameters: item.parsed_parameters_json || null,
  startLine: item.start_line_in_source,
  endLine: item.end_line_in_source,
  summary: item.summary || 'N/A',
  procedureContent: item.procedure_content || 'N/A',
  targetCobolProgram: item.target_cobol_program_name || 'N/A',
  lines: (item.end_line_in_source && item.start_line_in_source) ? (item.end_line_in_source - item.start_line_in_source + 1) : 'N/A',
  complexity: item.complexity || 'N/A',
  isRunnableMain: item.is_runnable_main === null || item.is_runnable_main === undefined ? 'N/A' : String(item.is_runnable_main),
  _internalId: item.proc_id,
  _inputSourceId: item.input_source_id,
});

const mapVariable = (item) => ({
  name: item.variable_name,
  type: 'Variable',
  scope: item.scope,
  dataType: item.variable_type || (item.attributes?.TYPE) || 'N/A',
  sourceLine: item.definition_line_number,
  attributes: item.attributes,
  cobolMappedVariableName: item.cobol_mapped_variable_name || 'N/A', // Updated field
  cobolPic: 'N/A',
  cobolLevel: 'N/A',
  _internalId: item.variable_id,
  _inputSourceId: item.input_source_id,
});

const mapOtherM204File = (item) => ({
  name: item.m204_file_name,
  type: 'Other M204 File',
  m204Attributes: item.m204_attributes || 'N/A',
  definedAtLine: item.defined_at_line === null || item.defined_at_line === undefined ? 'N/A' : item.defined_at_line,
  m204LogicalDatasetName: item.m204_logical_dataset_name || 'N/A',
  imageStatements: item.image_statements || [],
  _internalId: item.m204_file_id,
  _definedInInputSourceId: item.defined_in_input_source_id,
});

// --- Content View Modal Component ---

// Define custom components for rendering Markdown in the modal
const modalMarkdownComponents = {
  h1: (props) => <h1 className="text-xl font-semibold mb-3" {...props} />,
  h2: (props) => <h2 className="text-lg font-semibold mb-2" {...props} />,
  h3: (props) => <h3 className="text-md font-semibold mb-2" {...props} />,
  p: (props) => <p className="mb-2 text-sm leading-relaxed" {...props} />,
  ul: (props) => <ul className="list-disc list-inside mb-2 pl-4 text-sm" {...props} />,
  ol: (props) => <ol className="list-decimal list-inside mb-2 pl-4 text-sm" {...props} />,
  li: (props) => <li className="mb-1" {...props} />,
  code: (props) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono" {...props} />,
  pre: (props) => <pre className="bg-gray-100 p-3 rounded my-2 overflow-auto text-xs font-mono" {...props} />,
  blockquote: (props) => <blockquote className="border-l-4 border-gray-300 pl-3 italic my-2 text-sm" {...props} />,
  a: (props) => <a className="text-teal-600 hover:text-teal-700 underline" {...props} />,
  table: (props) => <div className="overflow-x-auto my-2"><table className="min-w-full text-sm border-collapse border border-gray-300" {...props} /></div>,
  thead: (props) => <thead className="bg-gray-100" {...props} />,
  th: (props) => <th className="border border-gray-300 px-2 py-1 text-left font-medium" {...props} />,
  tbody: (props) => <tbody {...props} />,
  tr: (props) => <tr className="border-b border-gray-300 even:bg-gray-50" {...props} />,
  td: (props) => <td className="border border-gray-300 px-2 py-1" {...props} />,
};

const ContentViewModal = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <XCircle size={22} />
          </button>
        </div>
        <div className="overflow-auto flex-grow p-5">
          <ReactMarkdown
            components={modalMarkdownComponents}
            remarkPlugins={[remarkGfm]}
          >
            {content || ''}
          </ReactMarkdown>
        </div>
        <div className="flex justify-end items-center gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-teal-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


const InventoryPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate(); // Initialize useNavigate
  const [inventoryData, setInventoryData] = useState(initialInventoryData);
  const [activeTab, setActiveTab] = useState('m204DbFiles');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedItemData, setEditedItemData] = useState(null);

  const [loadingStates, setLoadingStates] = useState({});
  const [errorStates, setErrorStates] = useState({});

  // Content Modal State
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', content: '' });

  // State for requirements generation
  const [isGeneratingRequirements, setIsGeneratingRequirements] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  const openContentModal = (title, contentText) => {
    setModalContent({ title, content: contentText });
    setIsContentModalOpen(true);
  };

  const closeContentModal = () => {
    setIsContentModalOpen(false);
    setModalContent({ title: '', content: '' });
  };

  const tabsConfig = useMemo(() => [
    { id: 'm204DbFiles', label: 'M204 DB Files', icon: Database, dataKey: 'm204DbFiles', displayField: 'name', subDisplayField: 'targetVsamDatasetName', endpoint: `/projects/${projectId}/metadata/m204_files/databases`, mapper: mapM204DbFile },
    { id: 'procedures', label: 'Procedures', icon: Cpu, dataKey: 'procedures', displayField: 'name', subDisplayField: 'procedureType', endpoint: `/projects/${projectId}/metadata/procedures/`, mapper: mapProcedure },
    { id: 'variables', label: 'Variables', icon: VariableIcon, dataKey: 'variables', displayField: 'name', subDisplayField: 'scope', endpoint: `/projects/${projectId}/metadata/variables/`, mapper: mapVariable },
    { id: 'otherDatasets', label: 'Other M204 Files', icon: Package, dataKey: 'otherDatasets', displayField: 'name', subDisplayField: 'm204LogicalDatasetName', endpoint: `/projects/${projectId}/metadata/m204_files/other`, mapper: mapOtherM204File },
  ], [projectId]);

  const currentTabConfig = useMemo(() => tabsConfig.find(tab => tab.id === activeTab), [tabsConfig, activeTab]);

  const fetchDataForTab = useCallback(async (tabConfig) => {
    if (!tabConfig || !tabConfig.endpoint) {
      setErrorStates(prev => ({ ...prev, [tabConfig.id]: "Endpoint not configured for this tab." }));
      setInventoryData(prev => ({ ...prev, [tabConfig.dataKey]: [] }));
      return;
    }
    setLoadingStates(prev => ({ ...prev, [tabConfig.id]: true }));
    setErrorStates(prev => ({ ...prev, [tabConfig.id]: null }));
    try {
      const response = await apiClient.get(tabConfig.endpoint, { params: { limit: 1000 } });
      const mappedData = response.data.data.map(item => {
        const mapped = tabConfig.mapper(item);
        return { ...mapped, key: mapped._internalId || mapped.name + Date.now() };
      });
      setInventoryData(prev => ({ ...prev, [tabConfig.dataKey]: mappedData }));
    } catch (err) {
      console.error(`Failed to fetch ${tabConfig.label}:`, err);
      setErrorStates(prev => ({ ...prev, [tabConfig.id]: err.response?.data?.detail || err.message || `Failed to load ${tabConfig.label}.` }));
      setInventoryData(prev => ({ ...prev, [tabConfig.dataKey]: [] }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [tabConfig.id]: false }));
    }
  }, []);

  useEffect(() => {
    if (projectId && currentTabConfig) {
      fetchDataForTab(currentTabConfig);
    } else if (projectId && !currentTabConfig && tabsConfig.length > 0) {
      setActiveTab(tabsConfig[0].id);
    }
  }, [projectId, currentTabConfig, fetchDataForTab, tabsConfig]);

  const currentTabData = useMemo(() => currentTabConfig ? inventoryData[currentTabConfig.dataKey] || [] : [], [inventoryData, currentTabConfig]);

  const filteredData = useMemo(() => {
    if (!currentTabData) return [];
    return currentTabData.filter(item =>
      (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (currentTabConfig?.subDisplayField && item[currentTabConfig.subDisplayField] && typeof item[currentTabConfig.subDisplayField] === 'string' && item[currentTabConfig.subDisplayField].toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [currentTabData, searchTerm, currentTabConfig]);

 useEffect(() => {
    if (selectedItem && !isEditing && currentTabConfig) {
        const currentList = inventoryData[currentTabConfig.dataKey];
        if (currentList) {
            const refreshedItem = currentList.find(item => item._internalId ? item._internalId === selectedItem._internalId : item.name === selectedItem.name);
            if (refreshedItem && JSON.stringify(refreshedItem) !== JSON.stringify(selectedItem)) {
                setSelectedItem(refreshedItem);
            } else if (!refreshedItem) {
                setSelectedItem(null);
            }
        }
    }
  }, [inventoryData, selectedItem, activeTab, isEditing, tabsConfig, currentTabConfig]);


  const handleEdit = () => {
    if (!selectedItem || !(activeTab === 'm204DbFiles' || activeTab === 'variables' || activeTab === 'procedures')) return;
    setIsEditing(true);
    setEditedItemData(JSON.parse(JSON.stringify(selectedItem)));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedItemData(null);
  };

  const handleInputChange = (e, fieldId, structureIndex) => {
    const { name, value } = e.target;
    const originalItem = selectedItem;

    let processedValue = value;
    if (structureIndex !== undefined && originalItem?.structure?.[structureIndex]) {
        const originalFieldStructure = originalItem.structure[structureIndex];
        if (name === 'length' || (typeof originalFieldStructure[name] === 'number' && originalFieldStructure[name] !== 'N/A')) {
            processedValue = value === '' ? null : parseFloat(value);
            if (value !== '' && isNaN(processedValue)) {
                processedValue = originalFieldStructure[name];
            }
        }
    } else if (originalItem && typeof originalItem[name] === 'number' && originalItem[name] !== 'N/A' && !['_internalId', '_definedInInputSourceId', '_inputSourceId'].includes(name) ) {
        processedValue = value === '' ? null : parseFloat(value);
        if (value !== '' && isNaN(processedValue)) {
            processedValue = originalItem[name];
        }
    }

    setEditedItemData(prev => {
      if (structureIndex !== undefined && prev.structure) {
        const updatedStructure = prev.structure.map((field, index) =>
          index === structureIndex ? { ...field, [name]: processedValue } : field
        );
        return { ...prev, structure: updatedStructure };
      }
      return { ...prev, [name]: processedValue };
    });
  };

  const handleSave = async () => {
    if (!editedItemData || !currentTabConfig || !(activeTab === 'm204DbFiles' || activeTab === 'variables' || activeTab === 'procedures')) return;

    // TODO: Implement backend save logic here
    // For now, just updating local state
    setInventoryData(prevInventory => {
      const updatedDataArray = prevInventory[currentTabConfig.dataKey].map(item =>
        item._internalId === editedItemData._internalId ? editedItemData : item
      );
      return {
        ...prevInventory,
        [currentTabConfig.dataKey]: updatedDataArray,
      };
    });
    setSelectedItem(editedItemData);
    setIsEditing(false);
    setEditedItemData(null);
    alert("Changes saved locally. Backend save not implemented.");
  };

  const getEditableFields = (item) => {
    if (!item || !currentTabConfig) return {};
    const baseDisplayFields = { name: "Name", type: "Type" };
    let specificFields = {};

    // Dynamically add other fields from the item, excluding known non-display/internal fields
    for (const key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key) &&
            !['_internalId', '_definedInInputSourceId', '_inputSourceId', 'key', 'name', 'type', 'structure', 'attributes', 'parsedParameters', 'parameters', 'createdAt', 'updatedAt', 'sourceFile', 'mappingStatus', 'summary', 'procedureContent', 'imageStatements'].includes(key) && // Exclude already handled or internal fields
            typeof item[key] !== 'object' && item[key] !== null) {
            specificFields[key] = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        }
    }

    switch (currentTabConfig.id) {
        case 'm204DbFiles':
            specificFields = {
                ...specificFields, // Keep dynamically added fields
                m204Attributes: "M204 Attributes",
                definedAtLine: "Defined At Line",
                targetVsamDatasetName: "Target VSAM Dataset",
                targetVsamType: "Target VSAM Type",
                primaryKeyFieldName: "Primary Key Field",
            };
            break;
        case 'procedures':
            specificFields = {
                procedureType: "Procedure Type",
                startLine: "Start Line",
                endLine: "End Line",
                summary: "Summary",
                procedureContent: "Procedure Content",
                targetCobolProgram: "Target COBOL Program",
                lines: "Lines of Code",
                isRunnableMain: "Is Runnable Main",
            };
            if (item && item.complexity !== undefined && item.complexity !== 'N/A') {
                specificFields.complexity = "Complexity";
            }
            break;
        case 'variables':
            specificFields = {
                ...specificFields, // Keep dynamically added fields
                scope: "Scope",
                dataType: "Data Type",
                sourceLine: "Source Line",
                cobolMappedVariableName: "COBOL Mapped Name", // Added for editing
            };
            if (item.attributes && typeof item.attributes === 'object') {
                specificFields.attributesDisplay = "Attributes";
            }
            break;
        case 'otherDatasets':
            specificFields = {
                ...specificFields, // Keep dynamically added fields
                m204Attributes: "M204 Attributes",
                definedAtLine: "Defined At Line",
                m204LogicalDatasetName: "M204 Logical Dataset Name",
            };
            if (item && item.imageStatements && item.imageStatements.length > 0) {
                specificFields.imageStatementsDisplay = "Image Statements";
            }
            break;
        default:
            // Keep specificFields populated by the dynamic loop for unknown tabs
            break;
    }
    return { ...baseDisplayFields, ...specificFields };
  };

  const renderDetailItem = (label, value, fieldName, item, fieldId, structureIndex) => {
    if (value === null || value === undefined) value = '';
    const currentItemForEdit = isEditing ? editedItemData : selectedItem;

    // Handle Summary and Procedure Content for Procedures tab
    if (activeTab === 'procedures' && (fieldName === 'summary' || fieldName === 'procedureContent')) {
      const modalTitle = fieldName === 'summary' ? `Summary: ${item?.name}` : `Content: ${item?.name}`;
      const contentValue = (isEditing ? editedItemData : selectedItem)?.[fieldName];

      if (isEditing) { // In edit mode, show truncated content, not a button
        return (
          <div className="grid grid-cols-[160px_1fr] gap-1 items-center py-1.5">
            <div className="text-sm font-medium text-gray-500 truncate" title={label}>{label}:</div>
            <div className="text-sm text-gray-700 bg-gray-100 p-2 rounded-md border border-gray-200 truncate" title={String(contentValue)}>
              {contentValue && String(contentValue) !== 'N/A' ? `${String(contentValue).substring(0, 40)}${String(contentValue).length > 40 ? '...' : ''}` : <span className="text-gray-400 italic">Not available</span>}
              {contentValue && String(contentValue) !== 'N/A' && String(contentValue).length > 40 && <span className="text-xs text-gray-400"> (Full view in non-edit mode)</span>}
            </div>
          </div>
        );
      }

      // Display mode for summary/content
      if (!contentValue || contentValue === 'N/A' || String(contentValue).trim() === '') {
        return (
          <div className="grid grid-cols-[160px_1fr] gap-1 items-center py-1.5">
            <div className="text-sm font-medium text-gray-500 truncate" title={label}>{label}:</div>
            <div className="text-sm text-gray-400 italic">Not available</div>
          </div>
        );
      }

      const buttonText = fieldName === 'summary' ? "Show Summary" : "View Content";
      const buttonTitle = fieldName === 'summary' ? "Click to view full summary" : "Click to view full content";

      return (
        <div className="grid grid-cols-[160px_1fr] gap-1 items-center py-1.5">
          <div className="text-sm font-medium text-gray-500 truncate" title={label}>{label}:</div>
          <button
            onClick={() => openContentModal(modalTitle, String(contentValue))}
            className="text-sm text-teal-600 hover:text-teal-700 hover:underline font-medium text-left cursor-pointer p-0 bg-transparent border-none"
            title={buttonTitle}
          >
            {buttonText}
          </button>
        </div>
      );
    } else if (activeTab === 'otherDatasets' && fieldName === 'imageStatementsDisplay') {
        const itemForContent = isEditing ? editedItemData : selectedItem; // Should always be selectedItem as 'otherDatasets' is not editable
        const imageStatements = itemForContent?.imageStatements;

        // 'otherDatasets' are not editable, so no 'isEditing' branch needed here for input fields
        if (!imageStatements || imageStatements.length === 0) {
            return (
                <div className="grid grid-cols-[160px_1fr] gap-1 items-center py-1.5">
                    <div className="text-sm font-medium text-gray-500 truncate" title={label}>{label}:</div>
                    <div className="text-sm text-gray-400 italic">No image statements defined</div>
                </div>
            );
        }

        const combinedContent = imageStatements.map(stmt => `\`\`\`\n${stmt.image_content}\n\`\`\``).join("\n\n---\n\n"); // Wrap each statement in a code block
        const modalTitle = `Image Statements: ${item?.name}`;
        const buttonText = "View Image Statements";
        const buttonTitle = "Click to view image statements";

        return (
            <div className="grid grid-cols-[160px_1fr] gap-1 items-center py-1.5">
                <div className="text-sm font-medium text-gray-500 truncate" title={label}>{label}:</div>
                <button
                    onClick={() => openContentModal(modalTitle, combinedContent)}
                    className="text-sm text-teal-600 hover:text-teal-700 hover:underline font-medium text-left cursor-pointer p-0 bg-transparent border-none"
                    title={buttonTitle}
                >
                    {buttonText}
                </button>
            </div>
        );
    }

    let isFieldReadOnly = true; // Default to read-only

    if (isEditing && currentItemForEdit && item && currentItemForEdit._internalId === item._internalId) {
        // Determine if the field is editable based on the active tab and field name
        if (activeTab === 'm204DbFiles') {
            const editableM204TopLevel = ['targetVsamDatasetName', 'targetVsamType', 'primaryKeyFieldName'];
            const editableM204Structure = ['fieldName', 'm204Attributes']; // Removed dataType and length

            if (structureIndex === undefined) { // Top-level field of the M204 DB File item
                if (editableM204TopLevel.includes(fieldName)) {
                    isFieldReadOnly = false;
                }
            } else { // Field within the 'structure' array
                if (editableM204Structure.includes(fieldName)) {
                    isFieldReadOnly = false;
                }
            }
        } else if (activeTab === 'variables') {
            if (fieldName === 'name' || fieldName === 'cobolMappedVariableName') { // 'name' and 'cobolMappedVariableName' are editable for variables
                isFieldReadOnly = false;
            }
        } else if (activeTab === 'procedures') {
            if (fieldName === 'targetCobolProgram') { // Only 'targetCobolProgram' is editable for procedures
                isFieldReadOnly = false;
            }
            // 'name' and other fields for procedures remain read-only by default (isFieldReadOnly is true)
        }
    }


    if (isEditing && currentItemForEdit && item && currentItemForEdit._internalId === item._internalId) {
      let originalValueForTypeCheck = item[fieldName];
      let currentValueToDisplay = currentItemForEdit[fieldName];

      if (structureIndex !== undefined && item.structure?.[structureIndex] && currentItemForEdit.structure?.[structureIndex]) {
        originalValueForTypeCheck = item.structure[structureIndex][fieldName];
        currentValueToDisplay = currentItemForEdit.structure[structureIndex][fieldName];
      }

      const inputKey = fieldId ? `${fieldId}-${structureIndex !== undefined ? `struct-${structureIndex}-` : ''}${fieldName}` : fieldName;

      if (fieldName === 'attributesDisplay' && activeTab === 'variables') { // Always read-only display for attributes
          const dataToShow = currentItemForEdit.attributes;
          return (
            <div className="grid grid-cols-[160px_1fr] gap-1 items-start py-1">
              <div className="text-sm font-medium text-gray-500 truncate" title={label}>{label}:</div>
              <textarea
                value={typeof dataToShow === 'object' && dataToShow !== null ? JSON.stringify(dataToShow, null, 2) : String(dataToShow ?? 'N/A')}
                readOnly
                className="text-sm text-gray-800 p-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-gray-100 h-24" // Always bg-gray-100 for read-only textarea
              />
            </div>
          );
      }

      return (
        <div className="grid grid-cols-[160px_1fr] gap-2 items-center mb-1.5">
          <label htmlFor={inputKey} className="text-sm font-medium text-gray-500 truncate" title={label}>{label}:</label>
          <input
            type={(typeof originalValueForTypeCheck === 'number' && originalValueForTypeCheck !== 'N/A' && !isFieldReadOnly && !['definedAtLine', 'sourceLine', 'startLine', 'endLine', 'lines'].includes(fieldName)) ? 'number' : 'text'}
            id={inputKey}
            name={fieldName}
            value={currentValueToDisplay ?? ''}
            onChange={(e) => handleInputChange(e, fieldId, structureIndex)}
            className={`text-sm text-gray-800 p-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 ${isFieldReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            readOnly={isFieldReadOnly}
            disabled={isFieldReadOnly} // Ensure disabled attribute is also set
          />
        </div>
      );
    }

    // Display mode (not editing)
     if (fieldName === 'attributesDisplay' && activeTab === 'variables') {
        const dataToShow = value;
        return (
             <div className="grid grid-cols-[160px_1fr] gap-1 items-start py-1">
                <div className=" font-medium text-gray-500 truncate" title={label}>{label}:</div>
                <pre className=" text-gray-800 break-words bg-gray-100 p-1.5 rounded-md text-xs">
                  {typeof dataToShow === 'object' && dataToShow !== null ? JSON.stringify(dataToShow, null, 2) : String(dataToShow ?? 'N/A')}
                </pre>
            </div>
        );
    }

    return (
      <div className="grid grid-cols-[160px_1fr] gap-1 items-center py-1">
        <div className="text-sm font-medium text-gray-500 truncate" title={label}>{label}:</div>
        <div className="text-sm text-gray-800 break-words">{String(value)}</div>
      </div>
    );
  };

  const renderStructureField = (field, index, parentItem) => {
    const fieldKey = `${parentItem._internalId}-field-${index}`;
    const isParentEditing = isEditing && activeTab === 'm204DbFiles' && editedItemData && editedItemData._internalId === parentItem._internalId;

    return (
      <div key={fieldKey} className="pl-4 mt-2 pt-2 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-600 mb-1">
          Field: {isParentEditing && editedItemData?.structure ? editedItemData.structure[index]?.fieldName : field.fieldName}
        </p>
        {renderDetailItem("Field Name", field.fieldName, "fieldName", parentItem, parentItem._internalId, index)}
        {field.m204Attributes !== undefined && renderDetailItem("M204 Attrs", field.m204Attributes, "m204Attributes", parentItem, parentItem._internalId, index)}
      </div>
    );
  };

  const handleGenerateRequirements = async () => {
    setIsGeneratingRequirements(true);
    setGenerationError(null);
    try {
      const requestBody = {};
      const response = await apiClient.post(`/requirements/projects/${projectId}/generate-document`, requestBody);

      if (response.data && response.data.data && response.data.data.requirement_document_id) {
        alert('Requirements document generated successfully! Navigating to view it.');
        navigate(`/project/${projectId}/requirements`);
      } else {
        const message = response.data?.message || "Failed to generate requirements. Unexpected response from server.";
        setGenerationError(message);
        alert(message);
      }
    } catch (err) {
      console.error("Failed to generate requirements:", err);
      const errorMessage = err.response?.data?.detail || err.message || "An error occurred while generating the requirements document.";
      setGenerationError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsGeneratingRequirements(false);
    }
  };

  return (
    <div className="bg-white flex flex-col h-full">
      <div className="flex-grow flex flex-col border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Search and Generate Requirements Bar */}
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
          <button
            onClick={handleGenerateRequirements}
            disabled={isGeneratingRequirements}
            className="ml-4 p-3 px-8 bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 text-white rounded-md hover:opacity-90 text-sm flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
            title="Generate Requirements Document"
          >
            {isGeneratingRequirements ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                Generate Requirements
                <ChevronRight size={20} className="ml-2" />
              </>
            )}
          </button>
        </div>
        {generationError && (
          <div className="p-2 text-center text-sm text-red-600 bg-red-50 border-b border-red-200">
            <AlertTriangle size={15} className="inline mr-1" /> {generationError}
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <nav className="-mb-px flex space-x-0 overflow-x-auto" aria-label="Tabs">
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
                  {loadingStates[tab.id] && <Loader2 size={15} className="animate-spin ml-2" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area (List and Details) */}
        <div className="grid md:grid-cols-[minmax(320px,_1fr)_420px] flex-grow overflow-hidden">
          {/* List Pane */}
          <div className="overflow-y-auto border-r border-gray-200 p-2 bg-white">
            {loadingStates[activeTab] && (
              <div className="p-6 text-center text-gray-500 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin mr-2" /> Loading {currentTabConfig?.label.toLowerCase()}...
              </div>
            )}
            {errorStates[activeTab] && !loadingStates[activeTab] && (
              <div className="p-6 text-center text-red-600 bg-red-50 rounded-md m-2">
                <AlertTriangle size={24} className="mx-auto mb-2" />
                <p className="font-semibold">Error loading data</p>
                <p className="text-sm">{errorStates[activeTab]}</p>
              </div>
            )}
            {!loadingStates[activeTab] && !errorStates[activeTab] && filteredData.map((item) => {
                const Icon = currentTabConfig?.icon || Package;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                        setSelectedItem(item);
                        setIsEditing(false);
                    }}
                    className={`w-full flex items-center text-left px-3 py-3 text-sm rounded-md
                                ${selectedItem?._internalId === item._internalId && !isEditing ? 'bg-teal-100 text-teal-700 font-medium' : ''}
                                ${selectedItem?._internalId === item._internalId && isEditing && (activeTab === 'm204DbFiles' || activeTab === 'variables' || activeTab === 'procedures') ? 'bg-orange-100 text-orange-700 font-medium' : ''}
                                ${!(selectedItem?._internalId === item._internalId) ? 'hover:bg-gray-100 text-gray-700' : ''}
                                transition-colors duration-150`}
                  >
                    <Icon size={15} className="mr-2.5 flex-shrink-0 text-gray-500" />
                    <span className="truncate flex-grow" title={item.name}>{item.name}</span>
                    {currentTabConfig?.subDisplayField && item[currentTabConfig.subDisplayField] && typeof item[currentTabConfig.subDisplayField] === 'string' && item[currentTabConfig.subDisplayField] !== 'N/A' && (
                       <span className="ml-2 text-gray-400 text-xs truncate hidden sm:inline" title={item[currentTabConfig.subDisplayField]}>
                         ({item[currentTabConfig.subDisplayField].substring(0,30)}{item[currentTabConfig.subDisplayField].length > 30 ? '...' : ''})
                       </span>
                    )}
                    <ChevronRight size={15} className="ml-auto text-gray-400 flex-shrink-0" />
                  </button>
                );
              })}
            {!loadingStates[activeTab] && !errorStates[activeTab] && filteredData.length === 0 && currentTabData.length > 0 && (
              <div className="p-6 text-center text-sm text-gray-500">
                No {currentTabConfig?.label.toLowerCase()} found matching your search.
              </div>
            )}
             {!loadingStates[activeTab] && !errorStates[activeTab] && currentTabData.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-500">
                No {currentTabConfig?.label.toLowerCase()} found for this project.
              </div>
            )}
          </div>

          {/* Details Pane */}
          <div className="overflow-y-auto p-5 bg-gray-50/70">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-base text-gray-700">Item Details</h3>
              {selectedItem && !isEditing && (activeTab === 'm204DbFiles' || activeTab === 'variables' || activeTab === 'procedures') && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-3 rounded-md transition-colors"
                >
                  <Edit3 size={12} /> Edit
                </button>
              )}
            </div>
             {selectedItem ? (
              <div className="space-y-1">
                {Object.entries(getEditableFields(isEditing ? editedItemData : selectedItem)).map(([key, label]) => {
                    const itemToDisplay = isEditing ? editedItemData : selectedItem;
                    if (Object.prototype.hasOwnProperty.call(itemToDisplay, key) ||
                        (key === 'attributesDisplay' && activeTab === 'variables' && Object.prototype.hasOwnProperty.call(itemToDisplay, 'attributes')) ||
                        (key === 'imageStatementsDisplay' && activeTab === 'otherDatasets' && Object.prototype.hasOwnProperty.call(itemToDisplay, 'imageStatements'))) {

                        let valueToRender;
                        let fieldNameToUse = key;

                        if (key === 'attributesDisplay') {
                            valueToRender = itemToDisplay.attributes;
                            fieldNameToUse = 'attributesDisplay';
                        } else if (key === 'imageStatementsDisplay' && activeTab === 'otherDatasets') {
                            valueToRender = itemToDisplay.imageStatements; // Pass the array
                            fieldNameToUse = 'imageStatementsDisplay';
                        }
                        else {
                            valueToRender = itemToDisplay[key];
                        }
                        return renderDetailItem(label, valueToRender, fieldNameToUse, selectedItem, selectedItem._internalId);
                    }
                    return null;
                })}

                {activeTab === 'procedures' &&
                 (isEditing ? editedItemData : selectedItem)?.parsedParameters &&
                 (isEditing ? editedItemData : selectedItem).parsedParameters.parameters &&
                 (isEditing ? editedItemData : selectedItem).parsedParameters.parameters.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">Parsed Parameters:</h4>
                    <div className="space-y-1.5">
                      {(isEditing ? editedItemData : selectedItem).parsedParameters.parameters.map((param, index) => (
                        <div key={index} className="grid grid-cols-[auto_1fr] gap-x-2 items-center py-0.5">
                          <span className="text-xs font-medium text-gray-500 truncate" title={param.name}>{param.name}:</span>
                          <span className="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md font-mono">{param.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'm204DbFiles' && selectedItem.structure && selectedItem.structure.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">Structure (Fields):</h4>
                    {(isEditing && editedItemData?.structure ? editedItemData.structure : selectedItem.structure).map((field, index) => (
                      renderStructureField(field, index, selectedItem)
                    ))}
                    {isEditing && (
                        <p className="text-xs text-gray-500 mt-2">Field structure editing is enabled.</p>
                    )}
                  </div>
                )}
                 {activeTab === 'm204DbFiles' && (!selectedItem.structure || selectedItem.structure.length === 0) && (
                     <p className="text-xs text-gray-500 mt-2">No detailed field structure available for this M204 DB file.</p>
                 )}

                {isEditing && (activeTab === 'm204DbFiles' || activeTab === 'variables' || activeTab === 'procedures') && (
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
              </div>
            ) : (
              <p className="text-sm text-gray-500 pt-2">Select an item from the list to view its details.</p>
            )}
          </div>
        </div>
      </div>
      <ContentViewModal
        isOpen={isContentModalOpen}
        onClose={closeContentModal}
        title={modalContent.title}
        content={modalContent.content}
      />
    </div>
  );
};

export default InventoryPage;