import re

with open('extract_raw_292178803.bin', 'rb') as f:
    data = f.read()

# Let's see if we can decode it as utf-8 or utf-16le
try:
    s = data.decode('utf-8')
    with open('decoded_utf8.txt', 'w', encoding='utf-8') as out:
        out.write(s)
    print("Decoded as utf-8")
except:
    pass

try:
    s = data.decode('utf-16le')
    with open('decoded_utf16.txt', 'w', encoding='utf-8') as out:
        out.write(s)
    print("Decoded as utf-16le")
except:
    pass
