import ReactMarkdown from 'react-markdown'

interface BusinessLogicContentProps {
  markdown: string
}

export default function BusinessLogicContent({ markdown }: BusinessLogicContentProps) {
  return (
    <div className="prose prose-invert prose-sm max-w-2xl w-full">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  )
}
