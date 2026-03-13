from pathlib import Path
lines = Path('app/chats/[id]/page.tsx').read_text().splitlines()
for idx,line in enumerate(lines, 1):
    if 'key={`' in line:
        print(idx, line)
