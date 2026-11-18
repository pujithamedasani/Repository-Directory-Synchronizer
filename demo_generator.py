#!/usr/bin/env python3
"""
SyncSphere Demo Data Generator
Creates sample source and destination directories for testing.
Run this script to generate test data for the application.

OS Concept: File I/O Operations - programmatic file and directory creation
"""
import os
import shutil
import random
import string
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).parent

def generate_text_content(lines=20):
    """Generate random text file content."""
    words = ["synchronize", "directory", "file", "monitor", "compare", "hash", 
             "filesystem", "metadata", "operation", "process", "thread", "async",
             "backup", "restore", "transfer", "checksum", "integrity", "event"]
    content = []
    for _ in range(lines):
        line_words = random.choices(words, k=random.randint(5, 12))
        content.append(" ".join(line_words))
    return "\n".join(content)

def generate_code_content(lang="python"):
    """Generate sample code file content."""
    if lang == "python":
        return '''#!/usr/bin/env python3
"""Sample Python file generated for SyncSphere testing."""
import os
from pathlib import Path

def process_files(directory: str) -> list:
    """Process all files in directory."""
    results = []
    for path in Path(directory).rglob("*"):
        if path.is_file():
            results.append({
                "name": path.name,
                "size": path.stat().st_size,
                "modified": path.stat().st_mtime
            })
    return results

if __name__ == "__main__":
    files = process_files(".")
    print(f"Found {len(files)} files")
'''
    elif lang == "js":
        return '''// Sample JavaScript file for SyncSphere testing
const fs = require('fs');
const path = require('path');

function scanDirectory(dirPath) {
    const results = [];
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        results.push({
            name: item,
            size: stat.size,
            isDirectory: stat.isDirectory()
        });
    }
    return results;
}

module.exports = { scanDirectory };
'''
    return "// Sample file content\nconsole.log('Hello from SyncSphere');\n"

def create_demo_data():
    """Create demo source and destination directories."""
    source_dir = BASE_DIR / "demo_source"
    dest_dir = BASE_DIR / "demo_dest"
    
    # Clean up if already exist
    if source_dir.exists():
        shutil.rmtree(source_dir)
    if dest_dir.exists():
        shutil.rmtree(dest_dir)
    
    print("Creating demo source directory structure...")
    
    # Create source structure
    # Root level files
    (source_dir).mkdir(parents=True)
    (source_dir / "README.md").write_text(
        "# Demo Project\n\nThis is a sample project for SyncSphere testing.\n\n" +
        generate_text_content(10)
    )
    (source_dir / "config.json").write_text(
        '{\n  "version": "1.0.0",\n  "name": "demo-project",\n  "debug": false\n}'
    )
    (source_dir / "main.py").write_text(generate_code_content("python"))
    (source_dir / "app.js").write_text(generate_code_content("js"))
    (source_dir / "data.csv").write_text(
        "id,name,value,timestamp\n" + 
        "\n".join(f"{i},item_{i},{random.randint(1,100)},{datetime.now().isoformat()}" 
                  for i in range(1, 21))
    )
    
    # Create subdirectories
    for subdir_name in ["src", "docs", "tests", "assets"]:
        subdir = source_dir / subdir_name
        subdir.mkdir()
        
        # Add files to each subdir
        for i in range(1, 4):
            (subdir / f"file_{i}.txt").write_text(generate_text_content(15))
        
        if subdir_name == "src":
            (subdir / "utils.py").write_text(generate_code_content("python"))
            (subdir / "models.js").write_text(generate_code_content("js"))
            # Create nested subdir
            nested = subdir / "components"
            nested.mkdir()
            for i in range(1, 4):
                (nested / f"component_{i}.jsx").write_text(
                    f"// Component {i}\nexport const Component{i} = () => {{\n  return <div>Component {i}</div>;\n}};\n"
                )
        
        elif subdir_name == "docs":
            for doc in ["installation.md", "api.md", "configuration.md"]:
                (subdir / doc).write_text(f"# {doc.replace('.md', '').title()}\n\n" + generate_text_content(20))
        
        elif subdir_name == "assets":
            # Create some binary-like content
            (subdir / "logo.svg").write_text(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
                '<circle cx="50" cy="50" r="40" fill="#6366f1"/></svg>'
            )
            (subdir / "style.css").write_text(
                "body { margin: 0; font-family: sans-serif; }\n"
                ".container { max-width: 1200px; margin: 0 auto; }\n"
                ".header { background: #6366f1; color: white; padding: 1rem; }\n"
            )
    
    print(f"  Source created: {source_dir}")
    
    # Create destination: copy some files, modify some, leave some out
    print("Creating demo destination directory structure...")
    dest_dir.mkdir()
    
    # Copy most root files but NOT app.js (will be "new" in comparison)
    shutil.copy2(source_dir / "README.md", dest_dir / "README.md")
    shutil.copy2(source_dir / "main.py", dest_dir / "main.py")
    shutil.copy2(source_dir / "data.csv", dest_dir / "data.csv")
    
    # Modify config.json in dest (will be "modified" in comparison)
    (dest_dir / "config.json").write_text(
        '{\n  "version": "0.9.0",\n  "name": "demo-project",\n  "debug": true,\n  "legacy": true\n}'
    )
    
    # Copy src directory partially
    src_dest = dest_dir / "src"
    src_dest.mkdir()
    shutil.copy2(source_dir / "src" / "file_1.txt", src_dest / "file_1.txt")
    # file_2.txt and file_3.txt are missing (will be "new")
    # Modify utils.py
    (src_dest / "utils.py").write_text(
        generate_code_content("python") + "\n# This version is older\n"
    )
    # models.js missing
    
    # Create components in dest but with one modified
    nested_dest = src_dest / "components"
    nested_dest.mkdir()
    shutil.copy2(source_dir / "src" / "components" / "component_1.jsx", 
                 nested_dest / "component_1.jsx")
    # component_2.jsx and component_3.jsx missing
    
    # Copy docs but skip one
    docs_dest = dest_dir / "docs"
    docs_dest.mkdir()
    shutil.copy2(source_dir / "docs" / "installation.md", docs_dest / "installation.md")
    shutil.copy2(source_dir / "docs" / "api.md", docs_dest / "api.md")
    # configuration.md missing
    
    # Add an extra file in dest that's not in source (will be "deleted" in one-way sync)
    (dest_dir / "legacy_config.json").write_text('{"legacy": true, "deprecated": true}')
    (docs_dest / "old_readme.md").write_text("# Old README\n\nThis is an old file not in source.\n")
    
    # Skip assets entirely (all files will be "new")
    
    # Skip tests entirely (all files will be "new")
    
    print(f"  Destination created: {dest_dir}")
    
    # Count files
    source_files = list(source_dir.rglob("*"))
    dest_files = list(dest_dir.rglob("*"))
    source_file_count = sum(1 for f in source_files if f.is_file())
    dest_file_count = sum(1 for f in dest_files if f.is_file())
    
    print(f"\n✓ Demo data created successfully!")
    print(f"  Source: {source_dir}")
    print(f"    Files: {source_file_count}")
    print(f"  Destination: {dest_dir}")
    print(f"    Files: {dest_file_count}")
    print(f"\nExpected comparison results:")
    print(f"  New files: ~{source_file_count - dest_file_count + 2} (in source, not in dest)")
    print(f"  Modified files: ~3 (config.json, src/utils.py)")
    print(f"  Deleted files: ~2 (in dest, not in source: legacy_config.json, old_readme.md)")
    print(f"  Unchanged files: ~{dest_file_count - 2}")
    print(f"\nTo use in SyncSphere:")
    print(f"  Source: {source_dir.absolute()}")
    print(f"  Dest:   {dest_dir.absolute()}")

if __name__ == "__main__":
    print("=" * 50)
    print("SyncSphere Demo Data Generator")
    print("=" * 50)
    print()
    create_demo_data()
