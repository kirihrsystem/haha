import re

with open('node_mem.dump', 'rb') as f:
    data = f.read()

# search for "export default function AdminDashboard"
idx = data.find(b"export default function AdminDashboard")
while idx != -1:
    print(f"Found at {idx}")
    # Extract 10000 bytes around it
    start = max(0, idx - 500)
    end = min(len(data), idx + 200000)
    chunk = data[start:end]
    # filter printable
    res = bytearray()
    for b in chunk:
        if 32 <= b <= 126 or b in (9, 10, 13):
            res.append(b)
        else:
            # maybe stop if too much binary?
            res.append(ord('.'))
    
    with open(f"extract_{idx}.txt", "wb") as out:
        out.write(res)
        
    idx = data.find(b"export default function AdminDashboard", idx + 1)
