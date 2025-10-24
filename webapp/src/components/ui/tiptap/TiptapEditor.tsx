import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import './TiptapEditor.css';

interface TiptapEditorProps {
    content: string;
    onChange: (content: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    return (
        <div className="tiptap-menubar">
            {/* Text Formatting */}
            <div className="menu-group">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'is-active' : ''}
                    title="Bold (Ctrl+B)"
                >
                    <span className="material-icons">format_bold</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'is-active' : ''}
                    title="Italic (Ctrl+I)"
                >
                    <span className="material-icons">format_italic</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={editor.isActive('underline') ? 'is-active' : ''}
                    title="Underline (Ctrl+U)"
                >
                    <span className="material-icons">format_underlined</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={editor.isActive('strike') ? 'is-active' : ''}
                    title="Strikethrough"
                >
                    <span className="material-icons">strikethrough_s</span>
                </button>
            </div>

            {/* Headings */}
            <div className="menu-group">
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                    title="Heading 1"
                >
                    H1
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                    title="Heading 2"
                >
                    H2
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                    title="Heading 3"
                >
                    H3
                </button>
            </div>

            {/* Lists */}
            <div className="menu-group">
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive('bulletList') ? 'is-active' : ''}
                    title="Bullet List"
                >
                    <span className="material-icons">format_list_bulleted</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive('orderedList') ? 'is-active' : ''}
                    title="Numbered List"
                >
                    <span className="material-icons">format_list_numbered</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    className={editor.isActive('taskList') ? 'is-active' : ''}
                    title="Task List"
                >
                    <span className="material-icons">checklist</span>
                </button>
            </div>

            {/* Alignment */}
            <div className="menu-group">
                <button
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
                    title="Align Left"
                >
                    <span className="material-icons">format_align_left</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
                    title="Align Center"
                >
                    <span className="material-icons">format_align_center</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
                    title="Align Right"
                >
                    <span className="material-icons">format_align_right</span>
                </button>
            </div>

            {/* Blocks */}
            <div className="menu-group">
                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={editor.isActive('blockquote') ? 'is-active' : ''}
                    title="Blockquote"
                >
                    <span className="material-icons">format_quote</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={editor.isActive('codeBlock') ? 'is-active' : ''}
                    title="Code Block"
                >
                    <span className="material-icons">integration_instructions</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Horizontal Rule"
                >
                    <span className="material-icons">horizontal_rule</span>
                </button>
            </div>

            {/* Links & Images */}
            <div className="menu-group">
                <button
                    onClick={() => {
                        if (editor.isActive('link')) {
                            // If already a link, remove it
                            editor.chain().focus().unsetLink().run();
                        } else {
                            // Create new link
                            const url = window.prompt('Enter URL:');
                            if (url) {
                                editor.chain().focus().setLink({ href: url, target: '_blank' }).run();
                            }
                        }
                    }}
                    className={editor.isActive('link') ? 'is-active' : ''}
                    title={editor.isActive('link') ? 'Remove Link' : 'Insert Link'}
                >
                    <span className="material-icons">{editor.isActive('link') ? 'link_off' : 'link'}</span>
                </button>
                <button
                    onClick={() => {
                        const url = window.prompt('Enter image URL:');
                        if (url) {
                            editor.chain().focus().setImage({ src: url }).run();
                        }
                    }}
                    title="Insert Image"
                >
                    <span className="material-icons">image</span>
                </button>
            </div>

            {/* Undo/Redo */}
            <div className="menu-group">
                <button
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo (Ctrl+Z)"
                >
                    <span className="material-icons">undo</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo (Ctrl+Y)"
                >
                    <span className="material-icons">redo</span>
                </button>
            </div>
        </div>
    );
};

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
            }),
            Image,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    return (
        <div className="tiptap-editor-container">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} className="tiptap-editor-content" />
        </div>
    );
};

export default TiptapEditor;
