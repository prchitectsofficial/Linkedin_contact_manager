import streamlit as st
import os

st.title("📦 Download Your LinkedIn Contact Manager")

# Check if archive exists
archive_path = "/home/runner/workspace/project-backup.tar.gz"
if os.path.exists(archive_path):
    st.success("✅ Your project archive is ready!")
    
    # Get file size
    file_size = os.path.getsize(archive_path)
    size_mb = file_size / (1024 * 1024)
    
    st.info(f"📊 **File Details:**")
    st.write(f"• **Filename:** project-backup.tar.gz")
    st.write(f"• **Size:** {size_mb:.1f} MB")
    st.write(f"• **Contains:** Complete LinkedIn Contact Manager with all 13,115 contacts")
    
    # Create download button
    with open(archive_path, "rb") as file:
        st.download_button(
            label="⬇️ Download Project Archive",
            data=file.read(),
            file_name="linkedin-contact-manager-backup.tar.gz",
            mime="application/gzip",
            help="Download your complete project as a compressed archive"
        )
    
    st.markdown("---")
    st.markdown("**📁 What's included in the archive:**")
    st.markdown("""
    - ✅ `app.py` - Main Streamlit application
    - ✅ `contact_manager.py` - Contact management logic  
    - ✅ `data/garima.csv` - All 13,115 contact records
    - ✅ `.streamlit/config.toml` - App configuration
    - ✅ `replit.md` - Project documentation
    - ✅ Other configuration files
    """)
    
else:
    st.error("❌ Archive not found. Please create the archive first.")
    if st.button("🔄 Create Archive Now"):
        import subprocess
        result = subprocess.run([
            "tar", "-czf", archive_path, 
            "app.py", "contact_manager.py", "data/", ".streamlit/", "replit.md", "pyproject.toml"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            st.success("✅ Archive created successfully!")
            st.rerun()
        else:
            st.error(f"❌ Failed to create archive: {result.stderr}")