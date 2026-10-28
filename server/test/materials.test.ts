import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractContent } from '../src/services/extractionService.js';

test('extractContent extracts text, word count, and version hash from text files', async () => {
  const sampleNotes = `
# Chapter 3 - Quadratics
Standard form of a quadratic equation: ax^2 + bx + c = 0.
Solving by factorising and using the quadratic formula.
Roots of the equation represent points where the parabola crosses the x-axis.
Vertex is the minimum or maximum point of the parabola.
`;

  const result = await extractContent({
    fileType: 'text',
    content: sampleNotes,
    fileName: 'quadratics.txt',
  });

  assert.ok(result.extractedText.includes('Chapter 3 - Quadratics'));
  assert.ok(result.extractedText.includes('ax^2 + bx + c = 0'));
  assert.ok(result.wordCount > 15);
  assert.equal(typeof result.versionHash, 'string');
  assert.equal(result.versionHash.length, 64); // SHA-256 hex length
  assert.ok(result.summary.length > 0);
});

test('extractContent produces deterministic version hashes', async () => {
  const contentA = 'Calculus Week 1: Limits and continuity definitions.';
  const contentB = 'Calculus Week 1: Limits and continuity definitions.';
  const contentC = 'Calculus Week 2: Derivative rules and chain rule.';

  const resA = await extractContent({ fileType: 'text', content: contentA });
  const resB = await extractContent({ fileType: 'text', content: contentB });
  const resC = await extractContent({ fileType: 'text', content: contentC });

  assert.equal(resA.versionHash, resB.versionHash);
  assert.notEqual(resA.versionHash, resC.versionHash);
});

test('extractContent extracts from document structure', async () => {
  const markdownDoc = `
# Data Structures
## Binary Trees
- In-order traversal visits left subtree, root, then right subtree.
- Binary search trees maintain the invariant that left < root < right.
- Balance factor in AVL trees must be between -1 and +1.
`;

  const result = await extractContent({
    fileType: 'doc',
    content: markdownDoc,
    fileName: 'trees.md',
  });

  assert.ok(result.extractedText.includes('Binary Trees'));
  assert.ok(result.summary.length >= 2);
  assert.equal(typeof result.versionHash, 'string');
  assert.equal(result.versionHash.length, 64);
});

test('extractContent handles PDF text streams and page estimation', async () => {
  // Mock minimal PDF stream representation
  const pdfMockString = `%PDF-1.4
1 0 obj << /Type /Page >> endobj
2 0 obj << /Type /Page >> endobj
stream
(Linear Algebra Lecture 1)
(Vectors in R^n and matrix multiplication)
(Dot products and orthogonality properties)
endstream`;

  const pdfBuffer = Buffer.from(pdfMockString, 'latin1');

  const result = await extractContent({
    fileType: 'pdf',
    buffer: pdfBuffer,
    fileName: 'linalg.pdf',
  });

  assert.ok(result.extractedText.includes('Linear Algebra Lecture 1'));
  assert.ok(result.extractedText.includes('matrix multiplication'));
  assert.equal(result.estimatedPages, 2);
  assert.ok(result.versionHash.length === 64);
});

test('extractContent handles Image metadata and visual concept indexing', async () => {
  const imageFakeBase64 = Buffer.from('mock_png_image_binary_bytes').toString('base64');

  const result = await extractContent({
    fileType: 'image',
    content: imageFakeBase64,
    fileName: 'biology_cell_diagram.png',
  });

  assert.ok(result.extractedText.includes('biology_cell_diagram.png'));
  assert.ok(result.extractedText.includes('Visual diagram'));
  assert.equal(result.versionHash.length, 64);
});

