// src/components/TextEditor/Tiptap.jsx
import { EditorProvider, useCurrentEditor, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    Bold, Italic, Strikethrough, List, ListOrdered,
    Heading1, Heading2, Heading3, Quote, Code,
    Undo, Redo, Code2, Minus, AlignLeft,
    AlignCenter, AlignRight
} from 'lucide-react';
import TextAlign from '@tiptap/extension-text-align';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './styles.scss';

const extensions = [
    StarterKit.configure({
        heading: {
            levels: [1, 2, 3],
        },
    }),
    TextAlign.configure({
        types: ['heading', 'paragraph'],
    }),
];

const MenuBar = () => {
    const { editor } = useCurrentEditor();
    const { t } = useTranslation();

    if (!editor) {
        return null;
    }

    return (
        <div className="tiptap-toolbar single-line">
            <div className="toolbar-group">
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'is-active' : ''}
                    title={t('editor.bold')}
                >
                    <Bold size={16} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'is-active' : ''}
                    title={t('editor.italic')}
                >
                    <Italic size={16} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run() }}
                    disabled={!editor.can().chain().focus().toggleStrike().run()}
                    className={editor.isActive('strike') ? 'is-active' : ''}
                    title={t('editor.strikethrough')}
                >
                    <Strikethrough size={16} />
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run() }}
                    className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                    title={t('editor.heading_n', { n: 1 })}
                >
                    <Heading1 size={16} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }}
                    className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                    title={t('editor.heading_n', { n: 2 })}
                >
                    <Heading2 size={16} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run() }}
                    className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                    title={t('editor.heading_n', { n: 3 })}
                >
                    <Heading3 size={16} />
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
                    className={editor.isActive('bulletList') ? 'is-active' : ''}
                    title={t('editor.bullet_list')}
                >
                    <List size={16} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }}
                    className={editor.isActive('orderedList') ? 'is-active' : ''}
                    title={t('editor.numbered_list')}
                >
                    <ListOrdered size={16} />
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run() }}
                    className={editor.isActive('blockquote') ? 'is-active' : ''}
                    title={t('editor.blockquote')}
                >
                    <Quote size={16} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleCodeBlock().run() }}
                    className={editor.isActive('codeBlock') ? 'is-active' : ''}
                    title={t('editor.code_block')}
                >
                    <Code2 size={16} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().setHorizontalRule().run() }}
                    title={t('editor.horizontal_rule')}
                >
                    <Minus size={16} />
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run() }}
                    className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
                    title={t('editor.align_left')}
                >
                    <AlignLeft size={16} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run() }}
                    className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
                    title={t('editor.align_center')}
                >
                    <AlignCenter size={16} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run() }}
                    className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
                    title={t('editor.align_right')}
                >
                    <AlignRight size={16} />
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().undo().run() }}
                    disabled={!editor.can().undo()}
                    title={t('editor.undo')}
                >
                    <Undo size={16} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().redo().run() }}
                    disabled={!editor.can().redo()}
                    title={t('editor.redo')}
                >
                    <Redo size={16} />
                </button>
            </div>
        </div>
    );
};

const CustomBubbleMenu = () => {
    const { editor } = useCurrentEditor();
    const { t } = useTranslation();

    if (!editor) {
        return null;
    }

    return (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="bubble-menu">
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
                    className={editor.isActive('bold') ? 'is-active' : ''}
                    title={t('editor.bold')}
                >
                    <Bold size={16} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
                    className={editor.isActive('italic') ? 'is-active' : ''}
                    title={t('editor.italic')}
                >
                    <Italic size={16} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run() }}
                    className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                    title={t('editor.heading_n', { n: 1 })}
                >
                    H1
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }}
                    className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                    title={t('editor.heading_n', { n: 2 })}
                >
                    <Heading2 size={16} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run() }}
                    className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                    title={t('editor.heading_n', { n: 3 })}
                >
                    <Heading3 size={16} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
                    className={editor.isActive('bulletList') ? 'is-active' : ''}
                    title={t('editor.bullet_list')}
                >
                    <List size={16} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }}
                    className={editor.isActive('orderedList') ? 'is-active' : ''}
                    title={t('editor.numbered_list')}
                >
                    <ListOrdered size={16} />
                </button>
            </div>
        </BubbleMenu>
    );
};

const Tiptap = ({ content = '', onUpdate }) => {
    const handleUpdate = useCallback(({ editor }) => {
        if (onUpdate) {
            const html = editor.getHTML();
            onUpdate(html);
        }
    }, [onUpdate]);

    return (
        <div className="tiptap-container">
            <EditorProvider
                extensions={extensions}
                content={content}
                onUpdate={handleUpdate}
            >
                <MenuBar />
                <CustomBubbleMenu />
            </EditorProvider>
        </div>
    );
};

export default Tiptap;