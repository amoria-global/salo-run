# Dashboard Components

Reusable components for the photographer dashboard.

## Components

### StatCard
Displays metric cards with value, trend, and icon.

```tsx
<StatCard
  title="Total Earnings"
  value="$2,600"
  percentage="52.76%"
  timeframe="last week"
  icon={<span>💰</span>}
  trend="up" // or "down"
/>
```

### HeaderStat
Simple stat display for header metrics.

```tsx
<HeaderStat label="Earnings" value="$9.64k" />
```

### ActivityItem
Individual activity item with label and value.

```tsx
<ActivityItem
  label="Customer"
  value="Joseph Mugabo"
  valueColor="#ff0066" // optional
/>
```

### ClientItem
Client card with avatar, name, event, and status.

```tsx
<ClientItem
  name="Kalisa Aime"
  event="Wedding"
  status="In Progress" // "In Progress" | "Completed" | "Pending"
  avatar="/avatars/kalisa.jpg"
  onMenuClick={() => {}} // optional
/>
```

### PaymentItem
Payment entry with avatar/logo, name, type, and amount.

```tsx
<PaymentItem
  name="Kalisa Aime"
  type="Earnings"
  amount="$1,950"
  avatar="/avatars/kalisa.jpg" // optional
  logo="/logos/amoria.png" // optional (use either avatar or logo)
/>
```

### PerformanceChart
Bar chart component for performance visualization.

```tsx
const data = [
  { day: 'Sun', value1: 130, value2: 150 },
  { day: 'Mon', value1: 90, value2: 100 },
  // ...
];

<PerformanceChart data={data} height={200} />
```

## Styling

The components use CSS classes defined in `dashboard.css`. Import the CSS file in your page:

```tsx
import './dashboard.css';
```

## Usage Example

See [dashboard.tsx](../../pages/photographers/dashboard.tsx) for a complete implementation example.
