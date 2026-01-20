# Walking Customer Page - API Integration Documentation

## Overview
The Walking Customer page in the CRM has been fully integrated with the backend API, providing complete CRUD functionality and auto-collection features.

## Features Implemented

### 1. **Walk-in Customers Management**
- ✅ **View All Walk-in Customers**: Fetches customers with source='Walk-in' from API
- ✅ **Add New Customer**: Creates new walk-in customer records
- ✅ **Edit Customer**: Updates existing customer information
- ✅ **Delete Customer**: Soft-deletes customers (sets is_active=False)
- ✅ **View Customer Details**: Display full customer information in modal
- ✅ **Filter by Status**: Active/Inactive customer filtering
- ✅ **Search Functionality**: Search by name, phone, or email

### 2. **Customer Database (Auto-Collection)**
- ✅ **Auto-Collection Display**: Shows customers from all sources (Booking, Passport Lead, Area Branch)
- ✅ **Sync Now**: Triggers on-demand sync from bookings (last 30 days)
- ✅ **Source Filtering**: Filter by booking source
- ✅ **Real-time Stats**: Shows total and source-wise customer counts

### 3. **API Endpoints Used**

#### Get All Customers
```
GET /api/customers/customers/
```
Returns all active customers (with Walk-in source for walk-in tab)

#### Auto Collection
```
GET /api/customers/customers/auto_collection/
```
Returns merged customer list from all sources (de-duplicated)

#### Sync Customers
```
POST /api/customers/customers/auto_collection/
Body: { "cutoff_days": 30 }
```
Triggers sync from recent bookings

#### Create Customer
```
POST /api/customers/customers/manual-add/
Body: {
  "full_name": "string",
  "phone": "string",
  "email": "string",
  "city": "string",
  "source": "Walk-in"
}
```

#### Update Customer
```
PATCH /api/customers/customers/{id}/
Body: {
  "full_name": "string",
  "phone": "string",
  "email": "string",
  "city": "string"
}
```

#### Delete Customer (Soft Delete)
```
DELETE /api/customers/customers/{id}/
```
Sets is_active=False instead of hard delete

## Data Model

### Customer Fields
- `id`: Customer ID (auto-generated)
- `full_name`: Customer's full name (required)
- `phone`: Phone number (required, indexed)
- `email`: Email address (optional, indexed)
- `city`: City name (optional)
- `source`: Source of customer (Walk-in, Booking, Passport Lead, Area Branch)
- `branch`: Foreign key to Branch
- `organization`: Foreign key to Organization
- `is_active`: Boolean status
- `last_activity`: Timestamp of last activity
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## State Management

### Component State Variables
```javascript
// Main states
const [customers, setCustomers] = useState([]);           // Walk-in customers
const [allCustomers, setAllCustomers] = useState([]);     // All auto-collected customers
const [loading, setLoading] = useState(false);            // Loading state
const [syncing, setSyncing] = useState(false);            // Sync operation state
const [submitting, setSubmitting] = useState(false);      // Form submission state

// Form data
const [formData, setFormData] = useState({
  full_name: '',
  phone: '',
  email: '',
  city: '',
  source: 'Walk-in'
});

// Toast notifications
const [toast, setToast] = useState({ 
  show: false, 
  message: '', 
  variant: 'success' 
});
```

## Functions Implemented

### 1. `fetchWalkInCustomers()`
Fetches all walk-in customers from the API and updates state.

### 2. `fetchCustomerDatabase()`
Fetches auto-collected customers from all sources.

### 3. `handleAddCustomer()`
Creates a new walk-in customer via API.

### 4. `handleUpdateCustomer()`
Updates an existing customer's information.

### 5. `handleDeleteCustomer()`
Soft-deletes a customer (sets is_active=False).

### 6. `handleSyncNow()`
Triggers manual sync of customers from bookings.

### 7. `showToast(message, variant)`
Displays toast notification for user feedback.

## Permissions

The page respects the following permissions:
- `view_walking_customer_admin`: View walk-in customers
- `add_walking_customer_admin`: Add new walk-in customers
- `edit_walking_customer_admin`: Edit existing customers
- `delete_walking_customer_admin`: Delete customers
- `view_customer_database_admin`: View customer database
- `add_customer_database_admin`: Add to customer database
- `edit_customer_database_admin`: Edit customer database
- `delete_customer_database_admin`: Delete from database

## Error Handling

All API calls include comprehensive error handling:
- Network errors are caught and displayed as toast notifications
- API error messages are extracted and shown to users
- Loading states prevent duplicate submissions
- Form validation before API calls

## User Feedback

### Toast Notifications
Success and error messages are displayed using Bootstrap Toast:
- ✅ Success messages (green)
- ❌ Error messages (red)
- ⚠️ Warning messages (yellow)

### Loading States
- Spinner animations during data fetching
- Disabled buttons during submissions
- Loading text indicators ("Adding...", "Updating...", "Syncing...")

## Statistics Dashboard

### Walk-in Tab Stats
- Total Customers
- Active Customers
- Inactive Customers
- Total Revenue (placeholder)

### Database Tab Stats
- Total Collected
- From Bookings
- From Leads
- From Branches

## Filtering & Search

### Walk-in Customers
- All
- Active
- Inactive

### Customer Database
- All Sources
- From Bookings
- From Leads
- From Branches

### Search
Real-time search across:
- Customer name
- Phone number
- Email address

## Future Enhancements

1. **Booking Split Functionality**: Connect with backend API
2. **Export to Excel**: Implement data export
3. **Advanced Filters**: Date range, branch, organization
4. **Bulk Operations**: Select multiple customers for bulk actions
5. **Customer Activity Log**: Track all customer interactions
6. **Revenue Tracking**: Calculate actual revenue from bookings

## Testing Checklist

- [ ] Test adding new walk-in customer
- [ ] Test editing customer information
- [ ] Test deleting customer (soft delete)
- [ ] Test viewing customer details
- [ ] Test search functionality
- [ ] Test filtering (active/inactive)
- [ ] Test auto-collection sync
- [ ] Test database view with all sources
- [ ] Test permissions (show/hide based on user role)
- [ ] Test error handling with network issues
- [ ] Test form validation
- [ ] Test toast notifications

## Dependencies

- React Bootstrap (Modal, Button, Form, Table, Badge, etc.)
- Lucide React (Icons)
- Axios (HTTP client)
- Custom Permission Context

## Backend Requirements

Ensure the following backend endpoints are configured:
1. Customer ViewSet registered at `/api/customers/customers/`
2. Auto-collection endpoint at `/api/customers/customers/auto_collection/`
3. Manual-add endpoint at `/api/customers/customers/manual-add/`
4. Proper CORS configuration for API requests
5. JWT authentication enabled
6. Permission classes configured on ViewSets

## Known Issues & Solutions

### Issue: API returns 401 Unauthorized
**Solution**: Ensure JWT token is valid and stored in localStorage as 'accessToken'

### Issue: CORS errors
**Solution**: Configure CORS in Django settings to allow frontend domain

### Issue: Data not refreshing after operations
**Solution**: Component automatically refetches data after create/update/delete

## Contact & Support

For issues or questions, contact the development team or refer to:
- Backend API documentation: `/api/docs/` (Swagger)
- Customer models: `backend/customers/models.py`
- Customer views: `backend/customers/views.py`
