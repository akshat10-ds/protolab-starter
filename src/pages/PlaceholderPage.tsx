import {
  Card,
  Icon,
  Stack,
  Heading,
  Text,
} from '@/design-system';

interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: 'var(--ink-spacing-600)',
    }}>
      <Card>
        <Card.Body>
          <Stack align="center" gap="medium" style={{ padding: 'var(--ink-spacing-600) var(--ink-spacing-800)' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--ink-radius-200)',
              background: 'var(--ink-bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon name="document-gear" size={32} />
            </div>
            <Heading level={3}>{title}</Heading>
            <Text size="sm" color="secondary" style={{ textAlign: 'center' }}>
              This page is under construction. Check back soon for updates.
            </Text>
          </Stack>
        </Card.Body>
      </Card>
    </div>
  );
}
