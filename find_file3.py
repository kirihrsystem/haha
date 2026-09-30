import re

with open('node_mem.dump', 'rb') as f:
    data = f.read()

idx = data.find(b"export default function AdminDashboard")
while idx != -1:
    print(f"Found at {idx}")
    start = max(0, idx - 5000)
    react_idx = data.rfind(b"import React", start, idx)
    if react_idx != -1:
        start = react_idx
    else:
        start = idx - 1000

    end = min(len(data), start + 350000)
    chunk = data[start:end]
    
    # Write exactly the raw bytes
    with open(f"extract_raw_{idx}.bin", "wb") as out:
        out.write(chunk)
        
    idx = data.find(b"export default function AdminDashboard", idx + 1)
