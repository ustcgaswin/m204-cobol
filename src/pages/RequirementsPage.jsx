import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { FileText, ChevronRight, ChevronDown, Menu, X, ChevronLeft, Download, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import remarkGfm from "remark-gfm";
import rehypeSlug from 'rehype-slug'; // Import rehype-slug
import GithubSlugger from 'github-slugger'; // Import github-slugger
import apiClient from '../config/axiosConfig';


const markdownComponents = {
    h1: (props) => <h1 className="text-3xl font-bold mb-6 scroll-mt-20" {...props} />,
    h2: (props) => <h2 className="text-2xl font-semibold mb-4 scroll-mt-20" {...props} />,
    h3: (props) => <h3 className="text-xl font-medium mb-3 scroll-mt-20" {...props} />,
    h4: (props) => <h4 className="text-lg font-medium mb-2 scroll-mt-20" {...props} />,
    p: (props) => <p className="mb-4 leading-relaxed" {...props} />,
    li: (props) => <li className="mb-2" {...props} />,
    ul: (props) => <ul className="list-disc ml-6 mb-4" {...props} />,
    ol: (props) => <ol className="list-decimal ml-6 mb-4" {...props} />,
    blockquote: (props) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />,
    code: (props) => <code className="bg-gray-100 p-1 rounded text-sm" {...props} />,
    pre: (props) => <pre className="bg-gray-100 p-4 rounded mb-4 overflow-auto text-sm" {...props} />,
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
};

// Updated helper function to generate table of contents sections from markdown
const generateTableOfContentsFromMarkdown = (markdown) => {
  const lines = markdown.split('\n');
  const sections = [];
  const headerRegex = /^(#{1,6})\s+(.*)/; // Matches H1 to H6
  const slugger = new GithubSlugger(); // Use GithubSlugger instance

  lines.forEach(line => {
    const match = line.match(headerRegex);
    if (match) {
      const level = match[1].length; // Number of '#'
      const title = match[2].trim(); // Raw title text from markdown
      if (title) { // Ensure title is not empty
        const id = slugger.slug(title); // Generate ID using GithubSlugger
        sections.push({ id, title, level }); // Store original title for display
      }
    }
  });
  slugger.reset(); // Reset slugger if it were to be reused, though new instance per call is fine.
  return sections;
};

const RequirementsPage = () => {
  const { projectId } = useParams();
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [tableOfContentsSections, setTableOfContentsSections] = useState([]);

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

          // Regex to find an H1 followed by a ```markdown code block that contains the actual content
          // It looks for:
          // 1. An H1 line: /^#\s[^\n]+\n/
          // 2. Optional blank line(s): (\s*\n)*
          // 3. The start of the markdown code block: ```markdown\n
          // 4. Captures the content inside: ([\s\S]*?)
          // 5. The end of the code block: \n```
          // 6. Optional trailing whitespace: \s*$/
          const markdownWrapperRegex = /^#\s[^\n]+\n(?:\s*\n)*```markdown\n([\s\S]*?)\n```\s*$/;
          const match = fetchedMarkdown.match(markdownWrapperRegex);

          if (match && match[1]) {
            // If the pattern is matched, use the content inside the code block
            contentToRender = match[1].trim(); 
          }
          
          setRequirements(contentToRender);
          const tocSections = generateTableOfContentsFromMarkdown(contentToRender);
          setTableOfContentsSections(tocSections);
        } else {
          const message = responseData?.message || "No requirements document has been generated for this project yet.";
          setRequirements(`# Requirements Document Not Available\n\n${message}\n\nYou may need to generate it first.`);
          setTableOfContentsSections([]);
        }
      } catch (err) {
        console.error("Failed to fetch requirements:", err);
        const errorMessage = err.response?.data?.detail || err.message || "Failed to load requirements document. It may not exist or an error occurred.";
        setError(errorMessage);
        setRequirements(""); // Clear any existing requirements on error
        setTableOfContentsSections([]); // Clear TOC on error
      } finally {
        setLoading(false);
      }
    };

    fetchRequirements();
  }, [projectId]);

  useEffect(() => {
    if (tableOfContentsSections.length > 0) {
      const initialExpandedState = {};
      tableOfContentsSections.forEach(section => {
        // Auto-expand H1 and H2 sections by default, or adjust as needed
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
    setMobileSidebarOpen(false);
  };

  const handleDownloadRequirements = () => {
    if (!requirements) return; // 'requirements' state now holds the content to be rendered/downloaded

    let extractedProjectName = '';
    const lines = requirements.split('\n'); 
    for (const line of lines) {
      if (line.startsWith('# ')) { // This will now look at the first H1 of the *actual* content
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
            // Provide a consistent space even if there are no children, for alignment
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
    // Determine the starting level for the TOC (e.g. if content starts with H2, make those top-level in TOC)
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
      <>
        <div className="flex items-center justify-between mb-4 pt-1 shrink-0">
          <h2 className="text-lg font-semibold text-gray-700">Table of Contents</h2>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {renderTableOfContents()}
        </div>
      </>
  );

  const renderMobileSidebarContent = () => (
      <>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-semibold text-gray-700">Table of Contents</h2>
          <button
            className="rounded-md text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {renderTableOfContents()}
        </div>
      </>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          <p className="text-gray-600">Loading requirements document...</p>
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30 shrink-0">
        <div className="px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center">
            <button
              className="lg:hidden mr-3 text-gray-600 hover:text-gray-800"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800 flex items-center">
                <FileText size={20} className="mr-2 text-teal-600 flex-shrink-0" />
                Project Requirements
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
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
              className="ml-2 p-1.5 rounded-md hidden lg:flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              onClick={() => setShowDesktopSidebar(!showDesktopSidebar)}
              title={showDesktopSidebar ? "Hide Table of Contents" : "Show Table of Contents"}
            >
              {showDesktopSidebar ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`hidden lg:flex flex-col bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out shrink-0 ${showDesktopSidebar ? 'w-72 p-4' : 'w-0 p-0 overflow-hidden'}`}>
          {showDesktopSidebar && renderDesktopSidebarContent()}
        </aside>

        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileSidebarOpen(false)}></div>
            <div className="fixed inset-y-0 left-0 flex flex-col w-72 max-w-xs bg-white shadow-xl z-50">
              {renderMobileSidebarContent()}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-white min-h-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="h-[calc(100vh-var(--header-height,64px)-var(--footer-height,0px)-4rem)] overflow-y-auto">
              <article className="prose prose-sm sm:prose lg:prose-lg max-w-none prose-headings:font-semibold prose-a:text-teal-600 hover:prose-a:text-teal-700">
                <ReactMarkdown
                  components={markdownComponents}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSlug]} // Add rehypeSlug here
                >
                  {requirements}
                </ReactMarkdown>
              </article>
            </div>
          </div>
        </main> 
      </div>
    </div>
  );
};

export default RequirementsPage;