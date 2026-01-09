# CV Manager for Professors

A comprehensive web application designed specifically for professors to manage their academic CVs with advanced features including points calculation, admin oversight, and secure authentication.

## Overview

This application allows professors to create, edit, and maintain their academic CVs with automatic points calculation based on their academic achievements. The system includes intellectual and professional scoring, year-based filtering, and comprehensive admin management capabilities.

## Key Features

### For Professors
- **Secure Authentication**: Email/password signup with email verification
- **Password Reset**: Forgot password functionality with email verification
- **Comprehensive CV Management**: All academic sections with rich data entry
- **Points System**: Automatic calculation of intellectual and professional scores
- **Year Filtering**: Filter CV items by year range for targeted analysis
- **Professional Printing**: Formatted CV printing with custom layouts
- **Real-time Saving**: Automatic data persistence to secure database

### For Administrators
- **Admin Dashboard**: View and manage all professor CVs
- **Points Monitoring**: Track academic performance across all users
- **CV History**: View version history and changes
- **User Management**: Add/remove admin privileges
- **Archive System**: Archive old CV data for historical records
- **Advanced Analytics**: Comprehensive reporting and statistics

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, React Router v6
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **UI Components**: Lucide React Icons, React Hot Toast
- **Print**: React-to-Print with custom styling
- **State Management**: React Context API
- **Database**: PostgreSQL with Row Level Security
