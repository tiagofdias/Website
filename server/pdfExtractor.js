const fetch = require('node-fetch');

let canvas, pdfjsLib;

// Lazy load heavy dependencies
function loadDependencies() {
  if (!canvas) {
    try {
      canvas = require('canvas');
      pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
      console.log('✅ PDF processing libraries loaded');
    } catch (error) {
      console.error('❌ Error loading PDF libraries:', error.message);
      throw new Error('PDF processing libraries not available. Run: npm install canvas pdfjs-dist');
    }
  }
}

/**
 * Extract Google Drive file ID from various URL formats
 */
function extractFileIdFromUrl(url) {
  if (!url) return null;
  
  // Format: https://drive.google.com/file/d/FILE_ID/view
  if (url.includes('/file/d/')) {
    const match = url.match(/\/file\/d\/([^/]+)/);
    return match ? match[1] : null;
  }
  
  // Format: https://drive.google.com/open?id=FILE_ID
  if (url.includes('open?id=')) {
    const match = url.match(/open\?id=([^&]+)/);
    return match ? match[1] : null;
  }
  
  // Format: https://drive.google.com/uc?id=FILE_ID
  if (url.includes('uc?id=')) {
    const match = url.match(/uc\?id=([^&]+)/);
    return match ? match[1] : null;
  }
  
  return null;
}

/**
 * Download PDF from URL (supports Google Drive and direct links)
 */
async function downloadPdf(url) {
  console.log(`  ⬇️  Downloading PDF from: ${url.substring(0, 60)}...`);
  
  let downloadUrl = url;
  const fileId = extractFileIdFromUrl(url);
  
  if (fileId) {
    // Use the direct download URL that bypasses virus scan for small files
    downloadUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`;
    console.log(`  🔑 Using file ID: ${fileId}`);
  }
  
  try {
    const response = await fetch(downloadUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      redirect: 'follow'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const buffer = await response.buffer();
    
    // Check if we actually got a PDF (check magic bytes)
    const magicBytes = buffer.slice(0, 4).toString();
    if (!magicBytes.includes('%PDF')) {
      console.log(`  ⚠️  Response doesn't look like a PDF (first bytes: ${magicBytes})`);
      
      // Try the old method with confirmation
      if (fileId) {
        console.log(`  🔄 Trying alternative download method...`);
        const altUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        const altResponse = await fetch(altUrl, {
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const contentType = altResponse.headers.get('content-type');
        
        if (contentType && contentType.includes('text/html')) {
          const text = await altResponse.text();
          
          // Try multiple confirmation patterns
          let confirmToken = null;
          const patterns = [
            /confirm=([^&"']+)/,
            /id="download-form".*?action="([^"]+)"/s,
            /href="(\/uc\?export=download[^"]+)"/
          ];
          
          for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
              if (pattern === patterns[0]) {
                confirmToken = match[1];
                const confirmUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmToken}`;
                console.log(`  🔑 Found confirmation token, retrying...`);
                const confirmResponse = await fetch(confirmUrl, { timeout: 30000 });
                const confirmBuffer = await confirmResponse.buffer();
                console.log(`  ✅ Downloaded with confirmation (${confirmBuffer.length} bytes)`);
                return confirmBuffer;
              }
            }
          }
        }
        
        const altBuffer = await altResponse.buffer();
        const altMagic = altBuffer.slice(0, 4).toString();
        if (altMagic.includes('%PDF')) {
          console.log(`  ✅ Downloaded via alternative method (${altBuffer.length} bytes)`);
          return altBuffer;
        }
      }
      
      throw new Error('Downloaded file is not a valid PDF');
    }
    
    console.log(`  ✅ Downloaded (${buffer.length} bytes)`);
    return buffer;
    
  } catch (error) {
    console.error(`  ❌ Error downloading PDF: ${error.message}`);
    throw error;
  }
}

/**
 * Convert PDF buffer to base64 JPEG image of the first page
 */
async function pdfToBase64Image(pdfBuffer, options = {}) {
  const { quality = 85, maxWidth = 1200 } = options;
  
  loadDependencies(); // Ensure dependencies are loaded
  
  try {
    // Convert Buffer to Uint8Array (required by PDF.js)
    const uint8Array = new Uint8Array(pdfBuffer);
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useSystemFonts: true,
      disableFontFace: true,
      verbosity: 0 // Suppress warnings
    });
    
    const pdfDocument = await loadingTask.promise;
    
    if (pdfDocument.numPages === 0) {
      throw new Error('PDF has no pages');
    }
    
    // Get the first page
    const page = await pdfDocument.getPage(1);
    
    // Calculate scale based on desired width
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = viewport.width > maxWidth ? maxWidth / viewport.width : 2.0;
    const scaledViewport = page.getViewport({ scale });
    
    // Create canvas
    const { createCanvas } = canvas;
    const canvasElement = createCanvas(scaledViewport.width, scaledViewport.height);
    const context = canvasElement.getContext('2d');
    
    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport
    };
    
    await page.render(renderContext).promise;
    
    // Convert canvas to JPEG base64
    const imageBuffer = canvasElement.toBuffer('image/jpeg', { quality: quality / 100 });
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;
    
    const sizeKb = (base64Image.length / 1024).toFixed(1);
    console.log(`  ✅ Converted to JPEG (${sizeKb} KB, ${scaledViewport.width}x${scaledViewport.height}px)`);
    
    // Clean up
    await pdfDocument.destroy();
    
    return dataUrl;
    
  } catch (error) {
    console.error(`  ❌ Error converting PDF to image: ${error.message}`);
    console.error(`  Stack trace:`, error.stack);
    throw error;
  }
}

/**
 * Process an array of PDF URLs and return array of base64 images
 */
async function extractImagesFromPdfLinks(pdfLinks) {
  if (!pdfLinks || pdfLinks.length === 0) {
    return [];
  }
  
  console.log(`\n📄 Processing ${pdfLinks.length} PDF link(s)...`);
  
  const images = [];
  
  for (let i = 0; i < pdfLinks.length; i++) {
    const pdfUrl = pdfLinks[i];
    
    if (!pdfUrl || !pdfUrl.trim()) {
      console.log(`  [${i + 1}/${pdfLinks.length}] ⏭️  Skipped: Empty URL`);
      continue;
    }
    
    console.log(`\n  [${i + 1}/${pdfLinks.length}] Processing PDF...`);
    
    try {
      // Download PDF
      const pdfBuffer = await downloadPdf(pdfUrl);
      
      // Convert to base64 image
      const base64Image = await pdfToBase64Image(pdfBuffer, {
        quality: 85,
        maxWidth: 1200
      });
      
      images.push(base64Image);
      
    } catch (error) {
      console.error(`  [${i + 1}/${pdfLinks.length}] ❌ Failed: ${error.message}`);
      // Continue with next PDF instead of failing completely
    }
  }
  
  console.log(`\n✅ Successfully extracted ${images.length} image(s) from ${pdfLinks.length} PDF(s)\n`);
  
  return images;
}

module.exports = {
  extractImagesFromPdfLinks,
  downloadPdf,
  pdfToBase64Image
};
