import React, { useState, useRef } from 'react';
import { Upload, FileText, Trash2, Download, ArrowLeft, File, Image, Code, Archive, Eye, Zap, 
  AlertTriangle, CheckCircle, Search, Filter } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

const SourceFilesPage = () => {
  const { projectId } = useParams();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  // Removed unused selectedFiles state
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileToView, setFileToView] = useState(null);
  const [fileStatus, setFileStatus] = useState({}); // Track status of each file: 'checking', 'analyzed', 'error'

  // Get file icon based on file extension
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) return <Image size={18} className="text-purple-500" />;
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json'].includes(extension))
      return <Code size={18} className="text-blue-500" />;
    if (['zip', 'tar', 'rar', 'gz'].includes(extension))
      return <Archive size={18} className="text-amber-500" />;
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(extension))
      return <FileText size={18} className="text-red-500" />;
    return <File size={18} className="text-gray-500" />;
  };

  // Get status icon based on file status
  const getStatusIcon = (fileId) => {
    switch (fileStatus[fileId]) {
      case 'checking':
        return <div className="animate-pulse"><Zap size={16} className="text-amber-500" /></div>;
      case 'analyzed':
        return <CheckCircle size={16} className="text-emerald-500" />;
      case 'error':
        return <AlertTriangle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      // Removed selectedFiles usage
      const newFiles = Array.from(event.target.files).map(file => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        size: file.size,
        uploadDate: new Date().toISOString(),
        originalFile: file,
      }));
      setUploadedFiles(prevFiles => [...prevFiles, ...newFiles]);
      event.target.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDeleteFile = (fileId) => {
    setUploadedFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    const newFileStatus = { ...fileStatus };
    delete newFileStatus[fileId];
    setFileStatus(newFileStatus);
  };

  const handleViewFile = async (file) => {
    if (!file.originalFile) {
      setFileToView({
        name: file.name,
        content: "File data is not available for preview.",
        type: "unknown",
      });
      setIsModalOpen(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileToView({
        name: file.name,
        content: e.target.result,
        type: file.originalFile.type,
      });
      setIsModalOpen(true);
    };
    reader.onerror = () => {
      setFileToView({
        name: file.name,
        content: "Error reading file content.",
        type: file.originalFile.type,
      });
      setIsModalOpen(true);
    };

    const textLikeMimeTypes = ['text/', 'application/json', 'application/xml', 'application/javascript', 'application/typescript'];
    const textLikeExtensions = /\.(txt|md|json|js|jsx|ts|tsx|html|css|xml|log|csv|yaml|yml)$/i;

    if (textLikeMimeTypes.some(typePrefix => file.originalFile.type.startsWith(typePrefix)) || textLikeExtensions.test(file.name)) {
      reader.readAsText(file.originalFile);
    } else {
      setFileToView({
        name: file.name,
        content: `Preview not available for this file type (${file.originalFile.type || 'unknown'}). Try downloading the file.`,
        type: file.originalFile.type,
      });
      setIsModalOpen(true);
    }
  };

  const handleAnalyzeFile = (file) => {
    setFileStatus(prev => ({ ...prev, [file.id]: 'checking' }));
    setTimeout(() => {
      const status = Math.random() > 0.3 ? 'analyzed' : 'error';
      setFileStatus(prev => ({ ...prev, [file.id]: status }));
    }, 1500);
  };

  const handleAnalyzeAllFiles = () => {
    if (uploadedFiles.length === 0) return;
    const newStatus = {};
    uploadedFiles.forEach(file => {
      newStatus[file.id] = 'checking';
    });
    setFileStatus(newStatus);
    uploadedFiles.forEach(file => {
      setTimeout(() => {
        const status = Math.random() > 0.3 ? 'analyzed' : 'error';
        setFileStatus(prev => ({ ...prev, [file.id]: status }));
      }, 1000 + Math.random() * 2000);
    });
  };

  const handleRemoveAllFiles = () => {
    if (uploadedFiles.length === 0) return;
    if (window.confirm(`Are you sure you want to remove all ${uploadedFiles.length} files? This action cannot be undone.`)) {
      setUploadedFiles([]);
      setSearchQuery('');
      setFileStatus({});
    }
  };

  // Check if every file has been processed (status is either 'analyzed' or 'error')
  const allFilesAnalyzed = uploadedFiles.length > 0 &&
    uploadedFiles.every(file => fileStatus[file.id] && (fileStatus[file.id] === 'analyzed' || fileStatus[file.id] === 'error'));

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section with Upload Button */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Source Files</h1>
            <p className="text-gray-600 mt-1">Manage and analyze your project source files</p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors"
            >
              <Upload size={20} />
              <span>Upload Files</span>
            </button>
            <Link
              to={`/project/${projectId}`}
              className="flex items-center gap-2 text-teal-600 hover:text-teal-800 font-medium transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:border-teal-300"
            >
              <ArrowLeft size={16} />
              <span>Back to Project</span>
            </Link>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id="fileUploadInput"
        />

        {/* Files Management Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FileText size={20} className="text-teal-500" />
              <span>Uploaded Files</span>
              {uploadedFiles.length > 0 && (
                <span className="text-xs px-2.5 py-1 bg-teal-100 text-teal-800 rounded-full ml-2">
                  {uploadedFiles.length}
                </span>
              )}
            </h2>
          </div>

          <div className="p-6">
            {uploadedFiles.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search files by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleAnalyzeAllFiles}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm whitespace-nowrap"
                  >
                    <Zap size={16} />
                    <span>Analyze All</span>
                  </button>
                  
                  <button
                    onClick={handleRemoveAllFiles}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg shadow-sm transition-colors text-sm border border-gray-300 whitespace-nowrap"
                  >
                    <Trash2 size={16} />
                    <span>Remove All</span>
                  </button>
                </div>
              </div>
            )}

            {/* File List */}
            {uploadedFiles.length > 0 ? (
              <>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="bg-gray-50 px-4 py-3 hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                    <div className="col-span-5">File Name</div>
                    <div className="col-span-2">Size</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-3 text-right">Actions</div>
                  </div>

                  <ul className="divide-y divide-gray-200">
                    {uploadedFiles.filter(file =>
                      file.name.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length > 0 ? (
                      uploadedFiles.filter(file =>
                        file.name.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((file) => (
                        <li
                          key={file.id}
                          className="bg-white hover:bg-gray-50 transition-colors px-4 py-3 grid md:grid-cols-12 gap-3 md:gap-4 items-center"
                        >
                          <div className="md:col-span-5 flex items-center gap-3">
                            <div className="flex-shrink-0 w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center">
                              {getFileIcon(file.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 truncate" title={file.name}>{file.name}</p>
                              <p className="text-xs text-gray-500 md:hidden">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>

                          <div className="md:col-span-2 text-sm text-gray-600 hidden md:block">
                            {formatFileSize(file.size)}
                          </div>

                          <div className="md:col-span-2 hidden md:flex items-center gap-1.5">
                            {getStatusIcon(file.id)}
                            <span className="text-sm">
                              {fileStatus[file.id] === 'checking' && 'Checking...'}
                              {fileStatus[file.id] === 'analyzed' && 'Analyzed'}
                              {fileStatus[file.id] === 'error' && 'Error'}
                              {!fileStatus[file.id] && 'Not checked'}
                            </span>
                          </div>

                          <div className="md:col-span-3 flex gap-1.5 justify-end">
                            <button
                              className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="View file content"
                              onClick={() => handleViewFile(file)}
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              className="p-2 rounded-lg text-gray-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                              title="Analyze file"
                              onClick={() => handleAnalyzeFile(file)}
                            >
                              <Zap size={18} />
                            </button>
                            <button
                              className="p-2 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Download file"
                              onClick={() => alert(`Simulating download for: ${file.name}`)}
                            >
                              <Download size={18} />
                            </button>
                            <button
                              className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                              onClick={() => handleDeleteFile(file.id)}
                              title="Delete file"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="py-10 text-center text-gray-500 bg-white">
                        <Search size={36} className="mx-auto text-gray-300 mb-3" />
                        <p className="font-medium">No files match your search</p>
                        <p className="text-sm mt-1">Try adjusting your search term</p>
                      </li>
                    )}
                  </ul>
                </div>

                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                  <Filter size={12} />
                  Showing {uploadedFiles.filter(file =>
                    file.name.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length} of {uploadedFiles.length} files
                </p>

                {allFilesAnalyzed && (
                <div className="mt-4 text-center">
                  <Link
                    to={`/project/${projectId}/inventory`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                  >
                    Move to Inventory
                  </Link>
                </div>
              )}
              </>
            ) : (
              <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 mb-4">
                  <FileText size={28} className="text-teal-500" />
                </div>
                <p className="text-gray-700 font-medium text-lg">No files uploaded yet</p>
                <p className="text-gray-500 mt-2 max-w-md mx-auto">
                  Click the "Upload Files " button above to add files to your project.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File View Modal */}
      {isModalOpen && fileToView && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out scale-100">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2" title={fileToView.name}>
                {getFileIcon(fileToView.name)}
                <span className="truncate max-w-md">{fileToView.name}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-full"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="overflow-auto flex-grow p-5">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-5 rounded-lg border border-gray-200 font-mono text-gray-800">{fileToView.content}</pre>
            </div>
            
            <div className="flex justify-end items-center gap-3 p-5 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => alert(`Simulating download for: ${fileToView.name}`)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download size={16} />
                <span>Download</span>
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm transition-colors"
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

export default SourceFilesPage;