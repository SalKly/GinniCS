# PDF.js Setup Documentation

## Overview

This project uses PDF.js (version 5.4.149) to extract text from PDF documents uploaded by users. The setup is configured to work in both development and production environments (including Vercel).

## How It Works

### Architecture

1. **Client-Side Only**: PDF.js is dynamically imported only on the client side to avoid SSR issues
2. **Local Worker File**: The PDF.js worker file is stored in the `public` directory to avoid CDN and CORS issues
3. **Automatic Updates**: A postinstall script ensures the worker file always matches the installed pdfjs-dist version

### Files

- **`src/utils/pdfParser.ts`**: Contains the PDF parsing logic with dynamic imports
- **`public/pdf.worker.min.mjs`**: The PDF.js worker file (auto-generated)
- **`scripts/copy-pdf-worker.js`**: Postinstall script that copies the worker from node_modules

## Setup

### Installation

When you run `npm install`, the postinstall script automatically:

1. Copies `node_modules/pdfjs-dist/build/pdf.worker.min.mjs`
2. To `public/pdf.worker.min.mjs`
3. Ensures version compatibility

### Manual Update

If you need to manually update the worker file:

```bash
npm run postinstall
# or
node scripts/copy-pdf-worker.js
```

## Troubleshooting

### Error: "TT: undefined function: 32"

**Cause**: Version mismatch between pdfjs-dist library and worker file

**Solution**:

1. Run `npm install` to reinstall dependencies
2. The postinstall script will copy the correct worker file
3. Restart your development server

### Error: "DOMMatrix is not defined"

**Cause**: PDF.js is being loaded during server-side rendering

**Solution**: Already handled - we use dynamic imports to ensure PDF.js only loads client-side

### Error: "Failed to fetch worker"

**Cause**: Worker file not found or incorrect path

**Solution**:

1. Verify `public/pdf.worker.min.mjs` exists
2. Run `npm run postinstall` to copy the worker file
3. Make sure the file is committed to git for Vercel deployments

### Transcript Not Appearing

**Cause**: PDF parsing is failing silently or worker issue

**Solution**:

1. Check browser console for detailed error messages
2. Ensure the PDF file is valid and not corrupted
3. Try a different PDF file
4. Run `npm run postinstall` to update the worker file

## Production Deployment (Vercel)

### Requirements

1. The `public/pdf.worker.min.mjs` file must be committed to git
2. The postinstall script runs automatically during build
3. No additional configuration needed

### Build Process

On Vercel:

1. Dependencies are installed → postinstall runs → worker file is updated
2. Next.js build completes
3. Static files (including worker) are served from the CDN

## Development Notes

### Dynamic Import

The PDF.js library is imported dynamically to prevent SSR issues:

```typescript
const pdfjs = await import("pdfjs-dist");
```

### Worker Configuration

The worker is configured to use the local file:

```typescript
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
```

### Version Management

- The postinstall script ensures the worker always matches the library version
- Worker file size: ~1.04 MB
- Both files should have matching timestamps after installation

## Testing

### Local Testing

1. Upload a PDF document through the Business Information step
2. Watch for "Parsing PDF document..." message
3. Transcript should appear in the "Document Transcription" field
4. Check console for version info: `PDF.js version: 5.4.149, Worker: /pdf.worker.min.mjs`

### Production Testing

1. Deploy to Vercel
2. Test with various PDF files
3. Monitor console for any worker loading errors

## Updates

### Updating pdfjs-dist

When updating the pdfjs-dist package:

```bash
npm install pdfjs-dist@latest
```

The postinstall script automatically updates the worker file.

## Support

If issues persist:

1. Clear browser cache
2. Delete `node_modules` and `package-lock.json`
3. Run `npm install` fresh
4. Verify console logs show correct version and worker path
