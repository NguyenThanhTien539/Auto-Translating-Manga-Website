/* eslint-disable @typescript-eslint/no-explicit-any */
import { Editor } from "@tinymce/tinymce-react";

export default function TinyMCEEditor(props: {
  editorRef: any;
  value: string;
}) {
  const { editorRef, value } = props;
  return (
    <>
      <Editor
        apiKey={`${process.env.NEXT_PUBLIC_TINY_MCE }`}
        onInit={(_evt, editor) => (editorRef.current = editor)}
        initialValue={value}
        init={{
          height: 400,
          menubar: true,
          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "preview",
            "anchor",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "insertdatetime",
            "media",
            "table",
            "code",
            "help",
            "wordcount",
          ],
          toolbar: `undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help`,
        }}
      />
    </>
  );
}
