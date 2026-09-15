# Lazy Loading Components Guide

This guide explains how to use lazy-loaded components to improve LCP (Largest Contentful Paint) and overall page performance.

## Overview

Two main lazy-loading utilities are provided:

1. **LazyChart** - For chart components (Recharts-based)
2. **LazyModal** - For modal/dialog components

Both defer code loading until components are needed, reducing initial bundle size and improving LCP.

---

## LazyChart Usage

### Problem
Charts using Recharts add ~420KB to bundle. If chart is below the fold or rarely viewed, this slows down initial page load.

### Solution
Use `LazyChart` to load chart code only when:
- Chart becomes visible (intersection observer detects visibility)
- User scrolls within 500px of chart (anticipatory loading)

### Examples

#### Example 1: Simple Chart Component
```tsx
import { LazyChart } from './LazyChart';
import { lazy } from 'react';

// Define your chart component
const MyChart = lazy(() => import('./MyChart'));

function Dashboard() {
  return (
    <LazyChart 
      component={MyChart} 
      props={{
        data: chartData,
        options: { ... }
      }}
      height={400}
    />
  );
}
```

#### Example 2: Using createLazyChart Factory
```tsx
import { createLazyChart } from './LazyChart';

const LazyBarChart = createLazyChart(() => import('./BarChart'));

function Reports() {
  return (
    <LazyBarChart 
      data={reportData} 
      height={300}
    />
  );
}
```

#### Example 3: Multiple Charts with Different Loading
```tsx
function AnalyticsDashboard() {
  return (
    <>
      {/* Chart above fold - load immediately */}
      <RegularChart data={topData} />
      
      {/* Charts below fold - lazy load */}
      <LazyChart 
        component={lazy(() => import('./LineChart'))}
        props={{ data: trendData }}
        height={300}
      />
    </>
  );
}
```

---

## LazyModal Usage

### Problem
Modals add code to bundle even though they're hidden most of the time. Modal code only runs when modal is opened.

### Solution
Use `LazyModal` to load modal code only when modal is opened.

### Examples

#### Example 1: Detail Modal
```tsx
import { LazyModal } from './LazyModal';

function UserList() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <>
      {users.map(user => (
        <div key={user.id} onClick={() => setSelectedUser(user)}>
          {user.name}
        </div>
      ))}

      <LazyModal
        component={lazy(() => import('./UserDetailModal'))}
        componentProps={{ user: selectedUser }}
        title="User Details"
      />
    </>
  );
}
```

#### Example 2: Trigger with Custom Button
```tsx
import { LazyModal } from './LazyModal';
import { Button } from './ui/button';

function FormPage() {
  return (
    <LazyModal
      triggerElement={<Button>View History</Button>}
      component={lazy(() => import('./HistoryModal'))}
      title="History"
      description="View recent changes"
    />
  );
}
```

#### Example 3: Using createLazyModal Factory
```tsx
import { createLazyModal } from './LazyModal';

const LazyConfirmModal = createLazyModal(
  () => import('./ConfirmModal'),
  { title: 'Confirm Action', description: 'Are you sure?' }
);

function Toolbar() {
  const [action, setAction] = useState(null);

  return (
    <LazyConfirmModal 
      triggerElement={<Button onClick={() => setAction('delete')}>Delete</Button>}
      componentProps={{ action }}
    />
  );
}
```

---

## Performance Impact

### LazyChart
- **Benefit**: Defers ~420KB of Recharts code from initial bundle
- **When to use**: Charts below the fold or in secondary tabs
- **When NOT to use**: Charts above the fold that contribute to LCP

### LazyModal
- **Benefit**: Defers modal code (typically 5-50KB per modal)
- **When to use**: All modals (they're hidden until opened)
- **When NOT to use**: Very rarely - modals should almost always be lazy-loaded

---

## Best Practices

1. **Measure First**: Use PerformanceMonitor to see which components impact LCP
2. **Lazy-load Below the Fold**: Keep above-the-fold content instant
3. **Use Anticipatory Loading**: LazyChart loads 500px before visibility
4. **Combine Strategies**: Use lazy loading + code splitting + progressive rendering together
5. **Test on Slow Networks**: Simulate 4G to see loading placeholders

---

## Migration Guide

### Before (Heavy Component)
```tsx
import LineChart from './LineChart'; // Loads immediately

function Analytics() {
  return <LineChart data={data} />;
}
```

### After (Lazy Component)
```tsx
import { LazyChart } from './LazyChart';
import { lazy } from 'react';

function Analytics() {
  return (
    <LazyChart
      component={lazy(() => import('./LineChart'))}
      props={{ data }}
      height={400}
    />
  );
}
```

---

## Debugging

### Check Bundle Impact
```bash
# Build and analyze bundle size
npm run build
# Look for chart-lib size (should not be in main bundle)
```

### Check Loading State
```tsx
// Add console logging
<LazyChart
  component={MyChart}
  props={...}
  fallback={
    <div>
      <p>Loading chart...</p> {/* This shows during load */}
      <ChartSkeleton />
    </div>
  }
/>
```

### Monitor Intersection Observer
```tsx
// In LazyChart, add:
useEffect(() => {
  console.log('Intersection observer triggered', shouldLoad);
}, [shouldLoad]);
```

---

## Related Files
- `LazyChart.tsx` - Chart lazy loading component
- `LazyModal.tsx` - Modal lazy loading component
- `lazyLoad.tsx` - Page-level lazy loading utilities
- `performanceLogger.ts` - Performance tracking
