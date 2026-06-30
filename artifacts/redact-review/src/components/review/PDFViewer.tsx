import React, { useState, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { getSeverity, parseConsensus, isSecondOpinion } from "@/lib/review-utils";

// Configure PDF.js worker using standard unpkg CDN to avoid Vite build issues
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  documentId: string;
  redactions: any[];
  selectedId: string | null;
  onRedactionClick: (id: string) => void;
  docViewMode: "original" | "reviewed" | "export";
  onSelection?: (selection: { text: string; x: number; y: number; boundingBoxes: string }) => void;
}

export function PDFViewer({
  documentId,
  redactions,
  selectedId,
  onRedactionClick,
  docViewMode,
  onSelection
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [computedBoxes, setComputedBoxes] = useState<Record<string, any[]>>({});
  const viewerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseUp = () => {
    if (docViewMode !== "original" || !onSelection) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !viewerRef.current) return;

    const range = sel.getRangeAt(0);
    const text = sel.toString();
    if (!text.trim()) return;

    const rects = range.getClientRects();
    if (rects.length === 0) return;

    // Get the viewer's bounding rect to calculate relative positions
    const viewerRect = viewerRef.current.getBoundingClientRect();
    
    // We need to figure out which page this selection is on
    // A simple heuristic: find the closest .react-pdf__Page element
    let node: Node | null = range.commonAncestorContainer;
    let pageNode: HTMLElement | null = null;
    while (node && node !== viewerRef.current) {
      if (node instanceof HTMLElement && node.classList.contains('react-pdf__Page')) {
        pageNode = node;
        break;
      }
      node = node.parentNode;
    }

    if (!pageNode) return; // Selection outside a page
    const pageNum = parseInt(pageNode.getAttribute('data-page-number') || '1', 10);
    const pageRect = pageNode.getBoundingClientRect();

    const boundingBoxes = [];
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      // Convert to page-relative coordinates
      boundingBoxes.push({
        page: pageNum,
        x: r.left - pageRect.left,
        y: r.top - pageRect.top,
        width: r.width,
        height: r.height
      });
    }

    const firstRect = rects[0];
    onSelection({
      text,
      x: firstRect.left + firstRect.width / 2,
      y: firstRect.top - 10,
      boundingBoxes: JSON.stringify(boundingBoxes)
    });
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Effect to map redaction text to PDF bounding boxes
  React.useEffect(() => {
    if (!documentId) return;
    let isMounted = true;
    
    async function mapTextToBoxes() {
      try {
        const loadingTask = pdfjs.getDocument(`/api/documents/${documentId}/file`);
        const pdf = await loadingTask.promise;
        
        const newComputed: Record<string, any[]> = {};
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const viewport = page.getViewport({ scale: 1 });
          
          const items = textContent.items as any[];
          
          // Combine text to find matches
          let fullText = "";
          const itemMapping: { startIndex: number; endIndex: number; item: any }[] = [];
          
          for (const item of items) {
            if (item.str) {
              const start = fullText.length;
              fullText += item.str;
              // Some PDFs add spaces between items, but let's assume direct concatenation first
              itemMapping.push({
                startIndex: start,
                endIndex: fullText.length,
                item
              });
            }
          }
          
          // For each redaction that lacks boundingBoxes, find it in the text
          for (const r of redactions) {
            if (!r.text) continue;
            // Only try if it's not already having boundingBoxes or computed
            if (!r.boundingBoxes) {
              // Basic substring search
              const idx = fullText.toLowerCase().indexOf(r.text.toLowerCase());
              if (idx !== -1) {
                // Find items that overlap with this range
                const startIdx = idx;
                const endIdx = idx + r.text.length;
                
                const matchedItems = itemMapping.filter(
                  m => m.endIndex > startIdx && m.startIndex < endIdx
                );
                
                const boxes = matchedItems.map(m => {
                  const tx = pdfjs.Util.transform(viewport.transform, m.item.transform);
                  // Calculate bounding box using standard pdfjs mapping
                  // The height is usually the 4th element of the transform array or the height property
                  const height = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
                  const width = m.item.width * (viewport.scale || 1);
                  return {
                    page: i,
                    x: tx[4],
                    y: tx[5] - height, // adjust y because pdfjs uses bottom-left
                    width: width,
                    height: height
                  };
                });
                
                if (boxes.length > 0) {
                  if (!newComputed[r.id]) newComputed[r.id] = [];
                  newComputed[r.id].push(...boxes);
                }
              }
            }
          }
        }
        
        if (isMounted) {
          setComputedBoxes(newComputed);
          
          // Send computed boxes to backend so export-redacted can use them
          const updates: Record<string, string> = {};
          let hasUpdates = false;
          for (const [id, boxes] of Object.entries(newComputed)) {
            // Only update if the redaction doesn't already have boundingBoxes
            const r = redactions.find(r => r.id === id);
            if (r && !r.boundingBoxes) {
              updates[id] = JSON.stringify(boxes);
              hasUpdates = true;
            }
          }
          if (hasUpdates) {
            fetch(`/api/documents/${documentId}/redactions/boxes`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ boxes: updates })
            }).catch(e => console.error("Failed to save boxes:", e));
          }
        }
      } catch (err) {
        console.error("Failed to map text to boxes:", err);
      }
    }
    
    mapTextToBoxes();
    
    return () => { isMounted = false; };
  }, [documentId, redactions]);

  // Filter redactions based on view mode
  const activeRedactions = useMemo(() => {
    if (docViewMode === "original") return [];
    return redactions.filter(r =>
      docViewMode === "export"
        ? (r.status === "confirmed" || r.status === "user_added")
        : r.status === "confirmed" || r.status === "user_added" || r.status === "rejected" || r.status === "pending"
    );
  }, [redactions, docViewMode]);

  const renderRedactionOverlays = (pageNumber: number) => {
    return activeRedactions.map(r => {
      let boxes = [];
      if (r.boundingBoxes) {
        try {
          boxes = JSON.parse(r.boundingBoxes);
        } catch (e) {}
      }
      
      if (boxes.length === 0 && computedBoxes[r.id]) {
        boxes = computedBoxes[r.id];
      }
      
      if (boxes.length === 0) return null;

      const pageBoxes = boxes.filter((b: any) => b.page === pageNumber);
      if (pageBoxes.length === 0) return null;

      const isSelected = selectedId === r.id;
      const consensus = parseConsensus(r.note);
      const isSecond = isSecondOpinion(consensus);
      const sev = getSeverity(r.category);

      let cls = "absolute z-10 mix-blend-multiply cursor-pointer transition-all";
      if (r.status === "pending") {
        if (isSecond) cls += " bg-orange-400/40 border border-orange-500 hover:bg-orange-400/60";
        else if (sev === "critical") cls += " bg-red-500/40 border border-red-600 hover:bg-red-500/60";
        else if (sev === "high") cls += " bg-orange-500/40 border border-orange-600 hover:bg-orange-500/60";
        else cls += " bg-amber-400/40 border border-amber-500 hover:bg-amber-400/60";
      } else if (r.status === "confirmed" || r.status === "user_added") {
        cls += " bg-black/90";
      } else if (r.status === "rejected") {
        cls += " opacity-20 bg-gray-200 border-2 border-dashed border-gray-400";
      }

      if (isSelected) cls += " ring-2 ring-[#6B1E2B] ring-offset-2 z-20";

      return pageBoxes.map((box: any, idx: number) => (
        <div
          key={`${r.id}-${idx}`}
          className={cls}
          style={{
            left: `${box.x}px`,
            top: `${box.y}px`,
            width: `${box.width}px`,
            height: `${box.height}px`
          }}
          onClick={(e) => {
            e.stopPropagation();
            onRedactionClick(r.id);
          }}
        />
      ));
    });
  };

  return (
    <div 
      className="flex flex-col items-center gap-4 bg-gray-50 p-8 min-h-screen"
      ref={viewerRef}
      onMouseUp={handleMouseUp}
    >
      <Document
        file={`/api/documents/${documentId}/file`}
        onLoadSuccess={onDocumentLoadSuccess}
        className="flex flex-col gap-8"
        loading={<div className="animate-pulse bg-gray-200 w-[800px] h-[1000px] rounded" />}
      >
        {Array.from(new Array(numPages), (el, index) => (
          <div key={`page_${index + 1}`} className="relative shadow-xl bg-white border border-gray-200">
            <Page
              pageNumber={index + 1}
              renderTextLayer={true}
              renderAnnotationLayer={false}
              width={800} // Fixed width or allow to scale? Let's use a fixed width for now to match bounds
              className="relative"
            />
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <div className="pointer-events-auto">
                {renderRedactionOverlays(index + 1)}
              </div>
            </div>
          </div>
        ))}
      </Document>
    </div>
  );
}
