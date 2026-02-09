// Services (Database Abstraction Layer)
export { templateApi, folderApi, historyApi, commentApi } from './services/templateApi'
export { default as templateServices } from './services/templateApi'

// Hooks
export { useTemplates } from './hooks/useTemplates'
export { useTemplateFolders } from './hooks/useTemplateFolders'
export { useTemplateEditor } from './hooks/useTemplateEditor'
export { useTemplateHistory } from './hooks/useTemplateHistory'
export { useTemplateComments } from './hooks/useTemplateComments'
export { useCurrentUser } from './hooks/useCurrentUser'

// Components
export { TemplateCard } from './components/TemplateCard'
export { TemplateBoard } from './components/TemplateBoard'
export { TemplateList } from './components/TemplateList'
export { AddTemplateModal } from './components/AddTemplateModal'
export { TemplateDetailPanel } from './components/TemplateDetailPanel'
export { BlockEditor } from './components/BlockEditor'
export { Block } from './components/Block'
export { BlockMenu } from './components/BlockMenu'
export { FolderTree } from './components/FolderTree'
export { VariableHighlighter, extractVariables, replaceVariables } from './components/VariableHighlighter'
export { CopyButton } from './components/CopyButton'
export { VersionHistory } from './components/VersionHistory'

// Collaboration Components (Phase 5)
export { CommentThread } from './components/CommentThread'
export { CommentBubble, FloatingCommentButton, CommentIndicator } from './components/CommentBubble'

// Block Types
export * from './components/blocks'
