'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase, PHOTOS_BUCKET, PHOTOS_TABLE } from '../config/supabaseConfig';

interface CameraCaptureProps {
  onPhotoTaken?: (photoUrl: string) => void;
}

export default function CameraCapture({ onPhotoTaken }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [captureMode, setCaptureMode] = useState<'front' | 'back' | 'signature'>('front');
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [backPhoto, setBackPhoto] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [documentData, setDocumentData] = useState<{
    front: string | null;
    back: string | null;
    signature: string | null;
    timestamp: string;
    id: string;
  } | null>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera: string }).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
    };
    checkMobile();
  }, []);

  const startCamera = useCallback(async () => {
    try {
      // Check if the browser supports getUserMedia
      if (!navigator?.mediaDevices?.getUserMedia) {
        alert('Camera access is not supported in this browser. Please use a modern browser like Chrome, Safari, or Firefox.');
        return;
      }

      // Check if we're on HTTPS or localhost (required for camera access)
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        alert('Camera access requires HTTPS. Please access the site using https:// or use localhost for testing.');
        return;
      }

      // Show loading message for mobile users
      if (isMobile) {
        console.log('Initializing mobile camera...');
      }

      // More flexible camera constraints for mobile devices
      const constraints = {
        video: {
          facingMode: isMobile ? 'environment' : 'user', // Use back camera on mobile
          width: { ideal: isMobile ? 1280 : 1920, min: 640 },
          height: { ideal: isMobile ? 720 : 1080, min: 480 },
          aspectRatio: { ideal: 16/9, min: 4/3, max: 21/9 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Camera initialized successfully');
        };
      }
    } catch (error: unknown) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Unable to access camera. ';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += 'Please grant camera permissions and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage += 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage += 'Camera access is not supported in this browser.';
        } else if (error.name === 'NotReadableError') {
          errorMessage += 'Camera is already in use by another application.';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage += 'Camera constraints not supported. Trying with basic settings...';
          // Try with basic constraints
          try {
            const basicStream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
              videoRef.current.srcObject = basicStream;
              setIsStreaming(true);
              console.log('Camera initialized with basic constraints');
            }
            return;
          } catch (basicError) {
            errorMessage += 'Basic camera access also failed.';
          }
        } else {
          errorMessage += 'Please check your camera permissions and try again.';
        }
      }
      
      // For mobile devices, provide more specific guidance
      if (isMobile) {
        errorMessage += '\n\nMobile Tips:\n• Make sure you\'re using HTTPS\n• Try refreshing the page\n• Check if camera permissions are granted\n• Try using Chrome or Safari';
      }
      
      alert(errorMessage);
    }
  }, [isMobile]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  // Signature drawing functionality with touch support
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!signatureRef.current) return;
    
    setIsDrawing(true);
    const canvas = signatureRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    
    // Handle both mouse and touch events
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !signatureRef.current) return;
    
    const canvas = signatureRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Handle both mouse and touch events
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearSignature = useCallback(() => {
    if (!signatureRef.current) return;
    const canvas = signatureRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const completeDocument = useCallback(async () => {
    if (!frontPhoto || !backPhoto) {
      alert('Please capture both front and back photos first');
      return;
    }

    // Get signature as data URL
    if (!signatureRef.current) return;
    const signatureDataUrl = signatureRef.current.toDataURL();

    // Create document data
    const documentId = `doc_${Date.now()}`;
    const newDocumentData = {
      front: frontPhoto,
      back: backPhoto,
      signature: signatureDataUrl,
      timestamp: new Date().toISOString(),
      id: documentId
    };

    setDocumentData(newDocumentData);
    onPhotoTaken?.(documentId);

    alert('Document capture completed! You can now generate a printable PDF.');
  }, [frontPhoto, backPhoto, onPhotoTaken]);

  const resetCapture = useCallback(() => {
    setFrontPhoto(null);
    setBackPhoto(null);
    setCaptureMode('front');
    clearSignature();
    setDocumentData(null);
  }, [clearSignature]);

  const autoPrintDocument = useCallback(() => {
    if (!frontPhoto || !backPhoto) {
      alert('Please capture both front and back photos first');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to enable auto-print');
      return;
    }

    // Create the print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Document Verification</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none; }
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #333; 
            padding-bottom: 10px;
          }
          .title { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 5px;
          }
          .timestamp { 
            font-size: 12px; 
            color: #666;
          }
          .photos-container { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px;
            gap: 20px;
          }
          .photo-section { 
            flex: 1; 
            text-align: center;
          }
          .photo-label { 
            font-size: 14px; 
            font-weight: bold; 
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          .photo-image { 
            max-width: 100%; 
            height: auto; 
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          .signature-section { 
            margin-top: 30px; 
            text-align: center;
          }
          .signature-label { 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 15px;
          }
          .signature-box { 
            width: 100%; 
            height: 80px; 
            border: 2px solid #333; 
            border-radius: 4px;
            margin: 0 auto;
            background: #f9f9f9;
          }
          .footer { 
            margin-top: 30px; 
            font-size: 10px; 
            color: #666;
            text-align: center;
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
        <div class="header">
          <div class="title">Document Verification</div>
          <div class="timestamp">Captured: ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="photos-container">
          <div class="photo-section">
            <div class="photo-label">Front Side</div>
            <img src="${frontPhoto}" alt="Front Side" class="photo-image" />
          </div>
          <div class="photo-section">
            <div class="photo-label">Back Side</div>
            <img src="${backPhoto}" alt="Back Side" class="photo-image" />
          </div>
        </div>
        
        <div class="signature-section">
          <div class="signature-label">Signature</div>
          <div class="signature-box"></div>
        </div>
        
        <div class="footer">
          <p>This document has been captured and verified electronically.</p>
          <p>Document ID: doc_${Date.now()}</p>
        </div>
        
        <div class="no-print" style="text-align: center;">
          <button class="print-button" onclick="window.print()">🖨️ Print Document</button>
          <p style="margin-top: 10px; color: #666;">Click the button above to print, or use Ctrl+P (Cmd+P on Mac)</p>
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
  }, [frontPhoto, backPhoto]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      setIsUploading(true);
      try {
        // Generate unique filename
        const filename = `document_${captureMode}_${Date.now()}.jpg`;
        const filePath = `${filename}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(PHOTOS_BUCKET)
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(PHOTOS_BUCKET)
          .getPublicUrl(filePath);

        // Update local state based on capture mode
        if (captureMode === 'front') {
          setFrontPhoto(publicUrl);
          setCaptureMode('back');
        } else if (captureMode === 'back') {
          setBackPhoto(publicUrl);
          setCaptureMode('signature');
        }

        // Save metadata to Supabase database
        const { error: dbError } = await supabase
          .from(PHOTOS_TABLE)
          .insert({
            filename: filename,
            url: publicUrl,
            file_path: filePath,
            size: blob.size,
            created_at: new Date().toISOString()
          });

        if (dbError) {
          throw dbError;
        }

        alert(`${captureMode.charAt(0).toUpperCase() + captureMode.slice(1)} captured successfully!`);
      } catch (error: unknown) {
        console.error('Error uploading photo:', error);
        alert(`Error uploading photo: ${error instanceof Error ? error.message : 'Please try again.'}`);
      } finally {
        setIsUploading(false);
      }
    }, 'image/jpeg', 0.9);
  }, [captureMode, onPhotoTaken]);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-blue-600 text-white text-center">
        <h2 className="text-xl font-bold">Document Capture</h2>
        <p className="text-blue-100 text-sm">Front → Back → Signature</p>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Mobile Instructions Banner */}
        {isMobile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <div className="text-blue-600 text-lg">📱</div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Mobile Camera Tips:</p>
                <ul className="text-xs space-y-1">
                  <li>• Make sure you&apos;re using HTTPS</li>
                  <li>• Grant camera permissions when prompted</li>
                  <li>• Use the back camera for document capture</li>
                  <li>• Hold device steady for best results</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${captureMode === 'front' ? 'bg-blue-600' : frontPhoto ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <div className={`w-3 h-3 rounded-full ${captureMode === 'back' ? 'bg-blue-600' : backPhoto ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <div className={`w-3 h-3 rounded-full ${captureMode === 'signature' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        </div>

        {/* Current Mode Display */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">
            Current: {captureMode.charAt(0).toUpperCase() + captureMode.slice(1)} Side
          </p>
        </div>

        {/* Video Preview - Only show for front/back capture */}
        {captureMode !== 'signature' && (
          <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ display: isStreaming ? 'block' : 'none' }}
            />
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="text-4xl mb-2">📷</div>
                  <p>Camera not active</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Signature Canvas - Show for signature mode */}
        {captureMode === 'signature' && (
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Draw your signature below:</p>
            </div>
            <canvas
              ref={signatureRef}
              width={400}
              height={150}
              className="w-full h-32 border-2 border-gray-300 rounded-lg cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{ touchAction: 'none' }} // Prevent scrolling on mobile
            />
            <div className="flex gap-2">
              <button
                onClick={clearSignature}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm transition-colors"
              >
                Clear Signature
              </button>
              {frontPhoto && backPhoto && (
                <button
                  onClick={autoPrintDocument}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-3 rounded text-sm transition-colors"
                >
                  🖨️ Quick Print
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isStreaming && captureMode !== 'signature' ? (
            <button
              onClick={startCamera}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Start Camera
            </button>
          ) : captureMode === 'signature' ? (
            <div className="flex gap-2 w-full">
              <button
                onClick={completeDocument}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Complete Document
              </button>
              <button
                onClick={resetCapture}
                className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Reset
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={capturePhoto}
                disabled={isUploading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {isUploading ? 'Uploading...' : `Capture ${captureMode.charAt(0).toUpperCase() + captureMode.slice(1)}`}
              </button>
              <button
                onClick={stopCamera}
                className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Stop
              </button>
            </>
          )}
        </div>

        {/* Captured Photos Preview */}
        {(frontPhoto || backPhoto) && (
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Captured Photos:</p>
            <div className="grid grid-cols-2 gap-3">
              {frontPhoto && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Front</p>
                  <img
                    src={frontPhoto}
                    alt="Front side"
                    className="w-full h-24 object-cover rounded border"
                  />
                </div>
              )}
              {backPhoto && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Back</p>
                  <img
                    src={backPhoto}
                    alt="Back side"
                    className="w-full h-24 object-cover rounded border"
                  />
                </div>
              )}
            </div>
            
            {/* Auto-Print Button - Show when both photos are captured */}
            {frontPhoto && backPhoto && (
              <div className="pt-3">
                <button
                  onClick={autoPrintDocument}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  🖨️ Auto-Print Document
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Prints front & back on one page with signature space
                </p>
              </div>
            )}
          </div>
        )}

        {/* Document Complete Status */}
        {documentData && (
          <div className="border-t pt-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 text-sm font-medium">✅ Document Capture Complete!</p>
              <p className="text-green-700 text-xs">Ready for PDF generation or immediate printing</p>
              
              {/* Print Button for Completed Document */}
              <div className="mt-3">
                <button
                  onClick={autoPrintDocument}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-3 rounded text-sm transition-colors flex items-center justify-center gap-2"
                >
                  🖨️ Print Document Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
