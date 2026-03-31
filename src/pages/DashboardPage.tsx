import {
  Card,
  Badge,
  Icon,
  Stack,
  Grid,
  Heading,
  Text,
  PageHeader,
  Button,
  Divider,
} from '@/design-system';

/* ═══════════════════════════════════════
   Metric Cards
   ═══════════════════════════════════════ */

interface MetricCard {
  label: string;
  value: string;
  badgeText: string;
  badgeKind: 'success' | 'warning' | 'subtle' | 'emphasis';
  icon: string;
}

const metrics: MetricCard[] = [
  { label: 'Total Agreements', value: '1,284', badgeText: '+12% this month', badgeKind: 'success', icon: 'document-stack' },
  { label: 'Pending Review', value: '23', badgeText: '5 urgent', badgeKind: 'warning', icon: 'clock' },
  { label: 'Completed', value: '847', badgeText: 'On track', badgeKind: 'success', icon: 'check' },
  { label: 'Action Required', value: '8', badgeText: 'Needs attention', badgeKind: 'warning', icon: 'bolt' },
];

/* ═══════════════════════════════════════
   Recent Activity
   ═══════════════════════════════════════ */

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: string;
  badgeText: string;
  badgeKind: 'success' | 'warning' | 'subtle' | 'emphasis';
}

const recentActivity: ActivityItem[] = [
  { id: '1', title: 'NDA - Acme Corporation', description: 'Signed by all parties', time: '2 hours ago', icon: 'check', badgeText: 'Completed', badgeKind: 'success' },
  { id: '2', title: 'MSA - TechStart Inc', description: 'Waiting for John Doe to review', time: '4 hours ago', icon: 'clock', badgeText: 'Pending', badgeKind: 'warning' },
  { id: '3', title: 'SOW - Phase 2 Development', description: 'Draft saved by Jane Smith', time: '6 hours ago', icon: 'edit', badgeText: 'Draft', badgeKind: 'subtle' },
  { id: '4', title: 'Employment Agreement', description: 'Sent for signature to HR Team', time: 'Yesterday', icon: 'send', badgeText: 'Sent', badgeKind: 'emphasis' },
  { id: '5', title: 'Vendor Agreement - CloudCo', description: 'New comment from Legal', time: 'Yesterday', icon: 'comment', badgeText: 'Action Required', badgeKind: 'warning' },
];

/* ═══════════════════════════════════════
   Dashboard Page
   ═══════════════════════════════════════ */

export default function DashboardPage() {
  return (
    <Stack gap="large">
      <PageHeader
        title="Home"
        showAIBadge
        actions={<Button kind="brand">New Agreement</Button>}
      />

      {/* Metric Cards */}
      <Grid columns={4} gap="medium">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <Card.Body>
              <Stack gap="small">
                <Stack direction="horizontal" align="center" justify="between">
                  <Text size="sm" color="secondary">{metric.label}</Text>
                  <Icon name={metric.icon as any} size="medium" />
                </Stack>
                <Heading level={2}>{metric.value}</Heading>
                <Badge kind={metric.badgeKind} text={metric.badgeText} startElement />
              </Stack>
            </Card.Body>
          </Card>
        ))}
      </Grid>

      {/* Recent Activity */}
      <Card>
        <Card.Header>
          <Stack direction="horizontal" align="center" justify="between">
            <Heading level={3}>Recent Activity</Heading>
            <Button kind="tertiary" size="small">View All</Button>
          </Stack>
        </Card.Header>
        <Card.Body>
          <Stack gap="none">
            {recentActivity.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <Divider />}
                <div style={{ padding: 'var(--ink-spacing-300) 0' }}>
                  <Stack direction="horizontal" align="center" gap="medium">
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--ink-radius-200)',
                      background: 'var(--ink-bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon name={item.icon as any} size="medium" />
                    </div>
                    <Stack gap="none" style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" weight="medium">{item.title}</Text>
                      <Text size="xs" color="secondary">{item.description}</Text>
                    </Stack>
                    <Stack direction="horizontal" align="center" gap="small" style={{ flexShrink: 0 }}>
                      <Badge kind={item.badgeKind} text={item.badgeText} />
                      <Text size="xs" color="tertiary">{item.time}</Text>
                    </Stack>
                  </Stack>
                </div>
              </div>
            ))}
          </Stack>
        </Card.Body>
      </Card>
    </Stack>
  );
}
