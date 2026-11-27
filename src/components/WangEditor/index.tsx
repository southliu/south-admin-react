import '@wangeditor-next/editor/dist/css/style.css';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor-next/editor';
import { Editor, Toolbar } from '@wangeditor-next/editor-for-react';
import { useState, useEffect, type HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { FILE_API } from '@/utils/config';

export interface EditorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: string; // 富文本内容
  onChange: (value: string) => void; // 处理更改内容
  height?: number; // 富文本高度
}

function WangEditor(props: EditorProps) {
  const { value, height, style, className, onChange } = props;
  const { t } = useTranslation();

  // editor 实例
  const [editor, setEditor] = useState<IDomEditor | null>(null);

  // 工具栏配置
  const toolbarConfig: Partial<IToolbarConfig> = {};

  // 编辑器配置
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: t('public.inputPleaseEnter'),
    MENU_CONF: {
      uploadImage: {
        // 上传图片地址
        server: FILE_API,
      },
      uploadVideo: {
        // 上传视频地址
        server: FILE_API,
      },
    },
  };

  // 及时销毁 editor ，重要！
  useEffect(() => {
    return () => {
      if (editor === null) return;
      editor.destroy();
    };
  }, [editor]);

  /**
   * 更改富文本内容
   * @param editor - 富文本编辑器实例，用于读取最新内容
   */
  const handleChange = (editor: IDomEditor) => {
    onChange(editor.getHtml());
  };

  return (
    <div className={className} style={{ ...(style || {}), border: '1px solid #ccc', zIndex: 100 }}>
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        style={{ borderBottom: '1px solid #ccc' }}
      />

      <Editor
        defaultConfig={editorConfig}
        value={value || ''}
        onCreated={setEditor}
        onChange={handleChange}
        mode="default"
        style={{ height: height || 300, overflowY: 'hidden' }}
      />
    </div>
  );
}

export default WangEditor;
