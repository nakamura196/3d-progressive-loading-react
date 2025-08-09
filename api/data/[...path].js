// Vercel Serverless Function to handle /data/* requests
// Returns 404 for non-existent files instead of falling back to index.html

export default function handler(req, res) {
  // This function will only be called if the static file doesn't exist
  // Return 404 with appropriate message
  res.status(404).json({
    error: 'Not Found',
    message: `The requested resource ${req.url} was not found.`,
    statusCode: 404
  });
}