# Overview

This is a LinkedIn Contact Manager built with Streamlit featuring the **Accunite Portal** design style. The application provides an advanced web-based interface for managing LinkedIn connections with a modern dark theme and red accent colors. It supports uploading CSV files, advanced combined search functionality, hover tooltips for detailed information, and comprehensive contact management with enhanced security features.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses Streamlit with a complete **Accunite Portal design** featuring:
- **Dark Theme**: Consistent dark backgrounds (#0a0a0a to #1a1a1a gradients) with red accent colors (#ff4444)
- **Dashboard-Integrated Search**: Combined search functionality built directly into the dashboard (no separate search page)
- **Advanced Search Features**: Multi-column search across company and designation fields with real-time result counts
- **Interactive Elements**: Hover tooltips for company details (location/duration) replacing traditional info buttons
- **Modern Navigation**: Tools dropdown menu and enhanced button styling
- **Security**: HTML escaping implemented to prevent XSS vulnerabilities from user-generated content

## Data Management
The core data management is handled by a ContactManager class that uses pandas DataFrames for in-memory data storage. The system maintains a predefined schema with specific columns for:
- Basic contact information (name, email, phone, LinkedIn, website)
- Current employment data (up to 2 current positions with company, designation, duration, location)
- Previous employment history (up to 5 previous positions)
- Internal tracking fields for creation and update timestamps

## Session Management
Streamlit's session state is used to persist data across page interactions, storing the ContactManager instance and pagination settings. This ensures data continuity during the user session without requiring external database persistence.

## Data Processing
The application handles CSV file uploads with automatic column mapping and validation. Missing columns are automatically filled with NaN values to maintain data consistency. The system provides data cleaning and normalization during the import process.

# Recent Changes

## Accunite Portal Transformation (September 17, 2025)
- **Complete UI/UX Redesign**: Transformed to Accunite Portal style with consistent dark theme and red accents
- **Combined Search**: Implemented advanced search functionality across multiple columns (company + designation)
- **Dashboard Integration**: Removed separate search page and integrated all search functionality directly on dashboard
- **Interactive Enhancements**: Replaced info buttons with hover tooltips showing location and duration details
- **Navigation Improvements**: Added tools dropdown menu and enhanced button styling
- **Performance Optimization**: Fixed pagination to work with single-click and moved controls to bottom
- **Security Hardening**: Added HTML escaping to prevent XSS vulnerabilities
- **UI Cleanup**: Removed duplicate dashboard sections, data source display, and "All Contacts" text

# External Dependencies

## Core Framework
- **Streamlit**: Web application framework with custom Accunite Portal theming
- **Pandas**: Data manipulation and analysis library for handling contact data
- **NumPy**: Numerical computing library supporting pandas operations
- **html**: Built-in Python module for HTML escaping and security

## File Processing
- **Python IO**: Built-in library for handling file upload and processing operations

## Data Storage
The current implementation uses in-memory storage via pandas DataFrames. No external database is currently integrated, though the architecture could accommodate database integration in the future.