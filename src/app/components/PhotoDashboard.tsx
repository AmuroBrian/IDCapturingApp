"use client";

import { useState, useEffect } from "react";
import { supabase, PHOTOS_TABLE } from "../config/supabaseConfig";
import { jsPDF } from "jspdf";

interface Photo {
  id: string;
  url: string;
  filename: string;
  file_path: string;
  created_at: string;
  size: number;
}

interface DocumentData {
  front: string;
  back: string;
  signature: string;
  timestamp: string;
  id: string;
}

export default function PhotoDashboard() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch initial photos
    const fetchPhotos = async () => {
      const { data, error } = await supabase
        .from(PHOTOS_TABLE)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching photos:", error);
        setLoading(false);
        return;
      }

      setPhotos(data || []);
      setLoading(false);
    };

    fetchPhotos();

    // Set up real-time subscription for new photos
    const subscription = supabase
      .channel("photos_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: PHOTOS_TABLE,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPhotos((prev) => [payload.new as Photo, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setPhotos((prev) =>
              prev.filter((photo) => photo.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const togglePhotoSelection = (photoId: string) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      newSelection.add(photoId);
    }
    setSelectedPhotos(newSelection);
  };

  const selectAllPhotos = () => {
    setSelectedPhotos(new Set(photos.map((photo) => photo.id)));
  };

  const clearSelection = () => {
    setSelectedPhotos(new Set());
  };

  const deletePhoto = async (photoId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this photo? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from(PHOTOS_TABLE)
        .delete()
        .eq("id", photoId);

      if (error) {
        console.error("Error deleting photo:", error);
        alert("Error deleting photo. Please try again.");
        return;
      }

      // Remove from local state
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
      // Remove from selection if it was selected
      setSelectedPhotos((prev) => {
        const newSelection = new Set(prev);
        newSelection.delete(photoId);
        return newSelection;
      });
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Error deleting photo. Please try again.");
    }
  };

  const deleteSelectedPhotos = async () => {
    if (selectedPhotos.size === 0) {
      alert("Please select at least one photo to delete");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedPhotos.size} selected photo(s)? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const photoIds = Array.from(selectedPhotos);
      const { error } = await supabase
        .from(PHOTOS_TABLE)
        .delete()
        .in("id", photoIds);

      if (error) {
        console.error("Error deleting photos:", error);
        alert("Error deleting photos. Please try again.");
        return;
      }

      // Remove from local state
      setPhotos((prev) =>
        prev.filter((photo) => !selectedPhotos.has(photo.id))
      );
      // Clear selection
      setSelectedPhotos(new Set());
    } catch (error) {
      console.error("Error deleting photos:", error);
      alert("Error deleting photos. Please try again.");
    }
  };

  const generatePDF = async (photoIds: string[]) => {
    const selectedPhotoData = photos.filter((photo) =>
      photoIds.includes(photo.id)
    );

    if (selectedPhotoData.length === 0) {
      alert("Please select at least one photo to generate PDF");
      return;
    }

    const pdf = new jsPDF();
    let pageAdded = false;

    for (let i = 0; i < selectedPhotoData.length; i++) {
      const photo = selectedPhotoData[i];

      if (pageAdded) {
        pdf.addPage();
      }

      try {
        // Create a temporary image element to get dimensions
        const img = new Image();
        img.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = photo.url;
        });

        // Calculate dimensions to fit on page
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - margin * 2;
        const maxHeight = pageHeight - margin * 3; // Extra margin for text

        let imgWidth = img.width;
        let imgHeight = img.height;

        // Scale image to fit page
        if (imgWidth > maxWidth) {
          imgHeight = (imgHeight * maxWidth) / imgWidth;
          imgWidth = maxWidth;
        }
        if (imgHeight > maxHeight) {
          imgWidth = (imgWidth * maxHeight) / imgHeight;
          imgHeight = maxHeight;
        }

        // Center the image
        const x = (pageWidth - imgWidth) / 2;
        const y = margin;

        // Add image to PDF
        pdf.addImage(img, "JPEG", x, y, imgWidth, imgHeight);

        // Add filename and timestamp below image
        const textY = y + imgHeight + 10;
        pdf.setFontSize(10);
        pdf.text(`File: ${photo.filename}`, margin, textY);

        if (photo.created_at) {
          const date = new Date(photo.created_at);
          pdf.text(`Date: ${date.toLocaleString()}`, margin, textY + 5);
        }

        pageAdded = true;
      } catch (error) {
        console.error(`Error adding photo ${photo.filename} to PDF:`, error);
      }
    }

    // Save the PDF
    const filename = `photos_${new Date()
      .toISOString()
      .slice(0, 10)}_${Date.now()}.pdf`;
    pdf.save(filename);
  };

  const printSelectedPhotos = async (photoIds: string[]) => {
    const selectedPhotoData = photos.filter((photo) =>
      photoIds.includes(photo.id)
    );

    if (selectedPhotoData.length === 0) {
      alert("Please select at least one photo to print");
      return;
    }

    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to enable printing");
      return;
    }

    // Create the print content
    let printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title></title>
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none; }
            .photo-row { page-break-inside: avoid; }
            .photo-image { max-height: 80vh !important; }
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            line-height: 1.4;
          }
          .photo-row { 
            display: flex; 
            gap: 0; 
            margin-bottom: 0; 
            page-break-inside: avoid;
          }
          .photo-item { 
            flex: 1; 
            padding: 0; 
            border: none; 
            border-radius: 0;
            background: transparent;
            width: 50%;
            height: 100%;
          }
          .photo-container { 
            text-align: center; 
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
          }
          .photo-image { 
            width: 100%; 
            height: auto; 
            border: none;
            border-radius: 0;
            margin: 0;
            max-height: 500px;
            object-fit: contain;
            display: block;
          }
          .print-button { 
            background: #007bff; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 16px;
            margin: 20px 0;
          }
          .print-button:hover { 
            background: #0056b3; 
          }
          .single-photo { 
            max-width: 60%; 
            margin: 0 auto; 
          }
        </style>
      </head>
      <body>

    `;

    // Group photos into rows of 2
    for (let i = 0; i < selectedPhotoData.length; i += 2) {
      const photo1 = selectedPhotoData[i];
      const photo2 = selectedPhotoData[i + 1];

      printContent += `<div class="photo-row">`;

      // First photo in row
      printContent += `
        <div class="photo-item">
          <div class="photo-container">
            <img src="${photo1.url}" alt="" class="photo-image" />
          </div>
        </div>
      `;

      // Second photo in row (if exists)
      if (photo2) {
        printContent += `
          <div class="photo-item">
            <div class="photo-container">
              <img src="${photo2.url}" alt="" class="photo-image" />
            </div>
          </div>
        `;
      } else {
        // If odd number of photos, add empty space for second slot
        printContent += `
          <div class="photo-item" style="opacity: 0;">
            <div class="photo-container">
              <div style="height: 500px; border: none; display: flex; align-items: center; justify-content: center; color: transparent;">
              </div>
            </div>
          </div>
        `;
      }

      printContent += `</div>`;
    }

    printContent += `
        <div class="no-print" style="text-align: center;">
          <button class="print-button" onclick="window.print()">🖨️ Print Photos</button>
        </div>
      </body>
      </html>
    `;

    // Write content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for images to load, then auto-print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    };
  };

  const generateDocumentPDF = async (documentData: DocumentData) => {
    const pdf = new jsPDF();

    try {
      // Add title
      pdf.setFontSize(18);
      pdf.text("Document Verification", 105, 20, { align: "center" });

      // Add timestamp
      pdf.setFontSize(10);
      const timestamp = new Date(documentData.timestamp).toLocaleString();
      pdf.text(`Captured: ${timestamp}`, 105, 30, { align: "center" });

      // Add front side (top left)
      pdf.setFontSize(12);
      pdf.text("Front Side", 20, 50);

      const frontImg = new Image();
      await new Promise((resolve, reject) => {
        frontImg.onload = resolve;
        frontImg.onerror = reject;
        frontImg.src = documentData.front;
      });

      // Calculate front image dimensions (smaller to fit side by side)
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = (pageWidth - margin * 3) / 2; // Half page width minus margins
      const maxHeight = 60;

      let frontWidth = frontImg.width;
      let frontHeight = frontImg.height;

      if (frontWidth > maxWidth) {
        frontHeight = (frontHeight * maxWidth) / frontWidth;
        frontWidth = maxWidth;
      }
      if (frontHeight > maxHeight) {
        frontWidth = (frontWidth * maxHeight) / frontHeight;
        frontHeight = maxHeight;
      }

      // Position front image on left side
      pdf.addImage(frontImg, "JPEG", margin, 60, frontWidth, frontHeight);

      // Add back side (top right)
      pdf.setFontSize(12);
      pdf.text("Back Side", pageWidth - margin - 30, 50);

      const backImg = new Image();
      await new Promise((resolve, reject) => {
        backImg.onload = resolve;
        backImg.onerror = reject;
        backImg.src = documentData.back;
      });

      // Calculate back image dimensions
      let backWidth = backImg.width;
      let backHeight = backImg.height;

      if (backWidth > maxWidth) {
        backHeight = (backHeight * maxWidth) / backWidth;
        backWidth = maxWidth;
      }
      if (backHeight > maxHeight) {
        backWidth = (backWidth * maxHeight) / backHeight;
        backHeight = maxHeight;
      }

      // Position back image on right side
      const backX = pageWidth - margin - backWidth;
      pdf.addImage(backImg, "JPEG", backX, 60, backWidth, backHeight);

      // Add signature area below (centered, full width)
      pdf.setFontSize(12);
      pdf.text("Signature:", 20, 140);

      // Draw signature box
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, 150, pageWidth - margin * 2, 40);

      // Add signature image if available
      if (documentData.signature) {
        const signatureImg = new Image();
        await new Promise((resolve, reject) => {
          signatureImg.onload = resolve;
          signatureImg.onerror = reject;
          signatureImg.src = documentData.signature;
        });

        // Calculate signature dimensions to fit in box
        let sigWidth = signatureImg.width;
        let sigHeight = signatureImg.height;

        if (sigWidth > pageWidth - margin * 2) {
          sigHeight = (sigHeight * (pageWidth - margin * 2)) / sigWidth;
          sigWidth = pageWidth - margin * 2;
        }
        if (sigHeight > 35) {
          sigWidth = (sigWidth * 35) / sigHeight;
          sigHeight = 35;
        }

        // Center signature in the box
        const sigX = (pageWidth - sigWidth) / 2;
        const sigY = 150 + (40 - sigHeight) / 2;
        pdf.addImage(signatureImg, "PNG", sigX, sigY, sigWidth, sigHeight);
      }

      // Add verification details at bottom
      pdf.setFontSize(10);
      pdf.text(
        "This document has been captured and verified electronically.",
        20,
        210
      );
      pdf.text("Document ID: " + documentData.id, 20, 220);

      // Save the PDF
      const filename = `document_verification_${new Date()
        .toISOString()
        .slice(0, 10)}_${Date.now()}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating document PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  const downloadSinglePhoto = (photo: Photo) => {
    const link = document.createElement("a");
    link.href = photo.url;
    link.download = photo.filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printSinglePhoto = (photo: Photo) => {
    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to enable printing");
      return;
    }

    // Create the print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title></title>
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none; }
            .photo-image { max-height: 80vh !important; }
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            line-height: 1.4;
          }
          .photo-container { 
            text-align: center; 
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
          }
          .photo-image { 
            width: 100%; 
            height: auto; 
            border: none;
            border-radius: 0;
            margin: 0;
            max-height: 800px;
            object-fit: contain;
            display: block;
          }
          .print-button { 
            background: #007bff; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 16px;
            margin: 20px 0;
          }
          .print-button:hover { 
            background: #0056b3; 
          }
        </style>
      </head>
      <body>
        <div class="photo-container">
          <img src="${photo.url}" alt="" class="photo-image" />
        </div>
        
        <div class="no-print" style="text-align: center;">
          <button class="print-button" onclick="window.print()">🖨️ Print Photo</button>
        </div>
      </body>
      </html>
    `;

    // Write content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for images to load, then auto-print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading photos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-purple-600 text-white">
        <h2 className="text-xl font-bold">Photo Dashboard</h2>
        <p className="text-purple-100 text-sm">
          Real-time photo gallery with PDF export & 2-per-page printing
        </p>
      </div>

      {photos.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <div className="text-4xl mb-4">📸</div>
          <p>No photos captured yet</p>
          <p className="text-sm">
            Photos will appear here automatically when captured
          </p>
        </div>
      ) : (
        <div className="p-4">
          {/* Control Panel */}
          <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={selectAllPhotos}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Select All ({photos.length})
              </button>
              <button
                onClick={clearSelection}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={() => generatePDF(Array.from(selectedPhotos))}
                disabled={selectedPhotos.size === 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Generate PDF ({selectedPhotos.size})
              </button>
              <button
                onClick={() => printSelectedPhotos(Array.from(selectedPhotos))}
                disabled={selectedPhotos.size === 0}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                🖨️ Print 2/Page ({selectedPhotos.size})
              </button>
              <button
                onClick={deleteSelectedPhotos}
                disabled={selectedPhotos.size === 0}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                🗑️ Delete ({selectedPhotos.size})
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Total: {photos.length} photos
            </div>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={`border-2 rounded-lg overflow-hidden transition-all ${
                  selectedPhotos.has(photo.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="relative">
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-full h-48 object-cover cursor-pointer"
                    onClick={() => togglePhotoSelection(photo.id)}
                  />
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedPhotos.has(photo.id)}
                      onChange={() => togglePhotoSelection(photo.id)}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {photo.filename}
                  </p>
                  {photo.created_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(photo.created_at).toLocaleString()}
                    </p>
                  )}
                  <div className="mt-2 flex gap-1">
                    <button
                      onClick={() => downloadSinglePhoto(photo)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => generatePDF([photo.id])}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => printSinglePhoto(photo)}
                      className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded transition-colors"
                    >
                      🖨️ Print
                    </button>
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
