import pandas as pd
import numpy as np
from datetime import datetime
import os
import glob

class ContactManager:
    def __init__(self):
        self.contacts_data = {}  # Dictionary to store contacts by username
        self.current_user = 'All'  # Current selected user filter
        self.data_directory = 'data'
        self.original_columns = [
            'name', 'email', 'phone', 'linkedin', 'website',
            'current_company_1', 'current_designation_1', 'current_duration_1', 'current_location_1',
            'current_company_2', 'current_designation_2', 'current_duration_2', 'current_location_2',
            'previous_company_1', 'previous_designation_1', 'previous_duration_1', 'previous_location_1',
            'previous_company_2', 'previous_designation_2', 'previous_duration_2', 'previous_location_2',
            'previous_company_3', 'previous_designation_3', 'previous_duration_3', 'previous_location_3',
            'previous_company_4', 'previous_designation_4', 'previous_duration_4', 'previous_location_4',
            'previous_company_5', 'previous_designation_5', 'previous_duration_5', 'previous_location_5'
        ]
        
        # Automatically discover and load all CSV files
        self.discover_and_load_all_users()
    
    def discover_csv_files(self):
        """Discover all CSV files in the data directory"""
        if not os.path.exists(self.data_directory):
            os.makedirs(self.data_directory)
            return []
        
        csv_files = glob.glob(os.path.join(self.data_directory, "*.csv"))
        return [os.path.basename(f) for f in csv_files]
    
    def get_username_from_filename(self, filename):
        """Extract username from CSV filename (e.g., 'garima.csv' -> 'garima')
        Makes it case-insensitive by converting to lowercase.
        """
        username = os.path.splitext(filename)[0].lower()
        return username
    
    def discover_and_load_all_users(self):
        """Discover and load data from all CSV files with case-insensitive username handling"""
        csv_files = self.discover_csv_files()
        
        # Group files by normalized username to handle case-insensitive duplicates
        username_files = {}
        for csv_file in csv_files:
            username = self.get_username_from_filename(csv_file)
            if username not in username_files:
                username_files[username] = []
            username_files[username].append(csv_file)
        
        for username, files in username_files.items():
            # If multiple files for same username (case variations), use the first one
            csv_file = files[0]
            file_path = os.path.join(self.data_directory, csv_file)
            
            try:
                df = self.read_csv_with_encoding(file_path)
                self.load_user_data(username, df)
                
                # If there were multiple files for same user, warn and merge them
                if len(files) > 1:
                    print(f"Warning: Found multiple files for user '{username}': {files}. Using {csv_file} and merging others.")
                    for additional_file in files[1:]:
                        additional_path = os.path.join(self.data_directory, additional_file)
                        try:
                            additional_df = self.read_csv_with_encoding(additional_path)
                            self.append_csv_data(username, additional_df)
                        except Exception as e:
                            print(f"Error merging {additional_file}: {str(e)}")
                            
            except Exception as e:
                print(f"Error loading {csv_file}: {str(e)}")
    
    def read_csv_with_encoding(self, file_path):
        """Read CSV file trying different encodings to handle encoding issues"""
        # List of common encodings to try
        encodings = ['utf-8', 'windows-1252', 'iso-8859-1', 'latin1', 'cp1252']
        
        for encoding in encodings:
            try:
                return pd.read_csv(file_path, encoding=encoding, dtype={'phone': 'str'})
            except UnicodeDecodeError:
                continue
            except Exception as e:
                # If it's not an encoding error, re-raise the exception
                if "codec can't decode" not in str(e):
                    raise e
                continue
        
        # If all encodings fail, try reading with binary mode and decoding manually
        try:
            # Read the file with binary mode and try to decode
            with open(file_path, 'rb') as file:
                raw_data = file.read()
                decoded_data = raw_data.decode('utf-8', errors='replace')
            
            # Write to a temporary string and read with pandas
            import io
            return pd.read_csv(io.StringIO(decoded_data), dtype={'phone': 'str'})
        except Exception as e:
            raise Exception(f"Could not read CSV file with any encoding. Error: {str(e)}")
    
    def load_user_data(self, username, df):
        """Load data for a specific user with case-insensitive username handling"""
        try:
            # Normalize username to lowercase for case-insensitive handling
            username = username.lower()
            
            # Ensure all expected columns exist
            for col in self.original_columns:
                if col not in df.columns:
                    df[col] = np.nan
            
            # Reorder columns to match expected structure
            user_df = df[self.original_columns].copy()
            
            # Add internal tracking columns
            user_df['_created_at'] = datetime.now()
            user_df['_updated_at'] = datetime.now()
            user_df['_username'] = username  # Track which user this data belongs to
            
            # Reset index
            user_df = user_df.reset_index(drop=True)
            
            # Store in contacts_data dictionary
            self.contacts_data[username] = user_df
            
            return True
        except Exception as e:
            raise Exception(f"Error loading data for {username}: {str(e)}")
    
    def get_available_users(self):
        """Get list of available usernames plus 'All' option"""
        users = list(self.contacts_data.keys())
        users.sort()
        return ['All'] + users
    
    def set_current_user(self, username):
        """Set the current user filter"""
        self.current_user = username
    
    def get_current_contacts(self):
        """Get contacts for the currently selected user"""
        if self.current_user == 'All':
            return self.get_all_contacts()
        elif self.current_user in self.contacts_data:
            return self.contacts_data[self.current_user][self.original_columns].copy()
        else:
            return pd.DataFrame()
    
    def is_empty(self):
        """Check if the contact manager has any data"""
        if self.current_user == 'All':
            return len(self.contacts_data) == 0 or all(df.empty for df in self.contacts_data.values())
        elif self.current_user in self.contacts_data:
            return self.contacts_data[self.current_user].empty
        else:
            return True
    
    def get_statistics(self):
        """Get basic statistics about the contacts for current user"""
        contacts = self.get_current_contacts()
        
        if contacts.empty:
            return {
                'total_contacts': 0,
                'with_email': 0,
                'with_phone': 0,
                'with_linkedin': 0
            }
        
        return {
            'total_contacts': len(contacts),
            'with_email': len(contacts[contacts['email'].notna() & (contacts['email'].astype(str).str.strip() != '') & (contacts['email'].astype(str) != 'nan')]),
            'with_phone': len(contacts[contacts['phone'].notna() & (contacts['phone'].astype(str).str.strip() != '') & (contacts['phone'].astype(str) != 'nan')]),
            'with_linkedin': len(contacts[contacts['linkedin'].notna() & (contacts['linkedin'].astype(str).str.strip() != '') & (contacts['linkedin'].astype(str) != 'nan')])
        }
    
    def get_all_contacts(self):
        """Get all contacts from all users combined"""
        if not self.contacts_data:
            return pd.DataFrame()
        
        all_contacts = []
        for username, df in self.contacts_data.items():
            if not df.empty:
                user_contacts = df[self.original_columns].copy()
                all_contacts.append(user_contacts)
        
        if all_contacts:
            return pd.concat(all_contacts, ignore_index=True)
        else:
            return pd.DataFrame()
    
    def get_recent_contacts(self, limit=10):
        """Get recent contacts for current user"""
        contacts = self.get_current_contacts()
        
        if contacts.empty:
            return pd.DataFrame()
        
        if self.current_user == 'All':
            # For 'All', get recent from all users and sort by update time
            all_contacts_with_time = []
            for username, df in self.contacts_data.items():
                if not df.empty:
                    user_contacts = df.copy()
                    all_contacts_with_time.append(user_contacts)
            
            if all_contacts_with_time:
                combined = pd.concat(all_contacts_with_time, ignore_index=True)
                sorted_df = combined.sort_values('_updated_at', ascending=False)
                return sorted_df.head(limit)[self.original_columns].copy()
            else:
                return pd.DataFrame()
        else:
            # For specific user, sort by update time
            if self.current_user in self.contacts_data:
                sorted_df = self.contacts_data[self.current_user].sort_values('_updated_at', ascending=False)
                return sorted_df.head(limit)[self.original_columns].copy()
            else:
                return pd.DataFrame()
    
    def search_contacts(self, query, search_options=None):
        """Enhanced search contacts for current user with combined search capability"""
        contacts = self.get_current_contacts()
        
        if contacts.empty or not query:
            return contacts
        
        if search_options is None:
            search_options = {}
        
        # Convert query to lowercase for case-insensitive search
        query_lower = str(query).lower()
        
        # Enhanced combined search - split query into words for better matching
        query_words = query_lower.split()
        
        # Determine which columns to search
        search_columns = []
        
        if search_options.get('name_only'):
            search_columns = ['name']
        elif search_options.get('email_only'):
            search_columns = ['email']
        elif search_options.get('current_only'):
            search_columns = [col for col in self.original_columns if col.startswith('current_')]
        elif search_options.get('previous_only'):
            search_columns = [col for col in self.original_columns if col.startswith('previous_')]
        else:
            # Search all columns by default - prioritize company and designation columns for combined search
            search_columns = self.original_columns
        
        # Create boolean mask for matching rows
        mask = pd.Series([False] * len(contacts))
        
        # For combined search, check if multiple words match across different columns
        if len(query_words) > 1 and not any(search_options.get(opt) for opt in ['name_only', 'email_only', 'current_only', 'previous_only']):
            # Enhanced combined search logic
            for index, row in contacts.iterrows():
                row_text_combined = ""
                # Combine text from key columns for better matching
                company_designation_cols = ['current_company_1', 'current_company_2', 
                                          'current_designation_1', 'current_designation_2',
                                          'previous_company_1', 'previous_company_2',
                                          'previous_designation_1', 'previous_designation_2']
                
                for col in company_designation_cols:
                    if col in contacts.columns and pd.notna(row[col]):
                        row_text_combined += " " + str(row[col]).lower()
                
                # Check if all words in query are found in combined text
                words_found = sum(1 for word in query_words if word in row_text_combined)
                if words_found >= len(query_words):
                    mask.iloc[index] = True
                # Also check individual column matches as fallback  
                else:
                    for col in search_columns:
                        if col in contacts.columns and pd.notna(row[col]):
                            if query_lower in str(row[col]).lower():
                                mask.iloc[index] = True
                                break
        else:
            # Standard search for single words or specific column searches
            for col in search_columns:
                if col in contacts.columns:
                    # Convert column to string and search
                    col_mask = contacts[col].astype(str).str.lower().str.contains(
                        query_lower, case=False, na=False, regex=False
                    )
                    mask = mask | col_mask
        
        # Filter and return results
        return contacts[mask].copy()
    
    def add_contact(self, username, contact_data):
        """Add a new contact to a specific user with case-insensitive username handling"""
        try:
            # Normalize username to lowercase for case-insensitive handling
            username = username.lower()
            
            # Create a new row with the contact data
            new_row = {}
            
            # Fill in the provided data
            for col in self.original_columns:
                new_row[col] = contact_data.get(col, np.nan)
            
            # Add tracking columns
            new_row['_created_at'] = datetime.now()
            new_row['_updated_at'] = datetime.now()
            new_row['_username'] = username
            
            # Convert to DataFrame
            new_contact_df = pd.DataFrame([new_row])
            
            if username not in self.contacts_data or self.contacts_data[username].empty:
                self.contacts_data[username] = new_contact_df
            else:
                self.contacts_data[username] = pd.concat([self.contacts_data[username], new_contact_df], ignore_index=True)
            
            # Save to file
            self.save_user_data_to_file(username)
            
            return True
        except Exception as e:
            raise Exception(f"Error adding contact: {str(e)}")
    
    def update_contact(self, contact_id, updated_data):
        """Update an existing contact for current user"""
        try:
            if self.current_user == 'All':
                raise Exception("Cannot edit contacts when 'All' filter is selected. Please select a specific user.")
            
            if self.current_user not in self.contacts_data:
                raise Exception("User not found")
            
            user_df = self.contacts_data[self.current_user]
            
            if contact_id >= len(user_df):
                raise Exception("Contact not found")
            
            # Update the contact data
            for col in self.original_columns:
                if col in updated_data:
                    value = updated_data[col]
                    # Convert empty strings to NaN
                    if value == '':
                        value = np.nan
                    user_df.loc[contact_id, col] = value
            
            # Update the timestamp
            user_df.loc[contact_id, '_updated_at'] = datetime.now()
            
            # Save to file
            self.save_user_data_to_file(self.current_user)
            
            return True
        except Exception as e:
            raise Exception(f"Error updating contact: {str(e)}")
    
    def append_csv_data(self, username, new_df):
        """Append new CSV data to existing user data with LinkedIn URL deduplication"""
        try:
            # Normalize username to lowercase for case-insensitive handling
            username = username.lower()
            
            # Ensure new data has all required columns
            for col in self.original_columns:
                if col not in new_df.columns:
                    new_df[col] = np.nan
            
            # Get only the required columns from new data
            new_data = new_df[self.original_columns].copy()
            
            if username not in self.contacts_data or self.contacts_data[username].empty:
                # If no existing data for this user, create new
                self.load_user_data(username, new_data)
                return len(new_data)
            else:
                # Handle LinkedIn URL deduplication
                existing_data = self.contacts_data[username].copy()
                added_count = 0
                updated_count = 0
                
                # Process each new contact
                for idx, new_row in new_data.iterrows():
                    new_linkedin = new_row.get('linkedin', '')
                    
                    # Skip if no LinkedIn URL
                    if not new_linkedin or pd.isna(new_linkedin) or new_linkedin.strip() == '':
                        # Add as new contact if no LinkedIn URL
                        new_contact = new_row.copy()
                        new_contact['_created_at'] = datetime.now()
                        new_contact['_updated_at'] = datetime.now()
                        new_contact['_username'] = username
                        
                        existing_data = pd.concat([existing_data, pd.DataFrame([new_contact])], ignore_index=True)
                        added_count += 1
                        continue
                    
                    # Check if LinkedIn URL already exists
                    matching_contacts = existing_data[existing_data['linkedin'] == new_linkedin]
                    
                    if not matching_contacts.empty:
                        # LinkedIn URL exists - overwrite the existing entry
                        matching_idx = matching_contacts.index[0]
                        
                        # Update existing contact with new data
                        for col in self.original_columns:
                            existing_data.loc[matching_idx, col] = new_row[col]
                        
                        existing_data.loc[matching_idx, '_updated_at'] = datetime.now()
                        updated_count += 1
                    else:
                        # LinkedIn URL doesn't exist - append as new contact
                        new_contact = new_row.copy()
                        new_contact['_created_at'] = datetime.now()
                        new_contact['_updated_at'] = datetime.now()
                        new_contact['_username'] = username
                        
                        existing_data = pd.concat([existing_data, pd.DataFrame([new_contact])], ignore_index=True)
                        added_count += 1
                
                # Update the contacts data
                self.contacts_data[username] = existing_data
                
                # Save the updated data back to CSV file
                self.save_user_data_to_file(username)
                
                return added_count + updated_count
        except Exception as e:
            raise Exception(f"Error appending CSV data for {username}: {str(e)}")
    
    def save_user_data_to_file(self, username):
        """Save user data to CSV file with case-insensitive username handling"""
        try:
            # Normalize username to lowercase for case-insensitive handling
            username_normalized = username.lower()
            
            if username_normalized in self.contacts_data and not self.contacts_data[username_normalized].empty:
                # Save only the original columns to CSV
                export_df = self.contacts_data[username_normalized][self.original_columns].copy()
                file_path = os.path.join(self.data_directory, f"{username_normalized}.csv")
                export_df.to_csv(file_path, index=False)
                return True
            return False
        except Exception as e:
            print(f"Error saving data for {username}: {str(e)}")
            return False
    
    def export_to_csv(self, filename=None):
        """Export current contacts to CSV"""
        contacts = self.get_current_contacts()
        
        if contacts.empty:
            return None
        
        if filename:
            contacts.to_csv(filename, index=False)
            return filename
        else:
            return contacts.to_csv(index=False)
    
    def get_user_contact_counts(self):
        """Get contact counts for each user"""
        counts = {}
        for username, df in self.contacts_data.items():
            counts[username] = len(df) if not df.empty else 0
        return counts