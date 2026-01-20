# Walking Customer Page - User Guide

## Quick Start Guide

### Accessing the Page
Navigate to: **CRM → Customer Management → Customers**

## Main Features

### 📋 **1. View Walk-in Customers**
- Default view shows all walk-in customers
- Filter by: All / Active / Inactive
- Search by name, phone, or email
- View customer statistics at the top

### ➕ **2. Add New Customer**
1. Click **"Add Customer"** button (requires permission)
2. Fill in required fields:
   - Customer Name *
   - Phone Number *
   - Email (optional)
   - City (optional)
3. Click **"Add Customer"**
4. Success notification will appear

### ✏️ **3. Edit Customer**
1. Click the **pencil icon** (Edit) in the Actions column
2. Update customer information
3. Click **"Update Customer"**
4. Changes are saved immediately

### 👁️ **4. View Customer Details**
1. Click the **eye icon** (View) in the Actions column
2. See full customer information
3. Click **"Edit Customer"** to make changes

### 🗑️ **5. Delete Customer**
1. Click the **trash icon** (Delete) in the Actions column
2. Confirm deletion
3. Customer is soft-deleted (can be recovered by admin)

### 💾 **6. Customer Database (Auto-Collection)**
Switch to **"Customer Database"** tab to:
- View all auto-collected customers
- Filter by source (Bookings, Leads, Branches)
- Click **"Sync Now"** to fetch latest customers from bookings

### 📊 **7. Statistics Dashboard**
View real-time statistics:
- **Walk-in Tab**: Total, Active, Inactive customers
- **Database Tab**: Total collected, By source breakdown

## Keyboard Shortcuts
- `ESC` - Close any modal
- `Ctrl + F` - Focus search box (browser default)

## Tips & Best Practices

### ✅ Data Entry
- Always include phone number (required for de-duplication)
- Add email when available for better customer tracking
- Use consistent phone format: +92-XXX-XXXXXXX

### ✅ Search
- Search works instantly as you type
- Searches across: Name, Phone, Email
- Clear search to see all customers

### ✅ Permissions
If you don't see certain buttons:
- Contact your administrator
- Required permissions:
  - `view_walking_customer_admin`
  - `add_walking_customer_admin`
  - `edit_walking_customer_admin`
  - `delete_walking_customer_admin`

## Troubleshooting

### ❌ **"Failed to fetch customers"**
**Solution**: 
- Check your internet connection
- Refresh the page
- Contact IT if issue persists

### ❌ **"Failed to add/update customer"**
**Causes**:
- Missing required fields
- Duplicate phone number (already exists)
- Network issues

**Solution**:
- Verify all required fields are filled
- Check if customer already exists
- Try again after a moment

### ❌ **Cannot see "Add Customer" button**
**Cause**: Missing permission

**Solution**: Contact administrator to request `add_walking_customer_admin` permission

## Common Workflows

### 🔄 **Workflow 1: Add Walk-in Customer**
```
1. Customer visits office
2. Click "Add Customer"
3. Enter: Name, Phone, Email, City
4. Click "Add Customer"
5. Customer record created ✓
```

### 🔄 **Workflow 2: Update Customer Info**
```
1. Search for customer
2. Click Edit icon
3. Update information
4. Click "Update Customer"
5. Changes saved ✓
```

### 🔄 **Workflow 3: Sync Customer Database**
```
1. Switch to "Customer Database" tab
2. Click "Sync Now"
3. Wait for sync to complete
4. View newly collected customers ✓
```

## Data Fields Explained

| Field | Description | Required |
|-------|-------------|----------|
| Customer Name | Full name of the customer | Yes |
| Phone Number | Contact number with country code | Yes |
| Email | Email address for communication | No |
| City | Customer's city of residence | No |
| Source | Origin of customer data (auto-set) | Yes |
| Status | Active/Inactive status | Auto |
| Last Activity | Last interaction timestamp | Auto |

## Notifications

### Success Messages
- ✅ "Customer added successfully!"
- ✅ "Customer updated successfully!"
- ✅ "Customer deleted successfully!"
- ✅ "Sync completed! Created: X, Updated: Y"

### Error Messages
- ❌ "Please fill in all required fields"
- ❌ "Failed to add customer"
- ❌ "Failed to fetch customers"

## Support

For technical support or feature requests:
- Contact: IT Department
- Email: support@example.com
- Documentation: `/admin/WALKING_CUSTOMER_API_INTEGRATION.md`

---

**Last Updated**: January 2026
**Version**: 2.0
