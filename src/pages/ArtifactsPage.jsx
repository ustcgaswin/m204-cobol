import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText,
  FileCode,
  BookCopy,
  AlertTriangle,
  Package,
  Eye,
  X,
  Download,
  Loader2, 
  CheckSquare 
} from 'lucide-react';
import JSZip from 'jszip';

// Sample project data (ideally, this would come from a shared context or API call)
const sampleProjectsForArtifacts = [
  { id: '1', name: 'Project Alpha' },
  { id: '2', name: 'Project Beta' },
  { id: '3', name: 'Project Gamma' },
  { id: '4', name: 'Project Delta' },
  { id: '5', name: 'Project Epsilon' },
  { id: '6', name: 'Project Zeta' },
  { id: '7', name: 'Project Eta' },
  { id: '8', name: 'Project Theta' },
];

const mockArtifactsData = {
  '1': [ // Corresponds to Project Alpha
    {
      id: 'alpha_cob1', name: 'CUSTPROC_ALPHA.CBL', type: 'COBOL', size: '15 KB', lastModified: '2025-05-10', url: '#',
      description: 'Main COBOL program for customer data processing and validation.',
      content: `IDENTIFICATION DIVISION.
PROGRAM-ID. CUSTPROC_ALPHA.
AUTHOR. Experian.
DATE-WRITTEN. 2025-01-15.
*
ENVIRONMENT DIVISION.
CONFIGURATION SECTION.
SOURCE-COMPUTER. IBM-MAINFRAME.
OBJECT-COMPUTER. IBM-MAINFRAME.
*
DATA DIVISION.
FILE SECTION.
WORKING-STORAGE SECTION.
01 WS-CUSTOMER-ID PIC X(10).
01 WS-MESSAGE     PIC X(50).
*
PROCEDURE DIVISION.
MAIN-LOGIC.
    DISPLAY "Processing CUSTPROC_ALPHA...".
    MOVE "CUSTOMER001" TO WS-CUSTOMER-ID.
    MOVE "Sample COBOL content for viewing." TO WS-MESSAGE.
    DISPLAY "Customer ID: " WS-CUSTOMER-ID.
    DISPLAY "Message: " WS-MESSAGE.
    STOP RUN.`
    },
    {
      id: 'alpha_cob1_test', name: 'CUSTPROC_ALPHA_TEST.TXT', type: 'UnitTest', size: '1 KB', lastModified: '2025-05-10', url: '#',
      description: 'Unit tests for CUSTPROC_ALPHA.CBL.',
      content: `Test Suite: CUSTPROC_ALPHA Tests
=================================

Test Case 1: Valid Customer ID
Input: WS-CUSTOMER-ID = "CUSTOMER001"
Expected Output: WS-MESSAGE contains "Sample COBOL content"
Status: PASSED

Test Case 2: Boundary Customer ID Length
Input: WS-CUSTOMER-ID = "CUST123456" (10 chars)
Expected Output: Successful processing
Status: PASSED
`
    },
    {
      id: 'alpha_jcl1', name: 'CUSTLOAD_ALPHA.JCL', type: 'JCL', size: '5 KB', lastModified: '2025-05-09', url: '#',
      description: 'JCL script to define and load data into a customer data store.',
      content: `//CUSTLOAD JOB (ACCT),'LOAD CUSTOMER DATA',CLASS=A,MSGCLASS=X
//STEP1    EXEC PGM=IDCAMS
//SYSPRINT DD SYSOUT=*
//SYSIN    DD *
  DEFINE CLUSTER (NAME(PROJ.APP.CUSTOMER.DATASET) -
    VOLUMES(VOL001) -
    RECORDS(1000 500) -
    RECORDSIZE(200 250) -
    KEYS(10 0) -
    FREESPACE(10 10) -
    INDEXED) -
  DATA (NAME(PROJ.APP.CUSTOMER.DATASET.DATA)) -
  INDEX (NAME(PROJ.APP.CUSTOMER.DATASET.INDEX))
/*
//STEP2    EXEC PGM=LOADERPGM
//CUSTFILE DD DSN=PROJ.APP.CUSTOMER.DATASET,DISP=OLD
//INDATA   DD DSN=PROJ.APP.CUSTOMER.INPUT,DISP=SHR
`
    },
    {
      id: 'alpha_cpy1', name: 'CUSTREC_ALPHA.CPY', type: 'Copybook', size: '2 KB', lastModified: '2025-05-08', url: '#',
      description: 'COBOL Copybook defining the layout of a customer record.',
      content: `      * CUSTOMER RECORD LAYOUT
       01 CUSTOMER-RECORD.
          05 CUST-ID         PIC X(10).
          05 CUST-NAME       PIC X(50).
          05 CUST-ADDRESS.
             10 CUST-STREET  PIC X(40).
             10 CUST-CITY    PIC X(30).
             10 CUST-STATE   PIC X(02).
             10 CUST-ZIP     PIC X(05).
          05 CUST-BALANCE    PIC S9(7)V99 COMP-3.`
    },
    {
      id: 'alpha_cob2', name: 'ORDVALID_ALPHA.CBL', type: 'COBOL', size: '12 KB', lastModified: '2025-05-11', url: '#',
      description: 'COBOL program responsible for validating customer orders.',
      content: 'IDENTIFICATION DIVISION.\nPROGRAM-ID. ORDVALID_ALPHA.\n*\nPROCEDURE DIVISION.\n    DISPLAY "Order Validation Program ORDVALID_ALPHA".\n    STOP RUN.'
    },
    {
      id: 'alpha_cob2_test', name: 'ORDVALID_ALPHA_TEST.TXT', type: 'UnitTest', size: '0.8 KB', lastModified: '2025-05-11', url: '#',
      description: 'Unit tests for ORDVALID_ALPHA.CBL.',
      content: `Test Suite: ORDVALID_ALPHA Tests
=================================

Test Case 1: Basic Execution
Input: N/A
Expected Output: Display "Order Validation Program ORDVALID_ALPHA"
Status: PASSED
`
    },
  ],
  '2': [
    {
      id: 'beta_cob1', name: 'ORDENTRY_BETA.CBL', type: 'COBOL', size: '22 KB', lastModified: '2025-05-11', url: '#',
      description: 'COBOL program for handling order entry for Project Beta.',
      content: 'IDENTIFICATION DIVISION.\nPROGRAM-ID. ORDENTRY_BETA.\n*\nPROCEDURE DIVISION.\n    DISPLAY "Order Entry Program ORDENTRY_BETA".\n    STOP RUN.'
    },
    {
      id: 'beta_cob1_test', name: 'ORDENTRY_BETA_TEST.TXT', type: 'UnitTest', size: '0.7 KB', lastModified: '2025-05-11', url: '#',
      description: 'Unit tests for ORDENTRY_BETA.CBL.',
      content: `Test Suite: ORDENTRY_BETA Tests
=================================

Test Case 1: Program Invocation
Input: N/A
Expected Output: Display "Order Entry Program ORDENTRY_BETA"
Status: PASSED
`
    },
  ],
  '3': [
    {
      id: 'gamma_jcl1', name: 'REPORT_GAMMA.JCL', type: 'JCL', size: '3 KB', lastModified: '2025-05-09', url: '#',
      description: 'JCL script to generate a standard report for Project Gamma.',
      content: '//REPORTGM JOB (ACCT),"RUN GAMMA REPORT",CLASS=A\n//STEP1 EXEC PGM=REPORTER\n//SYSOUT DD SYSOUT=*\n//INPUT DD DSN=PROJ.APP.GAMMA.DATA,DISP=SHR'
    },
    {
      id: 'gamma_cpy1', name: 'ITEMREC_GAMMA.CPY', type: 'Copybook', size: '1 KB', lastModified: '2025-05-08', url: '#',
      description: 'COBOL Copybook defining the layout of an item record for Project Gamma.',
      content: '       01 ITEM-RECORD.\n          05 ITEM-ID     PIC X(8).\n          05 ITEM-DESC   PIC X(100).'
    },
  ],
  '4': [],
  '5': [
    {
      id: 'epsilon_cob1', name: 'ARCHIVE_EPSILON.CBL', type: 'COBOL', size: '10 KB', lastModified: '2025-04-01', url: '#',
      description: 'COBOL program for archiving data related to Project Epsilon.',
      content: 'IDENTIFICATION DIVISION.\nPROGRAM-ID. ARCHIVE_EPSILON.\n*\nPROCEDURE DIVISION.\n    DISPLAY "Archive Program ARCHIVE_EPSILON".\n    STOP RUN.'
    },
    {
      id: 'epsilon_cob1_test', name: 'ARCHIVE_EPSILON_TEST.TXT', type: 'UnitTest', size: '0.9 KB', lastModified: '2025-04-01', url: '#',
      description: 'Unit tests for ARCHIVE_EPSILON.CBL.',
      content: `Test Suite: ARCHIVE_EPSILON Tests
=================================

Test Case 1: Standard Archive Process
Input: Standard dataset
Expected Output: Display "Archive Program ARCHIVE_EPSILON", data archived successfully
Status: PASSED
`
    },
  ],
};

const artifactCardIcons = {
  COBOL: <FileCode size={20} className="text-blue-500" />,
  JCL: <FileText size={20} className="text-green-500" />,
  Copybook: <BookCopy size={20} className="text-orange-500" />,
  UnitTest: <CheckSquare size={20} className="text-purple-500" />, // Added UnitTest icon
  Default: <Package size={20} className="text-gray-500" />,
};

const staticTabsConfig = [
  { id: 'COBOL', label: 'COBOL', IconComponent: FileCode, defaultIconProps: { className: "text-blue-500 group-hover:text-blue-600" } },
  { id: 'JCL', label: 'JCL', IconComponent: FileText, defaultIconProps: { className: "text-green-500 group-hover:text-green-600" } },
  { id: 'Copybook', label: 'Copybooks', IconComponent: BookCopy, defaultIconProps: { className: "text-orange-500 group-hover:text-orange-600" } },
  { id: 'UnitTest', label: 'Unit Tests', IconComponent: CheckSquare, defaultIconProps: { className: "text-purple-500 group-hover:text-purple-600" } }, // Added UnitTest tab
];


const ArtifactsPage = () => {
  const { projectId } = useParams();
  const [allArtifacts, setAllArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableTabs, setAvailableTabs] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [projectName, setProjectName] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewModalData, setViewModalData] = useState({ name: '', content: '' });
  const [isZipping, setIsZipping] = useState(false); // New state for zipping process

  useEffect(() => {
    setLoading(true);
    setError(null);
    setAllArtifacts([]);
    setAvailableTabs([]);
    setActiveTab('');

    let resolvedProjectName = '';
    if (projectId) {
      const project = sampleProjectsForArtifacts.find(p => p.id === projectId);
      if (project) {
        resolvedProjectName = project.name;
        setProjectName(project.name);
      } else {
        resolvedProjectName = `ID: ${projectId}`;
        setProjectName(`ID: ${projectId}`); // Keep projectName as ID if not found
      }
    } else {
      setProjectName('');
    }

    setTimeout(() => {
      const projectArtifacts = mockArtifactsData[projectId];
      if (projectArtifacts) {
        setAllArtifacts(projectArtifacts);
        if (projectArtifacts.length > 0) {
          const uniqueTypesInProject = [...new Set(projectArtifacts.map(a => a.type))];
          const currentProjectTabs = staticTabsConfig.filter(tabConf => uniqueTypesInProject.includes(tabConf.id));
          const sortedProjectTabs = currentProjectTabs.sort((a, b) =>
            staticTabsConfig.findIndex(t => t.id === a.id) -
            staticTabsConfig.findIndex(t => t.id === b.id)
          );
          setAvailableTabs(sortedProjectTabs);
          if (sortedProjectTabs.length > 0) {
            setActiveTab(sortedProjectTabs[0].id);
          }
        }
      } else if (projectId) {
        setError(`No artifact data found for project ${resolvedProjectName}. This project might not have associated artifacts or the ID is incorrect.`);
      }
      setLoading(false);
    }, 500);
  }, [projectId]);

  const handleViewContent = (artifact) => {
    setViewModalData({ name: artifact.name, content: artifact.content });
    setIsViewModalOpen(true);
  };

  const handleDownload = (artifact) => {
    alert(`Simulating download of ${artifact.name}`);
    // For actual download:
    // const blob = new Blob([artifact.content], { type: 'text/plain' }); // Adjust MIME type
    // const url = URL.createObjectURL(blob);
    // const link = document.createElement('a');
    // link.href = url;
    // link.download = artifact.name;
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
    // URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
    if (allArtifacts.length === 0) {
      alert("No artifacts to download.");
      return;
    }

    setIsZipping(true);
    setError(null); // Clear previous errors

    const zip = new JSZip();
    let metadataContent = `Project: ${projectName || `ID: ${projectId}`}\n`;
    metadataContent += `Date Downloaded: ${new Date().toISOString()}\n\n`;
    metadataContent += "Artifacts Metadata:\n";
    metadataContent += "=====================\n\n";

    allArtifacts.forEach(artifact => {
      zip.file(artifact.name, artifact.content || ""); // Add artifact file to zip

      // Append metadata
      metadataContent += `File: ${artifact.name}\n`;
      metadataContent += `Type: ${artifact.type}\n`;
      metadataContent += `Size: ${artifact.size}\n`;
      metadataContent += `Last Modified: ${artifact.lastModified}\n`;
      metadataContent += `Description: ${artifact.description || 'N/A'}\n`;
      metadataContent += "---------------------\n\n";
    });

    zip.file("metadata.txt", metadataContent); // Add metadata.txt to zip

    try {
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const safeProjectName = projectName.startsWith("ID: ") ? `project_${projectId}` : projectName.replace(/\s+/g, '_');
      const zipFileName = `${safeProjectName}_artifacts.zip`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Error creating zip file:", err);
      setError("Could not generate ZIP file for download. Please try again.");
    } finally {
      setIsZipping(false);
    }
  };


  const displayedArtifacts = allArtifacts
    .filter(artifact => !activeTab || artifact.type === activeTab);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          <p className="text-gray-600">Loading artifacts...</p>
        </div>
      </div>
    );
  }

  if (error && !allArtifacts.length) { // Only show full page error if no artifacts are loaded
    return (
      <div className="h-full p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-grow">
        <header className="mb-6 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Project Artifacts
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Viewable and downloadable output files for project <span className="font-semibold text-teal-600">{projectName || `ID: ${projectId}`}</span>.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4 shrink-0">
              <button
                onClick={handleDownloadAll}
                disabled={allArtifacts.length === 0 || loading || isZipping}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isZipping ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Zipping...
                  </>
                ) : (
                  <>
                    <Download size={16} className="mr-2" />
                    Download All Artifacts
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {error && allArtifacts.length > 0 && ( // Display error as a dismissible alert if artifacts are present
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                     <div className="ml-auto pl-3">
                        <div className="-mx-1.5 -my-1.5">
                        <button
                            type="button"
                            onClick={() => setError(null)}
                            className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                        >
                            <span className="sr-only">Dismiss</span>
                            <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {allArtifacts.length === 0 && !loading && !error ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-10 bg-white rounded-lg shadow">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-700">No Artifacts Available</h3>
            <p className="text-gray-500">There are no artifacts to display for this project.</p>
          </div>
        ) : !loading && allArtifacts.length > 0 ? (
          <div className="flex flex-col flex-grow">
            {availableTabs.length > 0 && (
              <div className="mt-6 border-b border-gray-200 bg-white rounded-t-lg shadow-sm shrink-0">
                <nav className="-mb-px flex space-x-0" aria-label="Tabs">
                  {availableTabs.map((tabConfig) => {
                    const { IconComponent, defaultIconProps } = tabConfig;
                    const isActive = activeTab === tabConfig.id;
                    return (
                      <button
                        key={tabConfig.id}
                        onClick={() => {
                          setActiveTab(tabConfig.id);
                        }}
                        className={`group whitespace-nowrap py-3.5 px-4 border-b-2 font-medium text-sm flex items-center gap-2
                          ${isActive
                            ? 'border-teal-500 text-teal-600 bg-teal-50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                          }
                          focus:outline-none transition-colors flex-1 justify-center md:flex-none`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <IconComponent size={15} {...defaultIconProps} className={`${defaultIconProps.className} ${isActive ? '' : 'text-gray-400 group-hover:text-gray-500'}`} />
                        <span className="ml-1">{tabConfig.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}

            <div className={`bg-white p-4 flex-grow ${availableTabs.length > 0 ? 'rounded-b-lg shadow-sm' : 'rounded-lg shadow-sm mt-6'}`}>
              {displayedArtifacts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayedArtifacts.sort((a, b) => a.name.localeCompare(b.name)).map((artifact) => (
                    <div
                      key={artifact.id}
                      className="bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center mb-2">
                          {artifactCardIcons[artifact.type] || artifactCardIcons.Default}
                          <h3 className="ml-2 text-md font-medium text-gray-800 truncate" title={artifact.name}>
                            {artifact.name}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500">Type: {artifact.type}</p>
                        <p className="text-xs text-gray-500">Size: {artifact.size}</p>
                        <p className="text-xs text-gray-500">Modified: {artifact.lastModified}</p>
                        {artifact.description && (
                          <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                            {artifact.description}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => handleViewContent(artifact)}
                          className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          <Eye size={16} className="mr-1.5" />
                          View
                        </button>
                        <button
                          onClick={() => handleDownload(artifact)}
                          className="flex-1 flex items-center justify-center px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                        >
                          <Download size={16} className="mr-1.5" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                  <>
                    <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium text-gray-700">
                      No {activeTab ? `${availableTabs.find(t => t.id === activeTab)?.label || ''} ` : ''}Artifacts
                    </h3>
                    <p className="text-gray-500">
                      There are no {activeTab ? `${availableTabs.find(t => t.id === activeTab)?.label.toLowerCase() || ''} ` : ''}artifacts to display in this section.
                    </p>
                  </>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* View Content Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900 truncate" title={viewModalData.name}>
                {viewModalData.name}
              </h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <pre className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-wrap break-all">
                {viewModalData.content || "No content available."}
              </pre>
            </div>
            <div className="flex items-center justify-end p-4 border-t">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtifactsPage;