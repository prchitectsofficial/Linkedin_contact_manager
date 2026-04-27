import streamlit as st
import pandas as pd
import numpy as np
from contact_manager import ContactManager
import io
import os
import html
import zipfile
import pymysql
from datetime import datetime

# ── MySQL connection config for bmi.brands ──────────────────────────────────
# Local dev  : host=localhost, user=root, password as below
# Production : override via environment variables DB_HOST / DB_USER / DB_PASSWORD
DB_CONFIG = {
    "host":            os.environ.get("DB_HOST",     "wmpbmi.cwyvyaxhb6rz.ap-south-1.rds.amazonaws.com"),
    "user":            os.environ.get("DB_USER",     "wmpbmi"),
    "password":        os.environ.get("DB_PASSWORD", "QHCJu1GGBtUbjKpGvwSN"),
    "database":        "bmi",
    "charset":         "utf8mb4",
    "connect_timeout": 10,
    "autocommit":      False,
}

def get_db_connection():
    """Return a live pymysql connection to the bmi database."""
    return pymysql.connect(**DB_CONFIG)


@st.dialog("➕ Add Brand", width="large")
def add_brand_dialog():
    """Modal form that inserts a new brand into bmi.brands — same DB & table as the PHP app."""

    st.markdown(
        "<p style='color:#64748b; font-size:13px; margin-top:-10px;'>"
        "Fields marked <b>*</b> are required.</p>",
        unsafe_allow_html=True,
    )

    col1, col2 = st.columns(2)

    with col1:
        brand    = st.text_input("Brand name *",          placeholder="e.g. Nike")
        client   = st.text_input("Point of Contact",      placeholder="Full name")
        desig    = st.text_input("Designation",           placeholder="Marketing Manager")
        email    = st.text_input("Email",                 placeholder="contact@brand.com")
        contact  = st.text_input("Phone / Contact",       placeholder="+91 ...")
        company  = st.text_input("Company name",          placeholder="Same as brand or parent co.")
        website  = st.text_input("Website URL",           placeholder="https://...")
        linkedin = st.text_input("LinkedIn URL",          placeholder="https://linkedin.com/in/...")

    with col2:
        opinion  = st.selectbox("Opinion", [
            "", "relevant", "irrelevant", "BMI starter", "BMI enterprise",
            "unreachable", "unresponsive", "negotiation failed", "already in touch"
        ])
        handler  = st.selectbox("Handler", [
            "", "prashant", "garima", "bhanu", "mohseen", "himanshu",
            "abhishek", "kushagra", "divya", "megha", "jatin",
            "neha", "gauri", "aishwarya", "shweta", "io"
        ])
        st.markdown("**Outreach status**")
        conn_sent          = st.checkbox("Connection Sent")
        conn_est           = st.checkbox("Connection Established")
        pitch_sent         = st.checkbox("LinkedIn Message")
        linkedin_follow    = st.checkbox("LinkedIn Followup")
        email_outreach_chk = st.checkbox("Personal email outreach")

        email_send_from = ""
        if email_outreach_chk:
            email_send_from = st.selectbox("Email Send From", [
                "",
                "mohseen@prichitects.com",
                "bhanu@prichitects.com",
                "abhishek@prichitects.com",
                "himanshu@prichitects.com",
                "garima@prichitects.com",
                "kushagra@prichitects.com",
                "neha@prchitects.com",
                "gauri@prchitects.com",
            ])

        pitch_response = st.text_area("Pitch response / notes", height=80)

    st.markdown("---")
    save_col, cancel_col, _ = st.columns([1, 1, 5])

    with save_col:
        save_clicked = st.button("💾 Save Brand", type="primary", use_container_width=True)
    with cancel_col:
        if st.button("✖ Cancel", use_container_width=True):
            st.rerun()

    if save_clicked:
        # ── Validation ──────────────────────────────────────────────────────
        if not brand.strip():
            st.error("Brand name is required.")
            return
        if conn_est and not linkedin.strip():
            st.error("LinkedIn URL is required when Connection Established is checked.")
            return
        if pitch_sent and not handler:
            st.error("Please select a handler when LinkedIn Message is checked.")
            return
        if email_outreach_chk and not email_send_from:
            st.error("Please select the 'Email Send From' address.")
            return

        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # ── INSERT into bmi.brands ───────────────────────────────────────────
        sql = """
            INSERT INTO bmi.brands
                (brand, client, designation, email, contact, company,
                 website, conn_sent, conn_est, est_date, est_source,
                 pitch_sent, linkedin_follow, email_outreach,
                 pitch_response, linkedin, opinion,
                 handler, email_from,
                 createdon)
            VALUES
                (%s, %s, %s, %s, %s, %s,
                 %s, %s, %s, %s, %s,
                 %s, %s, %s,
                 %s, %s, %s,
                 %s, %s,
                 %s)
        """
        values = (
            brand.strip(),
            client.strip(),
            desig.strip(),
            email.strip(),
            contact.strip(),
            company.strip(),
            website.strip(),
            1 if conn_sent else 0,
            1 if conn_est else 0,
            now,                        # est_date
            "",                         # est_source
            1 if pitch_sent else 0,
            1 if linkedin_follow else 0,
            1 if email_outreach_chk else 0,
            pitch_response.strip(),
            linkedin.strip(),
            opinion,
            handler,
            email_send_from,
            now,                        # createdon
        )

        try:
            conn = get_db_connection()
            with conn.cursor() as cur:
                # Check duplicate
                cur.execute("SELECT id FROM bmi.brands WHERE brand = %s", (brand.strip(),))
                if cur.fetchone():
                    st.error(f"⚠️ Brand **{brand}** already exists in the index.")
                    conn.close()
                    return
                cur.execute(sql, values)
                conn.commit()
            conn.close()
            st.toast(f"✅ Brand **{brand}** added successfully!", icon="✅")
            import time
            time.sleep(1)
            st.rerun()
        except Exception as e:
            st.error(f"❌ Database error: {e}")


def clean_phone_display(phone):
    """Clean phone number for display by removing .0 and handling different formats"""
    if phone is None or pd.isna(phone):
        return ''
    
    phone_str = str(phone)
    # Remove .0 at the end if present
    if phone_str.endswith('.0'):
        phone_str = phone_str[:-2]
    
    return phone_str.strip()

# Country to flag mapping
COUNTRY_FLAGS = {
    'india': '🇮🇳', 'united states': '🇺🇸', 'usa': '🇺🇸', 'us': '🇺🇸',
    'united kingdom': '🇬🇧', 'uk': '🇬🇧', 'britain': '🇬🇧', 'england': '🇬🇧',
    'canada': '🇨🇦', 'australia': '🇦🇺', 'germany': '🇩🇪', 'france': '🇫🇷',
    'china': '🇨🇳', 'japan': '🇯🇵', 'south korea': '🇰🇷', 'korea': '🇰🇷',
    'brazil': '🇧🇷', 'mexico': '🇲🇽', 'italy': '🇮🇹', 'spain': '🇪🇸',
    'netherlands': '🇳🇱', 'sweden': '🇸🇪', 'norway': '🇳🇴', 'denmark': '🇩🇰',
    'switzerland': '🇨🇭', 'austria': '🇦🇹', 'belgium': '🇧🇪', 'ireland': '🇮🇪',
    'israel': '🇮🇱', 'singapore': '🇸🇬', 'hong kong': '🇭🇰', 'malaysia': '🇲🇾',
    'thailand': '🇹🇭', 'indonesia': '🇮🇩', 'philippines': '🇵🇭', 'vietnam': '🇻🇳',
    'uae': '🇦🇪', 'united arab emirates': '🇦🇪', 'saudi arabia': '🇸🇦',
    'russia': '🇷🇺', 'poland': '🇵🇱', 'czech republic': '🇨🇿', 'hungary': '🇭🇺',
    'romania': '🇷🇴', 'greece': '🇬🇷', 'portugal': '🇵🇹', 'finland': '🇫🇮',
    'south africa': '🇿🇦', 'nigeria': '🇳🇬', 'egypt': '🇪🇬', 'kenya': '🇰🇪',
    'argentina': '🇦🇷', 'chile': '🇨🇱', 'colombia': '🇨🇴', 'peru': '🇵🇪',
    'turkey': '🇹🇷', 'pakistan': '🇵🇰', 'bangladesh': '🇧🇩', 'sri lanka': '🇱🇰',
    'nepal': '🇳🇵', 'myanmar': '🇲🇲', 'cambodia': '🇰🇭', 'malta': '🇲🇹'
}

# Helper function to extract country from location
def extract_country_from_location(row):
    """Extract country information from various location fields"""
    location_fields = ['current_location_1', 'current_location_2', 'previous_location_1', 'previous_location_2']
    
    for field in location_fields:
        location = row.get(field, '')
        if location and pd.notna(location) and str(location).strip():
            location = str(location).lower()
            # Check for country matches
            for country, flag in COUNTRY_FLAGS.items():
                if country in location:
                    return flag, country.title()
    
    return '', ''

# Helper function to truncate text
def truncate_text(text, max_length=30):
    """Truncate text to max_length characters with ellipsis"""
    if not text or pd.isna(text):
        return ''
    text = str(text).strip()
    if len(text) <= max_length:
        return text
    return text[:max_length-3] + '...'

def read_csv_with_encoding_from_upload(uploaded_file):
    """Read CSV from Streamlit uploaded file trying different encodings"""
    # List of common encodings to try
    encodings = ['utf-8', 'windows-1252', 'iso-8859-1', 'latin1', 'cp1252']
    
    # Get the file content as bytes
    uploaded_file.seek(0)  # Reset file pointer
    file_bytes = uploaded_file.read()
    uploaded_file.seek(0)  # Reset file pointer
    
    for encoding in encodings:
        try:
            # Decode the bytes to string with the current encoding
            file_content = file_bytes.decode(encoding)
            # Create StringIO object and read with pandas
            return pd.read_csv(io.StringIO(file_content), dtype={'phone': 'str'})
        except UnicodeDecodeError:
            continue
        except Exception as e:
            # If it's not an encoding error, re-raise the exception
            if "codec can't decode" not in str(e):
                raise e
            continue
    
    # If all encodings fail, try with error handling
    try:
        file_content = file_bytes.decode('utf-8', errors='replace')
        return pd.read_csv(io.StringIO(file_content), dtype={'phone': 'str'})
    except Exception as e:
        raise Exception(f"Could not read CSV file with any encoding. Error: {str(e)}")

# Page configuration
st.set_page_config(
    page_title="LinkedIn Connection Manager",
    page_icon="👥",
    layout="wide"
)

# Initialize session state
if 'contact_manager' not in st.session_state:
    st.session_state.contact_manager = ContactManager()

if 'current_page' not in st.session_state:
    st.session_state.current_page = 1

if 'records_per_page' not in st.session_state:
    st.session_state.records_per_page = 25

if 'selected_user' not in st.session_state:
    st.session_state.selected_user = 'All'

if 'current_view' not in st.session_state:
    st.session_state.current_view = 'Dashboard'

def show_download_page():
    """Show the download page for the project archive"""
    st.markdown("""
    <div style="text-align: center; padding: 2rem;">
        <h1 style="color: #667eea; font-size: 3rem; margin-bottom: 1rem;">📦 Project Download</h1>
        <p style="font-size: 1.2rem; color: #64748b; margin-bottom: 2rem;">Download your complete LinkedIn Contact Manager archive</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Check if archive exists
    import os
    archive_path = "linkedin-contact-manager.tar.gz"
    if os.path.exists(archive_path):
        file_size = os.path.getsize(archive_path)
        size_mb = file_size / (1024 * 1024)
        
        # Create download card
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            st.markdown("""
            <div style="background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
                <div style="text-align: center;">
                    <div style="color: #10b981; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">✅ Archive Ready!</div>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            # File details
            st.markdown("### 📊 Archive Details")
            details_col1, details_col2 = st.columns(2)
            with details_col1:
                st.markdown(f"**Filename:** linkedin-contact-manager.tar.gz")
                st.markdown(f"**Size:** {size_mb:.1f} MB")
            with details_col2:
                st.markdown(f"**Contacts:** 13,201 LinkedIn contacts")
                st.markdown(f"**Status:** Ready for download")
            
            st.markdown("---")
            
            # Download button
            with open(archive_path, "rb") as file:
                st.download_button(
                    label="⬇️ DOWNLOAD PROJECT ARCHIVE",
                    data=file,
                    file_name="linkedin-contact-manager.tar.gz",
                    mime="application/gzip",
                    use_container_width=True,
                    type="primary"
                )
            
            st.markdown("### 📁 What's Included")
            st.markdown("""
            - ✅ **app.py** - Main Streamlit application  
            - ✅ **contact_manager.py** - Backend contact management
            - ✅ **data/garima.csv** - Complete contact database (13,201 records)
            - ✅ **.streamlit/config.toml** - Application configuration
            - ✅ **replit.md** - Project documentation and preferences
            - ✅ **pyproject.toml** - Python project configuration
            - ✅ **uv.lock** - Dependency lock file
            """)
    else:
        st.error("❌ Archive file not found. Please ensure the archive has been created.")
        if st.button("🔄 Go back to Dashboard"):
            st.session_state.current_view = 'Dashboard'
            st.rerun()


def main():
    
    # Tools dropdown with automatic opening
    header_col1, header_col2, header_col3 = st.columns([1, 1, 1])
    with header_col2:  # Center column
        selected_tool = st.selectbox(
            "Tools",
            ["Tools", "Homepage", "SiteMatch", "Email Extractor"],
            index=0,
            key="header_tools_dropdown",
            label_visibility="collapsed"
        )
        
        # Handle tool selection - show link button for immediate opening
        if selected_tool != "Tools":
            # URLs for each tool
            urls = {
                "Homepage": "https://apps.accunite.com/dashboard",
                "SiteMatch": "https://apps.accunite.com/sitematch/",
                "Email Extractor": "https://apps.accunite.com/email-extractor/"
            }
            
            if selected_tool in urls:
                # Create link button that opens in new tab
                st.link_button(
                    f"🔗 Open {selected_tool}",
                    urls[selected_tool],
                    use_container_width=True
                )
    
    st.title("👥 LinkedIn Contact Manager")
    
    
    # Enhanced navigation with proper alignment
    st.markdown("""
    <style>
    /* Accunite Portal theme matching reference images */
    .main .block-container {
        background: #f8fafc;
        color: #1e293b;
    }
    
    .nav-container {
        background: white;
        padding: 1rem;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
    }
    
    .stButton > button {
        border-radius: 8px;
        border: 1px solid #3b82f6 !important;
        padding: 0.6rem 1.2rem;
        font-weight: 600;
        transition: all 0.3s ease;
        background: white !important;
        color: #3b82f6 !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .stButton > button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        background: #3b82f6 !important;
        color: white !important;
    }
    
    .stSelectbox > div > div {
        border-radius: 8px;
        border: 1px solid #d1d5db !important;
        background: white !important;
        color: #1e293b !important;
    }
    
    .stSelectbox label {
        color: #374151 !important;
        font-weight: 600;
    }
    
    /* Header styling */
    h1, h2, h3 {
        color: #1e293b !important;
    }
    
    /* Text input styling */
    .stTextInput > div > div > input {
        background: white !important;
        border: 1px solid #d1d5db !important;
        color: #1e293b !important;
        border-radius: 8px;
    }
    
    .stTextInput > div > div > input:focus {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 5px rgba(59, 130, 246, 0.3) !important;
    }
    
    .stTextInput label {
        color: #374151 !important;
        font-weight: 600;
    }
    
    /* Checkbox styling */
    .stCheckbox > label {
        color: #1e293b !important;
    }
    
    /* Expander styling */
    .stExpander {
        border: 1px solid #d1d5db !important;
        background: white !important;
    }
    
    /* General text colors */
    .stMarkdown, p, div, span {
        color: #1e293b !important;
    }
    
    /* Unified stats container */
    .unified-stats-container {
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 12px;
        padding: 1.5rem;
        margin: 1rem 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: space-around;
        align-items: center;
    }
    
    .stat-item {
        text-align: center;
        padding: 0 1rem;
    }
    
    .stat-number {
        font-size: 2rem;
        font-weight: bold;
        color: #1e293b;
        display: block;
    }
    
    .stat-label {
        font-size: 0.875rem;
        color: #64748b;
        font-weight: 500;
        margin-top: 0.25rem;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Enhanced navigation
    nav_cols = st.columns([1, 1, 1, 0.3, 2])

    with nav_cols[0]:
        if st.button("🏠 Dashboard", type="primary" if st.session_state.current_view == 'Dashboard' else "secondary", use_container_width=True):
            st.session_state.current_view = 'Dashboard'
            st.rerun()

    with nav_cols[1]:
        if st.button("➕ Add Contact", type="primary" if st.session_state.current_view == 'Add' else "secondary", use_container_width=True):
            st.session_state.current_view = 'Add'
            st.rerun()

    with nav_cols[2]:
        if st.button("🏷️ Add Brand", use_container_width=True):
            add_brand_dialog()

    with nav_cols[3]:
        st.write("")  # Spacer

    with nav_cols[4]:
        # User filter dropdown aligned with navigation
        available_users = st.session_state.contact_manager.get_available_users()
        
        if available_users:
            user_counts = st.session_state.contact_manager.get_user_contact_counts()
            
            # Create options with contact counts
            user_options = []
            for user in available_users:
                if user == 'All':
                    total_count = sum(user_counts.values())
                    user_options.append(f"All ({total_count})")
                else:
                    count = user_counts.get(user, 0)
                    user_options.append(f"{user} ({count})")
            
            try:
                current_user_display = f"{st.session_state.selected_user} ({user_counts.get(st.session_state.selected_user, 0) if st.session_state.selected_user != 'All' else sum(user_counts.values())})"
                if current_user_display in user_options:
                    default_index = user_options.index(current_user_display)
                else:
                    default_index = 0
            except:
                default_index = 0
            
            selected_user_with_count = st.selectbox(
                "👤 Select User",
                user_options,
                index=default_index
            )
            
            # Extract username from selection
            if selected_user_with_count:
                selected_user = selected_user_with_count.split(' (')[0]
            else:
                selected_user = 'All'
            
            if selected_user != st.session_state.selected_user:
                st.session_state.selected_user = selected_user
                st.session_state.contact_manager.set_current_user(selected_user)
                st.rerun()
        else:
            st.info("No CSV files found. Upload CSV files to data/ folder.")
            return
    
    st.markdown("---")
    
    # Show current page based on navigation (removed Search page)
    if st.session_state.current_view == 'Dashboard':
        dashboard_page()
    elif st.session_state.current_view == 'Add':
        add_contact_page()
    elif st.session_state.current_view == 'Download':
        show_download_page()

def dashboard_page():
    st.header("🏠 Accunite Portal - LinkedIn Contact Manager")
    
    if st.session_state.contact_manager.is_empty():
        st.warning("No data found for the selected user. Please check CSV files or upload new data.")
        return
    
    # Search box directly on dashboard
    
    # Search functionality integrated on dashboard with Accunite styling
    with st.container():
        st.markdown('<div class="accunite-search">', unsafe_allow_html=True)
        search_col1, search_col2 = st.columns([4, 1])
        
        with search_col1:
            search_query = st.text_input(
                "Search Contacts",
                placeholder="Search across all contacts (e.g., 'Happn Marketing' for combined company + designation search)",
                key="dashboard_search",
                label_visibility="collapsed"
            )
        
        # Advanced filters in expander
        with st.expander("🔧 Advanced Search Filters"):
            filter_col1, filter_col2, filter_col3 = st.columns(3)
            with filter_col1:
                search_in_current = st.checkbox("Current company only", key="dash_current")
                search_in_name = st.checkbox("Name only", key="dash_name") 
            with filter_col2:
                search_in_previous = st.checkbox("Previous companies only", key="dash_previous")
                search_in_email = st.checkbox("Email only", key="dash_email")
            with filter_col3:
                location_filter = st.selectbox("Location:", ["All", "Indians", "Non Indians"], key="dash_location")
                contact_filter = st.selectbox("Contact Info:", ["All Contacts", "With Email", "Without Email", "With Phone", "Without Phone"], key="dash_contact")
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Unified Statistics Container
    stats = st.session_state.contact_manager.get_statistics()
    
    stats_html = f"""
    <div class="unified-stats-container">
        <div class="stat-item">
            <span class="stat-number">{stats['total_contacts']}</span>
            <div class="stat-label">Total Contacts</div>
        </div>
        <div class="stat-item">
            <span class="stat-number">{stats['with_email']}</span>
            <div class="stat-label">With Email</div>
        </div>
        <div class="stat-item">
            <span class="stat-number">{stats['with_phone']}</span>
            <div class="stat-label">With Phone</div>
        </div>
        <div class="stat-item">
            <span class="stat-number">{stats['with_linkedin']}</span>
            <div class="stat-label">With LinkedIn</div>
        </div>
    </div>
    """
    st.markdown(stats_html, unsafe_allow_html=True)
    
    # Handle search and display results
    if search_query:
        # Perform search with options
        search_options = {
            'current_only': st.session_state.get('dash_current', False),
            'previous_only': st.session_state.get('dash_previous', False),
            'name_only': st.session_state.get('dash_name', False),
            'email_only': st.session_state.get('dash_email', False)
        }
        
        search_results = st.session_state.contact_manager.search_contacts(search_query, search_options)
        
        if not search_results.empty:
            st.markdown(f"**{len(search_results)} results found**")
            display_paginated_results(search_results, show_filters=False)
        else:
            st.info("No contacts found matching your search criteria.")
    else:
        # Show all contacts without search
        all_contacts = st.session_state.contact_manager.get_current_contacts()
        
        if not all_contacts.empty:
            display_paginated_results(all_contacts, show_filters=True)
        else:
            st.info("No contacts available for the selected user.")

def search_contacts_page():
    st.header("🔍 Search Contacts")
    
    # Show current filter
    if st.session_state.selected_user == 'All':
        st.info(f"🔍 **Searching in:** All Users Combined")
    else:
        st.info(f"🔍 **Searching in:** {st.session_state.selected_user} contacts")
    
    if st.session_state.contact_manager.is_empty():
        st.warning("No data found for the selected user. Please check CSV files or upload new data.")
        return
    
    # Enhanced search interface with perfect alignment
    st.markdown("""
    <style>
    .search-container {
        background: linear-gradient(135deg, #f8faff 0%, #e3f2fd 100%);
        padding: 1.5rem;
        border-radius: 15px;
        margin-bottom: 1.5rem;
        border: 2px solid #e3f2fd;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .stTextInput > div > div > input {
        border-radius: 25px;
        border: 2px solid #e2e8f0;
        padding: 0.75rem 1.25rem;
        font-size: 16px;
        background: white;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }
    .stTextInput > div > div > input:focus {
        border-color: #667eea;
        box-shadow: 0 0 20px rgba(102, 126, 234, 0.2);
    }
    .search-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 25px;
        padding: 0.75rem 1.5rem;
        color: white;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Search interface with proper alignment
    search_cols = st.columns([4, 1])
    with search_cols[0]:
        search_query = st.text_input(
            "🔍 Search your contacts",
            placeholder="Enter name, email, company, designation, etc.",
            key="search_input",
            label_visibility="collapsed"
        )
    with search_cols[1]:
        search_button = st.button("🔍 Search", type="primary", use_container_width=True)
    
    # Advanced search options
    with st.expander("Advanced Search Options"):
        col1, col2 = st.columns(2)
        with col1:
            search_in_current = st.checkbox("Search in current company only")
            search_in_previous = st.checkbox("Search in previous companies only")
        with col2:
            search_in_email = st.checkbox("Search in email only")
            search_in_name = st.checkbox("Search in name only")
    
    # Perform search
    if search_query or search_button:
        search_options = {
            'current_only': search_in_current,
            'previous_only': search_in_previous,
            'email_only': search_in_email,
            'name_only': search_in_name
        }
        
        results = st.session_state.contact_manager.search_contacts(search_query, search_options)
        
        if not results.empty:
            st.success(f"Found {len(results)} matching contacts")
            
            # Pagination for search results
            display_paginated_results(results)
        else:
            st.info("No contacts found matching your search criteria.")
    else:
        # Show all contacts with pagination
        all_contacts = st.session_state.contact_manager.get_current_contacts()
        if not all_contacts.empty:
            st.info(f"Showing all {len(all_contacts)} contacts for {st.session_state.selected_user}")
            display_paginated_results(all_contacts)

def display_paginated_results(df, show_filters=True):
    if df.empty:
        return
    
    # Conditionally show filters
    if show_filters:
        filter_col1, filter_col2 = st.columns([1, 1])
        
        with filter_col1:
            # Location filter for Indians/Non Indians
            location_filter = st.selectbox(
                "Location Filter:",
                ["All", "Indians", "Non Indians"],
                key="location_filter"
            )
        
        with filter_col2:
            # Contact filter
            contact_filter = st.selectbox(
                "Contact Filter:",
                ["All Contacts", "With Email", "Without Email", "With Phone", "Without Phone"],
                key="contact_filter_paginated"
            )
    else:
        # Use filters from dashboard if not showing separate filter controls
        location_filter = st.session_state.get('dash_location', 'All')
        contact_filter = st.session_state.get('dash_contact', 'All Contacts')
    
    # Apply location filter
    filtered_df = df.copy()
    if location_filter == "Indians":
        # Filter for contacts where country is India
        mask = df.apply(lambda row: 'india' in ' '.join([
            str(row.get('current_location_1', '')),
            str(row.get('current_location_2', '')), 
            str(row.get('previous_location_1', '')),
            str(row.get('previous_location_2', ''))
        ]).lower(), axis=1)
        filtered_df = df[mask]
    elif location_filter == "Non Indians":
        # Filter for contacts where country is NOT India
        mask = df.apply(lambda row: 'india' not in ' '.join([
            str(row.get('current_location_1', '')),
            str(row.get('current_location_2', '')), 
            str(row.get('previous_location_1', '')),
            str(row.get('previous_location_2', ''))
        ]).lower(), axis=1)
        filtered_df = df[mask]
    
    # Apply contact filter
    if contact_filter == "With Email":
        filtered_df = filtered_df[filtered_df['email'].notna() & (filtered_df['email'].astype(str) != 'nan') & (filtered_df['email'].astype(str).str.len() > 0)]
    elif contact_filter == "Without Email":
        filtered_df = filtered_df[filtered_df['email'].isna() | (filtered_df['email'].astype(str) == 'nan') | (filtered_df['email'].astype(str).str.len() == 0)]
    elif contact_filter == "With Phone":
        filtered_df = filtered_df[filtered_df['phone'].notna() & (filtered_df['phone'].astype(str) != 'nan') & (filtered_df['phone'].astype(str).str.len() > 0)]
    elif contact_filter == "Without Phone":
        filtered_df = filtered_df[filtered_df['phone'].isna() | (filtered_df['phone'].astype(str) == 'nan') | (filtered_df['phone'].astype(str).str.len() == 0)]
    
    # Display result count with applied filters
    total_results = len(filtered_df)
    filters_applied = []
    
    if location_filter != "All":
        filters_applied.append(location_filter)
    if contact_filter != "All Contacts":
        filters_applied.append(contact_filter)
    
    if filters_applied:
        filter_text = " + ".join(filters_applied)
        # Display result count with colored background and download icon
        col1, col2 = st.columns([6, 1])
        with col1:
            st.info(f"📊 {total_results} results found with **{filter_text}**")
        with col2:
            if st.button("⬇️", help="Download filtered results as CSV", key="download_filtered_results"):
                st.session_state.show_download_popup = True
                st.session_state.download_data = filtered_df
                st.session_state.download_filename = f"contacts_{filter_text.replace(' + ', '_').replace(' ', '_').lower()}.csv"
    elif total_results < len(df):  # Some filtering happened but shows as "All"
        # Display result count with colored background and download icon
        col1, col2 = st.columns([6, 1])
        with col1:
            st.info(f"📊 {total_results} results found")
        with col2:
            if st.button("⬇️", help="Download results as CSV", key="download_all_results"):
                st.session_state.show_download_popup = True
                st.session_state.download_data = filtered_df
                st.session_state.download_filename = "contacts_filtered.csv"
    
    # Handle download popup
    if st.session_state.get('show_download_popup', False):
        st.markdown("---")
        st.markdown("### 🔐 Password Required for Download")
        
        password_input = st.text_input(
            "Enter password to download results:",
            type="password",
            key="download_password",
            placeholder="Enter password..."
        )
        
        col1, col2, col3 = st.columns([1, 1, 1])
        with col1:
            if st.button("📥 Download CSV", key="confirm_download"):
                if password_input == "Accu@1995!":
                    # Get the data to download
                    download_df = st.session_state.get('download_data', filtered_df)
                    filename = st.session_state.get('download_filename', 'contacts.csv')
                    
                    # Create CSV with exact columns shown in the table
                    columns_to_show = [
                        'name', 'email', 'phone', 'linkedin_url', 'website',
                        'current_company_1', 'current_designation_1', 'current_location_1', 'current_duration_1',
                        'current_company_2', 'current_designation_2', 'current_location_2', 'current_duration_2'
                    ]
                    
                    # Only include columns that exist in the dataframe
                    available_columns = [col for col in columns_to_show if col in download_df.columns]
                    export_df = download_df[available_columns]
                    
                    # Generate CSV
                    csv_data = export_df.to_csv(index=False)
                    
                    st.download_button(
                        label="📁 Click to Download CSV File",
                        data=csv_data,
                        file_name=filename,
                        mime="text/csv",
                        key="final_download"
                    )
                    st.success("✅ Password correct! Click the download button above.")
                else:
                    st.error("❌ Incorrect password. Please try again.")
        
        with col2:
            if st.button("❌ Cancel", key="cancel_download"):
                st.session_state.show_download_popup = False
                st.session_state.pop('download_data', None)
                st.session_state.pop('download_filename', None)
                st.rerun()

    if filtered_df.empty:
        st.info(f"No contacts found for filter: {location_filter} + {contact_filter}")
        return
    
    # Calculate pagination before display
    records_per_page = st.session_state.records_per_page
    total_pages = (len(filtered_df) - 1) // records_per_page + 1
    current_page = min(st.session_state.current_page, total_pages)
    
    # Calculate slice for current page
    start_idx = (current_page - 1) * records_per_page
    end_idx = start_idx + records_per_page
    page_data = filtered_df.iloc[start_idx:end_idx]
    
    # Display data first
    display_contacts_table(page_data, show_edit=True)
    
    # Pagination controls moved to bottom with single-click fix
    st.markdown("---")
    st.markdown("### 📄 Pagination Controls")
    
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col1:
        new_records_per_page = st.selectbox(
            "Records per page:",
            [25, 50, 100],
            index=[25, 50, 100].index(records_per_page) if records_per_page in [25, 50, 100] else 0,
            key="pagination_records_per_page"
        )
        if new_records_per_page != st.session_state.records_per_page:
            st.session_state.records_per_page = new_records_per_page
            st.session_state.current_page = 1  # Reset to first page
            st.rerun()
    
    with col2:
        new_current_page = st.number_input(
            "Page:",
            min_value=1,
            max_value=total_pages,
            value=current_page,
            key="pagination_current_page"
        )
        if new_current_page != st.session_state.current_page:
            st.session_state.current_page = new_current_page
            st.rerun()
    
    with col3:
        st.write(f"Page {current_page} of {total_pages}")
        st.write(f"Total records: {len(filtered_df)}")

def get_user_from_contact(row, selected_user):
    """Determine which user this contact belongs to"""
    if selected_user != 'All':
        return selected_user
    
    # Check if row has a 'user' column first
    if 'user' in row and pd.notna(row['user']) and row['user']:
        return row['user']
    
    # Try to determine from the session state contact manager
    contact_name = row.get('name', '')
    contact_email = row.get('email', '')
    contact_linkedin = row.get('linkedin', '')
    
    for username, user_df in st.session_state.contact_manager.contacts_data.items():
        if not user_df.empty:
            # Check if this row exists in the user's data by comparing key fields
            # Use more flexible matching
            matching_rows = user_df[
                (user_df['name'].fillna('') == contact_name) | 
                (user_df['email'].fillna('') == contact_email) | 
                (user_df['linkedin'].fillna('') == contact_linkedin)
            ]
            if not matching_rows.empty:
                return username
    
    return 'garima'  # Default to garima since most contacts are there

def get_all_users_from_contact(row):
    """Get all users that have this contact (for multi-user initial display)"""
    contact_name = row.get('name', '')
    contact_email = row.get('email', '')
    contact_linkedin = row.get('linkedin', '')
    
    matching_users = []
    
    # Check all users for this contact
    for username, user_df in st.session_state.contact_manager.contacts_data.items():
        if not user_df.empty:
            # Use LinkedIn URL as primary match, then email, then name
            linkedin_match = False
            email_match = False
            name_match = False
            
            if contact_linkedin and pd.notna(contact_linkedin) and contact_linkedin.strip():
                linkedin_match = (user_df['linkedin'].fillna('') == contact_linkedin).any()
            
            if contact_email and pd.notna(contact_email) and contact_email.strip():
                email_match = (user_df['email'].fillna('') == contact_email).any()
            
            if contact_name and pd.notna(contact_name) and contact_name.strip():
                name_match = (user_df['name'].fillna('') == contact_name).any()
            
            # Priority: LinkedIn > Email > Name
            if linkedin_match or (email_match and not linkedin_match) or (name_match and not linkedin_match and not email_match):
                matching_users.append(username)
    
    return matching_users if matching_users else ['garima']

def display_company_info(row, company_type, position_num, row_idx):
    """Display company information in a Streamlit column"""
    company_key = f'{company_type}_company_{position_num}'
    designation_key = f'{company_type}_designation_{position_num}'
    duration_key = f'{company_type}_duration_{position_num}'
    location_key = f'{company_type}_location_{position_num}'
    
    company = row.get(company_key, '')
    designation = row.get(designation_key, '')
    duration = row.get(duration_key, '')
    location = row.get(location_key, '')
    
    if not company or pd.isna(company):
        st.markdown('<div style="color: #ccc; font-style: italic;">-</div>', unsafe_allow_html=True)
        return
    
    # Display company name
    st.markdown(f'<div class="company-name">{company}</div>', unsafe_allow_html=True)
    
    # Display designation
    if designation and pd.notna(designation):
        st.markdown(f'<div class="designation">{designation}</div>', unsafe_allow_html=True)
    
    # Create info button for duration and location
    tooltip_parts = []
    if duration and pd.notna(duration):
        tooltip_parts.append(f'Duration: {duration}')
    if location and pd.notna(location):
        tooltip_parts.append(f'Location: {location}')
    
    if tooltip_parts:
        tooltip_text = ' | '.join(tooltip_parts)
        if st.button("ℹ️", key=f"info_{company_type}_{position_num}_{row_idx}", help=tooltip_text):
            with st.expander("Company Details", expanded=True):
                if duration and pd.notna(duration):
                    st.write(f"**Duration:** {duration}")
                if location and pd.notna(location):
                    st.write(f"**Location:** {location}")

def display_contacts_table(df, show_edit=False):
    if df.empty:
        return
    
    # Enhanced table styling with equal column widths and better spacing
    st.markdown("""
    <style>
    .contact-table-container {
        width: 100%;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .table-header {
        background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
        color: white;
        padding: 12px 8px;
        font-weight: 600;
        text-align: center;
        border-radius: 6px;
        font-size: 14px;
        margin-bottom: 2px;
        box-shadow: 0 2px 4px rgba(229, 62, 62, 0.3);
    }
    
    .table-row-container {
        background: white;
        border-radius: 8px;
        margin-bottom: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        border: 1px solid #e2e8f0;
        overflow: hidden;
    }
    
    .table-row-container:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transform: translateY(-1px);
        transition: all 0.2s ease;
    }
    
    .table-cell {
        padding: 12px 8px;
        font-size: 13px;
        line-height: 1.4;
        border-right: 1px solid #f1f5f9;
        min-height: 60px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
    }
    
    .table-cell:last-child {
        border-right: none;
    }
    
    .edit-button-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        min-height: 60px;
        width: 100%;
        padding: 0;
        margin: 0;
    }
    
    .edit-button-container > div {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
    }
    
    .name-with-flag {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
    }
    
    .user-initial {
        background: #667eea;
        color: white;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 600;
        flex-shrink: 0;
    }
    
    .name-text {
        font-weight: 600;
        color: #1e293b;
        font-size: 14px;
    }
    
    .country-flag {
        font-size: 16px;
        cursor: pointer;
        margin-left: 4px;
    }
    
    .contact-info {
        font-size: 12px;
        color: #64748b;
        margin: 2px 0;
        word-break: break-all;
    }
    
    .contact-info a {
        color: #0077b5;
        text-decoration: none;
        font-weight: 500;
    }
    
    .contact-info a:hover {
        text-decoration: underline;
    }
    
    .company-info {
        background: #f8fafc;
        padding: 6px;
        border-radius: 4px;
        border-left: 3px solid #667eea;
        font-size: 11px;
    }
    
    .company-name {
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 2px;
    }
    
    .company-role {
        color: #64748b;
        font-size: 11px;
    }
    
    .truncated-text {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    .empty-cell {
        color: #94a3b8;
        font-style: italic;
        text-align: center;
        opacity: 0.6;
    }
    
    /* Enhanced hover tooltips for company info */
    .company-info-hover {
        position: relative;
        cursor: pointer;
        padding: 6px;
        border-radius: 4px;
        transition: all 0.3s ease;
        background: #f8fafc;
        border-left: 3px solid #667eea;
    }
    
    .company-info-hover:hover {
        background: linear-gradient(135deg, #fff0f0 0%, #ffe8e8 100%);
        border-left: 3px solid #ff4444;
        transform: scale(1.02);
        box-shadow: 0 2px 8px rgba(255, 68, 68, 0.2);
    }
    
    .company-info-hover[title]:hover::after {
        content: attr(title);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
        color: #ff4444;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 11px;
        white-space: normal;
        word-wrap: break-word;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        border: 1px solid #ff4444;
        max-width: 300px;
        min-width: 150px;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Use provided dataframe (filtering is done in display_paginated_results)
    filtered_df = df
    
    # Column headers with smaller edit column
    header_cols = st.columns([1.5, 1.5, 1.5, 1.5, 1.5, 0.8])
    headers = ["Contact Details", "Current Company 1", "Current Company 2", "Previous Company 1", "Previous Company 2", "Actions"]
    for i, header in enumerate(headers):
        with header_cols[i]:
            st.markdown(f'<div class="table-header">{header}</div>', unsafe_allow_html=True)
    
    # Display contact rows with enhanced layout
    for idx, row in filtered_df.iterrows():
        edit_key = f"edit_{idx}"
        is_editing = st.session_state.get(edit_key, False)
        
        if is_editing:
            show_edit_form(row, idx, edit_key)
        else:
            # Create row container with equal columns
            st.markdown('<div class="table-row-container">', unsafe_allow_html=True)
            row_cols = st.columns([1.5, 1.5, 1.5, 1.5, 1.5, 0.8])
            
            # Column 1: Contact Details (Name + Country Flag + Contact Info)
            with row_cols[0]:
                name = truncate_text(row.get('name', 'N/A'), 25)
                all_users = get_all_users_from_contact(row)
                
                # Get country flag and name
                country_flag, country_name = extract_country_from_location(row)
                
                # User initials
                if len(all_users) > 1:
                    user_initials = ''.join([user[0].upper() for user in all_users])
                    initial_color = "#e74c3c"  # Red for multiple users
                else:
                    user_initials = all_users[0][0].upper() if all_users else 'U'
                    initial_color = "#667eea"  # Blue for single user
                
                # Name with flag and tooltip (escaped for security)
                import html
                name_escaped = html.escape(name)
                country_name_escaped = html.escape(country_name) if country_name else ''
                
                name_with_flag_html = f'''
                <div class="name-with-flag">
                    <div class="user-initial" style="background-color: {initial_color}">{user_initials}</div>
                    <div class="name-text truncated-text">{name_escaped}</div>
                    {f'<span class="country-flag" title="{country_name_escaped}">{country_flag}</span>' if country_flag else ''}
                </div>
                '''
                st.markdown(name_with_flag_html, unsafe_allow_html=True)
                
                # Contact info
                contact_info = []
                
                email = row.get('email', '')
                if email and pd.notna(email) and str(email).strip():
                    truncated_email = truncate_text(str(email), 25)
                    email_escaped = html.escape(truncated_email)
                    contact_info.append(f"📧 {email_escaped}")
                
                phone = clean_phone_display(row.get('phone', ''))
                if phone and str(phone).strip():
                    phone_escaped = html.escape(str(phone))
                    contact_info.append(f"📞 {phone_escaped}")
                
                linkedin = row.get('linkedin', '')
                if linkedin and pd.notna(linkedin) and str(linkedin).strip():
                    linkedin_escaped = html.escape(str(linkedin))
                    contact_info.append(f'💼 <a href="{linkedin_escaped}" target="_blank" style="color: #0077b5; text-decoration: none;">LinkedIn</a>')
                
                if contact_info:
                    contact_html = "<br>".join(contact_info)
                    st.markdown(f'<div class="contact-info">{contact_html}</div>', unsafe_allow_html=True)
            
            # Columns 2-5: Company Information
            company_configs = [
                ('current', 1, row_cols[1]),
                ('current', 2, row_cols[2]), 
                ('previous', 1, row_cols[3]),
                ('previous', 2, row_cols[4])
            ]
            
            for company_type, position_num, col in company_configs:
                with col:
                    company = row.get(f'{company_type}_company_{position_num}', '')
                    if company and pd.notna(company):
                        designation = row.get(f'{company_type}_designation_{position_num}', '')
                        duration = row.get(f'{company_type}_duration_{position_num}', '')
                        location = row.get(f'{company_type}_location_{position_num}', '')
                        
                        # Truncated company info
                        company_truncated = truncate_text(str(company), 25)
                        designation_truncated = truncate_text(str(designation), 25) if designation and pd.notna(designation) else ''
                        
                        # Build hover tooltip content with HTML escaping
                        tooltip_content = ""
                        if (duration and pd.notna(duration)) or (location and pd.notna(location)):
                            tooltip_details = []
                            if duration and pd.notna(duration):
                                tooltip_details.append(f"⏰ Duration: {html.escape(str(duration))}")
                            if location and pd.notna(location):
                                tooltip_details.append(f"📍 Location: {html.escape(str(location))}")
                            tooltip_content = " | ".join(tooltip_details)
                        
                        # Escape all user data before inserting into HTML
                        escaped_tooltip = html.escape(tooltip_content)
                        escaped_company = html.escape(str(company))
                        escaped_company_truncated = html.escape(str(company_truncated))
                        escaped_designation = html.escape(str(designation)) if designation and pd.notna(designation) else ""
                        escaped_designation_truncated = html.escape(str(designation_truncated)) if designation_truncated else ""
                        
                        company_html = f'''
                        <div class="company-info-hover" title="{escaped_tooltip}">
                            <div class="company-name truncated-text" title="{escaped_company}">{escaped_company_truncated}</div>
                            {f'<div class="company-role truncated-text" title="{escaped_designation}">{escaped_designation_truncated}</div>' if escaped_designation_truncated else ''}
                        </div>
                        '''
                        st.markdown(company_html, unsafe_allow_html=True)
                    else:
                        st.markdown('<div class="empty-cell">—</div>', unsafe_allow_html=True)
            
            # Column 6: Actions (centered)
            with row_cols[5]:
                st.markdown('<div class="edit-button-container">', unsafe_allow_html=True)
                if st.button("✏️", key=f"edit_btn_{idx}", help="Edit contact"):
                    st.session_state[edit_key] = True
                    st.rerun()
                st.markdown('</div>', unsafe_allow_html=True)
            
            st.markdown('</div>', unsafe_allow_html=True)

def show_edit_form(row, idx, edit_key):
    """Display edit form for a contact"""
    st.markdown("### ✏️ Edit Contact")
    
    # Create form columns
    col1, col2, col3 = st.columns([1, 1, 1])
    
    with col1:
        st.markdown("**Basic Information**")
        new_name = st.text_input("Name", value=row.get('name', ''), key=f"edit_name_{idx}")
        new_email = st.text_input("Email", value=row.get('email', ''), key=f"edit_email_{idx}")
        new_phone = st.text_input("Phone", value=clean_phone_display(row.get('phone', '')), key=f"edit_phone_{idx}")
        new_linkedin = st.text_input("LinkedIn", value=row.get('linkedin', ''), key=f"edit_linkedin_{idx}")
    
    with col2:
        st.markdown("**Current Companies**")
        new_current_company_1 = st.text_input("Current Company 1", value=row.get('current_company_1', ''), key=f"edit_curr_comp1_{idx}")
        new_current_designation_1 = st.text_input("Current Designation 1", value=row.get('current_designation_1', ''), key=f"edit_curr_des1_{idx}")
        new_current_duration_1 = st.text_input("Current Duration 1", value=row.get('current_duration_1', ''), key=f"edit_curr_dur1_{idx}")
        new_current_location_1 = st.text_input("Current Location 1", value=row.get('current_location_1', ''), key=f"edit_curr_loc1_{idx}")
        
        new_current_company_2 = st.text_input("Current Company 2", value=row.get('current_company_2', ''), key=f"edit_curr_comp2_{idx}")
        new_current_designation_2 = st.text_input("Current Designation 2", value=row.get('current_designation_2', ''), key=f"edit_curr_des2_{idx}")
        new_current_duration_2 = st.text_input("Current Duration 2", value=row.get('current_duration_2', ''), key=f"edit_curr_dur2_{idx}")
        new_current_location_2 = st.text_input("Current Location 2", value=row.get('current_location_2', ''), key=f"edit_curr_loc2_{idx}")
    
    with col3:
        st.markdown("**Previous Companies**")
        new_previous_company_1 = st.text_input("Previous Company 1", value=row.get('previous_company_1', ''), key=f"edit_prev_comp1_{idx}")
        new_previous_designation_1 = st.text_input("Previous Designation 1", value=row.get('previous_designation_1', ''), key=f"edit_prev_des1_{idx}")
        new_previous_duration_1 = st.text_input("Previous Duration 1", value=row.get('previous_duration_1', ''), key=f"edit_prev_dur1_{idx}")
        new_previous_location_1 = st.text_input("Previous Location 1", value=row.get('previous_location_1', ''), key=f"edit_prev_loc1_{idx}")
        
        new_previous_company_2 = st.text_input("Previous Company 2", value=row.get('previous_company_2', ''), key=f"edit_prev_comp2_{idx}")
        new_previous_designation_2 = st.text_input("Previous Designation 2", value=row.get('previous_designation_2', ''), key=f"edit_prev_des2_{idx}")
        new_previous_duration_2 = st.text_input("Previous Duration 2", value=row.get('previous_duration_2', ''), key=f"edit_prev_dur2_{idx}")
        new_previous_location_2 = st.text_input("Previous Location 2", value=row.get('previous_location_2', ''), key=f"edit_prev_loc2_{idx}")
    
    # Action buttons
    btn_col1, btn_col2, btn_col3 = st.columns([1, 1, 4])
    
    with btn_col1:
        if st.button("💾 Save", key=f"save_{idx}", type="primary"):
            # Update the contact data
            updated_data = {
                'name': new_name,
                'email': new_email,
                'phone': new_phone,
                'linkedin': new_linkedin,
                'current_company_1': new_current_company_1,
                'current_designation_1': new_current_designation_1,
                'current_duration_1': new_current_duration_1,
                'current_location_1': new_current_location_1,
                'current_company_2': new_current_company_2,
                'current_designation_2': new_current_designation_2,
                'current_duration_2': new_current_duration_2,
                'current_location_2': new_current_location_2,
                'previous_company_1': new_previous_company_1,
                'previous_designation_1': new_previous_designation_1,
                'previous_duration_1': new_previous_duration_1,
                'previous_location_1': new_previous_location_1,
                'previous_company_2': new_previous_company_2,
                'previous_designation_2': new_previous_designation_2,
                'previous_duration_2': new_previous_duration_2,
                'previous_location_2': new_previous_location_2
            }
            
            # Save the changes
            save_contact_changes(row, updated_data, idx)
            st.session_state[edit_key] = False
            st.success("Contact updated successfully!")
            st.rerun()
    
    with btn_col2:
        if st.button("❌ Cancel", key=f"cancel_{idx}"):
            st.session_state[edit_key] = False
            st.rerun()

def save_contact_changes(original_row, updated_data, idx):
    """Save changes to the contact in the CSV file"""
    try:
        # Get the user for this contact
        user_info = get_user_from_contact(original_row, st.session_state.selected_user)
        
        # Load the user's data
        user_df = st.session_state.contact_manager.contacts_data.get(user_info, pd.DataFrame())
        
        if user_df.empty:
            st.error(f"Could not find data for user: {user_info}")
            return
        
        # Find the matching row to update
        matching_mask = (
            (user_df['name'] == original_row.get('name', '')) &
            (user_df['email'] == original_row.get('email', '')) &
            (user_df['linkedin'] == original_row.get('linkedin', ''))
        )
        
        matching_indices = user_df.index[matching_mask]
        
        if len(matching_indices) > 0:
            # Update the first matching row
            update_idx = matching_indices[0]
            for field, value in updated_data.items():
                if field in user_df.columns:
                    user_df.loc[update_idx, field] = value if value else ''
            
            # Save back to CSV
            csv_path = f"data/{user_info}.csv"
            user_df.to_csv(csv_path, index=False)
            
            # Update the contact manager's data
            st.session_state.contact_manager.contacts_data[user_info] = user_df
            
        else:
            st.error("Could not find the contact to update")
            
    except Exception as e:
        st.error(f"Error saving changes: {str(e)}")

# Function removed - using new modern card layout instead

def add_contact_page():
    st.header("➕ Add New Contact")
    
    # Tabs for different ways to add contacts
    tab1, tab2 = st.tabs(["📝 Manual Entry", "📁 Upload CSV File"])
    
    with tab2:
        st.subheader("📁 Upload CSV File to Append Data")
        st.info("Upload a CSV file named with the username (e.g., garima.csv, prashant.csv) to append data to that user's contacts.")
        
        uploaded_file = st.file_uploader(
            "Choose a CSV file with LinkedIn connections data",
            type="csv",
            help="Upload your CSV file named as username.csv (e.g., garima.csv)",
            key="csv_append_uploader"
        )
        
        if uploaded_file is not None:
            try:
                # Extract username from filename (case-insensitive)
                original_filename = uploaded_file.name
                username = os.path.splitext(original_filename)[0].lower()
                
                # Load the CSV file with encoding detection
                new_df = read_csv_with_encoding_from_upload(uploaded_file)
                
                st.success(f"✅ Successfully loaded {len(new_df)} records from {original_filename}")
                st.info(f"📝 **Target User:** {username}")
                
                # Display preview
                st.subheader("Data Preview")
                st.dataframe(new_df.head(5))
                
                # Show column comparison
                st.subheader("Column Validation")
                expected_cols = set(st.session_state.contact_manager.original_columns)
                uploaded_cols = set(new_df.columns)
                
                missing_cols = expected_cols - uploaded_cols
                extra_cols = uploaded_cols - expected_cols
                
                if missing_cols:
                    st.warning(f"Missing columns (will be filled with empty values): {', '.join(missing_cols)}")
                if extra_cols:
                    st.info(f"Extra columns (will be ignored): {', '.join(extra_cols)}")
                
                # Append data button
                if st.button("➕ Append Data to User Contacts", type="primary"):
                    try:
                        result_count = st.session_state.contact_manager.append_csv_data(username, new_df)
                        st.success(f"✅ Successfully processed {result_count} contacts for {username}'s database!")
                        st.info("📝 **Note:** Contacts with existing LinkedIn URLs were updated, others were added as new contacts.")
                        st.balloons()
                        
                        # Refresh the contact manager to pick up new users
                        st.session_state.contact_manager.discover_and_load_all_users()
                        st.rerun()
                    except Exception as e:
                        st.error(f"Error appending data: {str(e)}")
                        
            except Exception as e:
                st.error(f"Error loading CSV file: {str(e)}")
                st.info("Please ensure your CSV file has the correct format and headers.")
    
    with tab1:
        st.subheader("📝 Manual Entry Form")
        
        # User selection for manual entry
        available_users = st.session_state.contact_manager.get_available_users()
        non_all_users = [user for user in available_users if user != 'All']
        
        if not non_all_users:
            st.warning("No user CSV files found. Please upload at least one CSV file first.")
            return
        
        selected_user_for_entry = st.selectbox(
            "Select user to add contact to:",
            non_all_users + ["Create New User"],
            key="manual_entry_user"
        )
        
        if selected_user_for_entry == "Create New User":
            new_username = st.text_input("Enter new username:", key="new_username")
            if new_username:
                selected_user_for_entry = new_username.lower()  # Normalize to lowercase
            else:
                st.info("Please enter a username to create a new user.")
                return
        
        with st.form("add_contact_form"):
            col1, col2 = st.columns(2)
            
            with col1:
                st.subheader("Basic Information")
                name = st.text_input("Name*", key="add_name")
                email = st.text_input("Email", key="add_email")
                phone = st.text_input("Phone", key="add_phone")
                linkedin = st.text_input("LinkedIn Profile", key="add_linkedin")
                website = st.text_input("Website", key="add_website")
                
                st.subheader("Current Position")
                current_company_1 = st.text_input("Current Company", key="add_current_company_1")
                current_designation_1 = st.text_input("Current Designation", key="add_current_designation_1")
                current_duration_1 = st.text_input("Duration", key="add_current_duration_1")
                current_location_1 = st.text_input("Location", key="add_current_location_1")
            
            with col2:
                st.subheader("Previous Positions")
                
                # Previous position 1
                st.markdown("**Previous Position 1**")
                previous_company_1 = st.text_input("Company", key="add_previous_company_1")
                previous_designation_1 = st.text_input("Designation", key="add_previous_designation_1")
                previous_duration_1 = st.text_input("Duration", key="add_previous_duration_1")
                previous_location_1 = st.text_input("Location", key="add_previous_location_1")
                
                # Previous position 2
                st.markdown("**Previous Position 2**")
                previous_company_2 = st.text_input("Company", key="add_previous_company_2")
                previous_designation_2 = st.text_input("Designation", key="add_previous_designation_2")
                previous_duration_2 = st.text_input("Duration", key="add_previous_duration_2")
                previous_location_2 = st.text_input("Location", key="add_previous_location_2")
            
            submitted = st.form_submit_button("➕ Add Contact", type="primary")
            
            if submitted:
                if not name:
                    st.error("Name is required!")
                else:
                    contact_data = {
                        'name': name,
                        'email': email,
                        'phone': phone,
                        'linkedin': linkedin,
                        'website': website,
                        'current_company_1': current_company_1,
                        'current_designation_1': current_designation_1,
                        'current_duration_1': current_duration_1,
                        'current_location_1': current_location_1,
                        'previous_company_1': previous_company_1,
                        'previous_designation_1': previous_designation_1,
                        'previous_duration_1': previous_duration_1,
                        'previous_location_1': previous_location_1,
                        'previous_company_2': previous_company_2,
                        'previous_designation_2': previous_designation_2,
                        'previous_duration_2': previous_duration_2,
                        'previous_location_2': previous_location_2,
                    }
                    
                    try:
                        st.session_state.contact_manager.add_contact(selected_user_for_entry, contact_data)
                        st.success(f"✅ Contact added successfully to {selected_user_for_entry}!")
                        st.rerun()
                    except Exception as e:
                        st.error(f"Error adding contact: {str(e)}")
    
    # Tiny file download icon at bottom right
    st.markdown("""
    <style>
    .tiny-download-icon {
        position: fixed;
        bottom: 15px;
        right: 15px;
        width: 20px;
        height: 20px;
        background: #f3f4f6;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        cursor: pointer;
        z-index: 9999;
        border: 1px solid #d1d5db;
        color: #6b7280;
        transition: all 0.2s ease;
    }
    .tiny-download-icon:hover {
        background: #e5e7eb;
        transform: scale(1.1);
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Create zip download for all .py files and modified files
    try:
        # Create zip file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Add all .py files in the project
            py_files = ['app.py', 'contact_manager.py', 'zip_download.py']
            for py_file in py_files:
                try:
                    with open(py_file, 'r', encoding='utf-8') as f:
                        zip_file.writestr(py_file, f.read())
                except:
                    pass
            
            # Add replit.md
            try:
                with open('replit.md', 'r', encoding='utf-8') as f:
                    zip_file.writestr('replit.md', f.read())
            except:
                pass
        
        zip_buffer.seek(0)
        
        # Position the download button at bottom right
        col1, col2 = st.columns([20, 1])
        with col2:
            st.download_button(
                label="📁",
                data=zip_buffer.getvalue(),
                file_name="modified_files.zip",
                mime="application/zip",
                key="dl_zip_files",
                help="Download modified files for DigitalOcean deployment"
            )
            
    except Exception as e:
        # Fallback if zip creation fails - show minimal error
        pass

def edit_contact_modal():
    st.header("✏️ Edit Contact")
    
    contact_data = st.session_state.edit_contact_data
    
    with st.form("edit_contact_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Basic Information")
            name = st.text_input("Name*", value=contact_data.get('name', ''))
            email = st.text_input("Email", value=contact_data.get('email', ''))
            phone = st.text_input("Phone", value=contact_data.get('phone', ''))
            linkedin = st.text_input("LinkedIn Profile", value=contact_data.get('linkedin', ''))
            website = st.text_input("Website", value=contact_data.get('website', ''))
            
            st.subheader("Current Position")
            current_company_1 = st.text_input("Current Company", value=contact_data.get('current_company_1', ''))
            current_designation_1 = st.text_input("Current Designation", value=contact_data.get('current_designation_1', ''))
            current_duration_1 = st.text_input("Duration", value=contact_data.get('current_duration_1', ''))
            current_location_1 = st.text_input("Location", value=contact_data.get('current_location_1', ''))
        
        with col2:
            st.subheader("Previous Positions")
            
            # Previous position 1
            st.markdown("**Previous Position 1**")
            previous_company_1 = st.text_input("Company", value=contact_data.get('previous_company_1', ''))
            previous_designation_1 = st.text_input("Designation", value=contact_data.get('previous_designation_1', ''))
            previous_duration_1 = st.text_input("Duration", value=contact_data.get('previous_duration_1', ''))
            previous_location_1 = st.text_input("Location", value=contact_data.get('previous_location_1', ''))
            
            # Previous position 2
            st.markdown("**Previous Position 2**")
            previous_company_2 = st.text_input("Company", value=contact_data.get('previous_company_2', ''))
            previous_designation_2 = st.text_input("Designation", value=contact_data.get('previous_designation_2', ''))
            previous_duration_2 = st.text_input("Duration", value=contact_data.get('previous_duration_2', ''))
            previous_location_2 = st.text_input("Location", value=contact_data.get('previous_location_2', ''))
        
        col1, col2, col3 = st.columns([1, 1, 1])
        with col1:
            update_submitted = st.form_submit_button("💾 Update Contact", type="primary")
        with col2:
            cancel_submitted = st.form_submit_button("❌ Cancel")
        
        if update_submitted:
            if not name:
                st.error("Name is required!")
            else:
                updated_data = {
                    'name': name,
                    'email': email,
                    'phone': phone,
                    'linkedin': linkedin,
                    'website': website,
                    'current_company_1': current_company_1,
                    'current_designation_1': current_designation_1,
                    'current_duration_1': current_duration_1,
                    'current_location_1': current_location_1,
                    'previous_company_1': previous_company_1,
                    'previous_designation_1': previous_designation_1,
                    'previous_duration_1': previous_duration_1,
                    'previous_location_1': previous_location_1,
                    'previous_company_2': previous_company_2,
                    'previous_designation_2': previous_designation_2,
                    'previous_duration_2': previous_duration_2,
                    'previous_location_2': previous_location_2,
                }
                
                try:
                    st.session_state.contact_manager.update_contact(st.session_state.edit_contact_id, updated_data)
                    st.success("✅ Contact updated successfully!")
                    
                    # Clear edit state
                    del st.session_state.edit_contact_id
                    del st.session_state.edit_contact_data
                    st.rerun()
                except Exception as e:
                    st.error(f"Error updating contact: {str(e)}")
        
        if cancel_submitted:
            # Clear edit state
            del st.session_state.edit_contact_id
            del st.session_state.edit_contact_data
            st.rerun()

# Handle contact editing
if hasattr(st.session_state, 'edit_contact_id') and st.session_state.edit_contact_id is not None:
    edit_contact_modal()

if __name__ == "__main__":
    main()