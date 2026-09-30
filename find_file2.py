import re

with open('node_mem.dump', 'rb') as f:
    data = f.read()

idx = data.find(b"export default function AdminDashboard")
while idx != -1:
    print(f"Found at {idx}")
    # Extract backward to start of file (imports)
    start = max(0, idx - 5000)
    # Search backwards for "import React"
    react_idx = data.rfind(b"import React", start, idx)
    if react_idx != -1:
        start = react_idx
    else:
        start = idx - 1000

    # The file ends with "export default AdminDashboard;" or "}"
    # Let's just extract a large chunk (300,000 bytes) and we can trim it
    end = min(len(data), start + 350000)
    chunk = data[start:end]
    
    res = bytearray()
    for b in chunk:
        if 32 <= b <= 126 or b in (9, 10, 13):
            res.append(b)
        else:
            res.append(ord('.'))
            
    with open(f"extract_full_{idx}.txt", "wb") as out:
        out.write(res)
        
    idx = data.find(b"export default function AdminDashboard", idx + 1)
