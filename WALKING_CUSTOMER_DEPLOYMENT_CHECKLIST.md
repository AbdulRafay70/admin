# Walking Customer Page - Deployment Checklist

## ✅ Pre-Deployment Verification

### Backend Requirements
- [ ] Django server is running on `http://localhost:8000`
- [ ] Customer app is installed and migrated
- [ ] Customer ViewSet is registered in URLs
- [ ] CORS is configured to allow frontend requests
- [ ] JWT authentication is enabled
- [ ] Permissions are properly set up in database

### API Endpoints Check
Run these commands to verify endpoints:
```bash
# Test customer list endpoint
curl -X GET http://localhost:8000/api/customers/customers/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test auto-collection endpoint
curl -X GET http://localhost:8000/api/customers/customers/auto_collection/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test manual-add endpoint
curl -X POST http://localhost:8000/api/customers/customers/manual-add/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Test User", "phone": "+92-300-1234567", "source": "Walk-in"}'
```

### Frontend Requirements
- [ ] React app is running
- [ ] Dependencies are installed (`npm install`)
- [ ] No console errors on page load
- [ ] JWT token is being stored in localStorage
- [ ] Permission context is working

### Database Check
```sql
-- Verify Customer table exists
SELECT * FROM customers_customer LIMIT 5;

-- Check permissions exist
SELECT * FROM auth_permission WHERE codename LIKE '%walking_customer%';

-- Verify user has permissions
SELECT u.username, p.codename 
FROM auth_user u
JOIN auth_user_user_permissions up ON u.id = up.user_id
JOIN auth_permission p ON up.permission_id = p.id
WHERE p.codename LIKE '%walking_customer%';
```

---

## 🧪 Functional Testing

### Test 1: Add Customer
- [ ] Navigate to CRM → Customer Management
- [ ] Click "Add Customer" button
- [ ] Fill in all required fields
- [ ] Submit form
- [ ] Verify success toast appears
- [ ] Check customer appears in table
- [ ] Verify customer in database

### Test 2: Edit Customer
- [ ] Click edit icon on a customer
- [ ] Modify customer information
- [ ] Save changes
- [ ] Verify success toast appears
- [ ] Check updated data in table
- [ ] Verify changes in database

### Test 3: View Customer
- [ ] Click view icon on a customer
- [ ] Verify all fields are displayed correctly
- [ ] Test "Edit Customer" button from view modal
- [ ] Close modal

### Test 4: Delete Customer
- [ ] Click delete icon on a customer
- [ ] Confirm deletion in modal
- [ ] Verify success toast appears
- [ ] Check customer is removed from active list
- [ ] Verify is_active=False in database (soft delete)

### Test 5: Search Functionality
- [ ] Enter customer name in search
- [ ] Verify filtered results
- [ ] Clear search
- [ ] Search by phone number
- [ ] Search by email
- [ ] Verify all searches work correctly

### Test 6: Filter Functionality
- [ ] Switch to "Active" filter
- [ ] Verify only active customers shown
- [ ] Switch to "Inactive" filter
- [ ] Verify only inactive customers shown
- [ ] Switch to "All" filter
- [ ] Verify all customers shown

### Test 7: Customer Database
- [ ] Switch to "Customer Database" tab
- [ ] Verify customers from all sources are shown
- [ ] Click "Sync Now"
- [ ] Wait for sync to complete
- [ ] Verify success message shows created/updated count
- [ ] Check database for new customers

### Test 8: Source Filtering
- [ ] In Customer Database tab
- [ ] Filter by "From Bookings"
- [ ] Filter by "From Leads"
- [ ] Filter by "From Branches"
- [ ] Filter by "All Sources"
- [ ] Verify correct filtering

### Test 9: Statistics
- [ ] Check Walk-in tab statistics update
- [ ] Check Customer Database statistics update
- [ ] Verify numbers are accurate

### Test 10: Permissions
- [ ] Test with user having all permissions
- [ ] Test with user having only view permission
- [ ] Test with user having no permissions
- [ ] Verify UI elements show/hide correctly

---

## 🔧 Error Handling Tests

### Test Network Errors
- [ ] Disconnect internet
- [ ] Try to add customer
- [ ] Verify error toast appears
- [ ] Reconnect internet
- [ ] Retry operation
- [ ] Verify success

### Test Invalid Data
- [ ] Try to submit empty form
- [ ] Verify validation message
- [ ] Try duplicate phone number
- [ ] Verify error handling

### Test Session Expiry
- [ ] Clear localStorage token
- [ ] Try any operation
- [ ] Verify proper error handling
- [ ] Re-login
- [ ] Retry operation

---

## 📊 Performance Tests

### Load Time
- [ ] Page loads in < 2 seconds
- [ ] API calls complete in < 1 second
- [ ] No memory leaks (check DevTools)

### Large Dataset
- [ ] Test with 100+ customers
- [ ] Verify search performance
- [ ] Check filter performance
- [ ] Verify table rendering

---

## 🔐 Security Tests

### Authentication
- [ ] Try accessing without token
- [ ] Verify redirect or error
- [ ] Test with expired token
- [ ] Verify proper handling

### Authorization
- [ ] Test each permission separately
- [ ] Verify unauthorized actions are blocked
- [ ] Check backend also enforces permissions

### Data Validation
- [ ] Try SQL injection in forms
- [ ] Try XSS attacks in text fields
- [ ] Verify proper sanitization

---

## 📱 Responsive Design Tests

### Desktop (1920x1080)
- [ ] Layout looks correct
- [ ] All buttons accessible
- [ ] Tables are readable

### Laptop (1366x768)
- [ ] Layout adjusts properly
- [ ] No horizontal scrolling issues
- [ ] Modals fit on screen

### Tablet (768x1024)
- [ ] Mobile-friendly layout
- [ ] Touch-friendly buttons
- [ ] Tables scroll horizontally

---

## 🌐 Browser Compatibility

### Chrome
- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly

### Firefox
- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly

### Safari (if available)
- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly

### Edge
- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly

---

## 📝 Documentation Review

### Code Documentation
- [ ] Functions have clear comments
- [ ] Complex logic is explained
- [ ] Variable names are descriptive

### User Documentation
- [ ] User guide is complete
- [ ] Screenshots are clear (if added)
- [ ] Troubleshooting section is helpful

### Technical Documentation
- [ ] API endpoints documented
- [ ] Data models explained
- [ ] Integration guide is clear

---

## 🚀 Deployment Steps

### 1. Code Review
- [ ] Review all changes
- [ ] Check for hardcoded values
- [ ] Verify environment variables

### 2. Backup
- [ ] Backup current database
- [ ] Backup current code
- [ ] Document rollback procedure

### 3. Deploy Backend
- [ ] Run migrations
- [ ] Restart Django server
- [ ] Verify API endpoints

### 4. Deploy Frontend
- [ ] Build React app (`npm run build`)
- [ ] Deploy to server
- [ ] Verify static files

### 5. Post-Deployment
- [ ] Run smoke tests
- [ ] Monitor error logs
- [ ] Check performance metrics

---

## 📞 Support Plan

### Monitoring
- [ ] Set up error logging
- [ ] Monitor API response times
- [ ] Track user activity

### Support Channels
- [ ] Email support ready
- [ ] Help desk tickets configured
- [ ] Documentation accessible

### Escalation Path
1. Level 1: User Guide
2. Level 2: Technical Support
3. Level 3: Developer Team

---

## ✅ Sign-Off

### Developer Sign-Off
- [ ] All code reviewed
- [ ] All tests passed
- [ ] Documentation complete
- [ ] Ready for QA

**Developer**: _________________  
**Date**: _________________

### QA Sign-Off
- [ ] Functional tests passed
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Ready for production

**QA Engineer**: _________________  
**Date**: _________________

### Product Owner Sign-Off
- [ ] Features meet requirements
- [ ] User experience acceptable
- [ ] Ready for deployment

**Product Owner**: _________________  
**Date**: _________________

---

## 🎉 Go-Live Checklist

Final checks before going live:
- [ ] All sign-offs complete
- [ ] Backup verified
- [ ] Rollback plan ready
- [ ] Monitoring in place
- [ ] Support team briefed
- [ ] Users notified
- [ ] Documentation published

**Go-Live Date**: _________________  
**Go-Live Time**: _________________  
**Responsible Person**: _________________

---

## 📊 Success Metrics

Track these metrics post-deployment:
- [ ] Page load time < 2 seconds
- [ ] API response time < 1 second
- [ ] Error rate < 1%
- [ ] User satisfaction > 90%
- [ ] Support tickets < 5 per week

---

**Document Version**: 1.0  
**Last Updated**: January 20, 2026  
**Next Review**: February 20, 2026
