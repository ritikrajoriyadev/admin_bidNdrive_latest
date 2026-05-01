# Toast Notification System

A global toast notification system for the BidNDrive Admin dashboard.

## Features

✅ Success, Error, Warning, and Info notifications  
✅ Auto-dismiss after 3 seconds (configurable)  
✅ Beautiful animations and styling  
✅ Easy-to-use React Hook  
✅ Global context provider  
✅ Custom positions and durations  

## Setup

The toast system is already set up in the project:

1. **ToastContext** (`src/context/ToastContext.jsx`) - Manages toast state and logic
2. **Toast Component** (`src/components/Toast.jsx`) - Individual toast UI
3. **ToastContainer** (`src/components/ToastContainer.jsx`) - Renders all toasts
4. **useToast Hook** (`src/hooks/useToast.js`) - Easy access to toast functionality
5. **App Integration** - Wrapped in `src/App.jsx` with provider and container

## Usage

### Basic Usage

Import and use the `useToast` hook in any component:

```jsx
import { useToast } from '../hooks/useToast';

export default function MyComponent() {
  const toast = useToast();

  const handleClick = () => {
    toast.success('Operation successful! 🎉');
    // or
    // toast.error('Something went wrong');
    // toast.warning('Please be careful');
    // toast.info('Here is some info');
  };

  return <button onClick={handleClick}>Show Toast</button>;
}
```

### Toast Types

```jsx
const toast = useToast();

// Success - Green
toast.success('Technician created successfully! 🎉');

// Error - Red
toast.error('Failed to create technician');

// Warning - Amber
toast.warning('Are you sure about this action?');

// Info - Indigo
toast.info('Loading your data...');
```

### Custom Duration

Each toast method accepts an optional duration parameter (in milliseconds):

```jsx
// Show for 5 seconds
toast.success('This will dismiss in 5 seconds', 5000);

// Never auto-dismiss (0 or omit)
toast.warning('This requires manual dismissal', 0);
```

### Full Options

You can also use the `addToast` method directly for full control:

```jsx
const { addToast } = useToast();

// addToast(message, type, duration)
addToast('Custom message', 'success', 3000);
```

## Examples in Use

### Enquiries.jsx
```jsx
const handleStatusChange = (id, newStatus) => {
  setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
  setSelected(prev => prev?.id === id ? { ...prev, status: newStatus } : prev);
  toast.success(`Enquiry status updated to ${newStatus}`);
};
```

### Technicians.jsx
```jsx
const handleCreateTechnician = async (e) => {
  e.preventDefault();
  if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
    toast.error('Please fill all required fields');
    return;
  }
  
  try {
    // API call...
    toast.success('Technician created successfully! 🎉');
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to create technician');
  }
};
```

### User.jsx
```jsx
const handleStatusChange = async (userId, newStatus) => {
  toast.info(`Status updated to ${newStatus}`);
  setSelectedUser(prev => prev ? { ...prev, status: newStatus } : null);
  fetchUsers();
};
```

## Styling

Toast notifications appear in the **bottom-right corner** of the screen with:

- **Success**: Green background with checkmark icon
- **Error**: Red background with X icon
- **Warning**: Amber background with warning icon
- **Info**: Indigo background with info icon

All toasts have:
- Smooth slide-in animation
- Backdrop blur effect
- Close button
- Auto-dismiss after 3 seconds (unless configured)

## Files Modified/Created

### Created
- `src/context/ToastContext.jsx` - Toast state management
- `src/components/Toast.jsx` - Individual toast component
- `src/components/ToastContainer.jsx` - Toast container
- `src/hooks/useToast.js` - Custom hook

### Modified
- `src/App.jsx` - Added ToastProvider and ToastContainer
- `src/pages/Enquiries.jsx` - Using toast instead of alerts
- `src/pages/Technicians.jsx` - Using toast for feedback
- `src/pages/User.jsx` - Using toast for notifications

## Best Practices

1. **Use appropriate types**: Success for positive actions, Error for failures, Warning for caution, Info for notifications
2. **Keep messages short**: Toasts are meant to be quick feedback, not detailed messages
3. **Use emojis sparingly**: Add them only for important success messages
4. **Don't overuse**: Too many toasts can be annoying - show them only when necessary
5. **Always catch errors**: Show error toasts when API calls fail

## Error Handling Example

```jsx
try {
  const response = await axios.post(...);
  toast.success('Data saved successfully!');
} catch (error) {
  toast.error(error.response?.data?.message || 'Failed to save data');
  console.error(error);
}
```

## No More Alerts!

Replace all `alert()` calls with appropriate toast messages for a better user experience:

```jsx
// Before
alert('Success!');
alert('Error occurred');

// After
toast.success('Operation completed successfully!');
toast.error('An error occurred. Please try again.');
```
