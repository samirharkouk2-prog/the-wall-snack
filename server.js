const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8008;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
    // Parse URL properly to handle query parameters and encoding
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Decode URL to handle spaces and special characters
    let decodedPath;
    try {
        decodedPath = decodeURIComponent(pathname);
    } catch (e) {
        console.error('Failed to decode URL:', pathname);
        res.writeHead(400);
        res.end('Bad Request');
        return;
    }

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} -> ${decodedPath}`);

    // Default to index.html for root or if no extension
    let relativePath = decodedPath === '/' ? '/4k burger image/index.html' : decodedPath;
    
    let filePath = path.join(__dirname, relativePath);

    // Security check: ensure the file is within the project directory
    const normalizedFilePath = path.normalize(filePath);
    if (!normalizedFilePath.startsWith(__dirname)) {
        console.warn('Security alert: attempt to access file outside project directory:', normalizedFilePath);
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const extname = path.extname(normalizedFilePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(normalizedFilePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                console.error('File not found:', normalizedFilePath);
                res.writeHead(404);
                res.end('File not found');
            } else {
                console.error('Server error:', error.code, 'for file:', normalizedFilePath);
                res.writeHead(500);
                res.end(`Server error: ${error.code}`);
            }
        } else {
            // Set appropriate headers for images
            const headers = { 'Content-Type': contentType };
            
            // Add CORS headers for images
            if (contentType.startsWith('image/')) {
                headers['Access-Control-Allow-Origin'] = '*';
                headers['Cache-Control'] = 'public, max-age=3600'; // Cache images for 1 hour
            }
            
            res.writeHead(200, headers);
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop.');
});
