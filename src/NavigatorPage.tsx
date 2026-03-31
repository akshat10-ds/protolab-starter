import { useState } from 'react';
import {
  AgentPanel,
  AIChat,
  Banner,
  DocuSignShell,
  AgreementTableView,
  PageHeader,
  FilterBar,
  Button,
  IconButton,
} from '@/design-system';
import type { ChatMessage } from '@/design-system/5-patterns/AIChat/AIChat';

const globalNavConfig = {
  logo: <img src="/docusign-logo.svg" alt="DocuSign" />,
  navItems: [
    { id: 'home', label: 'Home', href: '#' },
    { id: 'navigator', label: 'Navigator', href: '#', active: true },
    { id: 'templates', label: 'Templates', href: '#' },
    { id: 'insights', label: 'Insights', href: '#' },
    { id: 'admin', label: 'Admin', href: '#' },
  ],
  showSearch: true,
  showNotifications: true,
  notificationCount: 3,
  showSettings: true,
  user: { name: 'Jane Smith', email: 'jane@example.com' },
};

const localNavConfig = {
  headerLabel: 'Start',
  sections: [
    {
      id: 'main',
      items: [
        { id: 'all-agreements', label: 'All Agreements' },
        { id: 'drafts', label: 'Drafts' },
        { id: 'in-progress', label: 'In Progress' },
        { id: 'completed', label: 'Completed', active: true },
        { id: 'deleted', label: 'Deleted' },
      ],
    },
    {
      id: 'folders',
      title: 'Folders',
      headerLabel: true,
      hasDivider: true,
      items: [
        { id: 'folders-all', label: 'All Folders' },
        { id: 'folders-procurement', label: 'Procurement' },
        { id: 'folders-legal', label: 'Legal' },
      ],
    },
  ],
};

const SUGGESTED_ACTIONS = [
  {
    label: 'Summarize this agreement',
    description: 'Get a quick overview of key terms and obligations',
    icon: 'document',
  },
  {
    label: 'Find key clauses',
    description: 'Identify important clauses like indemnity, liability, and termination',
    icon: 'search',
  },
  {
    label: 'Compare agreements',
    description: 'Spot differences between two or more documents',
    icon: 'arrows-left-right',
  },
];

const SUGGESTED_QUESTIONS = [
  'What are the payment terms?',
  'Who are the parties involved?',
  'When does this agreement expire?',
  'Are there any renewal clauses?',
];

export default function NavigatorPage() {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSendMessage = (content: string) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `I can help you with that. Here's what I found based on your agreements: "${content}"`,
        timestamp: new Date(),
        status: 'sent',
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <DocuSignShell globalNav={globalNavConfig} localNav={localNavConfig}>
      {bannerVisible && (
        <Banner
          kind="promo"
          icon="ai-spark-filled"
          closable
          onClose={() => setBannerVisible(false)}
          action={{ label: 'Learn more', href: '#' }}
        >
          Meet your AI-powered agreement assistant — ask questions, surface insights, and act on your documents faster.
        </Banner>
      )}

      <AgreementTableView
        paddingVariant="compact"
        pageHeader={
          <PageHeader
            title="Navigator"
            showAIBadge
            actions={
              <>
                <IconButton
                  icon="ai-spark-filled"
                  variant={isPanelOpen ? 'primary' : 'tertiary'}
                  size="small"
                  aria-label="Toggle AI assistant"
                  onClick={() => setIsPanelOpen((v) => !v)}
                />
                <IconButton
                  icon="settings"
                  variant="tertiary"
                  size="small"
                  aria-label="Table settings"
                />
              </>
            }
          />
        }
        filterBar={
          <FilterBar
            viewSelector={
              <Button kind="secondary" size="small" menuTrigger>
                All Agreements
              </Button>
            }
            search={{
              value: searchValue,
              onChange: setSearchValue,
              placeholder: 'Try keywords or phrases',
            }}
            showSearchIndicator
            filters={
              <Button kind="secondary" size="small" menuTrigger>
                Filters
              </Button>
            }
          />
        }
      >
        {null}
      </AgreementTableView>

      <AgentPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title="AI Assistant"
        subtitle="Powered by Docusign AI"
      >
        <AIChat
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          userName="Jane"
          assistantName="Docusign AI"
          welcomeTitle="What would you like to know about your agreements?"
          suggestedActions={SUGGESTED_ACTIONS}
          suggestedActionsTitle="Prompts"
          suggestedActionsActionText="See all"
          suggestedQuestions={SUGGESTED_QUESTIONS}
          suggestedQuestionsTitle="Questions you can ask"
          onSuggestionClick={handleSuggestionClick}
          showFeedback
          placeholder="Ask anything about your agreements..."
          contextSource={{
            label: 'agreements',
            count: 7,
          }}
        />
      </AgentPanel>
    </DocuSignShell>
  );
}
