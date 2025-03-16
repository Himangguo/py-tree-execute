export interface CodeItem {
  id: string;
  code: string;
  pid?: string;
}

export interface PageData {
  pageId: string;
  title: string;
  desc: string;
  codeList: CodeItem[];
}

export interface TreeNode extends CodeItem {
  children?: TreeNode[];
} 