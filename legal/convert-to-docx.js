const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Header,
  Footer,
  PageNumber,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  PageBreak,
  TabStopPosition,
  TabStopType,
  ShadingType,
  WidthType,
  convertInchesToTwip,
} = require("docx");

const LEGAL_DIR = path.join(__dirname);

const FILES = [
  { md: "Privacy_Policy.md", docx: "Privacy_Policy.docx" },
  { md: "Terms_and_Conditions.md", docx: "Terms_and_Conditions.docx" },
  { md: "Liability_Release_Agreement.md", docx: "Liability_Release_Agreement.docx" },
  { md: "Business_Associate_Agreement.md", docx: "Business_Associate_Agreement.docx" },
];

/**
 * Parse inline bold (**text**) into TextRun elements.
 * Returns an array of TextRun objects.
 */
function parseInline(text, baseOptions = {}) {
  const runs = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before the bold
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index);
      if (before) {
        runs.push(new TextRun({ text: before, font: "Arial", ...baseOptions }));
      }
    }
    // Bold text
    runs.push(
      new TextRun({
        text: match[1],
        bold: true,
        font: "Arial",
        ...baseOptions,
      })
    );
    lastIndex = regex.lastIndex;
  }

  // Remaining text
  if (lastIndex < text.length) {
    runs.push(
      new TextRun({ text: text.slice(lastIndex), font: "Arial", ...baseOptions })
    );
  }

  // If empty, return a single empty run
  if (runs.length === 0) {
    runs.push(new TextRun({ text: "", font: "Arial", ...baseOptions }));
  }

  return runs;
}

/**
 * Parse italic (*text*) that is NOT bold — single asterisks only.
 * This handles *italic* after bold has been processed inline.
 */
function parseInlineWithItalic(text, baseOptions = {}) {
  // First handle bold, then within non-bold segments handle italic
  const runs = [];
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const segment = text.slice(lastIndex, match.index);
      runs.push(...parseItalicSegment(segment, baseOptions));
    }
    runs.push(
      new TextRun({ text: match[1], bold: true, font: "Arial", ...baseOptions })
    );
    lastIndex = boldRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push(...parseItalicSegment(text.slice(lastIndex), baseOptions));
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text: "", font: "Arial", ...baseOptions }));
  }

  return runs;
}

function parseItalicSegment(text, baseOptions) {
  const runs = [];
  // Match single * but not **
  const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = italicRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(
        new TextRun({ text: text.slice(lastIndex, match.index), font: "Arial", ...baseOptions })
      );
    }
    runs.push(
      new TextRun({ text: match[1], italics: true, font: "Arial", ...baseOptions })
    );
    lastIndex = italicRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining) {
      runs.push(new TextRun({ text: remaining, font: "Arial", ...baseOptions }));
    }
  }

  return runs;
}

/**
 * Create a signature line (underscored blank space)
 */
function createSignatureLine(text) {
  // text like "Signature: ___________________________________"
  const parts = text.split(/(_+)/);
  const runs = [];
  for (const part of parts) {
    if (/^_+$/.test(part)) {
      // Render as underlined spaces
      runs.push(
        new TextRun({
          text: "\u00A0".repeat(40),
          underline: {},
          font: "Arial",
          size: 22, // 11pt
        })
      );
    } else {
      runs.push(...parseInlineWithItalic(part, { size: 22 }));
    }
  }
  return runs;
}

/**
 * Convert a single markdown file to docx paragraphs
 */
function markdownToParagraphs(mdContent) {
  const lines = mdContent.split(/\r?\n/);
  const paragraphs = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Blank line / &nbsp; — empty spacing paragraph
    if (line.trim() === "" || line.trim() === "&nbsp;") {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: "", font: "Arial", size: 22 })],
          spacing: { after: 120 },
        })
      );
      continue;
    }

    // Horizontal rule --- → thin border paragraph (visual separator)
    if (/^---+$/.test(line.trim())) {
      paragraphs.push(
        new Paragraph({
          children: [],
          border: {
            bottom: {
              color: "999999",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
          spacing: { before: 200, after: 200 },
        })
      );
      continue;
    }

    // Heading 3: ###
    if (line.startsWith("### ")) {
      const headingText = line.replace(/^###\s+/, "");
      paragraphs.push(
        new Paragraph({
          children: parseInlineWithItalic(headingText, { size: 24, bold: true }),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 120 },
        })
      );
      continue;
    }

    // Heading 2: ##
    if (line.startsWith("## ")) {
      const headingText = line.replace(/^##\s+/, "");
      paragraphs.push(
        new Paragraph({
          children: parseInlineWithItalic(headingText, { size: 28, bold: true }),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 360, after: 160 },
        })
      );
      continue;
    }

    // Heading 1: #
    if (line.startsWith("# ")) {
      const headingText = line.replace(/^#\s+/, "");
      paragraphs.push(
        new Paragraph({
          children: parseInlineWithItalic(headingText, { size: 32, bold: true }),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 480, after: 200 },
        })
      );
      continue;
    }

    // Bullet list items: - **Label:** text
    if (/^-\s+/.test(line)) {
      const bulletText = line.replace(/^-\s+/, "");
      paragraphs.push(
        new Paragraph({
          children: parseInlineWithItalic(bulletText, { size: 22 }),
          bullet: { level: 0 },
          spacing: { after: 60 },
          indent: { left: convertInchesToTwip(0.5) },
        })
      );
      continue;
    }

    // Lettered sub-items: (a), (b), etc. → indented
    if (/^\([a-z]\)\s/.test(line.trim())) {
      paragraphs.push(
        new Paragraph({
          children: parseInlineWithItalic(line.trim(), { size: 22 }),
          spacing: { after: 80 },
          indent: { left: convertInchesToTwip(0.5) },
        })
      );
      continue;
    }

    // Signature lines containing ___
    if (line.includes("___")) {
      paragraphs.push(
        new Paragraph({
          children: createSignatureLine(line),
          spacing: { after: 80 },
        })
      );
      continue;
    }

    // Regular paragraph
    paragraphs.push(
      new Paragraph({
        children: parseInlineWithItalic(line, { size: 22 }),
        spacing: { after: 120 },
      })
    );
  }

  return paragraphs;
}

/**
 * Build and save a .docx document
 */
async function convertFile(mdFile, docxFile) {
  const mdPath = path.join(LEGAL_DIR, mdFile);
  const docxPath = path.join(LEGAL_DIR, docxFile);

  const mdContent = fs.readFileSync(mdPath, "utf-8");
  const paragraphs = markdownToParagraphs(mdContent);

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 22, // 11pt
          },
        },
        heading1: {
          run: {
            font: "Arial",
            size: 32, // 16pt
            bold: true,
          },
          paragraph: {
            spacing: { before: 480, after: 200 },
          },
        },
        heading2: {
          run: {
            font: "Arial",
            size: 28, // 14pt
            bold: true,
          },
          paragraph: {
            spacing: { before: 360, after: 160 },
          },
        },
        heading3: {
          run: {
            font: "Arial",
            size: 24, // 12pt
            bold: true,
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 12240,
              height: 15840,
            },
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "AURAGENTICS LLC \u2014 CONFIDENTIAL",
                    font: "Arial",
                    size: 16, // 8pt
                    color: "999999",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Arial",
                    size: 16, // 8pt
                  }),
                ],
              }),
            ],
          }),
        },
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(docxPath, buffer);
  console.log(`  Created: ${docxFile}`);
}

async function main() {
  console.log("Converting legal markdown files to .docx...\n");

  for (const file of FILES) {
    await convertFile(file.md, file.docx);
  }

  console.log("\nAll conversions complete.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
