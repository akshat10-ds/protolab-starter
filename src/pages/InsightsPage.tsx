import {
  Card,
  Stack,
  Grid,
  Heading,
  Text,
  Icon,
  ProgressBar,
  PageHeader,
  Badge,
  Divider,
} from '@/design-system';

/* ═══════════════════════════════════════
   Summary Metrics
   ═══════════════════════════════════════ */

interface SummaryCard {
  label: string;
  value: string;
  change: string;
  changeKind: 'success' | 'warning';
  icon: string;
}

const summaryCards: SummaryCard[] = [
  { label: 'Average Completion Time', value: '2.4 days', change: '-18% vs last month', changeKind: 'success', icon: 'clock' },
  { label: 'Total Envelopes Sent', value: '3,847', change: '+24% vs last month', changeKind: 'success', icon: 'send' },
  { label: 'Signature Rate', value: '94.2%', change: '+2.1% vs last month', changeKind: 'success', icon: 'check' },
];

/* ═══════════════════════════════════════
   Top Senders
   ═══════════════════════════════════════ */

interface Sender {
  name: string;
  count: number;
  total: number;
}

const topSenders: Sender[] = [
  { name: 'Jane Smith', count: 142, total: 200 },
  { name: 'John Doe', count: 118, total: 200 },
  { name: 'Legal Team', count: 97, total: 200 },
  { name: 'HR Department', count: 84, total: 200 },
  { name: 'Sales Ops', count: 63, total: 200 },
];

/* ═══════════════════════════════════════
   Status Breakdown
   ═══════════════════════════════════════ */

interface StatusBreakdown {
  label: string;
  count: number;
  percentage: number;
  kind: 'success' | 'warning' | 'subtle' | 'emphasis';
}

const statusBreakdown: StatusBreakdown[] = [
  { label: 'Completed', count: 847, percentage: 66, kind: 'success' },
  { label: 'In Progress', count: 213, percentage: 17, kind: 'emphasis' },
  { label: 'Pending Review', count: 142, percentage: 11, kind: 'warning' },
  { label: 'Draft', count: 82, percentage: 6, kind: 'subtle' },
];

/* ═══════════════════════════════════════
   Insights Page
   ═══════════════════════════════════════ */

export default function InsightsPage() {
  return (
    <Stack gap="large">
      <PageHeader title="Insights" showAIBadge />

      {/* Summary Cards */}
      <Grid columns={3} gap="medium">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <Card.Body>
              <Stack gap="small">
                <Stack direction="horizontal" align="center" justify="between">
                  <Text size="sm" color="secondary">{card.label}</Text>
                  <Icon name={card.icon as any} size="medium" />
                </Stack>
                <Heading level={2}>{card.value}</Heading>
                <Badge kind={card.changeKind} text={card.change} startElement />
              </Stack>
            </Card.Body>
          </Card>
        ))}
      </Grid>

      {/* Two-column layout: Top Senders + Status Breakdown */}
      <Grid columns={2} gap="medium">
        {/* Top Senders */}
        <Card>
          <Card.Header>
            <Heading level={3}>Top Senders</Heading>
          </Card.Header>
          <Card.Body>
            <Stack gap="medium">
              {topSenders.map((sender) => (
                <ProgressBar
                  key={sender.name}
                  label={sender.name}
                  value={sender.count}
                  max={sender.total}
                  kind="info"
                  showLabel
                  showContent
                  content={`${sender.count} envelopes`}
                />
              ))}
            </Stack>
          </Card.Body>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <Card.Header>
            <Heading level={3}>Status Breakdown</Heading>
          </Card.Header>
          <Card.Body>
            <Stack gap="none">
              {statusBreakdown.map((status, index) => (
                <div key={status.label}>
                  {index > 0 && <Divider />}
                  <div style={{ padding: 'var(--ink-spacing-300) 0' }}>
                    <Stack direction="horizontal" align="center" justify="between">
                      <Stack direction="horizontal" align="center" gap="small">
                        <Badge kind={status.kind} text={status.label} />
                      </Stack>
                      <Stack direction="horizontal" align="center" gap="small">
                        <Text size="sm" weight="semibold">{status.count}</Text>
                        <Text size="xs" color="secondary">{status.percentage}%</Text>
                      </Stack>
                    </Stack>
                  </div>
                </div>
              ))}
            </Stack>

            {/* Overall completion bar */}
            <div style={{ marginTop: 'var(--ink-spacing-400)' }}>
              <ProgressBar
                label="Overall Completion Rate"
                value={66}
                max={100}
                kind="success"
                showLabel
                showContent
              />
            </div>
          </Card.Body>
        </Card>
      </Grid>
    </Stack>
  );
}
