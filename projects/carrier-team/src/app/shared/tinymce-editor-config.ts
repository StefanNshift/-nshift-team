import * as Prism from 'prismjs';
import { Editor } from 'tinymce';

export const tinyMceInit = (
  highlightCodeBlocksCallback: () => void,
  improveSubjectCallback: (editor: Editor) => void,
  suggestReleaseNoteCallback: (editor: Editor) => void,
  insertTemplateCallback: (editor: Editor) => void,
  getCarrierInfoOptions: () => any[],
  getPostmanCollections: () => Promise<Array<{ name: string; link: string }>>, // 👈 PROMISE!
) => {
  return {
    height: 600,
    menubar: false,
    plugins: 'lists link image table codesample',
    statusbar: true,
    resize: true,
    toolbar:
      'blocks | bold italic underline forecolor | customBullist customNumlist | link image table | customHr CustomCodeSample   insertTag | templateMenu aiMenu | carrierAutocompleterHelper',
    branding: false,
    license_key: 'gpl',
    skin: 'oxide',
    // icons: 'small',
    toolbar_mode: 'sliding',
    toolbar_sticky: true,

    content_style: `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
          Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        font-size: 14px;
        line-height: 1.3;
        margin: 8px;
        color: #172B4D;
      }
      p {
        margin: 0 0 8px 0;
      }

      .jiratag {
  display: inline-block;
  background: #F4F5F7;
  color: #172B4D;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: 500;
}

.postman-link {
  display: inline-flex;
  align-items: center;
  background: #f5f8fa;
  border: 1px solid #d0d7de;
  border-radius: 4px;
  padding: 2px 6px;
  margin: 2px 2px;
  font-size: 0.9em;
}

.postman-link:hover {
  background: #e8f0fe;
}

.postman-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
}

.postman-anchor {
  color: #0366d6;
  text-decoration: none;
  font-weight: 500;
}

.postman-anchor:hover {
  text-decoration: underline;
}

#jiracode {
  background-color: #f6f8fa;
  border: 1px solid #d0d7de;
  border-left: 4px solid #0116a3;
  border-radius: 6px;
  padding: 8px 12px;
  font-family: 'Fira Code', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 12px;
  color: #24292f;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.4;
  margin: 8px 0;
  display: inline-block;
  max-width: 400px; /* Maximal bredd, justera om du vill */
  width: auto;
}


#jiracode .key {
  color: #005cc5; /* Blå för nycklar */
  font-weight: bold;
}

#jiracode .value {
  color: #22863a; /* Grön för värden */
}

#jiracode .string {
  color: #032f62; /* Extra blå för strängar */
}

      h1 { 
        font-size: 1.5em; 
        margin: 12px 0 8px 0;
        font-weight: 600;
        color: #172B4D;
      }
      h2 { 
        font-size: 1.3em; 
        margin: 10px 0 8px 0;
        font-weight: 600;
        color: #172B4D;
      }
      h3 { 
        font-size: 1.1em; 
        margin: 8px 0 6px 0;
        font-weight: 600;
        color: #172B4D;
      }
      ul, ol {
        margin: 0 0 8px 0;
        padding-left: 24px;
      }
      li {
        margin-bottom: 4px;
        padding-left: 2px;
      }
      pre {
        margin: 8px 0;
        padding: 8px 12px;
        background: #F4F5F7;
        border-radius: 3px;
        border-left: 4px solid #DFE1E6;
        overflow-x: auto;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 13px;
        line-height: 1.4;
        color: #091E42;
      }


      quote {
        margin: 8px 0;
        padding: 0 0 0 12px;
        border-left: 3px solid #DFE1E6;
        color: #5E6C84;
      }

.tox-tbtn.tox-tbtn--enabled {
  background-color: #d0ebff !important; /* Ljusblå */
  border-color: #91d5ff !important;
}

      table {
        border-collapse: collapse;
        width: 100%;
        margin: 8px 0;
      }
      table td, table th {
        border: 1px solid #DFE1E6;
        padding: 6px 8px;
      }
        
      table th {
        background-color: #F4F5F7;
        font-weight: 500;
      }
    `,

    images_upload_handler: (blobInfo, success, failure) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          const base64 = reader.result as string;
          success(base64);
          resolve(base64);
        };

        reader.onerror = () => {
          failure('Kunde inte läsa bildfilen.');
          reject('Filuppladdning misslyckades');
        };

        reader.readAsDataURL(blobInfo.blob());
      });
    },

    setup: (editor: Editor) => {
      let isInsideTag = false;

      const insertOrRemoveTag = (editor: Editor) => {
        let node = editor.selection.getNode();

        if (/^H[1-6]$/.test(node.nodeName)) {
          editor.execCommand('FormatBlock', false, 'p');
          node = editor.selection.getNode();
        }

        if (node.nodeName === 'SPAN' && node.classList.contains('jiratag')) {
          const text = node.textContent || '';
          editor.dom.remove(node, false);
          editor.insertContent(text);
        } else {
          const selectedText = editor.selection.getContent({ format: 'text' }) || 'tag';
          const escaped = selectedText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
          editor.insertContent(`<span class="jiratag">${escaped}</span>&nbsp;`);
        }
      };

      editor.ui.registry.addButton('CustomCodeSample', {
        icon: 'sourcecode',
        tooltip: 'Insert Code Sample (Ctrl+o)',
        onAction: () => {
          showCodeDialog(); // 👈 flytta dialoglogik till denna funktion
        },
      });

      const showCodeDialog = () => {
        editor.windowManager.open({
          title: 'Insert Code Sample',
          size: 'large',
          body: {
            type: 'panel',
            items: [
              {
                type: 'selectbox',
                name: 'language',
                label: 'Language',
                items: [
                  { text: 'JavaScript', value: 'javascript' },
                  { text: 'HTML/XML', value: 'markup' },
                  { text: 'CSS', value: 'css' },
                  { text: 'Python', value: 'python' },
                  { text: 'C#', value: 'csharp' },
                ],
              },
              {
                type: 'textarea',
                name: 'code',
                label: 'Code',
              },
            ],
          },
          buttons: [
            { type: 'cancel', text: 'Cancel' },
            { type: 'submit', text: 'Insert', primary: true },
          ],
          initialData: {
            code: editor.selection.getContent({ format: 'text' }),
            language: 'javascript',
          },
          onSubmit: api => {
            const data = api.getData();
            const html = `<pre class="language-${data.language}"><code>${editor.dom.encode(data.code)}</code></pre>`;
            editor.insertContent(html);
            api.close();
          },
        });
      };

      editor.ui.registry.addToggleButton('insertTag', {
        icon: 'addtag',
        tooltip: 'Insert or Remove Tag (Ctrl+M)',
        onAction: () => {
          insertOrRemoveTag(editor);
        },
        onSetup: api => {
          const onNodeChange = () => {
            const node = editor.selection.getNode();
            const isTag = node.nodeName === 'SPAN' && node.classList.contains('jiratag');
            api.setActive(isTag);
          };
          editor.on('NodeChange', onNodeChange);
          return () => editor.off('NodeChange', onNodeChange);
        },
      });

      editor.ui.registry.addToggleButton('customBullist', {
        icon: 'unordered-list',
        tooltip: 'Bullet list (Ctrl+Shift+8)',
        onAction: () => {
          editor.execCommand('InsertUnorderedList');
        },
        onSetup: api => {
          const onNodeChange = () => {
            const list = editor.queryCommandState('InsertUnorderedList');
            api.setActive(list);
          };
          editor.on('NodeChange', onNodeChange);
          return () => editor.off('NodeChange', onNodeChange);
        },
      });

      editor.ui.registry.addToggleButton('customNumlist', {
        icon: 'ordered-list',
        tooltip: 'Numbered list (Ctrl+Shift+7)',
        onAction: () => {
          editor.execCommand('InsertOrderedList');
        },
        onSetup: api => {
          const onNodeChange = () => {
            const isActive = editor.queryCommandState('InsertOrderedList');
            api.setActive(isActive);
          };
          editor.on('NodeChange', onNodeChange);
          return () => editor.off('NodeChange', onNodeChange);
        },
      });

      editor.on('NodeChange', e => {
        const node = editor.selection.getNode();
        const wasInsideTag = isInsideTag;
        isInsideTag = node.nodeName === 'SPAN' && node.style.backgroundColor === 'rgb(244, 245, 247)';

        if (wasInsideTag !== isInsideTag) {
          const button = editor.ui.registry.getAll().buttons.insertTag;
          if (button) {
            button.icon = isInsideTag ? 'remove' : 'plus';
            editor.ui.registry.addButton('insertTag', {
              text: '',
              icon: isInsideTag ? 'remove' : 'plus',
              tooltip: 'Insert or Remove Tag',
              onAction: () => {
                insertOrRemoveTag(editor);
              },
            });
          }
        }
      });

      editor.on('keydown', e => {
        if (e.ctrlKey && !e.altKey && !e.metaKey) {
          if (e.key.toLowerCase() === 'm') {
            e.preventDefault();
            insertOrRemoveTag(editor);
          }
        }
      });

      editor.addShortcut('ctrl+o', 'Insert Code Sample', () => {
        showCodeDialog();
      });

      editor.addShortcut('ctrl+shift+8', 'Insert bullet list', () => {
        editor.execCommand('InsertUnorderedList');
      });

      editor.addShortcut('ctrl+shift+9', 'Insert numbered list', () => {
        editor.execCommand('InsertOrderedList');
      });
      editor.ui.registry.addButton('customHr', {
        tooltip: 'Insert Horizontal Line (Ctrl+Shift+l)',
        icon: 'horizontal-rule',
        onAction: () => {
          editor.execCommand('InsertHorizontalRule');
        },
      });

      editor.ui.registry.addIcon(
        'producticon',
        '<svg width="24px" height="24px" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M48 0H0V48H48V0Z" fill="white" fill-opacity="0.01"></path> <path d="M44 14L24 4L4 14V34L24 44L44 34V14Z" stroke="#000000" stroke-width="4" stroke-linejoin="round"></path> <path d="M4 14L24 24" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M24 44V24" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M44 14L24 24" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M34 9L14 19" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>',
      );
      editor.ui.registry.addIcon(
        'addonicon',
        '<svg fill="#000000" width="64px" height="64px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M19,11a2.962,2.962,0,0,1,1,.184V7H15.859A4,4,0,1,0,8.141,7H4v4.184A2.962,2.962,0,0,1,5,11a3,3,0,0,1,0,6,2.962,2.962,0,0,1-1-.184V22H9.184A2.962,2.962,0,0,1,9,21a3,3,0,0,1,6,0,2.962,2.962,0,0,1-.184,1H20V16.816A2.962,2.962,0,0,1,19,17a3,3,0,0,1,0-6Z"></path></g></svg>',
      );
      editor.ui.registry.addIcon(
        'subcarriericon',
        '<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.4" d="M15 2V12C15 13.1 14.1 14 13 14H2V6C2 3.79 3.79 2 6 2H15Z" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M22 14V17C22 18.66 20.66 20 19 20H18C18 18.9 17.1 18 16 18C14.9 18 14 18.9 14 20H10C10 18.9 9.1 18 8 18C6.9 18 6 18.9 6 20H5C3.34 20 2 18.66 2 17V14H13C14.1 14 15 13.1 15 12V5H16.84C17.56 5 18.22 5.39001 18.58 6.01001L20.29 9H19C18.45 9 18 9.45 18 10V13C18 13.55 18.45 14 19 14H22Z" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M8 22C9.10457 22 10 21.1046 10 20C10 18.8954 9.10457 18 8 18C6.89543 18 6 18.8954 6 20C6 21.1046 6.89543 22 8 22Z" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M16 22C17.1046 22 18 21.1046 18 20C18 18.8954 17.1046 18 16 18C14.8954 18 14 18.8954 14 20C14 21.1046 14.8954 22 16 22Z" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M22 12V14H19C18.45 14 18 13.55 18 13V10C18 9.45 18.45 9 19 9H20.29L22 12Z" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>',
      );
      editor.ui.registry.addIcon(
        'validationicon',
        '<svg width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" mirror-in-rtl="true" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="#494c4e" d="M8 6H5c-.553 0-1-.448-1-1s.447-1 1-1h3c.553 0 1 .448 1 1s-.447 1-1 1zM13 10H5c-.553 0-1-.448-1-1s.447-1 1-1h8c.553 0 1 .448 1 1s-.447 1-1 1zM13 14H5c-.553 0-1-.448-1-1s.447-1 1-1h8c.553 0 1 .448 1 1s-.447 1-1 1z"></path> <path fill="#494c4e" d="M18 2v8c0 .55-.45 1-1 1s-1-.45-1-1V2.5c0-.28-.22-.5-.5-.5h-13c-.28 0-.5.22-.5.5v19c0 .28.22.5.5.5h13c.28 0 .5-.22.5-.5V21c0-.55.45-1 1-1s1 .45 1 1v1c0 1.1-.9 2-2 2H2c-1.1 0-2-.9-2-2V2C0 .9.9 0 2 0h14c1.1 0 2 .9 2 2z"></path> <path fill="#494c4e" d="M23.71 8.817c.44.438.372 1.212-.148 1.732l-7.835 7.84c-.07.068-.148.126-.227.173l-2.382 1.317c-.33.183-.7.152-.927-.075-.226-.227-.25-.603-.07-.923l1.328-2.373c.042-.085.1-.153.162-.216 0-.012.007-.018.007-.018l7.835-7.84c.52-.52 1.294-.587 1.73-.15l.53.53z"></path> </g></svg>',
      );

      editor.ui.registry.addIcon(
        'postmanicon',
        `
       <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"><image width="24" height="24" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAMA9JREFUeNrs3U1sZWeZJ/BjxwlJugIm3kRqJBwpLGakDhW11Gwi+dIr2ExXGBZI3RIuKSxGoqCy6bCIRJWURWCTCkbqRUeKI6UlFtApVrCa2FI2ZDExtDStEZFwRrTELAoMqXQgKWDuc3NOcst17brn3vPxnnN+P+nKTn3Y1+fe1P95n/fjZBkAAADQfysuAaTt2oWts+MP6/l/Tn8eto798fX8z9Rh79h/H40fP53674P818Lhxs7+oVcPFADA7HAf5Z8WHz+dh/hm/uiDonCIguDNvEiYFAvjIuHAuwAUANDHgC9G5EWgFwE/cnVu6iQcTBUIRXGw59KAAgC6EvTx+OTU5+uuzlIO88d+8bnCABQA0FbYb04F/FbWr3Z9VxQdg1iDEAXBwbgwOHJZQAEAVY/sR9n77fuRUX3S3YK9vCg40CkABQCUHd2P8pF9Mcqnu/bybkFMIezpEoACAGYFfnzcdFV67SAvChQEKABcAgYW+MUK/L8T+EwXBONi4KrLgQIA+hX60cY/l4e+lj6niWLgh3l3wBkFKACgg6P8CPyt/KNFeyzisCgIdAdQAEC6ob95LPShalfz7sBVawdQAEAaof/lTGsfxQAoABD6oBgABQDdD/31qdAfuSIoBkABQL+Dv1i5v+1q0DFHRTFgASEKAJgv9DfHH76eh77V+/TBYV4MPDcuBg5dDhQA8GHoFy3+CH7z+vTZ3vjx4rgQ2HUpUAAw9NH+NzN79RmemCLY1RVAAcDQgn87s6APdAVQADCI0I8R/sU8+DddEbhFdAJeHD+u2EGAAoA+BH+EfbT5t10NmFt0Ay6bHkABQBeDf5QH/8jVgIXt5YXAnkuBAoDUgz9G+lbzQ7XizoTPWSeAAoBUgz9G/JuuBtTmMO8IKARQACD4YaCFgAWDKABoPPSLFf3R6rd/H9oT4f+cQgAFAE2N+J8V/KAQQAHAcIJfqx/SLwSesEYABQCCH4bpMLNYEAUACwb/KLOPH/pQCJx3jgAKAOYJ/hjpvyD4oVf2MgcKoQDghOCPRX2xuG/b1YDe2s0cMYwCgKnwv5TZ0gdDYccACgDBP5nnj3b/pqsBg3OYWSioAGBwwb+ZmecH3reXvb918MClUADQ7/C/lL2/uh9g2pW8I2BaQAFAz4J/lGn3A6eL8I9tg1ddCgUA3Q/+9Tz4z7kawJz28kLg0KXor1WXoNfhHzfs+YXwB0oajR+v51OG6ADQoeDfzCzyA6pxkHcDLBLUAaADo/7XhT9QkbO6AToAGPUDugG6AToAGPUDugHoAGDUD+gGoANA7eG/bdQP6AagAzCc4LevH0jNXubcAAUAtYZ/jPZfzty1D0iPUwQVANQU/pcyZ/gD6dvN3r+5kHsKKABYMvg381H/WVcD6AgLBDvAIsC0wz/m+V8X/kDHxL9Zr+SLldEBoGT4Pzv+cNGVADpuNzMloABgruCPBX6vGPUDPWJKIEGmANIK/1H2/t37hD/QJ6YEFACcEv4X85G/LX5AH03OMMmnN0mAKYD2gz/+p4j/IVTGwFDsjR+PWRegABhy+G9mtvgBw3SYFwHWBbTEFEB74T/KbPEDhisGQNYFKAAGF/7xhjffDwxdsS7gkkvRPFMAzYd/3MhHxQtws93MeQEKgJ4Gf1S6Md8/cjUAZor1AJ9VBDTDFEAz4b+Zvd/yF/4AJ4s1Ua+P/820NkoHoBfhfzYz3w9QxlHeCbBDQAegs+F/TvgDlLaedwK2XQodgC6Gf7xxX3AlAJYS9xDYdRl0ALoS/heFP0AlXsh3T6EDkHz42+YHUL3djZ398y6DAkD4AwywCMicFaAASCz4J6dZjR/nXA2AWjkrQAGQVPjHSn/7VgEUAQoA4Q+AIkABIPwBUAQoAIQ/AIoABYDwB0ARoAAQ/gAoAhQAwh8ARYACQPgDoAhQAAh/ABQBCgDhD4AiQAEg/AEUAYqAGdwO+GTCH6Db4t/wl10GBUCZ0f8Lwh+gF0b5v+kcYwpgdvhvuxIAvbK7sbN/3mXQATgp/J8V/gC9tD3+N/6Sy6ADMCv8I/i1iQD67fzGzv6uy6AAEP4Aw/PYuAi4qgAQ/rHYL1b8r/t/AmAQYltgbA88UAAIf+EPMLwi4JFxEXA41Asw2EWA+UE/Lwh/gEGKf/tfzrNAATAwDvoBGLZBHxQ0yALAQT8A5AZ7UNDgCoDxC30xs9cfgA9t57vBBmVQiwDHL/C5zLnQAMwWOwP2FAD9C38r/gE4zaC2Bw5iCiBf5fmy8Ad6N4q750x2x18+5EJUY7I7bCg7A9YG8qJG+G96bwNdDPg7P3V2EvLxWL33TLb20OlrmP/4H29kf37nevbezw8mn9/45RvZn379KxdzPnFxY1HgY71/bw1g9B83+LnoPQ10RQT9Rz7zuQ+CvwpRALz7s1ezP/zkx5OigNu6vLGzf0kB0N3wt+gP6MxIP0L/7tEXs9X7H6j1exXFwO/3vq8zcLpeLwrsbQFg0R/QBRH293x+exL+bZh0Bfa/P5ku4Ba9Pi64lwVAvoDDSX9A0iP+e7/w1daC/7gbbxxk1196RkfgVgfjAuARBUB3CoBYwLHtfQukKNr8MeqPIiA1MS3wzo92J4sI+cCVcRHwhAIg/fCP4H/B+xVITbT7z/zDN267ir9t0QV4+1+eMS1ws8fGRcBVBUC64W/eH0jSXQ8/mv3F338jyVH/Sd7auagI+FDv1gP05hwAt/cFUhVz/dH275LYLij8b1IcKNeb9QB9Ogkw9vtb9AckJUb9XQz/mALgFmfzs2V6oRdTAPb7A8n943rPmUn4R+tf+PdOL84H6HwBMA7/zfGH1zOtfyCxkX8qW/zmFWcCXH/+KS/e7cV6gAfHRcBRl3+IPkwBmPcHhP+S4nhgI/+5FWvOOq3TBcB49B9n/I+8F4FUtHmq3zLh/7vvXJxr739MbcTPSHYuz6DO6uwUQL7l73XvQSAVcfOe+y5c6XX4f/RrVyY3KIoDg/7zX7879Je801sDu9wBcNgPkM5oahyOZx5/ehDhH2JnQ9cWONag01MBnSwAxqP/S5ktf0BCunbIzzLh39WfuSajrk4FdK4AyFv/3/TPDZCKGAl3aTRcRfgXvxdFANmzeTYpAGqm9Q8ko7ir39DCf7r4ibUPdC+bOlUAaP0DqYm58LjJzxDDv6ALMHE2zygFQA3hr/UPJDf678oxv3WF/yRIxgVQ17Y+1uTr+eF0CoCKaf0DyY3+u7AIrs7wLzgbYKJTuwI6UQBo/QMp6sKot4nw1wW4SWd2BSRfAOTtlK97TwEpicVvqc/9NxX+XSqIGvLN/Bb1CoAlOesfSK8A+Ju0w67p8A9rD53tzILImnViKiDpAiC/ze/IewlISQRmyvv+2wj/DwojpwMW4l4BSedXsgVA3j551nsISE3K+97bDP9gGuAmL6Q8FZByByC2/G16/wDJFQB/leYot+3wD/H1TAN8IDIs2QWBSRYA+Z7/i947gA5Ad8I/5evT5mA21bMBUu0AaP0DSYrwTG2Em1L4F10AbpLkgsDkCgAL/4CUrX0irXBrKvz/9OtfZTfeOJg8unaNEjDKsy2t93Ji4W/hH5B2AfBQOu3tpsL/Dz/5cfb2vzxz0wg/vtZJpyCmdI0SEtl2VQfgZDHvv+l9ApDOyH86/IvvffzXZn1PbrKZ2s2CkikAnPgHdEEKC9yanPOPAmCWd3/26om/N+kCmAaY5espbQtMqQMQ2/6c+AeQSPjfbiQfRQClJDXNnUQBkG/72/beAEgn/MNp+/rnWRDILbbzzFMA5Cz8A0gs/Atx2+OZz+nayVMADgNKP/NaLwDys5JH3g8A6YV/OGk+P57XSeZ5rgM2SuE+ASl0AF7wXgBIM/zDIl9PAZB+F6DVAmBcAW1ntv0BJBv+1OZsnoGD7QB803sAIO3wP6nVr9jodga2VgAY/QNd9N7P61/5HqGf0sj/xi9PKAA2Hij9d7jJZptdgDY7AEb/QOc0MbcdR++m1Pb//d73Z/76aUf+WgOQfha2UgDkxyEa/QOdc9rK96aLjNieV3f4RzFy0ol/dz386OzRv/MBynYBLg2iAMiPQXTkL9BJTbS2591D/86PdicBXZcI/v/81+/O/L04EvnEA4K0/8tq5YjgNjoAccMfR/4CnRSj89POwK9CjKznLQLipjx1FQFRYJzUjbjn89sn/r0muiQ9s55nY38LAKN/oA/qXggYc/sfe/L5udv7dRUBp7X+T5v/b2KhpC5A9zoA54z+gc4XAP9W/01wyi7wq6MImHUjoPi1v/j7b5w6+q+7Q6IL0M0CwMp/QAegI0VALDKM5xDTETHnHyP/eD6n3SHQ6H8pX27ym6009Y3yvY6O/QV6IUbBH/nM5xr5XsW5APPOrTf53I47uvQlHYDlnN/Y2d/tWwfA6B/oTxeggWmAVDoB89L+71ZWNlIAOPUP6Jt3f/Zqo2HXhSLgpAODKKWx0wGb6gBY+Q/0TtOBl3IRENMUbXQddAESLgDyex6f9XoCfTPvkb1DKAKM/ivvAoz60AEw9w/0UoR/G8GXWhEQUyEKgO5lZ60FwLiC2Rx/GHkdgb6K0/LaWPiWUhFw2omBLGw0ztBau+d1dwCM/oHei3BtQwpFQNz4x9x/bWpdP1dbAZAfaXjO6wf0XRx+E7sChlgEvP2D73oD1Ge7zuOB76jrCz/5mc04K/JzXj+gbRGSdz74X7M7Nh6YHJATp9rF56v3npn83p/f+vXyRcC/v5bd/eh/y1buvKv5n2/8PT/y1387eQ7z/CxxhkGc7rf2ieVuJRx3CmzyPISB+sO3X3tzr5b3TY0dgF9k9v4DLQV+ccOa025bOy0OsYmRfIyOF72bXXyv+y5cae3nbvLEwGj9x/eidocbO/sPdqYAGId/tP5f9roBTYqgj9vURvifdl797RSr2hfZ5heBetrNcvpQBMT1+e23Hrfwrzm1HA9cyxTAk5/Z/Cejf6DJ4L/3C1/NzvzDNyZt7WXb8JMpg//yN5OWfnbj3ezG4f+e++9G8FbRXl/4udc8HRCh/9Y//aMjf5u1/u3X3nwx+Q5AvvXvF14voIngjzvWxQh2mRH/PKF+/aVnSk0NtHlDnro6AWW/JpV6ZGNnv9JbLdaxC8Cxv0DtwR+BtX7pex/csrbOIP3jtV9N5vfLaOuGPNNdjCp3Bwj/1lWerXV0AH4T7QqvFVBHqEXg1x36IcIw2uPLbu/rQydA+CfhaPx4cGNn/6iqL1jpGoD8DkZf8joBVYtQuu9/fHsyN1/nVrsI/uvPP5W9+9qPsz/+v/+79NeLIiICNJ53K0XTkmsCIvRjwZ85/9bdPX78n2+/9mZl0wCVdgDGBcArmaN/gQpF6z0W+M3byl5UBFy0wWMrYF0/x5nHn669c1FlJyD+Tuz1JxkHGzv7jyRXAFj8B1Q6ch0HZWzpi3Z/3WLUH0FX97a2+Jnu+8rTk/MJulAEkKTKFgNWuQhw2+sCVCH28RcL/JoI/xj5N7GnvQjgpr7frAKkzMJAkvTlFDsATv4Dlg6oaD1HAdCEIvzb+lmjwIkuh04AJRxt7Ox/PJkCYBz+o/GHV7wuwDKj/gj/pubIFw3/GD3HPQQKy64ZaOosA0VArzw2LgKuLvtF1lJrSQDDG/XHIr8mt8qVDf/JDYT+6tETOxOxVTBWzy+y7z8WH8b6g3d+tDv5+lEMNLHgMY46trK/syJzly4AquoA2PsPlBYr42PUP8/NetoI/7LPr6qdBPH9ohgobmhUhRjpR6ESD6P+Xvj4smcCLF0A5Hv/X/BaAGXE3HfT899lwn+Z5xej6yq3z01uXxxTD/n+/OianNQliHAvTi+Mz4u7HNI7S98gqIopgL/zOgBlRreTm/Y0vBWuTPgve3pfcVJhVQsMI8CFOMfENMBSBcBSHYDx6D/a/r/xOgDzaHqhXxvhPy3m9eMBNYmjgQ8XLsaX/ObnXH9gHpPb9bZwEl5b4R9iCsGee2q0VAYvWwBo/wOnKg6faeJQn5TC/4Ov+9+/6k1AXZbagbdwAZC3/3UAgBPF4rU40a+No29TCP8QP3uTuxwYlLP5MfyNdwCEP3CiGPHfd+FKKze/SSX8C02dbMggLZzFyxQA2v/ALYrjfGPOvw2phX/RBYCaLDwNsFABoP0PzPwH5f4HJvP9TZ7ql3r4T67LvWe8OajLwtMAi3YAhD9wk5jv/9iTz7e26j3V8IcGLJTJixYA2v/AByJM25rvF/6QbTVZAIxcb6AI1Hi0JY7dTT3841heqLMDkE/Nl1L6KODxN4lWgxv/wMDFaP++rzzd6gK3CP5578DX5sj/xhuO8aX+IiAreTTwIh2ALdcZhi3m+WOxn/CfT9yBD2pWOpsXKQAsAIQBi8V+Ef5tHnHbpfCP5xl354MGOgD1FQDXLmxFub/pOsMwtb3Yr2vhH8Ff5W2B4RTr44welfkLZdcAjFxjGKY42KeN8/y7Gv7F8zX6p0GxQ2+vrgLA9j8YmBjtR/inEKZdC39z/zSs1CB9tc4vDnQ//Ns82a/L4T/v84UKnS2zHXDuAiDf/gcMRCzya/Nkvy6Gf7T7f/utx4U/bZo7q8t0AGz/gwGFf4z8276NbZfC/4//8Ub2u+9cnHyEFs2d1WXWAIxcV+i/CNE2T/YrG/4prFEowt+CPxIwd1avzPOH8jmF37iu0G+xyr+t2/guGv5tn0kQzzO2+gl/EvLgxs7+4e3+0LxTAEb/0HMx6hf+5cPfVj+62gWYtwAw/w89D/8U7pDXpfCP5zrvTYigYXNl9rxrAHQAoIdSCNKuhX+M9svu8Y/nanEgnesA5PP/Z11PEP7C//pksV/Z8G/7BEUGZ3Oc3ZtLFwBG/9A/EUrrl74n/EuIEXzs8S8zko9plThLwe2ASbELME8BYPQPPQv/CNI2b+jTxfCPkf+ffv2ruf9OjPqL7ZTv/VwBQONuuw5grYovAnTDXQ8/Ogkl4T+/YqV/GdOLKmP0X6ZwgIrcdvBuCgAGIgLpzONPC/8Sfr/3/VLhH883rvH0jgrHAtNWAXC7+wKc2gEoe29hIN3wT+F0vy6Ff9kb+sx6vrFo0B0BabkLsLdQAZCZ/4fOi8N9UlmF3oXwj9C+/vxTpebt43ne95Wnb7l3QoS/Q4Jo0WiZAuDTrh90VyoH/HQp/Mve0Oe0RZXv/GjXm5A2nbqG73YFwMj1A+E/hPBf5IY+p02tWPxHAk7t4p+4CDBfPLDp+kG3FCEq/OcXYV02/Ke3+c1i9E8C1k87EGht0coBSDf8Uzjgpyvhv+w2v5MKCnv/SagLcFi2ABi5biD8+xz+cRvf2OpX5hpH+Md5Cqcx+iexAuBq2QLgk64bCP++hn8V2/yM/umAExcCmgKAjkvpaN8uhP+iK/3P/MM35nquRv8kZvOk31hVAIDwH0r4x6r8Rbf5zfNcjf5JsQA46UTAmR2A8R8W/iD8exX+i27zi4OU5r3Gb//gu96YpGjmiYCrRv8g/Pse/vHcFt3jP+81ju9RprMADRcA83UAMvv/IVllR6XCv/ptfsdFYRE7CiBRnyxTALgFMCQa/qnc1KcL4b/ISv8orsoeohQL/5z5jw4AIPxbDv9iRF7HNr/jou1f5iwBSKUAWFUAgPDvW/jHfH+Z8C+z0v84rX86YH3WToBbCgA7AED4dzX8i5X+dW3zOy5G/rb90dUuwJrRP6Trns9vTx7Cf/7wr3Ob37Q4U8ChP3TI5jwFgA4AJCCl2/mWCf8I/fu+8nS2ev8DjT23RVb6L9tZie9n4R99KwDcAwCE/8Lh3/T5BNGGLzsPv+z11fqngz49TwGw6TqB8O9C+De1zW+a1j8dtT5PAWAKAIR/0uEfrfd4bu/+7NVS4V/FugStfzpqdPwXVuepEgDhn1L4x2K/MuG/zEr/aVr/dNnxrYBrx37T6B+Ef7Lhv8hK/6qeY3xve/7puJtuCrRm9A/tqWJOeijhH7fafeufnyoV/nc9/GipG/qc1nW4/tIz3rD0ytqM6gBoKPzbOB+/i+Hfxja/aTHyd6c/emCkAwDCvzPhHyvuy666j67K3aMvVlZ8lNlpAF3tADgDAIR/MuFfdptfqHI9hXl/eubTpxUAm64PCP+2w38y5/78U6VW3Fd9bYt5f1v+6JH10woAQPi3Gv5x0E4s9isz5x7HDsfxw1VeW/P+9NDmaQXAyPUB4d9W+Le5zW+aeX+GWAAAwr+V8I+DfcqeslfVNr/jRUjZHQfQRR+cBHj8hCBA+DcV/vF8Ys6/7K18zzz+dKXPrzhlEPpq+sC/6Q6AMwBA+Dce/jHXHkfsllHlNr9pZacfoIPWZxUAgPBvLPwjaCP829zmd/z6WPTHkKzNqgoA4V93+Mdou0zg1nldLfpjQD64H4ApABD+jYZ/hH7sr297m18h7jFg0R8DYgoA+h7+McqOYJvntrlNhn8K2/ymn0+cOQBDpACAnob/vC32psI/uhAx518m/O/81NnKV/pPXyMn/TFAH5tVAHzadYHF1NWe7kv4xyr/smfqV3k3v1li26FFfwzQB9P9q1O/aBEgLOjtH3w3iZFkiuEf0xBlw/+ez2/XGv7xnMrcZwD6aNUlgOUtMrfd9/AvbuizyDa/KADq7EZY8Q8KAOhFEZBi+MfzmWcBYqFYR1HHHv9CsQ4BUABA54uA1MI/nsdvv/X4Qnv81x46W+vzst0PPrwh0HQB4BwA6FgRkGL4x/OJW/rOK57X+qXv1bqIsnhewOwCwCJAuM0odd656SaKgDLhH9vp6g7/aK/HyL/sNr8mpiNir7/tfnAzUwAwZ/hHUJVZnV5nEVAm/GNO/b4L9YbsOz/aLd1eb+J5FdepTEcCFADATeFftKjL7E+vowgoG/51bqcLEfxRAJRR9za/gr3+oACASsJ/kWCtsghIKfwnrfWdi8lt85suTOz1BwUAVBb+bRUBqYV/PJcyAdvENr/p8LfXHxQAUHn4N10EpBT+8RyOLn0puW1+BQf9gAIAag3/poqAlMI/DvZZ5G5+dW/zKzjoBxQA0Ej4110EpBT+Ea6xqC6VW/nOen4O+gEFADQW/nUVASmFf4yqF9nm97Enn28k/G+8cSD8QQEAzYd/1UVASuEfwRrz6mXcPfpiI9v8iusYB/0ACgBoJfyrKgJSCf94HnGy3yLb/O79wlcbC/+278IICgAQ/jcF87zt7+kQSyX84+S8eZ/H9LU88/jTjWzzE/5Qwb9/xSfXLmz92eVA+LcXUsXzaDv8FwnWJq6l8IdqbOzsr+gAIPxrDqwyq+Aj1NoO/2j3L7LNL7odTYV/PLfrLz0j/GFJCgCEf82q3ApXd/jHgr9Ftvmt3v9AY+FfdmoCmG3NJUD41yvCKo7MXfvEQ0udTV9n+C9ydG4TNxoS/qAAgE6Efyyeu/HLNyb70ovgr0JdYRuhGnv8y4Z/bPNraqW/8AcFACQV/hFKRcgXH+uYl64z/BcJ1XguTa30F/6gAIDWw3867GOU31QgxfeKEKzyRL3i8JzoWJS5jhH+dz38qPAHBQD0M/zrauUvGtYRglUtJOzCNj/hDwoAqD38p1v5EfjFiDslVRUBi9wwJ67ffV95urGV/sIfmi8AYohz1iWh7+FfhHwR+mXa4F0uAuI8/7K3ym3ybn7CHxpxMKsAOHJd6Fv4R7gX8/Ztt/LbLAK6sM2vELccFv5Qm6NZBQD0wp2fOjsZ6abYym+6CIifP8L/3Z+92onwj+fa9SINusJJgPROhF1dW/LqEkEex+nOu71unoV8RSu9bPhH8LcV/mW7FIACADpresqizB7704qA+L2jS18qfTe/pvf4C39o3NGsAmDfdYH2wn96BL5MERCLHBfd5td0+BdTFMIfGvNTHQBIMPyXLQIWvZtf03v8i/CP5yr8oR0WAUJi4T9dBIR5AjKKgN9+6/HSWxrb2OY3Hf5W+0MaBYBtgJBI+C9SBJQN/+gwxA19hD8MyuGsAsDeG0go/BcpAsqEfxsr/YU/pFkAAImFfx1FQFsr/YU/pMUUACQe/lUVAfEcouUv/EEHYPJvwvSvXruw9WfXBtIL/5jfj8cfr/1qcsph2UOO2ribn/CH9Gzs7K/M6gAALYX/dMAXn0//97LieGThD0w7XgC4IyDUEP4RgBGGxf0Jjv933eI44Dhwp8mFf8IfknNwWgFgHQBUWACUPZSnTsXagSaKAOEPSTpSAEADqmjdd7EIiJ/7rX92S19I0OH0fxw/Cvinrg/0WxQBMR1Qh+JEQuEPSXrztAIAUAQsHP4pTXkAtzg6rQDYc32ge2K9Qaz0b6sIEP7QCacuAgQSFjsKVu89k609dDZbvf+B7I6NBya/VpznXzbUq1gTIPyhmx2AleO/6zAgaH80v/aJhyYBH48Y2cevzbuPf5GR/aL3BhD+0B3ThwDpAECLihF8jOaL0J8ezS+qOOq37k7AjTcOJqv9hT90b/R/UgGwN36MXCuoRozgi9F8BHzRtq9T3UVAnTsJgFoczFMAOAsAFhzNT+box59XNZpPsQgQ/tBJh/MUAHEWwDnXCm41PYKfXpCXqqqLAOEPnfXmPAXAoesEs8O0ybP0UysChD902lxTAAoA6En4V1UExC2If7/3fW8E6K5bpvdnbQNcH3/4jWsF/Qj/46FedhQfaxpSvK8BML/jWwAn/2/P+ENHmYWA0LvwX/TnEf7QeYczi/sT/vCB64Xw71f49/3nAhQAICQVAcCH9ssUAG+6Xgh/PyegAwDC388LKABAGPZFnFrY5omFQL02dvb35i4A8p0Ahy4bwr/fYlvgb7/1uBv6QH+dOKBfu81f2nTtEP795HAfGIQTB/Orp/yln7puCP/+idH+WzsXhT8Mw08X7QCA8O+RP/7HG9n1l56ZfAQGYU8BAAMP/3d/9urkGGDz/TAoJ2b5yml/69qFrbgnwLrrh/Dvtnd+tDt5AINyuLGz/+BJv7m6aOsAhH/6YrR//fmnhD8Y/ZcuACwEpDfu/NTZQYV/zPPHFr9o/QODtL9MAaADQC/c8ZcPZWcef3owP2/s7//ddy66kx/oAJxobZm/DF0J/49+7cpgTruzvx8IJ50AOFcHID8RUBGA8O+AmO+Plr/wB7I5OvirVXwREP7tuvHGQXZ06Uv29wOF2w7e1+b4IhYCIvwTZosfMMN+FQWADgDCP0HFFr/3fm6WDiif3SvzfJVrF7Z+kbkxEMI/GdHqf+ufn7LKH5jlYGNn/5Hb/aHVOb+YLgDCPxGxyC8W+wl/4KQCYJ4/tDbnF4u5hG3XFOHfnmj5x1n+DvYB5sjsygoAHQCEf4tilX+0/N3IB5jD1Xn+0Mq8X806AIR/O6zyB0qYa/6/TAeg6AJsu7YI/2bEHH+0/K3yB0pm9VxWS3zRH7quCP9mxDx/LPQT/kBJ+/P+wbIdABD+NYo5/mj3O84XqLsDsFLmq167sPX6+MNZ1xfhX73Y23/9pWcc5wssHP4bO/ufraMDEH6oAED4Vy9G/HEXP4AllJqqXy35xa+6vrQhQr+P4R8L/d7auSj8gUo6AKX+XS371a9d2PrN+MO660zT4R8dgD6JhX6xyt/efqAChxs7+w+W+QtrC3yT6AJsu9YI/8U40Q9oe/QfVhf4JvuuM8J/MXGiX2zvE/5AxUpv1V9kCiDa/79xrRH+5Ub9tvcBddnY2S+d56sLfJOjzGJAhH/pUb/wB2qyUCavLfjNYhrgnGuO8DfqB1q30Em9qwt+Mx0AhP8p4jCf333novAHku0ArCz63ZwKiPCfPeqP0Hf3PqCp8N/Y2X9skb+4tsQ3fVEBgPD/UMz1x1G+cbgPQEMW3pm3TAEQLYdnXXuGHv7m+oE2OwAL//u7zHc1DcDQw9+oH2hRqZv/VNkBCKYBGGT4x6g/zu//w09+7MUE2vLiMn952QLANACDC39n+AOJWGpH3sqy3/3aha1Xxh9GXgf6Hv7R5o9Rv2N8gRTCf9HV/1V1AMKLCgD6Hv7F1j6jfiARP1z2C1RRAEQL4gWvBX0M/zjQJxb5xUeARFRyJP/qsl8gvzfArteD0/zF33+jU+FfLPKLM/yFP5CYq3n2tt4BCNGK2PaacFL43/Xwo515vjHHH+Fvax+QqB9W8UVWqno21y5sxS2C170uHA//j3zmc514rhH4sbr/vZ8feOGAVB2OR/8PVvGF1ip8Urvjx0WvDV0Lf+f3Ax1S2c34qiwAnlMA0LXw1+4HOua5qr7QSpXPytHAdCX8tfuBDlrq6N86OwBFZWJLoPBP9vlp9wMd9mKVX6zqDkAsAvxFZjGg8E9QnNsf7X6H+QAddDQe/X+8yi+4WuUXy/clXvU6Cf+UxB373tq56Px+oMt2q/6CazU8ycuZMwGEfwJinj9a/e7YB/TAc1V/wZU6nqUbBAn/NhXz/PEw4gd6oNLFf3V2AIIbBAn/VsRoP0b9tvUBPfJiHV90pa5ne+3CViwG3PS6Cf8mxDz/2z/4rnP7gb6p7OS/pjoARcXyTa+d8K+T/fyA0X96BcAVBYDwr0txtz4L/ICeu1LXF16p81lfu7AVhwJte/2Ef5XBb4EfMBC7Gzv757vYAQi2BAr/yhQn+Al+YCAu1/nFV+p+9rYEdt/doy9m937hq619fyv7gQGqZetfkx2AooJRAHRUjPrbCv9Y2X/9pWcEP2D038UOQN4FcJfAjoZ/tP7bCP4Y8VvZDwxUbVv/mu4ABHcJFP6CHyCR0X9jHYC8C+BgIOEv+AESGP032QEoKhpdAOEv+AFaHv032gHQBRD+gh/gVEfj0f/Hm/pmaw3/cLoAAw5/wQ9wquea/GZNFwBXx49nx491r/Nwwl/wA9x+9J/VeOzvLCtN/4TXLmxdytwjYBDhH3fmi/P6BT/AbV3e2Nm/1OQ3XG3hh7ySVzr0PPx/952Lwh8gwdF/KwXAuMKJH/QJr3f7bvzyjVrO1Y+vGeHvzH6AuTyXZ2O/C4C8CNgdfzj0mrerGKVXHdRxdr/wB0h39N9aAZC77HXvZxHw3r+96sICzJmFbYz+Wy0AdAH63wkA4FRx6t+Vtr75ass/vC6AIgBgsKP/Nr95qwVA3gXY8x6o152fmu9GjFUVAXf85UMuOsDtR/+7gy0AdAHqF9v87rtwZbLlr6kiYO0hd34GuI3Wd8O1XgCMK6A9XYD6wr8I/unP6y4C1j6hAwBwir1x9l0dfAGQO+/9UF/4n/ZrdRQBq/c/MHkAMFMSne8kCoBxJXQ4/rDrPVFf+E//3r1f+GrtRcC86w4ABmY373wrAKbEfIgjgmsM/8Ldoy/OfQTwokWAhYAAtzjKElr3lkwBkB+E8Jz3R73hXyhzH4BFigAdAIBbPJd3vBUAM4qAS5nDgWoP/yaKAB0AgJtEtl1J6QmtJniRLAhsIPyni4CPPfl8tnLPmcqLAF0AgA+0duRvZwoA2wKbC//p0fpHv3al8iLAeQAAE3ttH/rTlQ6ALkCD4V9nEaADADDxRIpPKskCIF8k4YTAhsL/eBEwz/z9PEWAdQAA2ZVxph0oAEpetMyCwMbCv44iILoJigBgwJLa9teZAiBfLGEqoMHwnw7uqooA0wDAgJ1PbeFfVzoAxYLAq95DzYV/1UWADgAwUEmc99/ZAqCooDInBDYa/seLgHm+70lFgA4AMECd6GAnXwDk7ZNBLwhsI/yni4B5v/+sIsCNgYABSurEvy53AKIIiAWBe8I//ecxqwhwe2BgQA7yU22Tt9qhizq4qYBUwn/ZIsCBQMCAdGbx+h1deaLffu3Noyc/s/mH8aefG8I7KFrvf37r19mffv2r7MYbB5NHBGt2493Jr8UjAnb1o/c3+rzuevjRSUv/vX979dQ/F8/9vX9/LfvIX//t5Hm++7/+p38WgL6L436/15mc6drVvXZh6/XxB0PKGSKY79h44Kb/np5/jxX5q/d+eNLfMiPzP/zkx9nb//LMXM8pCoCytxMG6JjD8eORlLf99aEAiNR6ZfxY936r1vSK/eOH+MwqLt77+cFcRQDAAHw237reGStdvMrjIuDi+MOz3m8AJOByVxb+db4AyIuA6AKMvO8AaFGs+n+ki098tcMX3QFBAKSQRZ3U2QIgP2ThCe89AFpyOdU7/c1jpetX/9qFrZfHH855HwLQoDjr/7Nd/gFWe/AimAoAoEm9uFtt5wuAfM/lY96PADQ18OzCWf9D6AAUtw2+7D0JQM12U7/N76AKgLwIuDT+cOC9CUBNImN6s/h8tWcvTkwFWA8AQB3Od+mo30EVAPmczHnvUQAq9kSXt/wNoQOQ5XMzV7xXAahIzPv3LldW+/hKjV+omKOxHgCAZfVq3r/3BUDOegAAljHZ79+nef9BFAD5egDnAwCwqN7N+w+lA1CcD+B+AQCUdWWcIbt9/gFXhvAqXruw9cL4w7b3MwBz6Pw5/4PvAEyxKBCAeRxmA5k+XhnKK3rtwtbm+MPr48e69zcAM8Riv8/2ed5/iB0AiwIBuJ0nhhL+gyoA8iJgL3NSIAC3utz3RX/HrQzxVbYoEIApcdLf4AaHq0N8pfMXes97HmDwenvSnwLgZI9ldgYADNlh9v6iv0GeGrsy5FfezgCAwRrUin8FwOwi4Oz4wyuKAIBBeWTI4R9Wh/4OyN8AdgYADMf5oYe/AuDDIuCqIgBgMOG/6zIoAKaLgHhDXHYlAHprV/h/aMUluJkzAgB6G/46vQoARQCA8B82UwAzOCgIoDcGe9CPAmBxDgoC6H74D/agn9sxBXCKaxe24myAOCPgrKsBIPwVAIoAAIS/AkARAIDwVwAoAgAQ/goARQAAwl8BoAgAQPgrABQBAAh/BYAiAADhrwBQBAAg/BUAigAAhL8CQBEAIPxRAKRQBDybuYsgQF3c1U8BkHQh4FbCAMI/ee4GWLH8DbrrSgBU5orw1wHoUicgugAvuBIASzk/Dn+DKh2ATnUC4g2rYgVYzJHw1wHoeicgdgbEDoF1VwNg7vCPlf4HLoUOQJc7AZMtK+PHoasBcFvxb+Yjwl8HoE+dAGcFAJxub/x4zB5/BUBfCwHbBAFuZZtfw0wBNCx/g192JQA+8ITw1wEYUicgugBxcqDFgcBQRas/Wv57LoUCYGhFQKwHeHn82HQ1gIGJRX7nLfZTAAy5CFjPi4CRqwEMxNU8/C32UwAwLgRiOuCiKwH03OVx8F9yGRQA3FwEbGfWBQD9ZL5fAcBtioBYFxBbBZ0XAPTFQR7+hy6FAoDTi4D1vBOw7WoAHRd38nvCZVAAUK4Q2M5MCQDdVNzM56pLoQBgsSLAlADQNVr+CgAqKgJMCQBdoeWvAKCGQuBc3g0wJQCkxir/jnEvgA7J59Ieyd6/YxZAKuLfpgeFvw4AzXQDLo0/fNOVAFoe9cfBPldcCgUAzRYBFggCbbHQTwGAbgAwMI7zVQCgGwAMbNTvDn4KAHQDAKN+FADoBgB9tJeP+g9dCgUA3eoGfD1zbgBQnhX+CgA6XgRs5t2AkasBzCn29T9h1K8AoB+FgFMEgds5zIPfDXwGwEmAA5H/D/3g+KGdB8xyefx4RPjrANDvbkAsDoybC41cDRi8vcwiPwUAgysEtrP3twxuuhowOBH42v0KAAZcBMSagIuZ3QIwFLG6/zl7+lEAUBQCm3k3YNvVgN7azUf9Ry4FCgCOFwKjvBAYuRrQG3t58DvCFwUAcxUCsW1w09WAzjrIg3/PpUABQNlCYDuzUBC65jB7/xS/XZcCBQBVFAKxddBCQRD8KAAYWBFgxwCkabKyf/y4YoEfCgAUAiD4QQFArYXAlzNrBEDwowBgkMXAdmaxINTtMDPHjwKAhAuBmBo462qA4EcBwPAKgVHmQCFY1l4e/HsuBQoAulYIbGaOGIayYqT/nJP7UADQh0LAgkE4XbGwb9eteVEA0NdiYDsvBEauBkza/C+a30cBwJAKgegExILBKAicJ8DQRvtXM21+FAAoBnQFGIQI+2jzX7V/HwUAzO4KnMusFaA/o/3d7P02v9E+CgCYoxiIIuDv8mLAFAFdczUP/asuBQoAWKwQWM+LgKIYgFRp8aMAAMUAAwr9F/PQP3Q5UACAYgChDwoAUAzQcXvjxw+FPgoASLsgKIqBUWY3AYsp9urvZ+b0UQBAJ4uBs3khUBQEcJKDYqTvBjwoAKBfxcB6XgRs5R/dtnjYDvPAN8pHAQAKAgYS+Hvm8lEAALMKgmLqgO46yB8CHxQAULooKDoDRVGw6aok6Wg67ONzLX1QAEDVXYKiO/DpvCAwddBe2B/kYW90DwoAaK1TsJk/tqY+Z/mgj3D/6VTYG9mDAgA6URgUXYNPTnUM3ODoQ3v5x/2p0Bf0oACA3hYHZ6eKg/WpAqH4tT44zB9FwE8HvpAHBQBwQpGwmX04lTD9edg69sfrLBymg7wQI/Xf5p8XI/fJ5+NgP/DqAQAAAECb/r8AAwBfQ8St3vabjwAAAABJRU5ErkJggg=="/></svg>
        `,
      );

      editor.ui.registry.addAutocompleter('postmanautocomplete', {
        trigger: '@',
        minChars: 1,
        columns: 1,
        fetch: pattern => {
          const lowerPattern = pattern.toLowerCase();

          if (!lowerPattern.startsWith('postman')) {
            return Promise.resolve([]);
          }

          return getPostmanCollections().then(collections => {
            const search = lowerPattern.replace('postman', '').trim();

            const filtered = collections.filter(c => c.name.toLowerCase().includes(search));

            return filtered.map(c => ({
              type: 'autocompleteitem',
              value: `
                <span class="postman-link">
                  <img src="https://cdn.worldvectorlogo.com/logos/postman.svg" alt="Postman" class="postman-icon" />
                  <a href="${c.link}" target="_blank" class="postman-anchor">${c.name}</a>
                </span>&nbsp;
              `,
              text: c.name,
              icon: 'postmanicon',
            }));
          });
        },
        onAction: (autocompleteApi, rng, value) => {
          editor.selection.setRng(rng);
          editor.insertContent(value);
          autocompleteApi.hide();
        },
      });

      editor.ui.registry.addAutocompleter('carrierautocomplete', {
        trigger: '@',
        minChars: 1,
        columns: 1,
        fetch: pattern => {
          const carrierInfoOptions = getCarrierInfoOptions();

          const match = pattern.match(/^(product|addon|subcarrier|validation|service)\s*(.*)$/i);
          if (!match) return Promise.resolve([]);

          let type = match[1].toLowerCase();
          const search = match[2]?.toLowerCase() || '';

          if (type === 'service') type = 'product';

          const matches = carrierInfoOptions
            .filter(opt => opt.section.toLowerCase() === type && opt.label.toLowerCase().includes(search))
            .map(opt => ({
              type: 'autocompleteitem',
              value: opt.value,
              text: opt.label,
              icon: opt.section.toLowerCase() + 'icon',
            }));

          return Promise.resolve(matches);
        },

        onAction: (autocompleteApi, rng, value) => {
          editor.selection.setRng(rng);
          editor.insertContent(value);
          autocompleteApi.hide();
        },
      });

      editor.ui.registry.addMenuButton('aiMenu', {
        text: 'AI Tools',
        icon: 'ai-prompt',
        tooltip: 'AI Assistant Tools',
        fetch: callback => {
          callback([
            {
              type: 'menuitem',
              text: 'Suggest Subject Line',
              onAction: () => {
                improveSubjectCallback(editor);
              },
            },
            {
              type: 'menuitem',
              text: 'Suggest Release Note',
              onAction: () => {
                suggestReleaseNoteCallback(editor);
              },
            },
            {
              type: 'menuitem',
              text: 'Improve Description',
              onAction: () => {
                insertTemplateCallback(editor);
              },
            },
          ]);
        },
      });

      editor.addShortcut('ctrl+shift+l', 'Insert horizontal line', () => {
        editor.execCommand('InsertHorizontalRule');
      });
      editor.ui.registry.addMenuButton('templateMenu', {
        text: 'Templates',
        icon: 'template-add',
        tooltip: 'Insert predefined template',
        fetch: callback => {
          callback([
            {
              type: 'menuitem',
              text: 'Basic Template',
              onAction: () => {
                editor.insertContent(`
                  <h1>Business Case</h1>
                  <p>Describe why this task is needed, what problem it solves or what it improves.</p>
                  <h2>What to do</h2>
                  <p>List specific actions, like implementation steps or fixes.</p>
                `);
              },
            },
            {
              type: 'menuitem',
              text: 'Enable Addons Table',
              onAction: () => {
                editor.insertContent(`
                  <h1>Business Case</h1>
                   <p>Briefly describe why these addons or services are being enabled.
      
                  <h2>What to do</h2>
                  <p>List the services and addons that should be enabled, and indicate any special conditions.</p>
                  <table>
                    <thead>
                      <tr>
                        <th>@service</th>
                        <th>@service</th>
                        <th>@service</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>@addon</td>
                        <td>@addon</td>
                        <td>@addon</td>
                      </tr>
                    </tbody>
                  </table>
      
                  <h2>Validations</h2>'
                <p>  @validations</p>
                  <h2>How to test</h2>'
                  <p>Please use @postman try create example shipments.</p>
                `);
              },
            },
          ]);
        },
      });

      const doHighlight = () => {};

      editor.on('Change KeyUp SetContent', () => {
        const content = editor.getContent();
        localStorage.setItem('jiraFormDraftDescription', content);
      });
      editor.on('init', doHighlight);
      editor.on('SetContent', doHighlight);
      editor.on('Change', doHighlight);
    },
  };
};
