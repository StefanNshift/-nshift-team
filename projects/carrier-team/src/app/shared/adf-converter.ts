export interface AdfNode {
  type: string;
  attrs?: Record<string, any>;
  content?: AdfNode[];
  text?: string;
  marks?: AdfMark[];
}

export interface AdfMark {
  type: string;
  attrs?: Record<string, any>;
}

export interface AdfDocument {
  version: number;
  type: 'doc';
  content: AdfNode[];
}

export class AdfConverter {
  private readonly VALID_LANGUAGES = [
    'javascript',
    'typescript',
    'json',
    'xml',
    'html',
    'css',
    'sql',
    'python',
    'java',
    'csharp',
    'cpp',
    'c',
    'php',
    'ruby',
    'go',
    'rust',
    'shell',
    'bash',
    'yaml',
    'markdown',
    'text',
  ];

  // Maximum nesting depth to prevent infinite recursion
  private readonly MAX_DEPTH = 50;

  /**
   * Converts HTML string to ADF format with comprehensive error handling
   */
  convertHtmlToAdf(html: string): AdfDocument {
    try {
      // Validate and sanitize input
      if (!html || typeof html !== 'string') {
        return this.createEmptyDocument();
      }

      // Clean up the HTML
      const cleanHtml = this.sanitizeHtml(html);

      // Parse HTML safely
      const parser = new DOMParser();
      const doc = parser.parseFromString(cleanHtml, 'text/html');

      // Check for parsing errors
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        console.warn('HTML parsing error:', parserError.textContent);
        return this.createEmptyDocument();
      }

      // Convert with depth tracking
      const adfContent = this.convertChildNodes(doc.body as HTMLElement, 0);

      // Fix orphaned nodes and validate structure
      const fixedContent = this.fixOrphanedNodes(adfContent);
      const validatedContent = this.validateAndCleanContent(fixedContent);

      const adfDoc: AdfDocument = {
        version: 1,
        type: 'doc',
        content: validatedContent,
      };

      return adfDoc;
    } catch (error) {
      console.error('Error converting HTML to ADF:', error);
      return this.createEmptyDocument();
    }
  }

  /**
   * Creates an empty ADF document
   */
  private createEmptyDocument(): AdfDocument {
    return {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    };
  }

  /**
   * Sanitizes HTML input to prevent XSS and other issues
   */
  private sanitizeHtml(html: string): string {
    // Remove potentially dangerous elements and attributes
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '') // Remove event handlers
      .replace(/on\w+\s*=\s*'[^']*'/gi, '')
      .replace(/javascript:/gi, '');
  }

  /**
   * Fixes orphaned text nodes and other invalid structures
   */
  private fixOrphanedNodes(content: AdfNode[]): AdfNode[] {
    if (!Array.isArray(content)) {
      return [];
    }

    const result: AdfNode[] = [];
    let textBuffer: AdfNode[] = [];

    for (const item of content) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      if (item.type === 'text') {
        // Collect text nodes
        textBuffer.push(item);
      } else {
        // If we have buffered text nodes, wrap them in a paragraph
        if (textBuffer.length > 0) {
          result.push({
            type: 'paragraph',
            content: textBuffer,
          });
          textBuffer = [];
        }
        // Add the non-text item after validation
        const validatedItem = this.validateNode(item);
        if (validatedItem) {
          result.push(validatedItem);
        }
      }
    }

    // Handle any remaining text nodes at the end
    if (textBuffer.length > 0) {
      result.push({
        type: 'paragraph',
        content: textBuffer,
      });
    }

    return result;
  }

  /**
   * Validates and cleans ADF content structure
   */
  private validateAndCleanContent(content: AdfNode[]): AdfNode[] {
    return content
      .filter(node => this.isValidNode(node))
      .map(node => this.validateNode(node))
      .filter(node => node !== null) as AdfNode[];
  }

  /**
   * Validates a single ADF node
   */
  private validateNode(node: any): AdfNode | null {
    if (!node || typeof node !== 'object' || !node.type) {
      return null;
    }

    // Ensure required properties exist
    const validatedNode: AdfNode = {
      type: String(node.type),
    };

    // Validate and copy attrs if present
    if (node.attrs && typeof node.attrs === 'object') {
      validatedNode.attrs = { ...node.attrs };
    }

    // Validate and recursively clean content
    if (Array.isArray(node.content)) {
      validatedNode.content = this.validateAndCleanContent(node.content);
    }

    // Validate text content
    if (node.text !== undefined) {
      validatedNode.text = String(node.text);
    }

    // Validate marks
    if (Array.isArray(node.marks)) {
      validatedNode.marks = node.marks
        .filter(mark => mark && typeof mark === 'object' && mark.type)
        .map(mark => ({
          type: String(mark.type),
          ...(mark.attrs && typeof mark.attrs === 'object' ? { attrs: { ...mark.attrs } } : {}),
        }));
    }

    return validatedNode;
  }

  /**
   * Checks if a node has valid structure
   */
  private isValidNode(node: any): boolean {
    return node && typeof node === 'object' && typeof node.type === 'string' && node.type.length > 0;
  }

  /**
   * Converts child nodes with depth tracking to prevent infinite recursion
   */
  private convertChildNodes(element: HTMLElement, depth: number): AdfNode[] {
    if (depth > this.MAX_DEPTH) {
      console.warn('Maximum conversion depth reached, stopping recursion');
      return [];
    }

    if (!element || !element.childNodes) {
      return [];
    }

    let results: AdfNode[] = [];

    try {
      Array.from(element.childNodes).forEach(child => {
        const converted = this.convertNodeToAdf(child, depth + 1);
        if (Array.isArray(converted)) {
          results = results.concat(converted);
        }
      });
    } catch (error) {
      console.error('Error converting child nodes:', error);
    }

    return results;
  }

  /**
   * Converts a single DOM node to ADF with comprehensive error handling
   */
  private convertNodeToAdf(node: Node, depth: number): AdfNode[] {
    if (!node) {
      return [];
    }

    try {
      // TEXT NODE
      if (node.nodeType === Node.TEXT_NODE) {
        return this.convertTextNode(node);
      }

      // ELEMENT NODE
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        return this.convertElementNode(element, depth);
      }

      // Other node types (comments, etc.) are ignored
      return [];
    } catch (error) {
      console.error('Error converting node:', error);
      return [];
    }
  }

  /**
   * Converts text nodes with proper whitespace handling
   */
  private convertTextNode(node: Node): AdfNode[] {
    const text = node.nodeValue || '';

    // Normalize whitespace while preserving single spaces
    const trimmed = text.replace(/\s+/g, ' ');

    // Don't include empty or whitespace-only text nodes
    if (!trimmed.trim()) {
      return [];
    }

    return [
      {
        type: 'text',
        text: trimmed,
      },
    ];
  }

  /**
   * Converts element nodes based on their tag type
   */
  private convertElementNode(element: HTMLElement, depth: number): AdfNode[] {
    const tag = element.tagName.toLowerCase();

    // Handle spans with special styling
    if (tag === 'span') {
      return this.handleSpanElement(element, depth);
    }

    switch (tag) {
      // ========= Headings (h1-h6) =========
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return this.convertHeading(element, depth);

      // ========= Paragraphs =========
      case 'p':
        return this.convertParagraph(element, depth);

      // ========= Code blocks =========
      case 'pre':
        return this.convertCodeBlock(element);

      // ========= Bold / Italics =========
      case 'b':
      case 'strong':
        return this.convertBold(element, depth);
      case 'i':
      case 'em':
        return this.convertItalic(element, depth);

      // ========= Inline code =========
      case 'code':
        return this.convertInlineCode(element, depth);

      // ========= Links <a> =========
      case 'a':
        return this.convertLink(element, depth);

      // ========= Line breaks <br> =========
      case 'br':
        return [{ type: 'hardBreak' }];

      // ========= Lists (ul, ol, li) =========
      case 'ul':
        return this.convertUnorderedList(element, depth);
      case 'ol':
        return this.convertOrderedList(element, depth);
      case 'li':
        return this.convertListItem(element, depth);

      // ========= Images <img> =========
      case 'img':
        return this.convertImage(element);

      // ========= Tables =========
      case 'table':
        return this.convertTable(element, depth);
      case 'thead':
      case 'tbody':
      case 'tfoot':
        return this.convertChildNodes(element, depth);
      case 'tr':
        return this.convertTableRow(element, depth);
      case 'td':
      case 'th':
        return this.convertTableCell(element, depth);

      // ========= Blockquotes =========
      case 'blockquote':
        return this.convertBlockquote(element, depth);

      // ========= Horizontal Rule =========
      case 'hr':
        return [{ type: 'rule' }];

      // ========= Division and other containers =========
      case 'div':
      case 'section':
      case 'article':
        return this.convertChildNodes(element, depth);

      // ========= Other elements =========
      default:
        // For unknown elements, just convert their children
        return this.convertChildNodes(element, depth);
    }
  }

  /**
   * Handles span elements with special styling
   */
  private handleSpanElement(element: HTMLElement, depth: number): AdfNode[] {
    // Check for Jira tags
    const className = element.className || '';
    if (className.includes('jiratag')) {
      const children = this.convertChildNodes(element, depth);
      return this.applyMarkToChildren(children, 'code');
    }

    // Check for color styling
    const style = element.getAttribute('style') || '';
    if (style.includes('color:')) {
      const colorMatch = style.match(/#[0-9a-f]{6}|#[0-9a-f]{3}|rgb\([^)]+\)|rgba\([^)]+\)/i);
      if (colorMatch) {
        const color = this.normalizeColor(colorMatch[0]);
        const children = this.convertChildNodes(element, depth);
        return this.applyTextColorMark(children, color);
      }
    }

    // For regular spans, just convert children
    return this.convertChildNodes(element, depth);
  }

  /**
   * Normalizes color values
   */
  private normalizeColor(color: string): string {
    // Convert rgb/rgba to hex if needed
    if (color.startsWith('rgb')) {
      // This is a simplified conversion - you might want to add a proper rgb to hex converter
      return color;
    }
    return color.toLowerCase();
  }

  /**
   * Converts heading elements
   */
  private convertHeading(element: HTMLElement, depth: number): AdfNode[] {
    const tag = element.tagName.toLowerCase();
    const level = parseInt(tag.replace('h', ''), 10);

    // Ensure level is within valid range (1-6)
    const validLevel = Math.max(1, Math.min(6, level));

    const content = this.convertChildNodes(element, depth);

    return [
      {
        type: 'heading',
        attrs: { level: validLevel },
        content: content.length > 0 ? content : [{ type: 'text', text: '' }],
      },
    ];
  }

  /**
   * Converts paragraph elements
   */
  private convertParagraph(element: HTMLElement, depth: number): AdfNode[] {
    const children = this.convertChildNodes(element, depth);

    // Handle media elements specially
    if (children.length === 1 && children[0].type === 'mediaSingle') {
      return children;
    }

    // Filter out media elements that should be at document level
    const mediaElements = children.filter(c => c.type === 'mediaSingle');
    const nonMediaElements = children.filter(c => c.type !== 'mediaSingle');

    const result: AdfNode[] = [];

    // Add media elements first (they go at document level)
    result.push(...mediaElements);

    // Add paragraph with non-media content
    if (nonMediaElements.length > 0) {
      result.push({
        type: 'paragraph',
        content: nonMediaElements,
      });
    } else if (children.length === 0) {
      // Empty paragraph
      result.push({
        type: 'paragraph',
        content: [],
      });
    }

    return result;
  }

  /**
   * Converts code block elements
   */
  private convertCodeBlock(element: HTMLElement): AdfNode[] {
    const codeText = element.textContent || '';
    const language = this.detectLanguage(codeText);

    return [
      {
        type: 'codeBlock',
        attrs: { language },
        content: [
          {
            type: 'text',
            text: codeText,
          },
        ],
      },
    ];
  }

  /**
   * Converts bold elements
   */
  private convertBold(element: HTMLElement, depth: number): AdfNode[] {
    const children = this.convertChildNodes(element, depth);
    return this.applyMarkToChildren(children, 'strong');
  }

  /**
   * Converts italic elements
   */
  private convertItalic(element: HTMLElement, depth: number): AdfNode[] {
    const children = this.convertChildNodes(element, depth);
    return this.applyMarkToChildren(children, 'em');
  }

  /**
   * Converts inline code elements
   */
  private convertInlineCode(element: HTMLElement, depth: number): AdfNode[] {
    const children = this.convertChildNodes(element, depth);
    return this.applyMarkToChildren(children, 'code');
  }

  /**
   * Converts link elements
   */
  private convertLink(element: HTMLElement, depth: number): AdfNode[] {
    const href = element.getAttribute('href') || '';

    // Validate URL
    if (!this.isValidUrl(href)) {
      // If invalid URL, just return the text content
      return this.convertChildNodes(element, depth);
    }

    const children = this.convertChildNodes(element, depth);
    return this.applyLinkMark(children, href);
  }

  /**
   * Validates URLs
   */
  private isValidUrl(url: string): boolean {
    if (!url) return false;

    try {
      new URL(url);
      return true;
    } catch {
      // Check for relative URLs
      return url.startsWith('/') || url.startsWith('#') || url.startsWith('mailto:');
    }
  }

  /**
   * Converts unordered lists
   */
  private convertUnorderedList(element: HTMLElement, depth: number): AdfNode[] {
    const listItems = this.convertListItems(element, depth);

    return [
      {
        type: 'bulletList',
        content: listItems,
      },
    ];
  }

  /**
   * Converts ordered lists
   */
  private convertOrderedList(element: HTMLElement, depth: number): AdfNode[] {
    const listItems = this.convertListItems(element, depth);

    return [
      {
        type: 'orderedList',
        content: listItems,
      },
    ];
  }

  /**
   * Converts list item elements
   */
  private convertListItem(element: HTMLElement, depth: number): AdfNode[] {
    const content = this.convertChildNodes(element, depth);
    const fixedContent = this.ensureListItemContent(content);

    return [
      {
        type: 'listItem',
        content: fixedContent,
      },
    ];
  }

  /**
   * Converts image elements
   */
  private convertImage(element: HTMLElement): AdfNode[] {
    const src = element.getAttribute('src') || '';
    const alt = element.getAttribute('alt') || '';

    // Validate image source
    if (!src) {
      return [];
    }

    return [
      {
        type: 'mediaSingle',
        attrs: { layout: 'center' },
        content: [
          {
            type: 'media',
            attrs: {
              type: 'external',
              url: src,
              alt: alt,
            },
          },
        ],
      },
    ];
  }

  /**
   * Converts table elements
   */
  private convertTable(element: HTMLElement, depth: number): AdfNode[] {
    const rows = this.convertTableRows(element, depth);

    return [
      {
        type: 'table',
        attrs: {
          isNumberColumnEnabled: false,
          layout: 'default',
        },
        content: rows,
      },
    ];
  }

  /**
   * Converts table row elements
   */
  private convertTableRow(element: HTMLElement, depth: number): AdfNode[] {
    const cells = this.convertCells(element, depth);

    return [
      {
        type: 'tableRow',
        content: cells,
      },
    ];
  }

  /**
   * Converts table cell elements
   */
  private convertTableCell(element: HTMLElement, depth: number): AdfNode[] {
    const tag = element.tagName.toLowerCase();
    const isHeader = tag === 'th';
    let content = this.convertChildNodes(element, depth);

    // Ensure cells have proper content structure
    if (!content || content.length === 0) {
      content = [{ type: 'paragraph', content: [] }];
    }

    // Wrap content in paragraph if needed
    const wrappedContent = this.ensureParagraphWrapper(content);

    return [
      {
        type: isHeader ? 'tableHeader' : 'tableCell',
        attrs: {},
        content: wrappedContent,
      },
    ];
  }

  /**
   * Converts blockquote elements
   */
  private convertBlockquote(element: HTMLElement, depth: number): AdfNode[] {
    const content = this.convertChildNodes(element, depth);

    return [
      {
        type: 'blockquote',
        content: content.length > 0 ? content : [{ type: 'paragraph', content: [] }],
      },
    ];
  }

  /**
   * Applies a mark to all text nodes in children
   */
  private applyMarkToChildren(children: AdfNode[], markType: string): AdfNode[] {
    return children.map(child => {
      if (child.type === 'text') {
        return {
          ...child,
          marks: [...(child.marks || []), { type: markType }],
        };
      }
      if (child.content) {
        return {
          ...child,
          content: this.applyMarkToChildren(child.content, markType),
        };
      }
      return child;
    });
  }

  /**
   * Applies text color mark to children
   */
  private applyTextColorMark(children: AdfNode[], color: string): AdfNode[] {
    return children.map(child => {
      if (child.type === 'text') {
        return {
          ...child,
          marks: [
            ...(child.marks || []),
            {
              type: 'textColor',
              attrs: { color },
            },
          ],
        };
      }
      if (child.content) {
        return {
          ...child,
          content: this.applyTextColorMark(child.content, color),
        };
      }
      return child;
    });
  }

  /**
   * Applies link mark to children
   */
  private applyLinkMark(children: AdfNode[], href: string): AdfNode[] {
    return children.map(child => {
      if (child.type === 'text') {
        return {
          ...child,
          marks: [
            ...(child.marks || []),
            {
              type: 'link',
              attrs: { href },
            },
          ],
        };
      }
      if (child.content) {
        return {
          ...child,
          content: this.applyLinkMark(child.content, href),
        };
      }
      return child;
    });
  }

  /**
   * Converts list items with proper error handling
   */
  private convertListItems(listElement: HTMLElement, depth: number): AdfNode[] {
    const items: AdfNode[] = [];

    try {
      Array.from(listElement.childNodes).forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement;
          const tag = el.tagName.toLowerCase();

          if (tag === 'li') {
            const content = this.convertChildNodes(el, depth);
            const fixedContent = this.ensureListItemContent(content);

            items.push({
              type: 'listItem',
              content: fixedContent,
            });
          } else {
            // Handle non-li elements in lists
            const fallback = this.convertNodeToAdf(child, depth);
            items.push(...fallback);
          }
        }
      });
    } catch (error) {
      console.error('Error converting list items:', error);
    }

    return items;
  }

  /**
   * Ensures list items have proper content structure
   */
  private ensureListItemContent(content: AdfNode[]): AdfNode[] {
    if (!content || content.length === 0) {
      return [{ type: 'paragraph', content: [] }];
    }

    const first = content[0];

    // Check if first element is a valid list item child
    const validTypes = ['paragraph', 'bulletList', 'orderedList', 'codeBlock', 'mediaSingle'];

    if (!validTypes.includes(first.type)) {
      // Wrap in paragraph
      return [
        {
          type: 'paragraph',
          content: content,
        },
      ];
    }

    return content;
  }

  /**
   * Converts table rows with proper error handling
   */
  private convertTableRows(tableElement: HTMLElement, depth: number): AdfNode[] {
    const rows: AdfNode[] = [];

    try {
      Array.from(tableElement.childNodes).forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const tag = (child as HTMLElement).tagName.toLowerCase();

          if (tag === 'tr') {
            const cells = this.convertCells(child as HTMLElement, depth);
            rows.push({
              type: 'tableRow',
              content: cells,
            });
          } else if (['thead', 'tbody', 'tfoot'].includes(tag)) {
            const subRows = this.convertChildNodes(child as HTMLElement, depth);
            rows.push(...subRows);
          } else {
            const fallback = this.convertNodeToAdf(child, depth);
            rows.push(...fallback);
          }
        }
      });
    } catch (error) {
      console.error('Error converting table rows:', error);
    }

    return rows;
  }

  /**
   * Converts table cells with proper error handling
   */
  private convertCells(rowElement: HTMLElement, depth: number): AdfNode[] {
    const cells: AdfNode[] = [];

    try {
      Array.from(rowElement.childNodes).forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const tag = (child as HTMLElement).tagName.toLowerCase();

          if (tag === 'td' || tag === 'th') {
            const isHeader = tag === 'th';
            let content = this.convertChildNodes(child as HTMLElement, depth);

            // Ensure cells have content
            if (!content || content.length === 0) {
              content = [{ type: 'paragraph', content: [] }];
            }

            // Ensure proper paragraph wrapper
            const wrappedContent = this.ensureParagraphWrapper(content);

            cells.push({
              type: isHeader ? 'tableHeader' : 'tableCell',
              attrs: {},
              content: wrappedContent,
            });
          } else {
            const fallback = this.convertNodeToAdf(child, depth);
            cells.push(...fallback);
          }
        }
      });
    } catch (error) {
      console.error('Error converting table cells:', error);
    }

    return cells;
  }

  /**
   * Ensures content is wrapped in paragraphs where needed
   */
  private ensureParagraphWrapper(content: AdfNode[]): AdfNode[] {
    if (!content || content.length === 0) {
      return [{ type: 'paragraph', content: [] }];
    }

    // If first element is already a paragraph, list, or other block element, return as-is
    const blockElements = ['paragraph', 'heading', 'bulletList', 'orderedList', 'codeBlock', 'blockquote', 'table'];

    if (blockElements.includes(content[0].type)) {
      return content;
    }

    // Otherwise, wrap in a paragraph
    return [
      {
        type: 'paragraph',
        content: content,
      },
    ];
  }

  /**
   * Detects programming language from code content
   */
  private detectLanguage(code: string): string {
    if (!code || typeof code !== 'string') {
      return 'text';
    }

    const trimmed = code.trim();

    // Check for specific patterns
    if (trimmed.startsWith('<') && (trimmed.includes('</') || trimmed.includes('/>'))) {
      return 'xml';
    }

    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch {
        // Not valid JSON, continue checking
      }
    }

    // Check for SQL keywords
    if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(trimmed)) {
      return 'sql';
    }

    // Check for JavaScript/TypeScript
    if (/\b(function|const|let|var|=>|class|import|export)\b/.test(trimmed)) {
      if (/\b(interface|type|namespace|implements)\b/.test(trimmed)) {
        return 'typescript';
      }
      return 'javascript';
    }

    // Check for Python
    if (/\b(def|import|from|class|if __name__|print)\b/.test(trimmed)) {
      return 'python';
    }

    // Default
    return 'text';
  }

  /**
   * Converts plain text to ADF format
   */
  convertTextToAdf(text: string): AdfDocument {
    if (!text || typeof text !== 'string') {
      return this.createEmptyDocument();
    }

    const trimmedText = text.trim();

    if (!trimmedText) {
      return this.createEmptyDocument();
    }

    return {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: trimmedText,
            },
          ],
        },
      ],
    };
  }

  /**
   * Validates an entire ADF document
   */
  validateAdfDocument(adf: any): AdfDocument | null {
    try {
      if (!adf || typeof adf !== 'object') {
        return null;
      }

      if (adf.type !== 'doc' || !Array.isArray(adf.content)) {
        return null;
      }

      const validatedContent = this.validateAndCleanContent(adf.content);

      return {
        version: adf.version || 1,
        type: 'doc',
        content: validatedContent,
      };
    } catch (error) {
      console.error('Error validating ADF document:', error);
      return null;
    }
  }
}
