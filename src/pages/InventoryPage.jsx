import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Database,
  Cpu,
  Variable as VariableIcon,
  Package,
  Search as SearchIcon,
  ChevronRight,
  Save,
  XCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import apiClient from "../config/axiosConfig";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import InventoryList from '../components/InventoryList';
import InventoryDetailPanel from '../components/InventoryDetailPanel';

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
  definedAtLine: item.definition_line_number_start === null || item.definition_line_number_start === undefined ? 'N/A' : item.definition_line_number_start,
  targetVsamDatasetName: item.target_vsam_dataset_name || 'N/A',
  targetVsamType: item.target_vsam_type || 'N/A',
  primaryKeyFieldName: item.primary_key_field_name || 'N/A',
  m204LogicalDatasetName: item.m204_logical_dataset_name || 'N/A',
  structure: item.file_definition_json?.fields ? Object.entries(item.file_definition_json.fields).map(([fieldName, fieldData]) => ({
    fieldName: fieldName,
    length: fieldData.vsam_suggestions?.vsam_length || 'N/A',
    m204Attributes: fieldData.attributes ? fieldData.attributes.join(', ') : 'N/A',
    lineNumber: fieldData.line_number || 'N/A',
    isKeyComponent: fieldData.vsam_suggestions?.is_key_component || false,
    keyOrder: fieldData.vsam_suggestions?.key_order || 'N/A',
    cobolPictureClause: fieldData.vsam_suggestions?.cobol_picture_clause || 'N/A',
    suggestedCobolFieldName: fieldData.vsam_suggestions?.suggested_cobol_field_name || 'N/A',
  })) : [],
  file_definition_json: item.file_definition_json || null,
  _internalId: item.m204_file_id,
  _definedInInputSourceId: item.defined_in_input_source_id,
});

const mapProcedure = (item) => ({
  name: item.m204_proc_name,
  type: 'Procedure',
  procedureType: item.m204_proc_type,
  parameters: item.m204_parameters_string,
  parsedParameters: item.parsed_parameters_json || null,
  startLine: item.start_line_in_source,
  endLine: item.end_line_in_source,
  summary: item.summary || 'N/A',
  procedureContent: item.procedure_content || 'N/A',
  targetCobolFunctionName: item.target_cobol_function_name || 'N/A',
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
  dataType: item.variable_type || (item.attributes?.declared_m204_type) || 'N/A',
  sourceLine: item.definition_line_number,
  attributes: item.attributes,
  m204Type: item.attributes?.declared_m204_type || 'N/A',
  length: item.attributes?.length || 'N/A',
  arrayDimensions: item.attributes?.array_dimensions ? item.attributes.array_dimensions.join(', ') : 'N/A',
  otherKeywords: item.attributes?.other_m204_keywords ? item.attributes.other_m204_keywords.join(', ') : 'N/A',
  cobolMappedVariableName: item.cobol_mapped_variable_name || 'N/A',
  cobolVariableType: item.cobol_variable_type || 'N/A',
  procedureName: item.procedure_name || 'N/A',
  _internalId: item.variable_id,
  _inputSourceId: item.input_source_id,
});

const mapOtherM204File = (item) => {
  let imageStatementsForModal = [];
  if (item.image_statements && Array.isArray(item.image_statements) && item.image_statements.length > 0) {
    imageStatementsForModal = item.image_statements;
  } else if (item.file_definition_json?.image_definitions && Array.isArray(item.file_definition_json.image_definitions)) {
    imageStatementsForModal = item.file_definition_json.image_definitions.map(def => {
      let content = `IMAGE ${def.image_name || 'UnnamedImage'}\n`;
      if (def.fields && Array.isArray(def.fields)) {
        content += def.fields.map(f => {
          let fieldDef = `  ${f.field_name || 'UnnamedField'} ${f.m204_type || 'UNKNOWN_TYPE'}`;
          if (f.length !== null && f.length !== undefined) {
            fieldDef += `(${f.length})`;
          } else if (f.digits !== null && f.digits !== undefined) {
            fieldDef += `(${f.digits}${f.decimal_places !== null && f.decimal_places !== undefined ? `,${f.decimal_places}` : ''})`;
          }
          return fieldDef;
        }).join('\n');
      }
      return { image_name: def.image_name || 'UnnamedImage', image_content: content };
    });
  }

  return {
    name: item.m204_file_name,
    type: 'Other M204 File',
    m204Attributes: item.m204_attributes || 'N/A',
    definedAtLine: item.definition_line_number_start === null || item.definition_line_number_start === undefined ? 'N/A' : item.definition_line_number_start,
    m204LogicalDatasetName: item.m204_logical_dataset_name || 'N/A',
    targetVsamDatasetName: item.target_vsam_dataset_name || 'N/A',
    imageStatements: imageStatementsForModal,
    parsedImageFields: item.file_definition_json?.image_definitions?.[0]?.fields?.map(field => ({
      fieldName: field.field_name,
      suggestedCobolFieldName: field.suggested_cobol_field_name || 'N/A',
      position: field.position !== null && field.position !== undefined ? field.position : 'N/A',
      m204Type: field.m204_type || 'N/A',
      dataType: field.data_type || 'N/A',
      length: field.length !== null && field.length !== undefined ? field.length : (field.digits !== null && field.digits !== undefined ? `${field.digits}${field.decimal_places !== null && field.decimal_places !== undefined ? '.' + field.decimal_places : ''}` : 'N/A'),
      digits: field.digits !== null && field.digits !== undefined ? field.digits : 'N/A',
      decimalPlaces: field.decimal_places !== null && field.decimal_places !== undefined ? field.decimal_places : 'N/A',
      cobolPictureClause: field.cobol_layout_suggestions?.cobol_picture_clause || 'N/A',
    })) || [],
    file_definition_json: item.file_definition_json || null,
    _internalId: item.m204_file_id,
    _definedInInputSourceId: item.defined_in_input_source_id,
  };
};

// --- Content View Modal Component ---
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

const ContentViewModal = ({ isOpen, onClose, title, content, renderAsMarkdown = false }) => {
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
          {renderAsMarkdown ? (
            <ReactMarkdown
              components={modalMarkdownComponents}
              remarkPlugins={[remarkGfm]}
            >
              {content || ''}
            </ReactMarkdown>
          ) : (
            <pre className="text-sm whitespace-pre-wrap">{content || ''}</pre>
          )}
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
  const navigate = useNavigate();
  const [inventoryData, setInventoryData] = useState(initialInventoryData);
  const [activeTab, setActiveTab] = useState('m204DbFiles');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedItemData, setEditedItemData] = useState(null);

  const [loadingStates, setLoadingStates] = useState({});
  const [errorStates, setErrorStates] = useState({});

  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', content: '', renderAsMarkdown: false });

  const openContentModal = (title, contentText, renderAsMarkdown = false) => {
    setModalContent({ title, content: contentText, renderAsMarkdown });
    setIsContentModalOpen(true);
  };

  const closeContentModal = () => {
    setIsContentModalOpen(false);
    setModalContent({ title: '', content: '', renderAsMarkdown: false });
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

  const handleRefresh = useCallback(() => {
    if (currentTabConfig) {
        setSelectedItem(null);
        fetchDataForTab(currentTabConfig);
    }
  }, [currentTabConfig, fetchDataForTab]);

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
    if (!selectedItem || !(activeTab === 'm204DbFiles' || activeTab === 'variables' || activeTab === 'procedures' || activeTab === 'otherDatasets')) return;
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
    if (activeTab === 'm204DbFiles' && structureIndex !== undefined && typeof structureIndex === 'number' && originalItem?.structure?.[structureIndex]) {
        const originalFieldStructure = originalItem.structure[structureIndex];
        if (name === 'length' || name === 'vsamLength' || name === 'keyOrder' || (typeof originalFieldStructure[name] === 'number' && originalFieldStructure[name] !== 'N/A')) {
            processedValue = value === '' ? null : parseFloat(value);
            if (value !== '' && isNaN(processedValue)) {
                processedValue = originalFieldStructure[name];
            }
        }
    } else if (activeTab === 'otherDatasets' && structureIndex !== undefined && typeof structureIndex === 'number' && originalItem?.parsedImageFields?.[structureIndex]) {
        const originalFieldStructure = originalItem.parsedImageFields[structureIndex];
        if (name === 'length' || name === 'digits' || name === 'decimalPlaces' || name === 'position' || (typeof originalFieldStructure[name] === 'number' && originalFieldStructure[name] !== 'N/A')) {
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
      if (activeTab === 'm204DbFiles' && structureIndex !== undefined && typeof structureIndex === 'number' && prev.structure) {
        const updatedStructure = prev.structure.map((field, index) =>
          index === structureIndex ? { ...field, [name]: processedValue } : field
        );
        return { ...prev, structure: updatedStructure };
      } else if (activeTab === 'otherDatasets' && structureIndex !== undefined && typeof structureIndex === 'number' && prev.parsedImageFields) {
        const updatedParsedImageFields = prev.parsedImageFields.map((field, index) =>
          index === structureIndex ? { ...field, [name]: processedValue } : field
        );
        return { ...prev, parsedImageFields: updatedParsedImageFields };
      }
      return { ...prev, [name]: processedValue };
    });
  };

  const handleItemUpdate = (updatedItemData) => {
    if (!currentTabConfig) return;
    const updatedItem = currentTabConfig.mapper(updatedItemData);
    updatedItem.key = updatedItem._internalId || updatedItem.name + Date.now();

    setInventoryData(prevInventory => {
      const updatedDataArray = prevInventory[currentTabConfig.dataKey].map(item =>
        item._internalId === updatedItem._internalId ? updatedItem : item
      );
      return {
        ...prevInventory,
        [currentTabConfig.dataKey]: updatedDataArray,
      };
    });

    setSelectedItem(updatedItem);
    setIsEditing(false);
    setEditedItemData(null);
  };

  const handleSave = async () => {
    if (!editedItemData || !currentTabConfig || !(activeTab === 'm204DbFiles' || activeTab === 'variables' || activeTab === 'procedures' || activeTab === 'otherDatasets')) return;

    try {
      let updateEndpoint = '';
      let updatePayload = {};

      switch (activeTab) {
        case 'm204DbFiles':
          updateEndpoint = `/projects/${projectId}/metadata/m204_files/${editedItemData._internalId}`;
          updatePayload = {
            target_vsam_dataset_name: editedItemData.targetVsamDatasetName,
            target_vsam_type: editedItemData.targetVsamType,
            primary_key_field_name: editedItemData.primaryKeyFieldName,
            fields: editedItemData.structure ? editedItemData.structure.map(field => ({
              field_name: field.fieldName,
              attributes_text: field.m204Attributes,
              cobol_picture_clause: field.cobolPictureClause,
              suggested_cobol_field_name: field.suggestedCobolFieldName,
              vsam_length: field.length,
              key_order: field.keyOrder,
              is_key_component: field.isKeyComponent
            })) : undefined
          };
          break;

        case 'variables':
          updateEndpoint = `/projects/${projectId}/metadata/variables/${editedItemData._internalId}`;
          updatePayload = {
            cobol_mapped_variable_name: editedItemData.cobolMappedVariableName,
            cobol_variable_type: editedItemData.cobolVariableType
          };
          break;

        case 'procedures':
          updateEndpoint = `/projects/${projectId}/metadata/procedures/${editedItemData._internalId}`;
          updatePayload = {
            target_cobol_function_name: editedItemData.targetCobolFunctionName
          };
          break;
        
        case 'otherDatasets': {
          updateEndpoint = `/projects/${projectId}/metadata/m204_files/${editedItemData._internalId}`;
          
          let newFileDefinitionJson = JSON.parse(JSON.stringify(selectedItem.file_definition_json || { image_definitions: [] }));

          if (newFileDefinitionJson.image_definitions && newFileDefinitionJson.image_definitions.length > 0 && editedItemData.parsedImageFields) {
            const originalImageDefinitionFields = newFileDefinitionJson.image_definitions[0].fields || [];
            newFileDefinitionJson.image_definitions[0].fields = originalImageDefinitionFields.map(origField => {
              const editedFieldData = editedItemData.parsedImageFields.find(pf => pf.fieldName === origField.field_name);
              if (editedFieldData) {
                return {
                  ...origField,
                  suggested_cobol_field_name: editedFieldData.suggestedCobolFieldName,
                  cobol_layout_suggestions: {
                    ...(origField.cobol_layout_suggestions || {}),
                    cobol_picture_clause: editedFieldData.cobolPictureClause,
                  },
                };
              }
              return origField;
            });
          }
          
          updatePayload = {
            name: editedItemData.name,
            m204_logical_dataset_name: editedItemData.m204LogicalDatasetName,
            target_vsam_dataset_name: editedItemData.targetVsamDatasetName,
            file_definition_json: newFileDefinitionJson,
          };
          break;
        }
        default:
          throw new Error('Unsupported tab for saving');
      }

      const response = await apiClient.put(updateEndpoint, updatePayload);

      if (response.status === 200) {
        handleItemUpdate(response.data);
        alert("Changes saved successfully!");
      }
    } catch (error) {
      console.error("Failed to save changes:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Failed to save changes to the server.";
      alert(`Error saving changes: ${errorMessage}`);
    }
  };


   const getEditableFields = (item) => {
    if (!item || !currentTabConfig) return {};
    const baseDisplayFields = { name: "Name", type: "Type" };
    let specificFields = {};

    for (const key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key) &&
            !['_internalId', '_definedInInputSourceId', '_inputSourceId', 'key', 'name', 'type', 'structure', 'attributes', 'parsedParameters', 'parameters', 'createdAt', 'updatedAt', 'sourceFile', 'mappingStatus', 'summary', 'procedureContent', 'imageStatements', 'parsedImageFields', 'file_definition_json'].includes(key) && 
            typeof item[key] !== 'object' && item[key] !== null) {
            specificFields[key] = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        }
    }

    switch (currentTabConfig.id) {
        case 'm204DbFiles':
            specificFields = {
                ...specificFields,
                targetVsamDatasetName: "Target VSAM Dataset",
                targetVsamType: "Target VSAM Type",
                primaryKeyFieldName: "Primary Key Field",
            };
            delete specificFields.m204Attributes;
            delete specificFields.definedAtLine;
            break;
        case 'procedures':
            specificFields = {
                procedureType: "Procedure Type",
                startLine: "Start Line",
                endLine: "End Line",
                summary: "Summary",
                procedureContent: "Procedure Content",
                targetCobolFunctionName: "Target COBOL Function",
                lines: "Lines of Code",
                isRunnableMain: "Is Runnable Main",
            };
            if (item && item.complexity !== undefined && item.complexity !== 'N/A') {
                specificFields.complexity = "Complexity";
            }
            break;
        case 'variables':
            specificFields = {
                scope: "Scope",
                dataType: "Data Type",
                sourceLine: "Source Line",
                m204Type: "M204 Type",
                cobolMappedVariableName: "COBOL Mapped Name",
                cobolVariableType: "COBOL Variable Type",
            };
            if (item.length && item.length !== 'N/A') specificFields.length = "Length";
            if (item.arrayDimensions && item.arrayDimensions !== 'N/A') specificFields.arrayDimensions = "Array Dimensions";
            if (item.otherKeywords && item.otherKeywords !== 'N/A') specificFields.otherKeywords = "Other M204 Keywords";
            if (item.procedureName && item.procedureName !== 'N/A') specificFields.procedureName = "Procedure Name";
            break;
        case 'otherDatasets':
            specificFields = {
                ...specificFields,
                definedAtLine: "Defined At Line",
                m204LogicalDatasetName: "M204 Logical Dataset Name",
                targetVsamDatasetName: "Target VSAM Dataset", 
            };
            if (item && item.imageStatements && item.imageStatements.length > 0) {
                specificFields.imageStatementsDisplay = "Image Statements";
            }
            delete specificFields.m204Attributes;
            break;
        default:
            break;
    }
    return { ...baseDisplayFields, ...specificFields };
};

      const renderDetailItem = (label, value, fieldName, item, fieldId, structureIndex) => {
    if (value === null || value === undefined) value = '';
    const currentItemForEdit = isEditing ? editedItemData : selectedItem;

    if (activeTab === 'procedures' && (fieldName === 'summary' || fieldName === 'procedureContent')) {
      const modalTitle = fieldName === 'summary' ? `Summary: ${item?.name}` : `Content: ${item?.name}`;
      const contentValue = (isEditing ? editedItemData : selectedItem)?.[fieldName];
      const renderSummaryAsMarkdown = fieldName === 'summary';

      if (isEditing) {
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
            onClick={() => openContentModal(modalTitle, String(contentValue), renderSummaryAsMarkdown)}
            className="text-sm text-teal-600 hover:text-teal-700 hover:underline font-medium text-left cursor-pointer p-0 bg-transparent border-none"
            title={buttonTitle}
          >
            {buttonText}
          </button>
        </div>
      );
    } else if (activeTab === 'otherDatasets' && fieldName === 'imageStatementsDisplay') {
        const itemForContent = selectedItem;
        const imageStatements = itemForContent?.imageStatements;

        if (!imageStatements || imageStatements.length === 0) {
            return (
                <div className="grid grid-cols-[160px_1fr] gap-1 items-center py-1.5">
                    <div className="text-sm font-medium text-gray-500 truncate" title={label}>{label}:</div>
                    <div className="text-sm text-gray-400 italic">No image statements defined</div>
                </div>
            );
        }

        const combinedContent = imageStatements.map(stmt => stmt.image_content).join("\n\n---\n\n");
        const modalTitle = `Image Statements: ${item?.name}`;
        const buttonText = "View Image Statements";
        const buttonTitle = "Click to view image statements";

        return (
            <div className="grid grid-cols-[160px_1fr] gap-1 items-center py-1.5">
                <div className="text-sm font-medium text-gray-500 truncate" title={label}>{label}:</div>
                <button
                    onClick={() => openContentModal(modalTitle, combinedContent, false)}
                    className="text-sm text-teal-600 hover:text-teal-700 hover:underline font-medium text-left cursor-pointer p-0 bg-transparent border-none"
                    title={buttonTitle}
                >
                    {buttonText}
                </button>
            </div>
        );
    }

    let isFieldReadOnly = true;

    if (isEditing && currentItemForEdit && item && currentItemForEdit._internalId === item._internalId) {
        if (activeTab === 'm204DbFiles') {
            const editableM204TopLevel = ['targetVsamDatasetName', 'targetVsamType', 'primaryKeyFieldName', 'name'];
            const editableM204Structure = ['cobolPictureClause', 'suggestedCobolFieldName', 'length', 'keyOrder'];
            if (structureIndex === undefined || typeof structureIndex !== 'number') {
                if (editableM204TopLevel.includes(fieldName)) isFieldReadOnly = false;
            } else {
                if (editableM204Structure.includes(fieldName)) isFieldReadOnly = false;
            }
        } else if (activeTab === 'variables') {
            if (['cobolMappedVariableName', 'cobolVariableType'].includes(fieldName)) isFieldReadOnly = false;
        } else if (activeTab === 'procedures') {
            if (fieldName === 'targetCobolFunctionName') isFieldReadOnly = false;
        } else if (activeTab === 'otherDatasets') {
            const editableOtherTopLevel = ['name', 'm204LogicalDatasetName', 'targetVsamDatasetName'];
            const editableImageFields = ['suggestedCobolFieldName', 'cobolPictureClause'];

            if (typeof structureIndex === 'number') {
                if (editableImageFields.includes(fieldName)) {
                    isFieldReadOnly = false;
                }
            } else {
                if (editableOtherTopLevel.includes(fieldName)) {
                    isFieldReadOnly = false;
                }
            }
        }
    }


    if (isEditing && currentItemForEdit && item && currentItemForEdit._internalId === item._internalId) {
      let originalValueForTypeCheck = item[fieldName];
      let currentValueToDisplay = currentItemForEdit[fieldName];

      if (activeTab === 'm204DbFiles' && structureIndex !== undefined && typeof structureIndex === 'number' && item.structure?.[structureIndex] && currentItemForEdit.structure?.[structureIndex]) {
        originalValueForTypeCheck = item.structure[structureIndex][fieldName];
        currentValueToDisplay = currentItemForEdit.structure[structureIndex][fieldName];
      } else if (activeTab === 'otherDatasets' && structureIndex !== undefined && typeof structureIndex === 'number' && item.parsedImageFields?.[structureIndex] && currentItemForEdit.parsedImageFields?.[structureIndex]) {
        originalValueForTypeCheck = item.parsedImageFields[structureIndex][fieldName];
        currentValueToDisplay = currentItemForEdit.parsedImageFields[structureIndex][fieldName];
      }
      

      const inputKey = fieldId ? `${fieldId}-${structureIndex !== undefined ? (typeof structureIndex === 'number' ? `struct-${structureIndex}-` : `${structureIndex}-`) : ''}${fieldName}` : fieldName;

      if (fieldName === 'attributesDisplay' && activeTab === 'variables') {
          const dataToShow = currentItemForEdit.attributes;
          return (
            <div className="grid grid-cols-[160px_1fr] gap-1 items-start py-1">
              <div className="text-sm font-medium text-gray-500 truncate" title={label}>{label}:</div>
              <textarea
                value={typeof dataToShow === 'object' && dataToShow !== null ? JSON.stringify(dataToShow, null, 2) : String(dataToShow ?? 'N/A')}
                readOnly
                className="text-sm text-gray-800 p-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-gray-100 h-24"
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
            disabled={isFieldReadOnly}
          />
        </div>
      );
    }

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
    if (fieldName === 'm204Attributes' && activeTab === 'otherDatasets' && typeof value === 'string' && value.length > 60) {
      return (
        <div className="grid grid-cols-[160px_1fr] gap-1 items-start py-1">
          <div className="text-sm font-medium text-gray-500 truncate" title={label}>{label}:</div>
          <pre className=" text-gray-800 break-words whitespace-pre-wrap bg-gray-100 p-1.5 rounded-md text-xs">{String(value)}</pre>
        </div>
      );
    }

    if (
  fieldName === 'primaryKeyFieldName' &&
  activeTab === 'm204DbFiles' &&
  typeof value === 'string'
) {
  const keys = value.split(',').map(k => k.trim()).filter(Boolean);
  return (
    <div className="grid grid-cols-[160px_1fr] gap-1 items-start py-1">
      <div className="text-sm font-medium text-gray-500 truncate pt-0.5" title={label}>{label}:</div>
      <div className="flex flex-col gap-0.5 text-sm text-gray-800 break-words">
        {keys.length > 0 ? (
          keys.map((key, idx) => (
            <span key={idx}>{key}</span>
          ))
        ) : (
          <span className="text-gray-400 italic">N/A</span>
        )}
      </div>
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
  const isParentEditing = isEditing && editedItemData && editedItemData._internalId === parentItem._internalId;
  const currentFieldData = isParentEditing && editedItemData.structure ? editedItemData.structure[index] : field;


  return (
    <div key={fieldKey} className="pl-4 mt-2 pt-2 border-t border-gray-200">
      <p className="text-xs font-semibold text-gray-600 mb-1">
        Field: {currentFieldData?.fieldName || field.fieldName}
      </p>
      {renderDetailItem("Field Name", currentFieldData?.fieldName, "fieldName", parentItem, parentItem._internalId, index)}
      {renderDetailItem("Suggested COBOL Name", currentFieldData?.suggestedCobolFieldName, "suggestedCobolFieldName", parentItem, parentItem._internalId, index)}
      {currentFieldData?.m204Attributes !== undefined && renderDetailItem("M204 Attrs", currentFieldData.m204Attributes, "m204Attributes", parentItem, parentItem._internalId, index)}
      {currentFieldData?.length !== undefined && renderDetailItem("VSAM Length", currentFieldData.length, "length", parentItem, parentItem._internalId, index)}
      {currentFieldData?.keyOrder !== undefined && currentFieldData.keyOrder !== 'N/A' && renderDetailItem("Key Order", currentFieldData.keyOrder, "keyOrder", parentItem, parentItem._internalId, index)}
      {currentFieldData?.cobolPictureClause !== undefined && renderDetailItem("COBOL Picture", currentFieldData.cobolPictureClause, "cobolPictureClause", parentItem, parentItem._internalId, index)}
      {currentFieldData?.isKeyComponent !== undefined && renderDetailItem("Is Key Component", String(currentFieldData.isKeyComponent), "isKeyComponent", parentItem, parentItem._internalId, index)}
    </div>
  );
};

const renderImageDefinitionField = (field, index, parentItem) => {
  const fieldKey = `${parentItem._internalId}-imgfield-${index}-${field.fieldName}`;
  const isParentEditing = isEditing && editedItemData && editedItemData._internalId === parentItem._internalId;
  const currentFieldData = isParentEditing && editedItemData.parsedImageFields ? editedItemData.parsedImageFields[index] : field;

  return (
    <div key={fieldKey} className="pl-4 mt-2 pt-2 border-t border-gray-200">
      <p className="text-xs font-semibold text-gray-600 mb-1">
        Field: {currentFieldData?.fieldName || field.fieldName}
      </p>
      {renderDetailItem("Field Name", currentFieldData?.fieldName, "fieldName", parentItem, parentItem._internalId, index)}
      {renderDetailItem("Suggested COBOL Name", currentFieldData?.suggestedCobolFieldName, "suggestedCobolFieldName", parentItem, parentItem._internalId, index)}
      {renderDetailItem("Data Type", currentFieldData?.dataType, "dataType", parentItem, parentItem._internalId, index)}
      {renderDetailItem("Length/Size", currentFieldData?.length, "length", parentItem, parentItem._internalId, index)}
      {currentFieldData?.digits !== 'N/A' && currentFieldData?.digits !== undefined && renderDetailItem("Digits", currentFieldData.digits, "digits", parentItem, parentItem._internalId, index)}
      {currentFieldData?.decimalPlaces !== 'N/A' && currentFieldData?.decimalPlaces !== undefined && renderDetailItem("Decimal Places", currentFieldData.decimalPlaces, "decimalPlaces", parentItem, parentItem._internalId, index)}
      {renderDetailItem("COBOL Picture", currentFieldData?.cobolPictureClause, "cobolPictureClause", parentItem, parentItem._internalId, index)}
    </div>
  );
};


  const handleGenerateRequirements = async () => {
    navigate(`/project/${projectId}/requirements`);
    try {
      apiClient.post(`/requirements/projects/${projectId}/generate-document`, {});
    } catch (err) {
      console.error("Failed to initiate requirements generation:", err);
    }
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
            <button
            onClick={handleGenerateRequirements}
            className="ml-4 p-3 px-8 bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 text-white rounded-md hover:opacity-90 text-sm flex items-center"
            title="Generate Requirements Document"
          >
            Generate Requirements
            <ChevronRight size={20} className="ml-2" />
          </button>
        </div>
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

        <div className="grid md:grid-cols-[minmax(320px,_1fr)_420px] flex-grow overflow-hidden">
          <div className="overflow-y-auto border-r border-gray-200 p-2 bg-white">
            <InventoryList
              loading={loadingStates[activeTab]}
              error={errorStates[activeTab]}
              filteredData={filteredData}
              currentTabData={currentTabData}
              currentTabConfig={currentTabConfig}
              selectedItem={selectedItem}
              isEditing={isEditing}
              onSelectItem={(item) => {
                setSelectedItem(item);
                setIsEditing(false);
              }}
            />
          </div>

          <div className="overflow-y-auto p-5 bg-gray-50/70">
            <InventoryDetailPanel
              projectId={projectId}
              selectedItem={selectedItem}
              isEditing={isEditing}
              editedItemData={editedItemData}
              activeTab={activeTab}
              getEditableFields={getEditableFields}
              renderDetailItem={renderDetailItem}
              renderStructureField={renderStructureField}
              renderImageDefinitionField={renderImageDefinitionField}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onRefresh={handleRefresh}
            />
          </div>
        </div>
      </div>
      <ContentViewModal
        isOpen={isContentModalOpen}
        onClose={closeContentModal}
        title={modalContent.title}
        content={modalContent.content}
        renderAsMarkdown={modalContent.renderAsMarkdown}
      />
    </div>
  );
};

export default InventoryPage;
