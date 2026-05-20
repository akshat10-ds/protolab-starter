# Mock Data Pipeline

This folder contains centralized mock data that was previously hardcoded in `App.tsx`.

## Structure

`mockData.json` contains the following datasets:

- **agreements** - Historical agreement records (11 items)
- **navigator** - Active/completed agreements with details (8 items)  
- **parties** - Business parties/companies (10 items)
- **requests** - Legal/document requests (7 items)
- **templates** - Document templates (10 items)
- **reports** - Reports and dashboards (10 items)
- **home** - Home page data (activity, overview, favorites)
- **insights** - Insights page data (recents, favorites)

## How to Update

Simply edit `mockData.json` and the changes will be reflected when you restart the dev server or rebuild.

**Example: Adding a new agreement**
```json
{
  "id": "12",
  "name": "New Agreement Name",
  "recipient": "To: New Person",
  "status": "Completed",
  "statusIcon": "status-check",
  "statusKind": "success",
  "date": "25/3/2026",
  "time": "14:30",
  "action": "Download"
}
```

## Benefits

✅ Single source of truth for all mock data  
✅ Easy to update without touching component code  
✅ All data in one place for quick reference  
✅ Version control friendly — JSON changes are easy to review
