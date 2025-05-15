import  { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { FileText, ChevronRight, ChevronDown, Menu, X, ChevronLeft,Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import remarkGfm from "remark-gfm";


// Mock Markdown content - replace with actual data fetching later
const mockRequirementsMarkdown = `
# Business Requirements Document: M204 System Modernization

## 1. Executive Summary

This document outlines the business requirements for the **M204 System Modernization Project**. The project aims to mitigate risks associated with the legacy M204 platform by transitioning to a modern, scalable COBOL-based system. Key benefits include increased operational efficiency, enhanced business continuity, improved data accessibility, and streamlined maintenance.

## 2. Business Goals & Objectives

* **Goal 1: Ensure Business Continuity & Reduce Risk**
  * **Objective 1.1:** Migrate all core functionalities from M204 to a COBOL-based platform within 18 months.
  * **Objective 1.2:** Phase out reliance on M204-specific expertise by Q4 2026.

* **Goal 2: Improve Operational Efficiency**
  * **Objective 2.1:** Cut average transaction time for customer record updates by 15% post-migration.
  * **Objective 2.2:** Decrease manual order processing by 20% via improved automation.

* **Goal 3: Enhance Data Management & Accessibility**
  * **Objective 3.1:** Deliver standardized access to customer and order data for analytics and reporting.
  * **Objective 3.2:** Maintain data integrity and consistency throughout and after the migration.

* **Goal 4: Enable Future Growth**
  * **Objective 4.1:** Build a platform conducive to integrating with future systems (e.g., CRM).
  * **Objective 4.2:** Simplify and reduce the cost of introducing new features and complying with regulatory changes.

## 3. Scope of Work

### 3.1 In Scope
* Migration of processes associated with \`CUSTOMER.FILE\` and \`ORDERS.FILE\`.
* Reimplementation of M204 procedures, including \`PROCESS_CUSTOMER_RECORD\` and \`VALIDATE_INPUT\`.
* Data migration to VSAM structures.
* User Acceptance Testing (UAT) and end-user training.
* Development of reports mirroring current M204 outputs.

### 3.2 Out of Scope
* Major functional enhancements not currently present in M204 (unless required for parity).
* Integrations with external systems not linked to the M204 environment.
* Full UI/UX redesign – the focus is on backend modernization.

## 4. Key Stakeholders

* **Project Sponsor:** Jane Doe, VP of Operations  
* **Business Owner:** John Smith, Director of Customer Services  
* **IT Lead:** Alice Brown, IT Modernization Program Manager  
* **Key Users:** Representatives from Customer Service, Order Processing, and Finance Teams

## 5. High-Level Business Requirements

### 5.1 Customer Data Management
- **BR-001:** Authorized users must be able to create, view, and modify customer profiles accurately.
- **BR-002:** All input must be validated against defined business rules.
- **BR-003:** The system must log all changes to customer records for auditing.

### 5.2 Order Processing & Management
- **BR-004:** The system must support full lifecycle management of orders.
- **BR-005:** Order status should update in real-time or near real-time.
- **BR-006:** Existing pricing rules and discount structures must be preserved.
- **BR-007:** Order history must remain accessible for a minimum of 7 years.

### 5.3 System Administration & Security
- **BR-008:** Enforce role-based access with secure authentication.
- **BR-009:** Sensitive data must be protected in accordance with internal policies.

## 6. Non-Functional Business Requirements

### 6.1 Performance & Availability
- **NFR-BR-001:** Core operations should complete within 3 seconds for 95% of transactions during peak hours.
- **NFR-BR-002:** Achieve 99.8% uptime during business hours (Mon–Fri, 9 AM–6 PM).

### 6.2 Data Integrity & Accuracy
- **NFR-BR-003:** Migrated data must precisely match the source data.
- **NFR-BR-004:** The system must ensure ongoing data consistency and prevent corruption.

### 6.3 Usability (Internal Users)
- **NFR-BR-005:** Minimal retraining should be required—system behavior should closely follow existing workflows.

### 6.4 Maintainability & Scalability
- **NFR-BR-006:** The platform should support easy maintenance and future enhancements.
- **NFR-BR-007:** The system must handle a 20% increase in volume over 3 years without major rework.

## 7. Assumptions & Constraints

* **Assumption 1:** Existing M204 business logic is documented or can be reverse-engineered accurately.
* **Constraint 1:** The project must remain within the allocated budget.
* **Constraint 2:** Target COBOL and VSAM specifications are fixed as defined by IT.

## 8. Success Criteria

* Full migration of in-scope M204 functionality without loss of core capabilities.
* Successful completion of UAT and approval from key stakeholders.
* Meeting all performance and uptime targets.
* Delivery on time and within budget.

## 9. Additional Section for Scrolling

This section is provided to test scrolling behavior with extended content.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

### 9.1 Subsection
Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.

### 9.2 Another Subsection
Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.

#### 9.2.1 Deeper Subsection
Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.

## 10. More Content

At vero eos et accusamus et iusto odio dignissimos ducimus.

### 10.1 Details
Et harum quidem rerum facilis est et expedita distinctio.

### 10.2 More Details
Temporibus autem quibusdam et aut officiis debitis.

## 11. Final Section

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio.

### 11.1 Conclusion
Curabitur sodales ligula in libero. Sed dignissim lacinia nunc.

### 11.2 Appendix
Class aptent taciti sociosqu ad litora torquent per conubia nostra.

---
*Document Version: 1.2 (Extended for Scrolling)*  
*Last Updated: 2025-05-13*
`;


const markdownComponents = {
    h1: (props) => <h1 className="text-3xl font-bold mb-6" {...props} />,
    h2: (props) => <h2 className="text-2xl font-semibold mb-4" {...props} />,
    h3: (props) => <h3 className="text-xl font-medium mb-3" {...props} />,
    h4: (props) => <h4 className="text-lg font-medium mb-2" {...props} />,
    p: (props) => <p className="mb-4 leading-relaxed" {...props} />,
    li: (props) => <li className="mb-2" {...props} />,
    ul: (props) => <ul className="list-disc ml-6 mb-4" {...props} />,
    ol: (props) => <ol className="list-decimal ml-6 mb-4" {...props} />,
    blockquote: (props) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />,
    code: (props) => <code className="bg-gray-100 p-1 rounded" {...props} />,
    pre: (props) => <pre className="bg-gray-100 p-4 rounded mb-4 overflow-auto" {...props} />,
};

// Helper function to generate URL-friendly slugs from text
const slugify = (text) => {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-'); // Replace multiple - with single -
  };

// Helper function to generate table of contents sections from markdown
const generateTableOfContentsFromMarkdown = (markdown, slugifyFunc) => {
  const lines = markdown.split('\n');
  const sections = [];
  const headerRegex = /^(#{1,6})\s+(.*)/; // Matches H1 to H6

  lines.forEach(line => {
    const match = line.match(headerRegex);
    if (match) {
      const level = match[1].length; // Number of '#'
      const title = match[2].trim();
      const id = slugifyFunc(title);
      if (title) { // Ensure title is not empty
        sections.push({ id, title, level });
      }
    }
  });
  return sections;
};

const RequirementsPage = () => {
  const { projectId } = useParams();
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [tableOfContentsSections, setTableOfContentsSections] = useState([]);

  useEffect(() => {
    console.log(`Fetching requirements for project: ${projectId}`);
    // Simulate fetching data
    setTimeout(() => {
      setRequirements(mockRequirementsMarkdown);
      const tocSections = generateTableOfContentsFromMarkdown(mockRequirementsMarkdown, slugify);
      setTableOfContentsSections(tocSections);
      setLoading(false);
    }, 500);
  }, [projectId]);

  useEffect(() => {
    // Initialize expanded state for ToC sections
    if (tableOfContentsSections.length > 0) {
      const initialExpandedState = {};
      tableOfContentsSections.forEach(section => {
        // Expand top-level sections by default
        if (section.level === 1) {
          initialExpandedState[section.id] = true;
        }
      });
      setExpandedSections(initialExpandedState);
    } else {
      setExpandedSections({}); // Clear if no sections
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
    setMobileSidebarOpen(false); // Close mobile sidebar on navigation
  };


  
  const handleDownloadRequirements = () => {
    if (!requirements) return; // Only need requirements to proceed

    let extractedProjectName = '';
    // Try to extract project name from the first H1 heading in the markdown
    const lines = requirements.split('\n');
    for (const line of lines) {
      if (line.startsWith('# ')) {
        let title = line.substring(2).trim(); // Remove '# ' and trim
        // If the title follows a "Category: Actual Title" pattern, take the part after ':'
        const colonIndex = title.indexOf(':');
        if (colonIndex !== -1) {
          title = title.substring(colonIndex + 1).trim();
        }
        // Remove common markdown characters like bold/italic markers
        extractedProjectName = title.replace(/[*_~`]/g, '');
        break; // Use the first H1 found
      }
    }

    // Slugify the extracted name, fallback to projectId, then to a generic name
    const baseFileName = slugify(extractedProjectName) || slugify(projectId) || 'project';
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

  // Recursive component to render ToC nodes
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
          break; // Reached a sibling or a new higher-level section
        }
      }
    }
    const hasChildren = children.length > 0;
    // Indentation: 1rem per level, starting from level 2 (level 1 has 0 indent)
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
            // Placeholder for alignment if item has no children but we want to keep text aligned
            <span className="w-[calc(16px+0.375rem)] mr-0 shrink-0"></span> // Width of icon + margin-right
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
    const topLevelSections = tableOfContentsSections.filter(s => s.level === 1);
    if (topLevelSections.length === 0 && tableOfContentsSections.length > 0) {
        const minLevel = Math.min(...tableOfContentsSections.map(s => s.level));
        const rootSections = tableOfContentsSections.filter(s => s.level === minLevel);
        return rootSections.map((section) => (
            <RenderTocNode key={section.id} section={section} />
        ));
    }
    return topLevelSections.map((section) => (
      <RenderTocNode key={section.id} section={section} />
    ));
  };

  const renderDesktopSidebarContent = () => {
    return (
      <>
        <div className="flex items-center justify-between mb-4 pt-1 shrink-0">
          <h2 className="text-lg font-semibold text-gray-700">Table of Contents</h2>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0"> {/* Added min-h-0 */}
          {tableOfContentsSections.length > 0 ? renderTableOfContents() : (
            <p className="text-sm text-gray-500">No content to display.</p>
          )}
        </div>
      </>
    );
  };

  const renderMobileSidebarContent = () => {
    return (
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
        <div className="flex-1 overflow-y-auto p-4 min-h-0"> {/* Added min-h-0 */}
          {tableOfContentsSections.length > 0 ? renderTableOfContents() : <p className="text-sm text-gray-500">No content to display.</p>}
        </div>
      </>
    );
  };


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




  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
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

      {/* Main Content Area (Sidebar + Document) */}
      <div className="flex flex-1 overflow-hidden"> {/* This parent constrains height and prevents its own scroll */}
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:flex flex-col bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out shrink-0 ${showDesktopSidebar ? 'w-72 p-4' : 'w-0 p-0 overflow-hidden'}`}>
          {showDesktopSidebar && renderDesktopSidebarContent()}
        </aside>

        {/* Mobile Sidebar (Slide-in) */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileSidebarOpen(false)}></div>
            <div className="fixed inset-y-0 left-0 flex flex-col w-72 max-w-xs bg-white shadow-xl z-50">
              {renderMobileSidebarContent()}
            </div>
          </div>
        )}

        {/* Main Document Content */}
        <main className="flex-1 overflow-y-auto bg-white min-h-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="h-[70vh] overflow-y-auto"> {/* Adjust the height as needed */}
              <article className="prose prose-sm sm:prose lg:prose-lg max-w-none prose-headings:font-semibold prose-a:text-teal-600 hover:prose-a:text-teal-700">
                <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
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