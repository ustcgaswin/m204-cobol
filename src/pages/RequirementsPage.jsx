import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { FileText, ChevronRight, ChevronDown, X, ChevronLeft, Download, AlertTriangle, Loader2, Maximize2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import remarkGfm from "remark-gfm";
import rehypeSlug from 'rehype-slug';
import GithubSlugger from 'github-slugger';
import mermaid from 'mermaid';
import apiClient from '../config/axiosConfig';
import DOMPurify from 'dompurify';

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  suppressErrorRendering: true
});

const MermaidEditModal = ({ isOpen, onClose, code, onSave }) => {
  const [inputCode, setInputCode] = useState(code);

  useEffect(() => {
    setInputCode(code);
  }, [code, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h2 className="text-lg font-semibold mb-4">Edit Mermaid Code</h2>
        <textarea
          className="w-full h-40 border border-gray-300 rounded p-2 font-mono text-sm mb-4"
          value={inputCode}
          onChange={e => setInputCode(e.target.value)}
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(inputCode)}
            className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700"
          >
            Save & Render
          </button>
        </div>
      </div>
    </div>
  );
};

const MermaidModal = ({ isOpen, onClose, svgContent }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 10));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.diagram-controls')) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 0.1), 10));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-lg shadow-xl w-full h-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <div className="diagram-controls flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
              title="Zoom In"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
              title="Zoom Out"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm"
              title="Reset View"
            >
              Reset
            </button>
            <span className="text-sm text-gray-600 ml-2">
              {Math.round(scale * 100)}%
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden bg-gray-50 relative cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        >
          <div className="w-full h-full flex items-center justify-center p-4">
            <div
              className="transition-transform duration-100 ease-out"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: 'center center'
              }}
            >
              <div
                className="bg-white rounded-lg shadow-lg p-4 select-none"
                style={{
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            </div>
          </div>
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs px-3 py-2 rounded-lg select-none">
            <div>• Mouse wheel: Zoom in/out</div>
            <div>• Click and drag: Move diagram</div>
            <div>• Click Reset to center</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MermaidDiagram = ({ children, onUpdate }) => {
  const [svgContent, setSvgContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [diagramId] = useState(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`);
  const [diagramCode, setDiagramCode] = useState(children.toString());
  const [isFixing, setIsFixing] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const renderDiagram = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await new Promise(resolve => setTimeout(resolve, 100));

        const { svg } = await mermaid.render(diagramId, diagramCode);
        setSvgContent(svg);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err.message || 'Failed to render diagram');
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [diagramCode, diagramId, isMounted]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    const renderAgain = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 50));
        const { svg } = await mermaid.render(diagramId + '-retry', diagramCode);
        setSvgContent(svg);
      } catch (err) {
        console.error('Mermaid retry rendering error:', err);
        setError(err.message || 'Failed to render diagram');
      } finally {
        setIsLoading(false);
      }
    };
    renderAgain();
  };

  const handleAutoFix = async () => {
    if (!error) return;
    setIsFixing(true);
    setError(null);

    let errorLine = null;
    const lineMatch = error.match(/line\s*(\d+)/i);
    if (lineMatch) {
      errorLine = parseInt(lineMatch[1], 10);
    }

    let partialCode = diagramCode;
    let start = 0, end = 0;
    if (errorLine) {
      const codeLines = diagramCode.split('\n');
      start = Math.max(0, errorLine - 6);
      end = Math.min(codeLines.length, errorLine + 4);
      partialCode = codeLines.slice(start, end).join('\n');
    }

    try {
      const response = await apiClient.post('/analysis/fix-mermaid', {
        mermaid_code: partialCode,
        error_message: error,
      });
      const { fixed_mermaid_code } = response.data;

      if (fixed_mermaid_code && errorLine !== null) {
        const codeLines = diagramCode.split('\n');
        const patchLines = fixed_mermaid_code.split('\n');
        const newCodeLines = [
          ...codeLines.slice(0, start),
          ...patchLines,
          ...codeLines.slice(end)
        ];
        const newDiagramCode = newCodeLines.join('\n');
        if (onUpdate) {
          onUpdate(diagramCode, newDiagramCode);
        }
        setDiagramCode(newDiagramCode);
      } else {
        setError("Auto-fix did not return a patch. Please try again.");
      }
    } catch (fixError) {
      console.error("Mermaid auto-fix API error:", fixError);
      setError(fixError.response?.data?.detail || "The auto-fix request failed.");
    } finally {
      setIsFixing(false);
    }
  };

  const handleClick = () => {
    if (svgContent) {
      setModalOpen(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(diagramCode);
  };

  const handleEdit = () => {
    setEditModalOpen(true);
  };

  const handleSaveEdit = (newCode) => {
    setDiagramCode(newCode);
    setEditModalOpen(false);
    setError(null);
  };

  if (isLoading || isFixing) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg mb-4">
        <Loader2 className="animate-spin h-6 w-6 text-gray-500 mr-2" />
        <span className="text-gray-600">{isFixing ? 'Attempting to fix diagram...' : 'Rendering diagram...'}</span>
      </div>
    );
  }

  if (error || !svgContent) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
        <div className="flex items-center justify-between text-red-700">
          <div className="flex items-center">
            <AlertTriangle size={16} className="mr-2" />
            <span className="font-medium">Diagram Error</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRetry}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Retry
            </button>
            <button
              onClick={handleAutoFix}
              disabled={isFixing}
              className="px-3 py-1 text-xs font-medium text-white bg-teal-600 border border-teal-600 rounded-md hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed"
            >
              Auto-Fix
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              title="Copy Mermaid Code"
            >
              Copy
            </button>
            <button
              onClick={handleEdit}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              title="Edit Mermaid Code"
            >
              Edit
            </button>
          </div>
        </div>
        <p className="text-red-600 text-sm mt-2">{error || 'Failed to render diagram'}</p>
        <pre className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border overflow-auto">
          {diagramCode}
        </pre>
        <MermaidEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          code={diagramCode}
          onSave={handleSaveEdit}
        />
      </div>
    );
  }

  return (
    <>
      <div className="relative group mb-6">
        <div
          className="cursor-pointer border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow relative"
          onClick={handleClick}
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-md rounded-full p-1 border">
            <Maximize2 size={16} className="text-gray-600" />
          </div>
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(svgContent) }} />
        </div>
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-800 text-white px-2 py-1 rounded whitespace-nowrap">
          Click to expand
        </div>
      </div>
      <MermaidModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        svgContent={svgContent}
      />
    </>
  );
};

const markdownComponents = (onDiagramUpdate) => ({
  h1: (props) => <h1 className="text-3xl font-bold mb-6 scroll-mt-20" {...props} />,
  h2: (props) => <h2 className="text-2xl font-semibold mb-4 scroll-mt-20" {...props} />,
  h3: (props) => <h3 className="text-xl font-medium mb-3 scroll-mt-20" {...props} />,
  h4: (props) => <h4 className="text-lg font-medium mb-2 scroll-mt-20" {...props} />,
  p: (props) => <p className="mb-4 leading-relaxed" {...props} />,
  li: (props) => <li className="mb-2" {...props} />,
  ul: (props) => <ul className="list-disc ml-6 mb-4" {...props} />,
  ol: (props) => <ol className="list-decimal ml-6 mb-4" {...props} />,
  blockquote: (props) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />,
  code: (props) => {
    const { children, className } = props;
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    if (language === 'mermaid') {
      return <MermaidDiagram onUpdate={onDiagramUpdate}>{children}</MermaidDiagram>;
    }

    return (
      <code
        className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 border border-slate-200 shadow-sm px-2 py-1 rounded font-mono text-sm text-slate-800 relative"
        style={{ fontFamily: 'Fira Mono, Menlo, monospace' }}
        {...props}
      />
    );
  },
  pre: (props) => {
    const { children } = props;

    if (children?.props?.className?.includes('language-mermaid')) {
      return <MermaidDiagram onUpdate={onDiagramUpdate}>{children.props.children}</MermaidDiagram>;
    }

    return (
      <div className="mb-6">
        <pre className="bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 border border-slate-200 shadow-md p-4 rounded-xl overflow-auto text-sm font-mono text-slate-800 transition-all duration-150">
          {children}
        </pre>
      </div>
    );
  },
  table: (props) => (
    <div className="overflow-x-auto mb-6 shadow-sm border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-gray-50" {...props} />,
  th: (props) => <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />,
  tbody: (props) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
  tr: (props) => <tr className="hover:bg-gray-50 transition-colors" {...props} />,
  td: (props) => <td className="px-4 py-3 whitespace-normal text-sm text-gray-700" {...props} />,
});

const SkeletonLoader = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
    <div className="h-8 bg-gray-200 rounded-md mb-6 w-3/4"></div>
    <div className="space-y-4 mb-8">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
    </div>
    <div className="h-6 bg-gray-200 rounded-md mb-4 w-1/2"></div>
    <div className="space-y-3 mb-8">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
      <div className="bg-gray-100 h-10"></div>
      <div className="divide-y divide-gray-200">
        {[1, 2, 3, 4].map((row) => (
          <div key={row} className="h-12 flex items-center px-4 space-x-4">
            <div className="h-4 bg-gray-200 rounded flex-1"></div>
            <div className="h-4 bg-gray-200 rounded flex-1"></div>
            <div className="h-4 bg-gray-200 rounded flex-1"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SidebarSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
        </div>
      ))}
    </div>
  </div>
);

const generateTableOfContentsFromMarkdown = (markdown) => {
  const lines = markdown.split('\n');
  const sections = [];
  const headerRegex = /^(#{1,6})\s+(.*)/;
  const slugger = new GithubSlugger();

  lines.forEach(line => {
    const match = line.match(headerRegex);
    if (match) {
      const level = match[1].length;
      const title = match[2].trim();
      if (title) {
        const id = slugger.slug(title);
        sections.push({ id, title, level });
      }
    }
  });
  slugger.reset();
  return sections;
};

const RequirementsPage = () => {
  const { projectId } = useParams();
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(true);
  const [tableOfContentsSections, setTableOfContentsSections] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [requirementDocumentId, setRequirementDocumentId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const handleDiagramUpdate = (oldCode, newCode) => {
    setRequirements(prevRequirements => {
      const updatedRequirements = prevRequirements.replace(oldCode, newCode);
      setTableOfContentsSections(generateTableOfContentsFromMarkdown(updatedRequirements));
      return updatedRequirements;
    });
  };

  useEffect(() => {
    const fetchRequirements = async () => {
      if (!projectId) {
        setError("Project ID is missing.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get(`/requirements/projects/${projectId}/latest-document`);
        const responseData = response.data;

        if (responseData && responseData.data && responseData.data.markdown_content) {
          let fetchedMarkdown = responseData.data.markdown_content;
          let contentToRender = fetchedMarkdown;

          const markdownWrapperRegex = /^#\s[^\n]+\n(?:\s*\n)*```markdown\n([\s\S]*?)\n```\s*$/;
          const match = fetchedMarkdown.match(markdownWrapperRegex);

          if (match && match[1]) {
            contentToRender = match[1].trim();
          }

          setRequirements(contentToRender);
          const tocSections = generateTableOfContentsFromMarkdown(contentToRender);
          setTableOfContentsSections(tocSections);
          setIsGenerating(false);
          setLoading(false);
          setRequirementDocumentId(responseData.data.requirement_document_id);
        } else {
          const shouldGenerate = !responseData?.data;

          if (shouldGenerate) {
            setIsGenerating(true);
            setLoading(false);
            try {
              await apiClient.post(`/requirements/projects/${projectId}/generate-document`, {});
              setTimeout(() => {
                fetchRequirements();
              }, 3000);
              return;
            } catch (genError) {
              console.error("Failed to generate requirements:", genError);
              setIsGenerating(false);
              const message = genError.response?.data?.detail || "Failed to generate requirements document.";
              setRequirements(`# Requirements Document Generation Failed\n\n${message}\n\nPlease try again or contact support.`);
              setTableOfContentsSections([]);
              setLoading(false);
            }
          } else {
            const message = responseData?.message || "No requirements document has been generated for this project yet.";
            setRequirements(`# Requirements Document Not Available\n\n${message}\n\nYou may need to generate it first.`);
            setTableOfContentsSections([]);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch requirements:", err);
        setIsGenerating(false);
        const errorMessage = err.response?.data?.detail || err.message || "Failed to load requirements document. It may not exist or an error occurred.";
        setError(errorMessage);
        setRequirements("");
        setTableOfContentsSections([]);
        setLoading(false);
      }
    };

    fetchRequirements();
  }, [projectId]);

  useEffect(() => {
    if (tableOfContentsSections.length > 0) {
      const initialExpandedState = {};
      tableOfContentsSections.forEach(section => {
        if (section.level === 1 || section.level === 2) {
          initialExpandedState[section.id] = true;
        }
      });
      setExpandedSections(initialExpandedState);
    } else {
      setExpandedSections({});
    }
  }, [tableOfContentsSections]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDownloadRequirements = () => {
    if (!requirements) return;

    let extractedProjectName = '';
    const lines = requirements.split('\n');
    for (const line of lines) {
      if (line.startsWith('# ')) {
        let title = line.substring(2).trim();
        const colonIndex = title.indexOf(':');
        if (colonIndex !== -1) {
          title = title.substring(colonIndex + 1).trim();
        }
        extractedProjectName = title.replace(/[*_~`]/g, '');
        break;
      }
    }
    const simpleSlugify = (text) => text ? text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-') : '';
    const baseFileName = simpleSlugify(extractedProjectName) || simpleSlugify(projectId) || 'project';
    const filename = `${baseFileName}_requirements.md`;

    const blob = new Blob([requirements], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSyncWithBackend = async () => {
    if (!projectId || !requirementDocumentId || !requirements) return;
    setIsSyncing(true);
    setSyncError(null);

    let documentTitle = "Project Requirements Document";
    const lines = requirements.split('\n');
    for (const line of lines) {
      if (line.startsWith('# ')) {
        documentTitle = line.substring(2).trim();
        break;
      }
    }

    try {
      await apiClient.put(
        `/requirements/projects/${projectId}/documents/${requirementDocumentId}`,
        {
          project_id: Number(projectId),
          document_title: documentTitle,
          markdown_content: requirements,
        }
      );
      setIsSyncing(false);
    } catch (err) {
      setSyncError(err.response?.data?.detail || "Sync failed.");
      setIsSyncing(false);
    }
  };

  const RenderTocNode = ({ section }) => {
    const isExpanded = expandedSections[section.id];
    const children = [];
    const sectionIndex = tableOfContentsSections.findIndex(s => s.id === section.id);

    if (sectionIndex !== -1) {
      for (let i = sectionIndex + 1; i < tableOfContentsSections.length; i++) {
        const potentialChild = tableOfContentsSections[i];
        if (potentialChild.level === section.level + 1) {
          children.push(potentialChild);
        } else if (potentialChild.level <= section.level) {
          break;
        }
      }
    }
    const hasChildren = children.length > 0;
    const paddingLeft = section.level > 1 ? `${(section.level - 1) * 1}rem` : '0rem';

    return (
      <div className="mb-1">
        <div
          className={`flex items-center py-1.5 px-2 rounded-md cursor-pointer hover:bg-gray-200 text-gray-700 hover:text-gray-900`}
          style={{ paddingLeft }}
          onClick={() => hasChildren ? toggleSection(section.id) : scrollToSection(section.id)}
        >
          {hasChildren ? (
            <span className="mr-1.5 shrink-0">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          ) : (
            <span className="w-[calc(16px+0.375rem)] mr-0 shrink-0"></span>
          )}
          <span className={`text-sm truncate ${section.level === 1 ? 'font-medium' : ''}`}>{section.title}</span>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {children.map(child => (
              <RenderTocNode key={child.id} section={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTableOfContents = () => {
    if (tableOfContentsSections.length === 0) {
      return <p className="text-sm text-gray-500">No content to display.</p>;
    }
    const minLevel = Math.min(...tableOfContentsSections.map(s => s.level));
    const rootSections = tableOfContentsSections.filter(s => s.level === minLevel);

    return rootSections.map((section) => (
      <RenderTocNode key={section.id} section={section} />
    ));
  };

  const renderDesktopSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 mb-4 shrink-0">
        <h2 className="text-lg font-semibold text-gray-700">Table of Contents</h2>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4 custom-scrollbar">
        {(loading || isGenerating) ? <SidebarSkeleton /> : renderTableOfContents()}
      </div>
    </div>
  );

  const customScrollbarStyle = `
    .custom-scrollbar {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .custom-scrollbar::-webkit-scrollbar {
      display: none;
      width: 0;
      background: transparent;
    }
  `;

  if (loading || isGenerating) {
    return (
      <div className="h-screen bg-gray-100 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30 shrink-0">
          <div className="px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800 flex items-center">
                <FileText size={20} className="mr-2 text-teal-600 flex-shrink-0" />
                Project Requirements
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              {isGenerating && (
                <div className="flex items-center text-sm text-gray-600">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Generating requirements...
                </div>
              )}
              {loading && !isGenerating && (
                <div className="flex items-center text-sm text-gray-600">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Loading document...
                </div>
              )}
              <button
                disabled
                className="p-1.5 rounded-md flex items-center justify-center text-gray-400 cursor-not-allowed"
                title="Download Requirements (disabled during loading)"
              >
                <Download size={20} />
              </button>
              <button
                className="ml-2 p-1.5 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                onClick={() => setShowDesktopSidebar(!showDesktopSidebar)}
                title={showDesktopSidebar ? "Hide Table of Contents" : "Show Table of Contents"}
              >
                {showDesktopSidebar ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
            </div>
          </div>
        </header>
        <style>{customScrollbarStyle}</style>
        <div className="flex flex-1 overflow-hidden">
          <aside className={`flex flex-col bg-gray-50 transition-all duration-300 ease-in-out shrink-0 ${showDesktopSidebar ? 'w-72' : 'w-0 overflow-hidden'}`}>
            {showDesktopSidebar && (
              <div className="flex flex-col h-full">
                <div className="px-4 pt-4 mb-4 shrink-0">
                  <h2 className="text-lg font-semibold text-gray-700">Table of Contents</h2>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4 custom-scrollbar">
                  <SidebarSkeleton />
                </div>
              </div>
            )}
          </aside>
          {showDesktopSidebar && (
            <div
              className="shrink-0"
              style={{
                width: '1px',
                background: '#e5e7eb',
                height: '100%',
              }}
            />
          )}
          <main className="flex-1 bg-white custom-scrollbar" style={{ overflowY: 'auto', height: '100%' }}>
            <SkeletonLoader />
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-lg w-full">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Requirements</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to={`/project/${projectId}`}
            className="inline-flex items-center justify-center px-5 py-2 text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 transition-all duration-200 shadow-sm"
          >
            Back to Project Overview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30 shrink-0">
        <div className="px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-800 flex items-center">
              <FileText size={20} className="mr-2 text-teal-600 flex-shrink-0" />
              Project Requirements
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSyncWithBackend}
              disabled={isSyncing || !requirementDocumentId}
              className={`p-1.5 rounded-md flex items-center justify-center ${isSyncing || !requirementDocumentId ? 'text-gray-400 cursor-not-allowed' : 'text-teal-600 hover:bg-gray-100 hover:text-teal-800'}`}
              title="Sync with Backend"
            >
              <RefreshCw size={20} className={isSyncing ? "animate-spin" : ""} />
            </button>
            {syncError && (
              <span className="text-xs text-red-600 ml-2">{syncError}</span>
            )}
            <Link
              to={`/project/${projectId}/artifacts`}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 text-white rounded-md shadow hover:opacity-90 text-sm"
              title="Proceed With Migration"
            >
              Proceed With Migration
              <ChevronRight size={20} className="ml-2" />
            </Link>
            <button
              onClick={handleDownloadRequirements}
              className="p-1.5 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              title="Download Requirements"
            >
              <Download size={20} />
            </button>
            <button
              className="ml-2 p-1.5 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              onClick={() => setShowDesktopSidebar(!showDesktopSidebar)}
              title={showDesktopSidebar ? "Hide Table of Contents" : "Show Table of Contents"}
            >
              {showDesktopSidebar ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
        </div>
      </header>
      <style>{customScrollbarStyle}</style>
      <div className="flex flex-1 overflow-hidden">
        <aside className={`flex flex-col bg-gray-50 transition-all duration-300 ease-in-out shrink-0 ${showDesktopSidebar ? 'w-72' : 'w-0 overflow-hidden'}`}>
          {showDesktopSidebar && renderDesktopSidebarContent()}
        </aside>
        {showDesktopSidebar && (
          <div
            className="shrink-0"
            style={{
              width: '1px',
              background: '#e5e7eb',
              height: '100%',
            }}
          />
        )}
        <main className="flex-1 bg-white custom-scrollbar" style={{ overflowY: 'auto', height: '100%' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <article className="prose prose-sm sm:prose lg:prose-lg max-w-none prose-headings:font-semibold prose-a:text-teal-600 hover:prose-a:text-teal-700">
              <ReactMarkdown
                components={markdownComponents(handleDiagramUpdate)}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSlug]}
              >
                {requirements}
              </ReactMarkdown>
            </article>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RequirementsPage;